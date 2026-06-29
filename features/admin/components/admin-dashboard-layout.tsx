"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ADMIN_NAV } from "@/features/admin/lib/admin-nav";

type AdminDashboardLayoutProps = {
  email?: string | null;
  children: React.ReactNode;
};

export function AdminDashboardLayout({ email, children }: AdminDashboardLayoutProps) {
  return (
    <DashboardShell
      title="Administración"
      subtitle={email ?? undefined}
      navItems={ADMIN_NAV}
      backHref="/"
      backLabel="Volver al sitio"
    >
      {children}
    </DashboardShell>
  );
}
