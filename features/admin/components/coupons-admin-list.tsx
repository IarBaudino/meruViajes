"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Coupon } from "@/types/coupon";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function discountLabel(coupon: Coupon) {
  return coupon.discountType === "fixed"
    ? `$${Math.round(coupon.discountValue).toLocaleString("es-AR")}`
    : `−${coupon.discountValue}%`;
}

export function CouponsAdminList() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/coupons");
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setCoupons(data.coupons ?? []);
    } catch {
      setError("No se pudieron cargar los cupones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setActive(id: string, active: boolean) {
    setActionError("");
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error ?? "No se pudo actualizar");
      return;
    }
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
  }

  async function removePermanent(coupon: Coupon) {
    if (!confirm(`¿Eliminar el cupón ${coupon.code}?`)) return;
    setActionError("");
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error ?? "No se pudo eliminar");
      return;
    }
    setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
  }

  return (
    <div>
      <PageHeader
        title="Cupones"
        description="Códigos para vendedoras: descuento para quien reserva y comisión para quien lo trajo."
        action={
          <Link href="/admin/cupones/nuevo">
            <Button>Nuevo cupón</Button>
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

      {!loading && coupons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-border bg-white p-10 text-center">
          <p className="text-brand-charcoal">Todavía no hay cupones.</p>
          <Link href="/admin/cupones/nuevo" className="mt-4 inline-block">
            <Button>Crear el primero</Button>
          </Link>
        </div>
      ) : null}

      {coupons.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-brand-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-brand-border bg-brand-sand/50 text-left text-brand-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Vendedora</th>
                <th className="px-4 py-3 font-medium">Descuento</th>
                <th className="px-4 py-3 font-medium">Comisión</th>
                <th className="px-4 py-3 font-medium">Usos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-brand-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-brand-charcoal">{coupon.code}</td>
                  <td className="px-4 py-3 text-brand-muted">{coupon.sellerName}</td>
                  <td className="px-4 py-3">{discountLabel(coupon)}</td>
                  <td className="px-4 py-3 text-brand-muted">{coupon.commissionPercent}%</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {coupon.usedCount}
                    {coupon.maxUses > 0 ? ` / ${coupon.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        coupon.active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                      }
                    >
                      {coupon.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <Link
                        href={`/admin/cupones/${coupon.id}/editar`}
                        className="text-brand-secondary hover:underline"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="text-amber-700 hover:underline"
                        onClick={() => void setActive(coupon.id, !coupon.active)}
                      >
                        {coupon.active ? "Desactivar" : "Reactivar"}
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => void removePermanent(coupon)}
                      >
                        Eliminar
                      </button>
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
