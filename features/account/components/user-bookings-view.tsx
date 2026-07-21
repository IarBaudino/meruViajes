"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyARS } from "@/lib/format";

type PaidOrderItem = {
  serviceTitle?: string;
  quantity?: number;
  lineTotal?: number;
};

type PaidOrder = {
  id: string;
  total: number;
  paymentStatus: string;
  items: PaidOrderItem[];
  createdAt: string | null;
};

export function UserBookingsView() {
  const [orders, setOrders] = useState<PaidOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users/me/orders");
      if (res.ok) {
        const data = await res.json();
        const paid = ((data.orders ?? []) as PaidOrder[]).filter(
          (o) => o.paymentStatus === "pagado"
        );
        setOrders(paid);
      }
      setLoading(false);
    }
    void load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Reservas"
        description="Reservas con pago confirmado. Las pendientes de pago están en el carrito."
      />

      {loading ? <p className="text-meru-muted">Cargando…</p> : null}

      {!loading && orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-meru-border bg-white p-10 text-center">
          <p className="text-meru-charcoal">Todavía no tenés reservas pagadas.</p>
          <p className="mt-2 text-sm text-meru-muted">
            Si ya reservaste y el pago está pendiente, mirá el{" "}
            <Link href="/mi-cuenta/carrito" className="text-meru-secondary hover:underline">
              carrito
            </Link>
            .
          </p>
          <Link href="/excursiones" className="mt-4 inline-block">
            <Button>Explorar excursiones</Button>
          </Link>
        </div>
      ) : null}

      <ul className="space-y-4">
        {orders.map((order) => (
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
    </div>
  );
}
