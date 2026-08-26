"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Archive, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrencyARS } from "@/lib/format";
import { formatDepartureLabel } from "@/features/excursions/lib/departures";

type DepartureRow = {
  title: string;
  date: string;
  time: string;
  label?: string;
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
  customerDni?: string;
  itemCount?: number;
  departures?: DepartureRow[];
  hasManualPackage?: boolean;
  holdExpiresAt?: string | null;
  createdAt: string | null;
  archived?: boolean;
  past?: boolean;
  canArchive?: boolean;
};

type ArchiveView = "active" | "archived" | "all";
type StatusFilter = "all" | "pendiente" | "pagado" | "cancelado" | "pasadas";

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
  const [meta, setMeta] = useState({ activeCount: 0, archivedCount: 0, fetched: 0 });
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [archiveView, setArchiveView] = useState<ArchiveView>("active");
  const [releaseInfo, setReleaseInfo] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setActionError("");
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (archiveView === "archived") params.set("archived", "1");
      else if (archiveView === "all") params.set("archived", "all");
      else params.set("archived", "0");

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setActionError("No se pudieron cargar las órdenes");
        return;
      }
      const data = await res.json();
      setOrders(data.orders ?? []);
      setMeta({
        activeCount: Number(data.meta?.activeCount ?? 0),
        archivedCount: Number(data.meta?.archivedCount ?? 0),
        fetched: Number(data.meta?.fetched ?? 0),
      });
    } finally {
      setLoading(false);
    }
  }, [archiveView, debouncedQuery, statusFilter]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, [load]);

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

  async function patchStatus(
    orderId: string,
    paymentStatus: "pagado" | "cancelado",
    fromPaid = false
  ) {
    setActionError("");
    const confirmMsg =
      paymentStatus === "pagado"
        ? "¿Marcar esta orden como pagada? Pasará a Reservas del cliente."
        : fromPaid
          ? "¿Anular esta orden pagada y liberar los cupos? El cliente será avisado."
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
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function setArchived(orderId: string, archived: boolean) {
    setActionError("");
    const msg = archived
      ? "¿Archivar esta orden? Se oculta del listado principal (podés verla en Archivadas)."
      : "¿Restaurar esta orden al listado principal?";
    if (!confirm(msg)) return;

    setBusyId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "No se pudo archivar");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function archiveVisibleCancellable() {
    const candidates = orders.filter(
      (o) =>
        !o.archived &&
        (o.paymentStatus === "cancelado" || (o.paymentStatus === "pagado" && o.past))
    );
    if (candidates.length === 0) {
      setActionError("No hay canceladas o pasadas visibles para archivar.");
      return;
    }
    if (
      !confirm(
        `¿Archivar ${candidates.length} orden${candidates.length === 1 ? "" : "es"} cancelada(s)/pasada(s) del listado actual?`
      )
    ) {
      return;
    }

    setBusyId("bulk");
    setActionError("");
    try {
      let failed = 0;
      for (const order of candidates) {
        const res = await fetch(`/api/admin/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: true }),
        });
        if (!res.ok) failed += 1;
      }
      if (failed > 0) {
        setActionError(`Se archivaron con errores: ${failed} no se pudieron archivar.`);
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function releaseExpiredNow() {
    setActionError("");
    setReleaseInfo("");
    if (
      !confirm(
        "¿Liberar ahora todos los cupos de órdenes pendientes con plazo vencido? Los clientes serán avisados por email."
      )
    ) {
      return;
    }

    setBusyId("release-expired");
    try {
      const res = await fetch("/api/admin/orders/release-expired", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "No se pudieron liberar las vencidas");
        return;
      }
      const released = Number(json.released ?? 0);
      const checked = Number(json.checked ?? 0);
      const errCount = Array.isArray(json.errors) ? json.errors.length : 0;
      setReleaseInfo(
        `Revisadas ${checked}: liberadas ${released}${
          errCount > 0 ? `, con ${errCount} error(es)` : ""
        }.`
      );
      if (errCount > 0) {
        setActionError((json.errors as string[]).slice(0, 3).join(" · "));
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Órdenes"
        description="Buscá por cliente y archivá canceladas o pasadas para mantener el listado limpio."
      />

      <div className="mb-6 space-y-4 rounded-xl border border-meru-border bg-white p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-meru-muted"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono, DNI, ID o excursión…"
            className="pl-10"
            aria-label="Buscar órdenes"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["active", `Activas (${meta.activeCount})`],
              ["archived", `Archivadas (${meta.archivedCount})`],
              ["all", "Todas"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setArchiveView(value)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                archiveView === value
                  ? "bg-meru-primary text-white"
                  : "bg-meru-sand/60 text-meru-charcoal hover:bg-meru-sand"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "Todos los estados"],
              ["pendiente", "Pendientes"],
              ["pagado", "Pagadas"],
              ["cancelado", "Canceladas"],
              ["pasadas", "Pasadas"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                statusFilter === value
                  ? "bg-meru-charcoal text-white"
                  : "border border-meru-border text-meru-charcoal hover:bg-meru-sand/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {archiveView === "active" ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busyId === "bulk" || loading}
              onClick={() => void archiveVisibleCancellable()}
            >
              <Archive className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Archivar canceladas/pasadas visibles
            </Button>
            <p className="text-xs text-meru-muted">
              Mostrando hasta {meta.fetched} órdenes recientes.
            </p>
          </div>
        ) : null}
      </div>

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
                  El cron automático corre 1 vez al día (~9:00 AR). Si hace falta antes,
                  liberálas ahora.
                </p>
                <button
                  type="button"
                  className="mt-3 rounded-lg bg-red-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-50"
                  disabled={busyId === "release-expired"}
                  onClick={() => void releaseExpiredNow()}
                >
                  {busyId === "release-expired"
                    ? "Liberando…"
                    : `Liberar ${alreadyExpiredPending.length} vencida${
                        alreadyExpiredPending.length === 1 ? "" : "s"
                      } ahora`}
                </button>
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

      {releaseInfo ? (
        <p className="mb-4 text-sm text-green-800" role="status">
          {releaseInfo}
        </p>
      ) : null}

      {actionError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

      {loading ? <p className="text-meru-muted">Cargando…</p> : null}

      {!loading && orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-meru-border bg-white p-10 text-center text-meru-muted">
          {debouncedQuery || statusFilter !== "all" || archiveView !== "active"
            ? "No hay órdenes con esos filtros."
            : "Todavía no hay órdenes registradas."}
        </div>
      ) : null}

      {!loading && orders.length > 0 ? (
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
                      {order.archived ? (
                        <Badge className="mt-1 block w-fit bg-slate-100 text-slate-600">
                          Archivada
                        </Badge>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-meru-charcoal">{order.customerName || "—"}</p>
                      <p className="text-xs text-meru-muted">{order.customerEmail || ""}</p>
                      {order.customerPhone ? (
                        <p className="text-xs text-meru-muted">{order.customerPhone}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {order.hasManualPackage ? (
                        <Badge className="mb-1 bg-amber-100 text-amber-900">
                          Paquete manual
                        </Badge>
                      ) : null}
                      {(order.departures ?? []).length === 0 ? (
                        <span className="text-meru-muted">—</span>
                      ) : (
                        <ul className="space-y-1">
                          {(order.departures ?? []).slice(0, 3).map((dep, idx) => (
                            <li
                              key={`${order.id}-dep-${idx}`}
                              className="text-meru-charcoal"
                            >
                              <span className="font-medium">
                                {dep.label ??
                                  formatDepartureLabel({
                                    date: dep.date,
                                    time: dep.time,
                                  })}
                              </span>
                              <span className="block text-xs text-meru-muted">
                                {dep.title}
                              </span>
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
                      {order.past && order.paymentStatus !== "pendiente" ? (
                        <p className="mt-1 text-xs text-meru-muted">Salida pasada</p>
                      ) : null}
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
                            : `Cupo hasta ${new Date(order.holdExpiresAt).toLocaleString(
                                "es-AR",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                }
                              )}`}
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
                        {order.paymentStatus === "pagado" ? (
                          <button
                            type="button"
                            className="text-red-700 hover:underline disabled:opacity-50"
                            disabled={busyId === order.id}
                            onClick={() => void patchStatus(order.id, "cancelado", true)}
                          >
                            Anular / liberar
                          </button>
                        ) : null}
                        {order.canArchive ? (
                          <button
                            type="button"
                            className="text-slate-700 hover:underline disabled:opacity-50"
                            disabled={busyId === order.id}
                            onClick={() =>
                              void setArchived(order.id, !order.archived)
                            }
                          >
                            {order.archived ? "Restaurar" : "Archivar"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
