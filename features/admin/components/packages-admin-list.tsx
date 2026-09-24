"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ExcursionPackage } from "@/types/catalog";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyARS } from "@/lib/format";

export function PackagesAdminList() {
  const [packages, setPackages] = useState<ExcursionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/packages");
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setPackages(data.packages ?? []);
    } catch {
      setError("No se pudieron cargar los paquetes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setActive(id: string, active: boolean) {
    setActionError("");
    const res = await fetch(`/api/admin/packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error ?? "No se pudo actualizar");
      return;
    }
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, active } : p)));
  }

  async function removePermanent(pkg: ExcursionPackage) {
    if (
      !confirm(
        `¿Eliminar permanentemente "${pkg.title}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    setActionError("");
    const res = await fetch(`/api/admin/packages/${pkg.id}?permanent=true`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error ?? "No se pudo eliminar");
      return;
    }
    setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
  }

  return (
    <div>
      <PageHeader
        title="Paquetes"
        description="Combiná varias excursiones en un pack con precio propio. Podés crear todos los que quieras."
        action={
          <Link href="/admin/paquetes/nuevo">
            <Button>Nuevo paquete</Button>
          </Link>
        }
      />

      {actionError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}
      {loading ? <p className="text-meru-muted">Cargando…</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {!loading && packages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-meru-border bg-white p-10 text-center">
          <p className="text-meru-charcoal">Todavía no hay paquetes.</p>
          <Link href="/admin/paquetes/nuevo" className="mt-4 inline-block">
            <Button>Crear el primero</Button>
          </Link>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-meru-border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-meru-border bg-meru-sand/50 text-left text-meru-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Excursiones</th>
              <th className="px-4 py-3 font-medium">Home</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.id} className="border-b border-meru-border/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-meru-charcoal">{pkg.title}</p>
                  <p className="text-xs text-meru-muted">/{pkg.slug}</p>
                </td>
                <td className="px-4 py-3">{formatCurrencyARS(pkg.price)}</td>
                <td className="px-4 py-3 text-meru-muted">{pkg.serviceIds.length}</td>
                <td className="px-4 py-3 text-meru-muted">
                  {pkg.featuredOnHome ? `Sí · #${pkg.homeOrder ?? 100}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      pkg.active
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-100 text-slate-600"
                    }
                  >
                    {pkg.active ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link
                      href={`/admin/paquetes/${pkg.id}/editar`}
                      className="text-meru-secondary hover:underline"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      className="text-amber-700 hover:underline"
                      onClick={() => void setActive(pkg.id, !pkg.active)}
                    >
                      {pkg.active ? "Desactivar" : "Reactivar"}
                    </button>
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => void removePermanent(pkg)}
                    >
                      Eliminar
                    </button>
                    {pkg.active ? (
                      <Link
                        href={`/paquetes/${pkg.slug}`}
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
    </div>
  );
}
