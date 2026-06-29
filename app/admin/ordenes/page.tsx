"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyARS } from "@/lib/format";

type Order = {
  id: string;
  userId: string;
  total: number;
  paymentStatus: string;
  createdAt: string | null;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/orders");
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
      <PageHeader
        title="Órdenes"
        description="Pedidos de clientes. El checkout online se activará en la siguiente fase."
      />

      {loading ? <p className="text-meru-muted">Cargando…</p> : null}

      {!loading && orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-meru-border bg-white p-10 text-center text-meru-muted">
          Todavía no hay órdenes registradas.
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-meru-border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-meru-border bg-meru-sand/50 text-left text-meru-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-meru-border/60 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{order.id.slice(0, 8)}…</td>
                <td className="px-4 py-3 font-mono text-xs">{order.userId.slice(0, 8)}…</td>
                <td className="px-4 py-3">{formatCurrencyARS(order.total)}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      order.paymentStatus === "pagado"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-900"
                    }
                  >
                    {order.paymentStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-meru-muted">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("es-AR")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
