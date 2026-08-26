"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { formatCurrencyARS } from "@/lib/format";
import { formatPassengersSummary, normalizeCartPassengers } from "@/features/excursions/lib/pricing";
import { formatDepartureLabel } from "@/features/excursions/lib/departures";
import { cartWhatsAppHref, orderWhatsAppHref } from "@/lib/whatsapp";

type OrderItemRow = {
  serviceTitle?: string;
  quantity?: number;
  lineTotal?: number;
  departureDate?: string;
  departureTime?: string;
  stayFrom?: string;
  stayTo?: string;
  packageTitle?: string;
};

type UserOrder = {
  id: string;
  total: number;
  paymentStatus: string;
  paymentMethod?: string;
  items: OrderItemRow[];
  createdAt: string | null;
  holdExpiresAt?: string | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
};

export function CartView() {
  const router = useRouter();
  const { status } = useSession();
  const items = useCartStore((s) => s.items);
  const holdOrderId = useCartStore((s) => s.holdOrderId);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const syncHoldWithOrders = useCartStore((s) => s.syncHoldWithOrders);
  const total = useCartStore((s) => s.totalPrice());

  const [pendingOrders, setPendingOrders] = useState<UserOrder[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<UserOrder[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [justReserved, setJustReserved] = useState(false);
  const [holdWarning, setHoldWarning] = useState("");
  const [cartHydrated, setCartHydrated] = useState(false);

  const loadOrders = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await fetch("/api/users/me/orders", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      let all = (data.orders ?? []) as UserOrder[];

      const currentHoldId = useCartStore.getState().holdOrderId;
      if (currentHoldId && !all.some((o) => o.id === currentHoldId)) {
        const holdRes = await fetch(`/api/users/me/orders/${currentHoldId}`, {
          cache: "no-store",
        });
        if (holdRes.ok) {
          const holdData = await holdRes.json();
          if (holdData.order) {
            all = [holdData.order as UserOrder, ...all];
          }
        } else if (holdRes.status === 404 || holdRes.status === 403) {
          useCartStore.getState().clearCart();
        }
      }

      setPendingOrders(
        all.filter((o) => String(o.paymentStatus).toLowerCase() === "pendiente")
      );
      setCancelledOrders(
        all
          .filter((o) => String(o.paymentStatus).toLowerCase() === "cancelado")
          .slice(0, 8)
      );
      syncHoldWithOrders(all);
    } finally {
      setPendingLoading(false);
    }
  }, [syncHoldWithOrders]);

  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => setCartHydrated(true));
    if (useCartStore.persist.hasHydrated()) setCartHydrated(true);
    return unsub;
  }, []);

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
    if (!cartHydrated) return;
    if (status === "authenticated") {
      void loadOrders();
    } else {
      setPendingLoading(false);
    }
  }, [cartHydrated, loadOrders, status]);

  useEffect(() => {
    function onFocus() {
      if (!cartHydrated || status !== "authenticated") return;
      if (document.visibilityState === "hidden") return;
      void loadOrders();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [cartHydrated, loadOrders, status]);

  useEffect(() => {
    if (!cartHydrated) return;
    const shouldPoll = Boolean(holdOrderId) || pendingOrders.length > 0;
    if (!shouldPoll || status !== "authenticated") return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void loadOrders();
    }, 10000);
    return () => window.clearInterval(id);
  }, [cartHydrated, holdOrderId, pendingOrders.length, loadOrders, status]);

  const cartEmpty = items.length === 0;
  const reserved = Boolean(holdOrderId);
  const noPending = !pendingLoading && pendingOrders.length === 0;
  const showEmpty = cartEmpty && noPending && cancelledOrders.length === 0;

  return (
    <div>
      <PageHeader
        title="Carrito"
        description="Revisá tu selección y continuá a facturación para reservar el cupo."
      />

      {status !== "authenticated" && !reserved ? (
        <div className="mb-6 rounded-xl border border-meru-secondary/30 bg-meru-ice/60 p-4 text-sm text-meru-charcoal">
          Podés comprar sin cuenta. Si{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent("/carrito")}`}
            className="font-semibold text-meru-secondary underline"
          >
            iniciás sesión
          </Link>{" "}
          o{" "}
          <Link
            href={`/registro?callbackUrl=${encodeURIComponent("/carrito")}`}
            className="font-semibold text-meru-secondary underline"
          >
            creás una cuenta
          </Link>
          , vas a poder seguir tus reservas más fácil.
        </div>
      ) : null}

      {justReserved || reserved ? (
        <p className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            Cupo reservado. Para proceder al pago, enviá un mensaje por WhatsApp. El carrito se
            mantiene hasta que confirmemos el pago; después pasa a{" "}
            <Link href="/mi-cuenta/reservas" className="font-semibold underline">
              Reservas
            </Link>
            .
          </span>
        </p>
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
                          {item.quantity
                            ? ` · ${item.quantity} pasajero${item.quantity === 1 ? "" : "s"}`
                            : ""}
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
                    <WhatsAppButton
                      href={orderWhatsAppHref({
                        orderId: order.id,
                        total: order.total,
                        items: (order.items ?? []).map((item) => ({
                          title: item.packageTitle || item.serviceTitle || "Ítem",
                          quantity: item.quantity,
                          lineTotal: item.lineTotal,
                          departureDate: item.departureDate,
                          departureTime: item.departureTime,
                          stayFrom: item.stayFrom,
                          stayTo: item.stayTo,
                          isPackage: Boolean(item.packageTitle),
                        })),
                      })}
                      size="md"
                    >
                      Pagar por WhatsApp
                    </WhatsAppButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!pendingLoading && cancelledOrders.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-4 text-lg text-meru-charcoal">Canceladas</h2>
          <ul className="space-y-3">
            {cancelledOrders.map((order) => (
              <li
                key={order.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-meru-charcoal">
                      Pedido #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-1 text-meru-muted">
                      {order.cancelReason === "expired"
                        ? "Se canceló porque venció el plazo de pago y el cupo se liberó."
                        : "La reserva fue cancelada y el cupo quedó libre."}
                    </p>
                    <ul className="mt-2 space-y-0.5 text-meru-charcoal">
                      {(order.items ?? []).map((item, idx) => (
                        <li key={`${order.id}-c-${idx}`}>
                          {item.serviceTitle ?? "Ítem"}
                          {item.departureDate && item.departureTime
                            ? ` · ${formatDepartureLabel({
                                date: item.departureDate,
                                time: item.departureTime,
                              })}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Badge className="bg-slate-200 text-slate-700">Cancelada</Badge>
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
            No hay ítems nuevos por confirmar. Revisá las secciones de arriba.
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
                      {item.kind === "package" && item.stayFrom && item.stayTo ? (
                        <div className="mt-1 space-y-1 text-sm">
                          <p className="text-meru-secondary">
                            Estadía: {item.stayFrom.split("-").reverse().join("/")} →{" "}
                            {item.stayTo.split("-").reverse().join("/")}
                          </p>
                          <p className="text-meru-muted">
                            {item.quantity} pasajero{item.quantity === 1 ? "" : "s"}
                          </p>
                          {item.includedServices?.length ? (
                            <ul className="text-meru-muted">
                              {item.includedServices.map((s) => (
                                <li key={s.serviceId}>· {s.title}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : item.departureDate && item.departureTime ? (
                        <p className="mt-1 text-sm text-meru-secondary">
                          {formatDepartureLabel({
                            date: item.departureDate,
                            time: item.departureTime,
                          })}
                        </p>
                      ) : null}
                      {item.kind === "package" ? null : item.passengers ? (
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
                          {item.quantity} pasajero{item.quantity === 1 ? "" : "s"}
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
                <div className="flex w-full max-w-sm flex-col items-stretch gap-2 sm:items-end">
                  {holdOrderId ? (
                    <WhatsAppButton
                      href={cartWhatsAppHref({
                        items,
                        total,
                        orderId: holdOrderId,
                      })}
                    >
                      Pagar por WhatsApp
                    </WhatsAppButton>
                  ) : null}
                  <p className="text-sm text-meru-muted sm:text-right">
                    Para proceder al pago, enviá un mensaje por WhatsApp. El carrito se vacía
                    cuando confirmemos el pago.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-meru-border bg-white p-5">
                <p className="text-lg text-meru-charcoal">
                  Total:{" "}
                  <span className="text-meru-primary">{formatCurrencyARS(total)}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={clearCart}>
                    Vaciar carrito
                  </Button>
                  <Button type="button" size="lg" onClick={() => router.push("/checkout")}>
                    Continuar a facturación
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
