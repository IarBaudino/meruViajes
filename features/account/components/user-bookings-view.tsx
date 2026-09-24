"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyARS } from "@/lib/format";
import { formatDepartureLabel } from "@/features/excursions/lib/departures";

type OrderItemRow = {
  serviceTitle?: string;
  quantity?: number;
  lineTotal?: number;
  departureDate?: string;
  departureTime?: string;
};

type UserOrder = {
  id: string;
  total: number;
  paymentStatus: string;
  items: OrderItemRow[];
  createdAt: string | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
};

export function UserBookingsView() {
  const [paidOrders, setPaidOrders] = useState<UserOrder[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users/me/orders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const all = (data.orders ?? []) as UserOrder[];
        setPaidOrders(
          all.filter((o) => String(o.paymentStatus).toLowerCase() === "pagado")
        );
        setCancelledOrders(
          all
            .filter((o) => String(o.paymentStatus).toLowerCase() === "cancelado")
            .slice(0, 12)
        );
      }
      setLoading(false);
    }
    void load();

    function onFocus() {
      if (document.visibilityState === "hidden") return;
      void load();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const pollId = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void load();
    }, 10000);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.clearInterval(pollId);
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Reservas"
        description="Acá ves las reservas pagadas y las que fueron canceladas. Las pendientes están en el carrito."
      />

      {loading ? <p className="text-meru-muted">Cargando…</p> : null}

      {!loading && paidOrders.length === 0 ? (
        <div className="mb-10 rounded-xl border border-dashed border-meru-border bg-white p-10 text-center">
          <p className="text-meru-charcoal">Todavía no tenés reservas pagadas.</p>
          <p className="mt-2 text-sm text-meru-muted">
            Si ya reservaste y el pago está pendiente, mirá el{" "}
            <Link href="/carrito" className="text-meru-secondary hover:underline">
              carrito
            </Link>
            .
          </p>
          <Link href="/excursiones" className="mt-4 inline-block">
            <Button>Explorar excursiones</Button>
          </Link>
        </div>
      ) : null}

      {paidOrders.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-4 text-lg text-meru-charcoal">Confirmadas</h2>
          <ul className="space-y-4">
            {paidOrders.map((order) => (
              <li key={order.id} className="rounded-xl border border-meru-border bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-meru-charcoal">
                      Reserva #{order.id.slice(0, 8).toUpperCase()}
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
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800">Pagado</Badge>
                    <p className="mt-2 font-semibold text-meru-primary">
                      {formatCurrencyARS(order.total)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!loading && cancelledOrders.length > 0 ? (
        <section>
          <h2 className="mb-4 text-lg text-meru-charcoal">Canceladas</h2>
          <ul className="space-y-3">
            {cancelledOrders.map((order) => (
              <li
                key={order.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-meru-charcoal">
                      Pedido #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-1 text-meru-muted">
                      {order.cancelReason === "expired"
                        ? "Cancelada por vencimiento del plazo de pago. El cupo se liberó."
                        : "Cancelada por la agencia. El cupo se liberó."}
                      {order.cancelledAt
                        ? ` (${new Date(order.cancelledAt).toLocaleString("es-AR")})`
                        : ""}
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
    </div>
  );
}
