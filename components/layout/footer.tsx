import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-meru-border bg-meru-charcoal text-meru-sand/90">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h2 className="text-lg text-meru-sand">Meru Viajes y Turismo</h2>
            <p className="mt-3 text-sm leading-relaxed text-meru-sand/80">
              Aventurate en el Fin del Mundo. Excursiones y experiencias únicas en Ushuaia,
              Tierra del Fuego.
            </p>
          </div>

          <div>
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-meru-secondary">
              Enlaces
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/excursiones" className="hover:text-meru-sand">
                  Excursiones
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
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-meru-secondary">
              Contacto
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-meru-secondary" aria-hidden />
                <span>Ushuaia, Tierra del Fuego, Argentina</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-meru-secondary" aria-hidden />
                <a href="mailto:info@meruviajes.tur.ar" className="hover:text-meru-sand">
                  info@meruviajes.tur.ar
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-meru-secondary" aria-hidden />
                <span>Consultanos por WhatsApp</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-meru-sand/55">
          © {year} Meru Viajes y Turismo. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
