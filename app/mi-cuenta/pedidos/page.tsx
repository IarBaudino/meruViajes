"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrencyARS } from "@/lib/format";

type Order = {
  id: string;
  total: number;
  paymentStatus: string;
  createdAt: string | null;
};

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users/me/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
      setLoading(false);
    }
    void load();
  }, []);

  return (
    <div>
      <PageHeader title="Mis pedidos" description="Historial de compras y pagos." />

      {loading ? <p className="text-meru-muted">Cargando…</p> : null}

      {!loading && orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-meru-border bg-white p-10 text-center">
          <p className="text-meru-charcoal">Todavía no tenés pedidos.</p>
          <Link href="/excursiones" className="mt-4 inline-block">
            <Button>Ver excursiones</Button>
          </Link>
        </div>
      ) : null}

      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order.id} className="rounded-xl border border-meru-border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-meru-charcoal">{formatCurrencyARS(order.total)}</p>
                <p className="text-xs text-meru-muted">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString("es-AR")
                    : "—"}
                </p>
              </div>
              <Badge
                className={
                  order.paymentStatus === "pagado"
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-900"
                }
              >
                {order.paymentStatus}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
