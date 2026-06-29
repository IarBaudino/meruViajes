import Link from "next/link";
import { getActiveServices } from "@/features/excursions/lib/get-services";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyARS } from "@/lib/format";
import Image from "next/image";
import type { SiteSettings } from "@/types/site-settings";

type ExcursionsPreviewProps = {
  section: SiteSettings["excursionsPreview"];
};

export async function ExcursionsPreview({ section }: ExcursionsPreviewProps) {
  const services = await getActiveServices();
  const preview = services.slice(0, 3);

  return (
    <section id="excursiones" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl text-meru-charcoal sm:text-4xl">{section.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-meru-muted">{section.description}</p>
        </div>

        {preview.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-meru-border bg-meru-sand/50 py-16 text-center">
            <p className="text-lg font-medium text-meru-charcoal">
              Próximamente nuevas excursiones
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-meru-muted">
              Estamos preparando el catálogo. Escribinos y te ayudamos a planificar tu viaje.
            </p>
            <Link href="/#consulta" className="mt-6 inline-block">
              <Button variant="primary">Consultanos</Button>
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-12 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((service) => {
                const cover = service.photos[0];
                return (
                  <li key={service.id}>
                    <Card className="group h-full overflow-hidden transition-shadow hover:shadow-[var(--shadow-elevated)]">
                      <Link
                        href={`/excursiones/${service.slug}`}
                        className="flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-meru-secondary"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                          {cover ? (
                            <Image
                              src={cover}
                              alt={`${service.title} — vista previa`}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            />
                          ) : null}
                        </div>
                        <CardContent className="flex flex-1 flex-col pt-5">
                          <h3 className="text-lg text-meru-charcoal group-hover:text-meru-secondary">
                            {service.title}
                          </h3>
                          <p className="mt-2 line-clamp-2 flex-1 text-sm text-meru-charcoal-muted">
                            {service.description}
                          </p>
                          <p className="mt-4 font-medium text-meru-primary">
                            {formatCurrencyARS(service.price)}
                          </p>
                          <span className="mt-2 text-sm font-semibold text-meru-secondary">
                            Ver detalle →
                          </span>
                        </CardContent>
                      </Link>
                    </Card>
                  </li>
                );
              })}
            </ul>

            <div className="mt-10 text-center">
              <Link href="/excursiones">
                <Button variant="primary">Ver catálogo completo</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
