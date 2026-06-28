import Link from "next/link";
import Image from "next/image";
import { getActiveServices } from "@/features/excursions/lib/get-services";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyARS } from "@/lib/format";

export async function ExcursionsPreview() {
  const services = await getActiveServices();
  const preview = services.slice(0, 3);

  return (
    <section id="excursiones" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-meru-charcoal sm:text-4xl">
            Nuestras Excursiones
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-meru-muted">
            Algunas de nuestras propuestas en Ushuaia y Tierra del Fuego. Mirá el detalle, armá tu
            carrito o consultanos.
          </p>
        </div>

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
                      <h3 className="text-lg font-bold text-meru-charcoal group-hover:text-meru-secondary">
                        {service.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">
                        {service.description}
                      </p>
                      <p className="mt-4 font-bold text-meru-primary">
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
      </div>
    </section>
  );
}
