"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { AuthNav } from "@/components/layout/auth-nav";
import { MobileAuthMenu } from "@/components/layout/mobile-auth-menu";
import { BrandLogo } from "@/components/brand-logo";
import { CartNavLink } from "@/components/layout/cart-nav-link";
import { cn } from "@/lib/utils";

const seasonMenus = [
  { href: "/excursiones", label: "Excursiones" },
  { href: "/paquetes", label: "Paquetes" },
];

const navLinks = [
  { href: "/#sobre-nosotros", label: "Sobre Nosotros" },
  { href: "/#consulta", label: "Contacto" },
];

export function Header() {
  const { mobileMenuOpen, setMobileMenuOpen, toggleMobileMenu } = useUiStore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 border-b border-meru-border/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <BrandLogo href="/" size="sm" priority onClick={() => setMobileMenuOpen(false)} />

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex" aria-label="Principal">
          {seasonMenus.map((menu) => (
            <div key={menu.href} className="relative">
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium text-meru-charcoal transition-colors hover:text-meru-secondary"
                onClick={() => setOpenMenu((current) => (current === menu.href ? null : menu.href))}
                aria-expanded={openMenu === menu.href}
              >
                {menu.label}
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              </button>
              {openMenu === menu.href ? (
                <div className="absolute left-0 top-full z-50 mt-3 w-48 rounded-xl border border-meru-border bg-white p-2 shadow-lg">
                  <Link
                    href={menu.href}
                    className="block rounded-lg px-3 py-2 text-sm text-meru-charcoal hover:bg-meru-ice"
                    onClick={() => setOpenMenu(null)}
                  >
                    Ver todas
                  </Link>
                  <Link
                    href={`${menu.href}?temporada=verano`}
                    className="block rounded-lg px-3 py-2 text-sm text-meru-charcoal hover:bg-meru-ice"
                    onClick={() => setOpenMenu(null)}
                  >
                    Verano
                  </Link>
                  <Link
                    href={`${menu.href}?temporada=invierno`}
                    className="block rounded-lg px-3 py-2 text-sm text-meru-charcoal hover:bg-meru-ice"
                    onClick={() => setOpenMenu(null)}
                  >
                    Invierno
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-meru-charcoal transition-colors hover:text-meru-secondary"
            >
              {link.label}
            </Link>
          ))}
          <AuthNav />
          <CartNavLink />
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <CartNavLink onNavigate={() => setMobileMenuOpen(false)} />
          <button
            type="button"
            className="rounded-lg p-2 text-meru-primary"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-menu"
        className={cn(
          "border-t border-meru-border bg-white md:hidden",
          mobileMenuOpen ? "block" : "hidden"
        )}
        aria-label="Menú móvil"
      >
        <ul className="flex flex-col gap-1 px-4 py-4">
          {seasonMenus.map((menu) => (
            <li key={menu.href} className="rounded-lg px-3 py-2.5 text-meru-charcoal">
              <p className="text-sm font-medium">{menu.label}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <Link href={menu.href} className="rounded bg-meru-ice px-2.5 py-1.5" onClick={() => setMobileMenuOpen(false)}>
                  Todas
                </Link>
                <Link href={`${menu.href}?temporada=verano`} className="rounded bg-meru-ice px-2.5 py-1.5" onClick={() => setMobileMenuOpen(false)}>
                  Verano
                </Link>
                <Link href={`${menu.href}?temporada=invierno`} className="rounded bg-meru-ice px-2.5 py-1.5" onClick={() => setMobileMenuOpen(false)}>
                  Invierno
                </Link>
              </div>
            </li>
          ))}
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-lg px-3 py-2.5 text-meru-charcoal hover:bg-meru-ice"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <MobileAuthMenu onNavigate={() => setMobileMenuOpen(false)} />
        </ul>
      </nav>
    </header>
  );
}
