"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Mountain, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

type DashboardShellProps = {
  title: string;
  subtitle?: string;
  navItems: DashboardNavItem[];
  extraNavItems?: DashboardNavItem[];
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
};

export function DashboardShell({
  title,
  subtitle,
  navItems,
  extraNavItems = [],
  backHref = "/",
  backLabel = "Volver al sitio",
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const allItems = [...navItems, ...extraNavItems];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const navContent = (
    <nav className="flex flex-col gap-1 p-3">
      {allItems.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-meru-primary text-white"
                : "text-meru-charcoal hover:bg-meru-ice"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-meru-sand">
      <header className="border-b border-meru-border bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-meru-muted">{title}</p>
            {subtitle ? <p className="text-sm text-meru-charcoal">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-meru-charcoal hover:bg-meru-ice"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen ? <div className="border-t border-meru-border pb-3">{navContent}</div> : null}
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-meru-border bg-white lg:block lg:min-h-screen">
          <div className="border-b border-meru-border p-5">
            <Link href={backHref} className="flex items-center gap-2 text-meru-charcoal">
              <Mountain className="h-6 w-6 text-meru-secondary" aria-hidden />
              <span className="font-medium">{title}</span>
            </Link>
            {subtitle ? <p className="mt-1 truncate text-xs text-meru-muted">{subtitle}</p> : null}
          </div>
          {navContent}
          <div className="border-t border-meru-border p-4">
            <Link href={backHref} className="text-sm text-meru-secondary hover:underline">
              ← {backLabel}
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export const ADMIN_EXTRA_NAV: DashboardNavItem = {
  href: "/admin",
  label: "Panel admin",
  icon: ShieldCheck,
};
