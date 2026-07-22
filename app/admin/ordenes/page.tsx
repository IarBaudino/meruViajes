"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyARS } from "@/lib/format";
import { formatDepartureLabel } from "@/features/excursions/lib/departures";

type DepartureRow = {
  title: string;
  date: string;
  time: string;
};

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
  departures?: DepartureRow[];
  holdExpiresAt?: string | null;
  createdAt: string | null;
};

const EXPIRING_SOON_MS = 24 * 60 * 60 * 1000;

function paymentBadgeClass(status: string) {
  if (status === "pagado") return "bg-green-100 text-green-800";
  if (status === "cancelado") return "bg-slate-100 text-slate-600";
  return "bg-amber-100 text-amber-900";
}

function hoursLeftLabel(iso: string, now: number): string {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "vencida";
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours < 24) return `~${hours} h`;
  const days = Math.ceil(hours / 24);
  return `~${days} d`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

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
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const expiringSoon = useMemo(() => {
    return orders.filter((order) => {
      if (order.paymentStatus !== "pendiente" || !order.holdExpiresAt) return false;
      const expires = new Date(order.holdExpiresAt).getTime();
      return expires > now && expires - now <= EXPIRING_SOON_MS;
    });
  }, [orders, now]);

  const alreadyExpiredPending = useMemo(() => {
    return orders.filter((order) => {
      if (order.paymentStatus !== "pendiente" || !order.holdExpiresAt) return false;
      return new Date(order.holdExpiresAt).getTime() <= now;
    });
  }, [orders, now]);

  async function patchStatus(orderId: string, paymentStatus: "pagado" | "cancelado") {
    setActionError("");
    const confirmMsg =
      paymentStatus === "pagado"
        ? "¿Marcar esta orden como pagada? Pasará a Reservas del cliente."
        : "¿Cancelar esta reserva pendiente y liberar los cupos? El cliente será avisado.";
    if (!confirm(confirmMsg)) return;

    setBusyId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "No se pudo actualizar");
        return;
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o))
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Órdenes"
        description="Los cupos se reservan al confirmar. Si no pagan, podés cancelar y liberarlos (o se liberan solos al vencer)."
      />

      {expiringSoon.length > 0 || alreadyExpiredPending.length > 0 ? (
        <div className="mb-6 space-y-3">
          {alreadyExpiredPending.length > 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">
                  {alreadyExpiredPending.length} orden
                  {alreadyExpiredPending.length === 1 ? "" : "es"} pendiente
                  {alreadyExpiredPending.length === 1 ? "" : "s"} con plazo vencido
                </p>
                <p className="mt-1 text-red-900/80">
                  Deberían liberarse con el cron o podés cancelarlas ahora:{" "}
                  {alreadyExpiredPending
                    .map((o) => `#${o.id.slice(0, 8).toUpperCase()}`)
                    .join(", ")}
                </p>
              </div>
            </div>
          ) : null}
          {expiringSoon.length > 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">
                  {expiringSoon.length} orden
                  {expiringSoon.length === 1 ? "" : "es"} por vencer sin pago (menos de 24 h)
                </p>
                <ul className="mt-2 space-y-1">
                  {expiringSoon.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/admin/ordenes/${o.id}`}
                        className="font-medium underline"
                      >
                        #{o.id.slice(0, 8).toUpperCase()}
                      </Link>
                      {" — "}
                      {o.customerName || "Cliente"} · queda{" "}
                      {hoursLeftLabel(o.holdExpiresAt!, now)}
                      {o.departures?.[0]
                        ? ` · salida ${formatDepartureLabel(o.departures[0])}`
                        : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

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
              <th className="px-4 py-3 font-medium">Salida</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 font-medium">Creada</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const expiresSoon =
                order.paymentStatus === "pendiente" &&
                order.holdExpiresAt &&
                new Date(order.holdExpiresAt).getTime() - now <= EXPIRING_SOON_MS;
              const expired =
                order.paymentStatus === "pendiente" &&
                order.holdExpiresAt &&
                new Date(order.holdExpiresAt).getTime() <= now;

              return (
                <tr
                  key={order.id}
                  className={`border-b border-meru-border/60 last:border-0 ${
                    expired
                      ? "bg-red-50/70"
                      : expiresSoon
                        ? "bg-amber-50/50"
                        : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {order.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-meru-charcoal">{order.customerName || "—"}</p>
                    <p className="text-xs text-meru-muted">{order.customerEmail || ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    {(order.departures ?? []).length === 0 ? (
                      <span className="text-meru-muted">—</span>
                    ) : (
                      <ul className="space-y-1">
                        {(order.departures ?? []).slice(0, 3).map((dep, idx) => (
                          <li key={`${order.id}-dep-${idx}`} className="text-meru-charcoal">
                            <span className="font-medium">
                              {formatDepartureLabel({ date: dep.date, time: dep.time })}
                            </span>
                            <span className="block text-xs text-meru-muted">{dep.title}</span>
                          </li>
                        ))}
                        {(order.departures?.length ?? 0) > 3 ? (
                          <li className="text-xs text-meru-muted">
                            +{(order.departures?.length ?? 0) - 3} más
                          </li>
                        ) : null}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatCurrencyARS(order.total)}</td>
                  <td className="px-4 py-3">
                    <Badge className={paymentBadgeClass(order.paymentStatus)}>
                      {order.paymentStatus}
                    </Badge>
                    {order.paymentStatus === "pendiente" && order.holdExpiresAt ? (
                      <p
                        className={`mt-1 text-xs ${
                          expired
                            ? "font-medium text-red-700"
                            : expiresSoon
                              ? "font-medium text-amber-800"
                              : "text-meru-muted"
                        }`}
                      >
                        {expired
                          ? "Plazo vencido"
                          : `Cupo hasta ${new Date(order.holdExpiresAt).toLocaleString("es-AR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}`}
                      </p>
                    ) : null}
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
                      {order.paymentStatus === "pendiente" ? (
                        <>
                          <button
                            type="button"
                            className="text-amber-800 hover:underline disabled:opacity-50"
                            disabled={busyId === order.id}
                            onClick={() => void patchStatus(order.id, "pagado")}
                          >
                            Marcar pagado
                          </button>
                          <button
                            type="button"
                            className="text-red-700 hover:underline disabled:opacity-50"
                            disabled={busyId === order.id}
                            onClick={() => void patchStatus(order.id, "cancelado")}
                          >
                            Liberar cupos
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
