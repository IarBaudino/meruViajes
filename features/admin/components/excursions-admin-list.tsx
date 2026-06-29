"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Service } from "@/types";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyARS } from "@/lib/format";

export function ExcursionsAdminList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
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
    }
    void load();
  }, []);

  async function deactivate(id: string) {
    if (!confirm("¿Desactivar esta excursión? Dejará de verse en el catálogo.")) return;
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: false } : s)));
  }

  return (
    <div>
      <PageHeader
        title="Excursiones"
        description="Creá y editá el catálogo publicado en la web."
        action={
          <Link href="/admin/excursiones/nueva">
            <Button>Nueva excursión</Button>
          </Link>
        }
      />

      {loading ? <p className="text-meru-muted">Cargando…</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

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
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/excursiones/${service.id}/editar`}
                      className="text-meru-secondary hover:underline"
                    >
                      Editar
                    </Link>
                    {service.active ? (
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => void deactivate(service.id)}
                      >
                        Desactivar
                      </button>
                    ) : null}
                    <Link
                      href={`/excursiones/${service.slug}`}
                      className="text-meru-muted hover:underline"
                      target="_blank"
                    >
                      Ver
                    </Link>
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
