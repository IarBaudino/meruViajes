"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyARS } from "@/lib/format";
import { formatPassengersSummary, normalizeCartPassengers } from "@/features/excursions/lib/pricing";
import { formatDepartureLabel } from "@/features/excursions/lib/departures";

type ProfileCheck = {
  ok: boolean;
  missing: string[];
};

type PaymentMethod = "coordinar" | "getnet";

type PendingOrderItem = {
  serviceTitle?: string;
  quantity?: number;
  lineTotal?: number;
  departureDate?: string;
  departureTime?: string;
};

type PendingOrder = {
  id: string;
  total: number;
  paymentStatus: string;
  paymentMethod?: string;
  items: PendingOrderItem[];
  createdAt: string | null;
  holdExpiresAt?: string | null;
};

export function CartView() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const holdOrderId = useCartStore((s) => s.holdOrderId);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const setHoldOrderId = useCartStore((s) => s.setHoldOrderId);
  const releaseHoldIfPaid = useCartStore((s) => s.releaseHoldIfPaid);
  const total = useCartStore((s) => s.totalPrice());

  const [profileCheck, setProfileCheck] = useState<ProfileCheck | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("coordinar");
  const [getnetReady, setGetnetReady] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [justReserved, setJustReserved] = useState(false);
  const [holdWarning, setHoldWarning] = useState("");

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await fetch("/api/users/me/orders");
      if (!res.ok) return;
      const data = await res.json();
      const pending = ((data.orders ?? []) as PendingOrder[]).filter(
        (o) => o.paymentStatus === "pendiente"
      );
      setPendingOrders(pending);
      releaseHoldIfPaid(pending.map((o) => o.id));
    } finally {
      setPendingLoading(false);
    }
  }, [releaseHoldIfPaid]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setJustReserved(params.get("reserva") === "pendiente");
    }
  }, []);

  useEffect(() => {
    async function loadHoldWarning() {
      try {
        const res = await fetch("/api/booking-settings");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.warningMessage === "string" && data.warningMessage.trim()) {
          setHoldWarning(data.warningMessage.trim());
        }
      } catch {
        // silencioso
      }
    }
    void loadHoldWarning();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch("/api/users/me");
      if (!res.ok) {
        setProfileCheck({ ok: false, missing: ["perfil"] });
        return;
      }
      const data = await res.json();
      const missing: string[] = [];
      if (!data.dni?.trim() || data.dni.trim().length < 6) missing.push("DNI / pasaporte");
      if (!data.phone?.trim() || data.phone.trim().length < 6) missing.push("teléfono");
      if (!data.name?.trim()) missing.push("nombre");
      setProfileCheck({ ok: missing.length === 0, missing });
    }
    void loadProfile();
    void loadPending();
  }, [loadPending]);

  useEffect(() => {
    async function checkGetnet() {
      const res = await fetch("/api/payments/getnet/status");
      if (!res.ok) return;
      const data = await res.json();
      setGetnetReady(Boolean(data.configured));
    }
    void checkGetnet();
  }, []);

  useEffect(() => {
    if (getnetReady) setPaymentMethod("getnet");
  }, [getnetReady]);

  async function handlePayOrder(orderId: string) {
    setCheckoutError("");
    setPayingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "No se pudo iniciar el pago");
      }
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl as string;
        return;
      }
      throw new Error("No recibimos el enlace de pago");
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Error al ir a pagar");
    } finally {
      setPayingOrderId(null);
    }
  }

  async function handleCheckout() {
    setCheckoutError("");
    setCheckingOut(true);

    try {
      if (holdOrderId) {
        throw new Error(
          "Ya tenés una reserva pendiente de pago. Usá «Ir a pagar» o esperá la confirmación."
        );
      }

      const missingDeparture = items.some(
        (item) => !item.departureDate || !item.departureTime
      );
      if (missingDeparture) {
        throw new Error(
          "Hay ítems sin fecha y hora. Quitálos del carrito y volvé a reservar eligiendo una salida."
        );
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          items: items.map((item) => ({
            kind: item.kind ?? "service",
            serviceId: item.serviceId,
            packageId: item.packageId,
            quantity: item.quantity,
            passengers: item.passengers,
            departureId: item.departureId,
            departureDate: item.departureDate,
            departureTime: item.departureTime,
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "No se pudo confirmar la reserva");
      }

      const orderId = String(json.orderId ?? "");
      if (orderId) setHoldOrderId(orderId);

      setJustReserved(true);
      await loadPending();

      if (paymentMethod === "getnet" && json.checkoutUrl) {
        window.location.href = json.checkoutUrl as string;
        return;
      }

      router.replace("/mi-cuenta/carrito?reserva=pendiente");
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Error al confirmar");
    } finally {
      setCheckingOut(false);
    }
  }

  const profileIncomplete = profileCheck && !profileCheck.ok;
  const cartEmpty = items.length === 0;
  const reserved = Boolean(holdOrderId);
  const noPending = !pendingLoading && pendingOrders.length === 0;
  const showEmpty = cartEmpty && noPending;

  return (
    <div>
      <PageHeader
        title="Carrito"
        description="Tus excursiones quedan en el carrito hasta que el pago esté confirmado."
      />

      {justReserved || reserved ? (
        <p className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            Cupo reservado. El carrito se mantiene hasta que esté pago. Cuando se confirme el
            pago, pasa a{" "}
            <Link href="/mi-cuenta/reservas" className="font-semibold underline">
              Reservas
            </Link>
            .
          </span>
        </p>
      ) : null}

      {profileIncomplete ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Completá tu {profileCheck.missing.join(", ")} en{" "}
              <Link href="/mi-cuenta/perfil" className="font-semibold underline">
                Mi perfil
              </Link>{" "}
              antes de confirmar.
            </span>
          </p>
        </div>
      ) : null}

      {!pendingLoading && pendingOrders.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-4 text-lg text-meru-charcoal">Pendiente de pago</h2>
          <ul className="space-y-4">
            {pendingOrders.map((order) => (
              <li
                key={order.id}
                className="rounded-xl border border-amber-200 bg-amber-50/60 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-meru-charcoal">
                      Pedido #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-1 text-sm text-meru-muted">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString("es-AR")
                        : "—"}
                    </p>
                    <ul className="mt-3 space-y-1 text-sm text-meru-charcoal">
                      {(order.items ?? []).map((item, idx) => (
                        <li key={`${order.id}-${idx}`}>
                          {item.serviceTitle ?? "Ítem"}
                          {item.quantity ? ` × ${item.quantity}` : ""}
                          {item.departureDate && item.departureTime
                            ? ` · ${formatDepartureLabel({
                                date: item.departureDate,
                                time: item.departureTime,
                              })}`
                            : ""}
                          {typeof item.lineTotal === "number"
                            ? ` — ${formatCurrencyARS(item.lineTotal)}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                    {order.holdExpiresAt ? (
                      <p className="mt-3 text-xs text-meru-muted">
                        Cupo reservado hasta{" "}
                        {new Date(order.holdExpiresAt).toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                        . Si no se confirma el pago, se libera.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-stretch gap-2 sm:items-end">
                    <Badge className="w-fit bg-amber-100 text-amber-900">Pendiente de pago</Badge>
                    <p className="font-semibold text-meru-primary">
                      {formatCurrencyARS(order.total)}
                    </p>
                    {getnetReady ? (
                      <Button
                        type="button"
                        size="lg"
                        disabled={payingOrderId === order.id}
                        onClick={() => void handlePayOrder(order.id)}
                      >
                        {payingOrderId === order.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            Redirigiendo…
                          </>
                        ) : (
                          "Ir a pagar"
                        )}
                      </Button>
                    ) : (
                      <p className="max-w-[14rem] text-xs text-meru-muted sm:text-right">
                        Coordiná el pago con la agencia. Cuando esté confirmado, aparece en
                        Reservas.
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg text-meru-charcoal">
          {reserved ? "Tu reserva (en carrito)" : "Por confirmar"}
        </h2>

        {showEmpty ? (
          <div className="rounded-xl border border-dashed border-meru-border bg-white p-10 text-center">
            <p className="text-meru-charcoal">Tu carrito está vacío.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/excursiones">
                <Button>Explorar excursiones</Button>
              </Link>
              <Link href="/paquetes">
                <Button variant="outline">Ver paquetes</Button>
              </Link>
            </div>
          </div>
        ) : cartEmpty ? (
          <p className="text-sm text-meru-muted">
            No hay ítems nuevos. Pagá la reserva pendiente de arriba o explorá más excursiones.
          </p>
        ) : (
          <>
            <ul className="space-y-4">
              {items.map((item) => {
                const isPackage = item.kind === "package";
                const href = isPackage
                  ? `/paquetes/${item.slug}`
                  : `/excursiones/${item.slug}`;
                const lineTotal = item.lineTotal ?? item.price * item.quantity;
                return (
                  <li
                    key={`${item.kind ?? "service"}-${item.serviceId}-${item.departureId ?? item.departureTime ?? ""}`}
                    className="flex gap-4 rounded-xl border border-meru-border bg-white p-4"
                  >
                    {item.image ? (
                      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <Image src={item.image} alt="" fill className="object-cover" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      {isPackage ? (
                        <p className="text-xs font-medium uppercase tracking-wider text-meru-secondary">
                          Paquete
                        </p>
                      ) : null}
                      <Link href={href} className="text-meru-charcoal hover:text-meru-secondary">
                        {item.title}
                      </Link>
                      {item.departureDate && item.departureTime ? (
                        <p className="mt-1 text-sm text-meru-secondary">
                          {formatDepartureLabel({
                            date: item.departureDate,
                            time: item.departureTime,
                          })}
                        </p>
                      ) : null}
                      {item.passengers ? (
                        <p className="mt-1 text-sm text-meru-muted">
                          {formatPassengersSummary(
                            normalizeCartPassengers(item.passengers) ?? {
                              adult: item.quantity,
                              infant: 0,
                              discounted: [],
                            }
                          )}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-meru-muted">
                          Cantidad: {item.quantity}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-semibold text-meru-primary">
                        {formatCurrencyARS(lineTotal)}
                      </p>
                    </div>
                    {!reserved ? (
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => removeItem(item.serviceId, item.departureId)}
                      >
                        Quitar
                      </button>
                    ) : (
                      <Badge className="h-fit bg-amber-100 text-amber-900">Reservado</Badge>
                    )}
                  </li>
                );
              })}
            </ul>

            {holdWarning && !reserved ? (
              <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>{holdWarning}</p>
              </div>
            ) : null}

            {reserved ? (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-meru-border bg-white p-5">
                <p className="text-lg text-meru-charcoal">
                  Total:{" "}
                  <span className="text-meru-primary">{formatCurrencyARS(total)}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {holdOrderId && getnetReady ? (
                    <Button
                      type="button"
                      size="lg"
                      disabled={payingOrderId === holdOrderId}
                      onClick={() => void handlePayOrder(holdOrderId)}
                    >
                      {payingOrderId === holdOrderId ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          Redirigiendo…
                        </>
                      ) : (
                        "Ir a pagar"
                      )}
                    </Button>
                  ) : (
                    <p className="text-sm text-meru-muted">
                      Coordiná el pago con la agencia. El carrito se vacía cuando esté pago.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <fieldset className="mt-6 rounded-xl border border-meru-border bg-white p-5">
                  <legend className="px-1 text-sm font-medium text-meru-charcoal">
                    Forma de pago
                  </legend>
                  <div className="mt-2 space-y-3">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="mt-1"
                        checked={paymentMethod === "coordinar"}
                        onChange={() => setPaymentMethod("coordinar")}
                      />
                      <span>
                        <span className="block text-sm text-meru-charcoal">
                          Coordinar con la agencia
                        </span>
                        <span className="text-xs text-meru-muted">
                          Reservamos el cupo; el pago queda pendiente y el carrito se mantiene.
                        </span>
                      </span>
                    </label>
                    <label
                      className={`flex items-start gap-3 ${getnetReady ? "cursor-pointer" : "opacity-60"}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="mt-1"
                        checked={paymentMethod === "getnet"}
                        disabled={!getnetReady}
                        onChange={() => setPaymentMethod("getnet")}
                      />
                      <span>
                        <span className="block text-sm text-meru-charcoal">Pagar con Getnet</span>
                        <span className="text-xs text-meru-muted">
                          {getnetReady
                            ? "Confirmás la reserva y te llevamos a pagar."
                            : "Disponible cuando estén configuradas las credenciales de Getnet."}
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-meru-border bg-white p-5">
                  <p className="text-lg text-meru-charcoal">
                    Total:{" "}
                    <span className="text-meru-primary">{formatCurrencyARS(total)}</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearCart}
                      disabled={checkingOut}
                    >
                      Vaciar carrito
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      disabled={checkingOut || profileIncomplete === true}
                      onClick={() => void handleCheckout()}
                    >
                      {checkingOut ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          Confirmando…
                        </>
                      ) : paymentMethod === "getnet" ? (
                        "Confirmar e ir a pagar"
                      ) : (
                        "Confirmar reserva"
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {checkoutError ? (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {checkoutError}
              </p>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
