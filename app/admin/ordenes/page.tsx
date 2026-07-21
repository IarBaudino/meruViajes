"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyARS } from "@/lib/format";

type Order = {
  id: string;
  userId: string;
  total: number;
  paymentStatus: string;
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  itemCount?: number;
  createdAt: string | null;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/orders");
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function markPaid(orderId: string) {
    setActionError("");
    if (!confirm("¿Marcar esta orden como pagada? Pasará a Reservas del cliente.")) return;

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "pagado" }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error ?? "No se pudo actualizar");
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "pagado" } : o))
    );
  }

  return (
    <div>
      <PageHeader
        title="Órdenes"
        description="Pedidos web. Abrí el detalle para ver cliente, pasajeros y cupos."
      />

      {actionError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

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
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Ítems</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-meru-border/60 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{order.id.slice(0, 8)}…</td>
                <td className="px-4 py-3">
                  <p className="text-meru-charcoal">{order.customerName || "—"}</p>
                  <p className="text-xs text-meru-muted">{order.customerEmail || ""}</p>
                </td>
                <td className="px-4 py-3 text-meru-muted">{order.itemCount ?? "—"}</td>
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
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link
                      href={`/admin/ordenes/${order.id}`}
                      className="text-meru-secondary hover:underline"
                    >
                      Ver detalle
                    </Link>
                    {order.paymentStatus !== "pagado" ? (
                      <button
                        type="button"
                        className="text-amber-800 hover:underline"
                        onClick={() => void markPaid(order.id)}
                      >
                        Marcar pagado
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
