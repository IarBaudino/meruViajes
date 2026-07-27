import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getActiveServices, getServiceBySlug } from "@/features/excursions/lib/get-services";
import { ExcursionGallery } from "@/features/excursions/components/excursion-gallery";
import { ExcursionBookingPanel } from "@/features/excursions/components/excursion-booking-panel";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://meruviajes.tur.ar").replace(
  /\/$/,
  ""
);

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
  const description = service.description.slice(0, 160);
  const url = `${appUrl}/excursiones/${service.slug}`;
  const image = service.photos[0];
  return {
    title: service.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "es_AR",
      url,
      title: service.title,
      description: service.description.slice(0, 180),
      siteName: "Meru Viajes y Turismo",
      images: image ? [{ url: image, alt: service.title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: service.title,
      description,
      images: image ? [image] : undefined,
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
      <h2 className="text-sm font-medium uppercase tracking-wide text-meru-secondary">{title}</h2>
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

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: service.title,
    description: service.description.slice(0, 300),
    image: service.photos.slice(0, 5),
    brand: { "@type": "Brand", name: "Meru Viajes y Turismo" },
    offers: {
      "@type": "Offer",
      priceCurrency: "ARS",
      price: service.price,
      availability: "https://schema.org/InStock",
      url: `${appUrl}/excursiones/${service.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd data={productLd} />
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
        <h1 className="mt-3 text-3xl text-meru-charcoal">{service.title}</h1>
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
            <p className="whitespace-pre-line text-lg leading-relaxed text-meru-charcoal-muted">
              {service.description}
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            {service.meetingPoint && (
              <InfoBlock title="Punto de encuentro">
                <p className="whitespace-pre-line">{service.meetingPoint}</p>
              </InfoBlock>
            )}
            {service.requirements && (
              <InfoBlock title="Requisitos">
                <p className="whitespace-pre-line">{service.requirements}</p>
              </InfoBlock>
            )}
            {service.additionalEquipment && (
              <InfoBlock title="Equipo recomendado">
                <p className="whitespace-pre-line">{service.additionalEquipment}</p>
              </InfoBlock>
            )}
            {service.cancellationPolicy && (
              <InfoBlock title="Cancelaciones">
                <p className="whitespace-pre-line">{service.cancellationPolicy}</p>
              </InfoBlock>
            )}
            {service.notIncluded && (
              <InfoBlock title="No incluye">
                <p className="whitespace-pre-line">{service.notIncluded}</p>
              </InfoBlock>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-meru-border bg-white p-6 shadow-[var(--shadow-card)]">
            {service.duration && (
              <p className="text-sm text-meru-charcoal-muted">
                <span className="font-medium text-meru-charcoal">Duración:</span> {service.duration}
              </p>
            )}
            {service.difficulty && (
              <p className="mt-1 text-sm text-meru-charcoal-muted">
                <span className="font-medium text-meru-charcoal">Dificultad:</span>{" "}
                {service.difficulty}
              </p>
            )}
            <div className={service.duration || service.difficulty ? "mt-6" : undefined}>
              <ExcursionBookingPanel service={service} />
            </div>
            <Link
              href="/#consulta"
              className="mt-3 flex h-12 w-full items-center justify-center rounded-lg border-2 border-meru-primary font-semibold text-meru-primary transition-colors hover:bg-meru-ice"
            >
              Consultar por esta excursión
            </Link>
            <p className="mt-4 text-xs text-meru-muted">
              Elegí adultos, menores, infantes (sin cargo) y jubilados. El total se calcula con los
              descuentos de la excursión. Al confirmar desde el carrito reservamos los lugares.
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
