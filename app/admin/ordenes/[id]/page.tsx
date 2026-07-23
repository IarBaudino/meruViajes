"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrencyARS } from "@/lib/format";
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
  items: OrderItem[];
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
    if (!confirm("¿Marcar esta orden como pagada? Pasará a Reservas del cliente.")) return;

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
      setOrder({ ...order, paymentStatus: "pagado" });
    } finally {
      setSaving(false);
    }
  }

  async function cancelAndRelease() {
    if (!order) return;
    setActionError("");
    if (
      !confirm(
        "¿Cancelar esta reserva pendiente y liberar los cupos para que puedan venderse de nuevo?"
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

  if (loading) {
    return <p className="text-meru-muted">Cargando detalle…</p>;
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
        <section className="rounded-xl border border-meru-border bg-white p-6 space-y-4">
          <h2 className="text-lg text-meru-charcoal">Cliente</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-meru-muted">Nombre</dt>
              <dd className="text-meru-charcoal">{order.customerName || "—"}</dd>
            </div>
            <div>
              <dt className="text-meru-muted">Email</dt>
              <dd>
                {order.customerEmail ? (
                  <a
                    href={`mailto:${order.customerEmail}`}
                    className="text-meru-secondary hover:underline"
                  >
                    {order.customerEmail}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-meru-muted">Teléfono</dt>
              <dd>
                {order.customerPhone ? (
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="text-meru-secondary hover:underline"
                  >
                    {order.customerPhone}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-meru-muted">DNI / Pasaporte</dt>
              <dd className="text-meru-charcoal">{order.customerDni || "—"}</dd>
            </div>
            <div>
              <dt className="text-meru-muted">Usuario (UID)</dt>
              <dd className="font-mono text-xs text-meru-muted">{order.userId}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-meru-border bg-white p-6 space-y-4">
          <h2 className="text-lg text-meru-charcoal">Pago y estado</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-meru-muted">Estado</dt>
              <dd>
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
              </dd>
            </div>
            <div>
              <dt className="text-meru-muted">Método</dt>
              <dd className="text-meru-charcoal">
                {order.paymentMethod === "getnet" ? "Getnet" : "Coordinar con la agencia"}
              </dd>
            </div>
            {order.paymentInformation ? (
              <div>
                <dt className="text-meru-muted">Referencia de pago</dt>
                <dd className="font-mono text-xs text-meru-charcoal">{order.paymentInformation}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-meru-muted">Total</dt>
              <dd className="text-xl font-semibold text-meru-primary">
                {formatCurrencyARS(order.total)}
              </dd>
            </div>
            {order.paymentStatus === "pendiente" && order.holdExpiresAt ? (
              <div>
                <dt className="text-meru-muted">Cupo reservado hasta</dt>
                <dd className="text-meru-charcoal">
                  {new Date(order.holdExpiresAt).toLocaleString("es-AR")}
                </dd>
              </div>
            ) : null}
            {order.paymentStatus === "cancelado" ? (
              <div>
                <dt className="text-meru-muted">Cancelación</dt>
                <dd className="text-meru-charcoal">
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
              <dt className="text-meru-muted">Creada</dt>
              <dd className="text-meru-charcoal">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString("es-AR")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-meru-muted">ID completo</dt>
              <dd className="break-all font-mono text-xs text-meru-muted">{order.id}</dd>
            </div>
          </dl>

          {order.paymentStatus === "pendiente" ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void markPaid()} isLoading={saving}>
                Marcar como pagado
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void cancelAndRelease()}
                isLoading={saving}
              >
                Cancelar y liberar cupos
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-meru-border bg-white p-6">
        <h2 className="text-lg text-meru-charcoal">Ítems del pedido</h2>
        {order.items.length === 0 ? (
          <p className="mt-4 text-sm text-meru-muted">Sin ítems guardados en la orden.</p>
        ) : (
          <ul className="mt-4 divide-y divide-meru-border">
            {order.items.map((item, idx) => (
              <li key={`${item.serviceId ?? idx}-${idx}`} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {item.packageId || item.packageTitle ? (
                      <p className="text-xs font-medium uppercase tracking-wider text-meru-secondary">
                        Paquete
                      </p>
                    ) : null}
                    <p className="text-meru-charcoal">
                      {item.serviceTitle || item.packageTitle || "Ítem"}
                    </p>
                    {item.slug ? (
                      <p className="text-xs text-meru-muted">/{item.slug}</p>
                    ) : null}
                    {passengersLabel(item.passengers) ? (
                      <p className="mt-1 text-sm text-meru-muted">
                        {passengersLabel(item.passengers)}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-meru-muted">
                        {item.quantity ?? 1} pasajero
                        {(item.quantity ?? 1) === 1 ? "" : "s"}
                      </p>
                    )}
                    {item.stayFrom && item.stayTo ? (
                      <p className="mt-1 text-sm text-meru-secondary">
                        Estadía: {item.stayFrom.split("-").reverse().join("/")} →{" "}
                        {item.stayTo.split("-").reverse().join("/")}
                      </p>
                    ) : item.departureDate && item.departureTime ? (
                      <p className="mt-1 text-sm text-meru-secondary">
                        Salida: {item.departureDate.split("-").reverse().join("/")} ·{" "}
                        {item.departureTime}
                      </p>
                    ) : null}
                    {item.includedServices?.length ? (
                      <ul className="mt-2 space-y-1 text-sm text-meru-muted">
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
                      <p className="text-xs text-meru-muted">
                        Precio ref.: {formatCurrencyARS(item.unitPrice)}
                      </p>
                    ) : null}
                  </div>
                  <p className="font-semibold text-meru-primary">
                    {formatCurrencyARS(item.lineTotal ?? 0)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-meru-border bg-white p-6">
        <h2 className="text-lg text-meru-charcoal">Reservas / cupos asociados</h2>
        {bookings.length === 0 ? (
          <p className="mt-4 text-sm text-meru-muted">No hay bookings vinculados a esta orden.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="rounded-lg border border-meru-border/80 bg-meru-sand/40 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-meru-charcoal">{booking.serviceTitle}</p>
                    {passengersLabel(booking.passengers) ? (
                      <p className="text-meru-muted">
                        {passengersLabel(booking.passengers)}
                      </p>
                    ) : (
                      <p className="text-meru-muted">Cantidad: {booking.quantity}</p>
                    )}
                    <p className="text-xs text-meru-muted">
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
                    <p className="mt-1 font-medium text-meru-charcoal">
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
