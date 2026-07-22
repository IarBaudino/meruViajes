"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Service } from "@/types";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyARS } from "@/lib/format";
import { BookingHoldSettingsCard } from "@/features/admin/components/booking-hold-settings-card";

export function ExcursionsAdminList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/services");
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setServices(data.services ?? []);
    } catch {
      setError("No se pudieron cargar las excursiones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setActive(id: string, active: boolean) {
    setActionError("");
    const label = active ? "reactivar" : "desactivar";
    if (!confirm(`¿${active ? "Reactivar" : "Desactivar"} esta excursión en el catálogo?`)) return;

    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    const json = await res.json();

    if (!res.ok) {
      setActionError(json.error ?? `No se pudo ${label} la excursión`);
      return;
    }

    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active } : s)));
  }

  async function removePermanently(service: Service) {
    setActionError("");
    const confirmed = confirm(
      `¿Eliminar permanentemente "${service.title}"?\n\nSe borrarán el registro en Firestore y sus imágenes/vídeos en Supabase. No se puede deshacer. Si tiene reservas, no se permitirá.`
    );
    if (!confirmed) return;

    const res = await fetch(`/api/admin/services/${service.id}?permanent=true`, {
      method: "DELETE",
    });
    const json = await res.json();

    if (!res.ok) {
      setActionError(json.error ?? "No se pudo eliminar la excursión");
      return;
    }

    setServices((prev) => prev.filter((s) => s.id !== service.id));
  }

  const activeCount = services.filter((s) => s.active).length;
  const inactiveCount = services.length - activeCount;

  return (
    <div>
      <PageHeader
        title="Excursiones"
        description="Creá, editá, desactivá o eliminá excursiones del catálogo."
        action={
          <Link href="/admin/excursiones/nueva">
            <Button>Nueva excursión</Button>
          </Link>
        }
      />

      <BookingHoldSettingsCard />

      {!loading && services.length > 0 ? (
        <p className="mb-4 text-sm text-meru-muted">
          {activeCount} activa{activeCount === 1 ? "" : "s"}
          {inactiveCount > 0 ? ` · ${inactiveCount} inactiva${inactiveCount === 1 ? "" : "s"}` : ""}
        </p>
      ) : null}

      {loading ? <p className="text-meru-muted">Cargando…</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}
      {actionError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

      {!loading && services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-meru-border bg-white p-10 text-center">
          <p className="text-meru-charcoal">Todavía no hay excursiones.</p>
          <Link href="/admin/excursiones/nueva" className="mt-4 inline-block">
            <Button>Crear la primera</Button>
          </Link>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-meru-border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-meru-border bg-meru-sand/50 text-left text-meru-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Home</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-b border-meru-border/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-meru-charcoal">{service.title}</p>
                  <p className="text-xs text-meru-muted">/{service.slug}</p>
                </td>
                <td className="px-4 py-3">{formatCurrencyARS(service.price)}</td>
                <td className="px-4 py-3 text-meru-muted">
                  {service.featuredOnHome ? `Sí · #${service.homeOrder ?? 100}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      service.active
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-100 text-slate-600"
                    }
                  >
                    {service.active ? "Activa" : "Inactiva"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link
                      href={`/admin/excursiones/${service.id}/editar`}
                      className="text-meru-secondary hover:underline"
                    >
                      Editar
                    </Link>
                    {service.active ? (
                      <button
                        type="button"
                        className="text-amber-700 hover:underline"
                        onClick={() => void setActive(service.id, false)}
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-meru-secondary hover:underline"
                        onClick={() => void setActive(service.id, true)}
                      >
                        Reactivar
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => void removePermanently(service)}
                    >
                      Eliminar
                    </button>
                    {service.active ? (
                      <Link
                        href={`/excursiones/${service.slug}`}
                        className="text-meru-muted hover:underline"
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

      <p className="mt-4 text-xs text-meru-muted">
        <strong>Desactivar</strong> la oculta del catálogo pero conserva el historial.{" "}
        <strong>Eliminar</strong> borra Firestore y los medios en Supabase (solo si no tiene
        reservas).
      </p>
    </div>
  );
}
