"use client";

import { DashboardShell, ADMIN_EXTRA_NAV } from "@/components/dashboard/dashboard-shell";
import { ACCOUNT_NAV } from "@/features/account/lib/account-nav";

type AccountDashboardLayoutProps = {
  email?: string | null;
  isAdmin?: boolean;
  children: React.ReactNode;
};

export function AccountDashboardLayout({
  email,
  isAdmin,
  children,
}: AccountDashboardLayoutProps) {
  return (
    <DashboardShell
      title="Mi cuenta"
      subtitle={email ?? undefined}
      navItems={ACCOUNT_NAV}
      extraNavItems={isAdmin ? [ADMIN_EXTRA_NAV] : []}
      backHref="/"
      backLabel="Volver al sitio"
    >
      {children}
    </DashboardShell>
  );
}
