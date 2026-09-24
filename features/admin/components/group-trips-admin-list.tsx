"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { GroupTrip } from "@/types/catalog";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyARS } from "@/lib/format";
import { formatGroupTripDates } from "@/features/group-trips/lib/dates";
import { getGroupTripUnitPrice } from "@/features/group-trips/lib/pricing";

export function GroupTripsAdminList() {
  const [trips, setTrips] = useState<GroupTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/group-trips");
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setTrips(data.trips ?? []);
    } catch {
      setError("No se pudieron cargar los viajes grupales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setActive(id: string, active: boolean) {
    setActionError("");
    const res = await fetch(`/api/admin/group-trips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error ?? "No se pudo actualizar");
      return;
    }
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, active } : t)));
  }

  async function removePermanent(trip: GroupTrip) {
    if (
      !confirm(
        `¿Eliminar permanentemente "${trip.title}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    setActionError("");
    const res = await fetch(`/api/admin/group-trips/${trip.id}?permanent=true`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error ?? "No se pudo eliminar");
      return;
    }
    setTrips((prev) => prev.filter((t) => t.id !== trip.id));
  }

  return (
    <div>
      <PageHeader
        title="Viajes grupales"
        description="Ediciones con fechas fijas, itinerario propio, seña y cupo. Independientes de las excursiones del catálogo."
        action={
          <Link href="/admin/viajes-grupales/nuevo">
            <Button>Nuevo viaje grupal</Button>
          </Link>
        }
      />

      {actionError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}
      {loading ? <p className="text-brand-muted">Cargando…</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {!loading && trips.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-border bg-white p-10 text-center">
          <p className="text-brand-charcoal">Todavía no hay viajes grupales.</p>
          <Link href="/admin/viajes-grupales/nuevo" className="mt-4 inline-block">
            <Button>Crear el primero</Button>
          </Link>
        </div>
      ) : null}

      {trips.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-brand-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-brand-border bg-brand-sand/50 text-left text-brand-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Viaje</th>
                <th className="px-4 py-3 font-medium">Fechas</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Cupos</th>
                <th className="px-4 py-3 font-medium">Home</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} className="border-b border-brand-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="text-brand-charcoal">{trip.title}</p>
                    <p className="text-xs text-brand-muted">
                      {trip.destination} · /{trip.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {formatGroupTripDates(trip.startDate, trip.endDate)}
                  </td>
                  <td className="px-4 py-3">{formatCurrencyARS(getGroupTripUnitPrice(trip))}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {trip.stock} / {trip.capacity}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {trip.featuredOnHome ? `Sí · #${trip.homeOrder ?? 100}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        trip.active
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-600"
                      }
                    >
                      {trip.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <Link
                        href={`/admin/viajes-grupales/${trip.id}/editar`}
                        className="text-brand-secondary hover:underline"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="text-amber-700 hover:underline"
                        onClick={() => void setActive(trip.id, !trip.active)}
                      >
                        {trip.active ? "Desactivar" : "Reactivar"}
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => void removePermanent(trip)}
                      >
                        Eliminar
                      </button>
                      {trip.active ? (
                        <Link
                          href={`/viajes-grupales/${trip.slug}`}
                          className="text-brand-muted hover:underline"
                          target="_blank"
                        >
                          Ver
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
