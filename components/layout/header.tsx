"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { AuthNav } from "@/components/layout/auth-nav";
import { MobileAuthMenu } from "@/components/layout/mobile-auth-menu";
import { BrandLogo } from "@/components/brand-logo";
import { CartNavLink } from "@/components/layout/cart-nav-link";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/excursiones", label: "Excursiones" },
  { href: "/paquetes", label: "Paquetes" },
  { href: "/#sobre-nosotros", label: "Sobre Nosotros" },
  { href: "/#consulta", label: "Contacto" },
];

export function Header() {
  const { mobileMenuOpen, setMobileMenuOpen, toggleMobileMenu } = useUiStore();

  return (
    <header className="sticky top-0 z-50 border-b border-meru-border/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <BrandLogo href="/" size="sm" priority onClick={() => setMobileMenuOpen(false)} />

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex" aria-label="Principal">
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
