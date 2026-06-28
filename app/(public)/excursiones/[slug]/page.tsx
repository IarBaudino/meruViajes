import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getActiveServices, getServiceBySlug } from "@/features/excursions/lib/get-services";
import { ExcursionGallery } from "@/features/excursions/components/excursion-gallery";
import { AddToCartButton } from "@/features/excursions/components/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyARS } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const services = await getActiveServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) {
    return { title: "Excursión no encontrada" };
  }
  return {
    title: service.title,
    description: service.description.slice(0, 160),
    openGraph: {
      title: service.title,
      description: service.description.slice(0, 180),
      images: service.photos[0] ? [{ url: service.photos[0] }] : undefined,
    },
  };
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-meru-border bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-meru-secondary">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-meru-charcoal-muted">{children}</div>
    </div>
  );
}

export default async function ExcursionDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <nav aria-label="Migas de pan" className="text-sm text-meru-muted">
        <Link href="/" className="hover:text-meru-secondary">
          Inicio
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <Link href="/excursiones" className="hover:text-meru-secondary">
          Excursiones
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-meru-charcoal">{service.title}</span>
      </nav>

      <header className="mt-6">
        {service.category && (
          <Badge className="bg-meru-ice text-meru-primary">{service.category}</Badge>
        )}
        <h1 className="mt-3 text-3xl font-bold text-meru-charcoal sm:text-4xl">{service.title}</h1>
        {service.location && (
          <p className="mt-3 flex items-center gap-2 text-meru-muted">
            <MapPin className="h-5 w-5 shrink-0 text-meru-accent" aria-hidden />
            {service.location}
          </p>
        )}
      </header>

      <div className="mt-8">
        <ExcursionGallery
          photos={service.photos}
          title={service.title}
          seasonalPhotos={service.seasonalPhotos}
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section aria-labelledby="desc-heading">
            <h2 id="desc-heading" className="sr-only">
              Descripción
            </h2>
            <p className="text-lg leading-relaxed text-meru-charcoal-muted">{service.description}</p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            {service.meetingPoint && (
              <InfoBlock title="Punto de encuentro">
                <p>{service.meetingPoint}</p>
              </InfoBlock>
            )}
            {service.requirements && (
              <InfoBlock title="Requisitos">
                <p>{service.requirements}</p>
              </InfoBlock>
            )}
            {service.additionalEquipment && (
              <InfoBlock title="Equipo recomendado">
                <p>{service.additionalEquipment}</p>
              </InfoBlock>
            )}
            {service.cancellationPolicy && (
              <InfoBlock title="Cancelaciones">
                <p>{service.cancellationPolicy}</p>
              </InfoBlock>
            )}
            {service.notIncluded && (
              <InfoBlock title="No incluye">
                <p>{service.notIncluded}</p>
              </InfoBlock>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-meru-border bg-white p-6 shadow-[var(--shadow-card)]">
            <p className="text-sm text-meru-muted">Precio estimado</p>
            <p className="mt-1 text-3xl font-bold text-meru-primary">
              {formatCurrencyARS(service.price)}
            </p>
            {service.duration && (
              <p className="mt-3 text-sm text-meru-charcoal-muted">
                <span className="font-medium text-meru-charcoal">Duración:</span> {service.duration}
              </p>
            )}
            {service.difficulty && (
              <p className="mt-1 text-sm text-meru-charcoal-muted">
                <span className="font-medium text-meru-charcoal">Dificultad:</span> {service.difficulty}
              </p>
            )}
            <div className="mt-6 space-y-3">
              <AddToCartButton service={service} />
              <Link
                href="/#consulta"
                className="flex h-12 w-full items-center justify-center rounded-lg border-2 border-meru-primary font-semibold text-meru-primary transition-colors hover:bg-meru-ice"
              >
                Consultar por esta excursión
              </Link>
            </div>
            <p className="mt-4 text-xs text-meru-muted">
              La confirmación y el pago se coordinan con la agencia. Reservá desde tu carrito o
              escribinos.
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-12">
        <Link href="/excursiones" className="font-semibold text-meru-secondary hover:underline">
          ← Ver todas las excursiones
        </Link>
      </div>
    </div>
  );
}
