import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { brand } from "@/config/brand";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { PhoneContact } from "@/components/layout/phone-contact";
import { BrandLogo } from "@/components/brand-logo";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const footerLinks = [
  { href: "/excursiones", label: "Excursiones" },
  { href: "/paquetes", label: "Paquetes" },
  { href: "/viajes-grupales", label: "Viajes grupales" },
  { href: "/#sobre-nosotros", label: "Sobre Nosotros" },
  { href: "/#consulta", label: "Consultas" },
  { href: "/admin", label: "Administración" },
];

export async function Footer() {
  const year = new Date().getFullYear();
  const { footer, social } = await getSiteSettings();

  return (
    <footer className="border-t border-brand-border bg-brand-surface text-brand-charcoal">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo href="/" size="sm" />
            <div className="min-w-0">
              <p className="font-heading text-base leading-tight text-brand-charcoal">
                {footer.brandName}
              </p>
              <p className="mt-0.5 truncate text-xs text-brand-muted">{footer.tagline}</p>
            </div>
          </div>

          <nav aria-label="Pie de página">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-brand-secondary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted">
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-secondary" aria-hidden />
              <span>{footer.address}</span>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand-secondary" aria-hidden />
              <a href={`mailto:${footer.email}`} className="hover:text-brand-secondary">
                {footer.email}
              </a>
            </li>
            <li>
              <PhoneContact
                phoneLabel={footer.phoneLabel}
                phoneNumber={footer.phoneNumber}
                className="inline-flex flex-row flex-wrap items-center gap-x-2"
              />
            </li>
            {social.instagramUrl ? (
              <li>
                <a
                  href={social.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-brand-secondary"
                >
                  <InstagramIcon className="h-3.5 w-3.5 shrink-0 text-brand-secondary" />
                  {social.instagramHandle}
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-brand-border pt-2 text-[11px] text-brand-muted">
          <p>© {year} {footer.brandName}</p>
          {brand.developerCredit.enabled ? (
            <p>
              Desarrollado por{" "}
              <a
                href={brand.developerCredit.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand-charcoal underline underline-offset-2 hover:text-brand-secondary"
              >
                {brand.developerCredit.name}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
