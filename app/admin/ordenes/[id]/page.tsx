"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrencyARS } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/payments/methods";
import {
  formatPassengersSummary,
  normalizeCartPassengers,
} from "@/features/excursions/lib/pricing";
import type { CartPassengers } from "@/features/excursions/lib/pricing";

function passengersLabel(raw: CartPassengers | null | undefined): string | null {
  const normalized = normalizeCartPassengers(raw);
  if (!normalized) return null;
  const summary = formatPassengersSummary(normalized);
  return summary || null;
}

type OrderItem = {
  serviceId?: string;
  serviceTitle?: string;
  slug?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  packageId?: string;
  packageTitle?: string;
  passengers?: CartPassengers | null;
  departureId?: string;
  departureDate?: string;
  departureTime?: string;
  stayFrom?: string;
  stayTo?: string;
  fulfillmentMode?: "auto" | "manual";
  includedServices?: Array<{
    serviceId: string;
    title: string;
    slug?: string;
    description?: string;
  }>;
};

type Booking = {
  id: string;
  serviceTitle: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  packageId: string | null;
  passengers: CartPassengers | null;
  dni: string;
  active: boolean;
  bookingDate: string | null;
};

type OrderDetail = {
  id: string;
  userId: string;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  paymentInformation: string | null;
  customerName: string;
  customerEmail: string;
  customerDni: string;
  customerPhone: string;
  billing?: {
    fullName: string;
    email: string;
    phoneFull: string;
    identificationType: string;
    identificationNumber: string;
    address: {
      country: string;
      city: string;
      street: string;
      apartment?: string;
      postalCode: string;
    };
  } | null;
  serviceOrderNumber?: string | null;
  serviceOrderGeneratedAt?: string | null;
  isGuest?: boolean;
  items: OrderItem[];
  coupon?: {
    code: string;
    sellerName: string;
    discountAmount: number;
    commissionPercent: number;
    commissionAmount: number;
    subtotal: number;
  } | null;
  subtotal?: number | null;
  discountAmount?: number;
  archived?: boolean;
  holdExpiresAt: string | null;
  stockReleased: boolean;
  cancelReason: string | null;
  cancelledAt: string | null;
  orderDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo cargar la orden");
        setOrder(null);
        return;
      }
      setOrder(json.order);
      setBookings(json.bookings ?? []);
    } catch {
      setError("Error de red al cargar la orden");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markPaid() {
    if (!order) return;
    setActionError("");
    if (!confirm("¿Confirmar el pago y generar la orden de servicio?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "pagado" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "No se pudo actualizar");
        return;
      }
      setOrder({
        ...order,
        paymentStatus: "pagado",
        serviceOrderNumber: json.serviceOrderNumber ?? order.serviceOrderNumber,
      });
    } finally {
      setSaving(false);
    }
  }

  async function cancelAndRelease() {
    if (!order) return;
    setActionError("");
    const wasPaid = order.paymentStatus === "pagado";
    if (
      !confirm(
        wasPaid
          ? "¿Anular esta orden pagada y liberar los cupos? El cliente será avisado. Usalo para pruebas o cancelaciones reales."
          : "¿Cancelar esta reserva pendiente y liberar los cupos para que puedan venderse de nuevo?"
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "cancelado" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "No se pudo cancelar");
        return;
      }
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive() {
    if (!order) return;
    setActionError("");
    const next = !order.archived;
    if (
      !confirm(
        next
          ? "¿Archivar esta orden? Se oculta del listado principal."
          : "¿Restaurar esta orden al listado principal?"
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "No se pudo archivar");
        return;
      }
      setOrder({ ...order, archived: next });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-brand-muted">Cargando detalle…</p>;
  }

  if (error || !order) {
    return (
      <div>
        <p className="text-red-600">{error || "Orden no encontrada"}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => router.push("/admin/ordenes")}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Orden #${order.id.slice(0, 8).toUpperCase()}`}
        description="Detalle completo del pedido y las reservas asociadas."
        action={
          <Link href="/admin/ordenes">
            <Button type="button" variant="outline">
              ← Volver
            </Button>
          </Link>
        }
      />

      {actionError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

      {order.items.some(
        (item) => item.fulfillmentMode === "manual" || Boolean(item.packageId || item.packageTitle)
      ) ? (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Recordatorio: paquete con armado manual</p>
          <p className="mt-1">
            Esta orden no descontó cupos de las excursiones. Armá el itinerario, descontá stock a
            mano en cada salida y enviá el detalle al cliente por privado.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-brand-border bg-white p-6 space-y-4">
          <h2 className="text-lg text-brand-charcoal">Cliente / facturación</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-brand-muted">Nombre</dt>
              <dd className="text-brand-charcoal">
                {order.billing?.fullName || order.customerName || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-brand-muted">Email</dt>
              <dd>
                {(order.billing?.email || order.customerEmail) ? (
                  <a
                    href={`mailto:${order.billing?.email || order.customerEmail}`}
                    className="text-brand-secondary hover:underline"
                  >
                    {order.billing?.email || order.customerEmail}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-brand-muted">Teléfono (WhatsApp)</dt>
              <dd>
                {(order.billing?.phoneFull || order.customerPhone) ? (
                  <a
                    href={`tel:${order.billing?.phoneFull || order.customerPhone}`}
                    className="text-brand-secondary hover:underline"
                  >
                    {order.billing?.phoneFull || order.customerPhone}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-brand-muted">Identificación</dt>
              <dd className="text-brand-charcoal">
                {order.billing
                  ? `${order.billing.identificationType} ${order.billing.identificationNumber}`
                  : order.customerDni || "—"}
              </dd>
            </div>
            {order.billing?.address ? (
              <div>
                <dt className="text-brand-muted">Dirección</dt>
                <dd className="text-brand-charcoal">
                  {order.billing.address.street}
                  {order.billing.address.apartment
                    ? `, ${order.billing.address.apartment}`
                    : ""}
                  <br />
                  {order.billing.address.city}, {order.billing.address.country}
                  <br />
                  CP {order.billing.address.postalCode}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-brand-muted">Cuenta</dt>
              <dd className="text-brand-muted">
                {order.isGuest || !order.userId
                  ? "Compra sin cuenta (invitado)"
                  : `UID ${order.userId}`}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-brand-border bg-white p-6 space-y-4">
          <h2 className="text-lg text-brand-charcoal">Pago y estado</h2>
          {order.serviceOrderNumber ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              <p className="font-semibold">Orden de servicio</p>
              <p className="mt-1 font-mono text-base">{order.serviceOrderNumber}</p>
              {order.serviceOrderGeneratedAt ? (
                <p className="mt-1 text-xs">
                  Generada: {new Date(order.serviceOrderGeneratedAt).toLocaleString("es-AR")}
                </p>
              ) : null}
            </div>
          ) : order.paymentStatus === "pendiente" ? (
            <p className="text-sm text-brand-muted">
              La orden de servicio se genera al confirmar el pago.
            </p>
          ) : null}
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-brand-muted">Estado</dt>
              <dd className="flex flex-wrap items-center justify-end gap-2">
                <Badge
                  className={
                    order.paymentStatus === "pagado"
                      ? "bg-green-100 text-green-800"
                      : order.paymentStatus === "cancelado"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-amber-100 text-amber-900"
                  }
                >
                  {order.paymentStatus}
                </Badge>
                {order.archived ? (
                  <Badge className="bg-slate-100 text-slate-600">Archivada</Badge>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-brand-muted">Método</dt>
              <dd className="text-brand-charcoal">
                {paymentMethodLabel(order.paymentMethod)}
              </dd>
            </div>
            {order.paymentInformation ? (
              <div>
                <dt className="text-brand-muted">Referencia de pago</dt>
                <dd className="font-mono text-xs text-brand-charcoal">{order.paymentInformation}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-brand-muted">Total</dt>
              <dd className="text-xl font-semibold text-brand-primary">
                {formatCurrencyARS(order.total)}
              </dd>
            </div>
            {order.coupon ? (
              <div className="sm:col-span-2">
                <dt className="text-brand-muted">Cupón</dt>
                <dd className="text-brand-charcoal">
                  {order.coupon.code}
                  {order.coupon.sellerName ? ` · ${order.coupon.sellerName}` : ""}
                  {order.coupon.discountAmount
                    ? ` · descuento ${formatCurrencyARS(order.coupon.discountAmount)}`
                    : ""}
                  {order.coupon.commissionAmount
                    ? ` · comisión ${formatCurrencyARS(order.coupon.commissionAmount)}`
                    : ""}
                </dd>
              </div>
            ) : null}
            {order.paymentStatus === "pendiente" && order.holdExpiresAt ? (
              <div>
                <dt className="text-brand-muted">Cupo reservado hasta</dt>
                <dd className="text-brand-charcoal">
                  {new Date(order.holdExpiresAt).toLocaleString("es-AR")}
                </dd>
              </div>
            ) : null}
            {order.paymentStatus === "cancelado" ? (
              <div>
                <dt className="text-brand-muted">Cancelación</dt>
                <dd className="text-brand-charcoal">
                  {order.cancelledAt
                    ? new Date(order.cancelledAt).toLocaleString("es-AR")
                    : "—"}
                  {order.cancelReason === "expired"
                    ? " · vencimiento automático"
                    : order.cancelReason === "admin"
                      ? " · cancelada por admin"
                      : ""}
                  {order.stockReleased ? " · cupos liberados" : ""}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-brand-muted">Creada</dt>
              <dd className="text-brand-charcoal">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString("es-AR")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-brand-muted">ID completo</dt>
              <dd className="break-all font-mono text-xs text-brand-muted">{order.id}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            {order.paymentStatus === "pendiente" ? (
              <>
                <Button type="button" onClick={() => void markPaid()} isLoading={saving}>
                  Confirmar pago y generar OS
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void cancelAndRelease()}
                  isLoading={saving}
                >
                  Cancelar y liberar cupos
                </Button>
              </>
            ) : null}
            {order.paymentStatus === "pagado" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void cancelAndRelease()}
                isLoading={saving}
              >
                Anular y liberar cupos
              </Button>
            ) : null}
            {order.paymentStatus !== "pendiente" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void toggleArchive()}
                isLoading={saving}
              >
                {order.archived ? "Restaurar del archivo" : "Archivar orden"}
              </Button>
            ) : null}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-brand-border bg-white p-6">
        <h2 className="text-lg text-brand-charcoal">Ítems del pedido</h2>
        {order.items.length === 0 ? (
          <p className="mt-4 text-sm text-brand-muted">Sin ítems guardados en la orden.</p>
        ) : (
          <ul className="mt-4 divide-y divide-brand-border">
            {order.items.map((item, idx) => (
              <li key={`${item.serviceId ?? idx}-${idx}`} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {item.packageId || item.packageTitle ? (
                      <p className="text-xs font-medium uppercase tracking-wider text-brand-secondary">
                        Paquete
                      </p>
                    ) : null}
                    <p className="text-brand-charcoal">
                      {item.serviceTitle || item.packageTitle || "Ítem"}
                    </p>
                    {item.slug ? (
                      <p className="text-xs text-brand-muted">/{item.slug}</p>
                    ) : null}
                    {passengersLabel(item.passengers) ? (
                      <p className="mt-1 text-sm text-brand-muted">
                        {passengersLabel(item.passengers)}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-brand-muted">
                        {item.quantity ?? 1} pasajero
                        {(item.quantity ?? 1) === 1 ? "" : "s"}
                      </p>
                    )}
                    {item.stayFrom && item.stayTo ? (
                      <p className="mt-1 text-sm text-brand-secondary">
                        Estadía: {item.stayFrom.split("-").reverse().join("/")} →{" "}
                        {item.stayTo.split("-").reverse().join("/")}
                      </p>
                    ) : item.departureDate && item.departureTime ? (
                      <p className="mt-1 text-sm text-brand-secondary">
                        Salida: {item.departureDate.split("-").reverse().join("/")} ·{" "}
                        {item.departureTime}
                      </p>
                    ) : null}
                    {item.includedServices?.length ? (
                      <ul className="mt-2 space-y-1 text-sm text-brand-muted">
                        {item.includedServices.map((s) => (
                          <li key={s.serviceId}>· {s.title}</li>
                        ))}
                      </ul>
                    ) : null}
                    {item.fulfillmentMode === "manual" ? (
                      <p className="mt-2 text-xs font-medium text-amber-800">
                        Armado y descuento de cupos: manual
                      </p>
                    ) : null}
                    {typeof item.unitPrice === "number" ? (
                      <p className="text-xs text-brand-muted">
                        Precio ref.: {formatCurrencyARS(item.unitPrice)}
                      </p>
                    ) : null}
                  </div>
                  <p className="font-semibold text-brand-primary">
                    {formatCurrencyARS(item.lineTotal ?? 0)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-brand-border bg-white p-6">
        <h2 className="text-lg text-brand-charcoal">Reservas / cupos asociados</h2>
        {bookings.length === 0 ? (
          <p className="mt-4 text-sm text-brand-muted">No hay bookings vinculados a esta orden.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="rounded-lg border border-brand-border/80 bg-brand-sand/40 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-brand-charcoal">{booking.serviceTitle}</p>
                    {passengersLabel(booking.passengers) ? (
                      <p className="text-brand-muted">
                        {passengersLabel(booking.passengers)}
                      </p>
                    ) : (
                      <p className="text-brand-muted">Cantidad: {booking.quantity}</p>
                    )}
                    <p className="text-xs text-brand-muted">
                      DNI reserva: {booking.dni || "—"}
                      {booking.bookingDate
                        ? ` · ${new Date(booking.bookingDate).toLocaleString("es-AR")}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        booking.active
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-600"
                      }
                    >
                      {booking.active ? "Activa" : "Inactiva"}
                    </Badge>
                    <p className="mt-1 font-medium text-brand-charcoal">
                      {formatCurrencyARS(booking.lineTotal)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
