import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { PhoneContact } from "@/components/layout/phone-contact";
import { BrandLogo } from "@/components/brand-logo";

const INSTAGRAM_URL = "https://www.instagram.com/meru.viajes";

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

export async function Footer() {
  const year = new Date().getFullYear();
  const { footer } = await getSiteSettings();

  return (
    <footer className="border-t border-meru-border bg-meru-charcoal text-meru-sand/90">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="inline-flex rounded-xl bg-white/95 p-3">
              <BrandLogo href="/" size="lg" />
            </div>
            <h2 className="mt-4 text-lg text-meru-sand">{footer.brandName}</h2>
            <p className="mt-3 text-sm leading-relaxed text-meru-sand/80">{footer.tagline}</p>
          </div>

          <div>
            <h3 className="font-sans text-xs font-medium uppercase tracking-wider text-meru-secondary">
              Enlaces
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/excursiones" className="hover:text-meru-sand">
                  Excursiones
                </Link>
              </li>
              <li>
                <Link href="/paquetes" className="hover:text-meru-sand">
                  Paquetes
                </Link>
              </li>
              <li>
                <Link href="/#sobre-nosotros" className="hover:text-meru-sand">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/#consulta" className="hover:text-meru-sand">
                  Consultas
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-meru-sand">
                  Administración
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-sans text-xs font-medium uppercase tracking-wider text-meru-secondary">
              Contacto
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-meru-secondary" aria-hidden />
                <span>{footer.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-meru-secondary" aria-hidden />
                <a href={`mailto:${footer.email}`} className="hover:text-meru-sand">
                  {footer.email}
                </a>
              </li>
              <li>
                <PhoneContact
                  phoneLabel={footer.phoneLabel}
                  phoneNumber={footer.phoneNumber}
                />
              </li>
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-meru-sand"
                >
                  <InstagramIcon className="h-4 w-4 shrink-0 text-meru-secondary" />
                  @meru.viajes
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-1 border-t border-white/10 pt-6 text-center text-xs text-meru-sand/55">
          <p>© {year} {footer.brandName}. Todos los derechos reservados.</p>
          <p>
            Desarrollado por{" "}
            <a
              href="https://www.iarabaudinodev.com.ar"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-meru-sand/80 underline underline-offset-2 hover:text-meru-secondary"
            >
              Iara Baudino
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
