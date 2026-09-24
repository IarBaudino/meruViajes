import Link from "next/link";
import { getHomeFeaturedServices } from "@/features/excursions/lib/get-services";
import { Button } from "@/components/ui/button";
import { ExcursionCard } from "@/features/excursions/components/excursion-card";
import type { SiteSettings } from "@/types/site-settings";

type ExcursionsPreviewProps = {
  section: SiteSettings["excursionsPreview"];
};

export async function ExcursionsPreview({ section }: ExcursionsPreviewProps) {
  const preview = await getHomeFeaturedServices(6);

  return (
    <section id="excursiones" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl text-meru-charcoal">{section.title}</h2>
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
              {preview.map((service) => (
                <li key={service.id}>
                  <ExcursionCard service={service} className="h-full" />
                </li>
              ))}
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
