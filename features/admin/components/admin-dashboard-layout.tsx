"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ADMIN_NAV } from "@/features/admin/lib/admin-nav";

type AdminDashboardLayoutProps = {
  email?: string | null;
  preview?: boolean;
  children: React.ReactNode;
};

export function AdminDashboardLayout({ email, preview, children }: AdminDashboardLayoutProps) {
  return (
    <DashboardShell
      title="Administración"
      subtitle={email ?? undefined}
      navItems={ADMIN_NAV}
      backHref="/"
      backLabel="Volver al sitio"
    >
      {preview ? (
        <p className="mb-6 rounded-lg border border-brand-border bg-brand-ice px-4 py-3 text-sm text-brand-charcoal">
          Vista previa local: Firebase todavía no está configurado. Podés recorrer el panel; guardar
          o subir archivos no va a persistir.
        </p>
      ) : null}
      {children}
    </DashboardShell>
  );
}
