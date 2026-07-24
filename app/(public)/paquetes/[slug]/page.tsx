import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getActivePackages,
  getPackageBySlug,
} from "@/features/packages/lib/get-packages";
import { getServiceByIdAdmin } from "@/features/excursions/lib/get-services";
import { AddPackageToCartButton } from "@/features/packages/components/add-package-to-cart-button";
import { formatCurrencyARS } from "@/lib/format";
import { JsonLd } from "@/components/seo/json-ld";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://meruviajes.tur.ar").replace(
  /\/$/,
  ""
);

export async function generateStaticParams() {
  const packages = await getActivePackages();
  return packages.map((pkg) => ({ slug: pkg.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) {
    return { title: "Paquete no encontrado" };
  }
  const description = pkg.description.slice(0, 160);
  const url = `${appUrl}/paquetes/${pkg.slug}`;
  const image = pkg.photos[0];
  return {
    title: pkg.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "es_AR",
      url,
      title: pkg.title,
      description: pkg.description.slice(0, 180),
      siteName: "Meru Viajes y Turismo",
      images: image ? [{ url: image, alt: pkg.title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: pkg.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PackageDetailPage({ params }: Props) {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();

  const included = (
    await Promise.all(pkg.serviceIds.map((id) => getServiceByIdAdmin(id)))
  ).filter((s): s is NonNullable<typeof s> => Boolean(s));

  const cover = pkg.photos[0];

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.title,
    description: pkg.description.slice(0, 300),
    image: pkg.photos.slice(0, 5),
    brand: { "@type": "Brand", name: "Meru Viajes y Turismo" },
    offers: {
      "@type": "Offer",
      priceCurrency: "ARS",
      price: pkg.price,
      availability: "https://schema.org/InStock",
      url: `${appUrl}/paquetes/${pkg.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd data={productLd} />
      <p className="text-sm text-meru-muted">
        <Link href="/paquetes" className="hover:text-meru-secondary">
          Paquetes
        </Link>{" "}
        / {pkg.title}
      </p>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          {cover ? (
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-meru-ice">
              <Image
                src={cover}
                alt={pkg.title}
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 60vw"
                priority
              />
            </div>
          ) : null}
          <h1 className="mt-6 text-3xl text-meru-charcoal">{pkg.title}</h1>
          <p className="mt-4 whitespace-pre-line text-meru-muted leading-relaxed">
            {pkg.description}
          </p>

          <section className="mt-10 space-y-6">
            <h2 className="text-xl text-meru-charcoal">Excursiones incluidas</h2>
            {included.length === 0 ? (
              <p className="text-sm text-meru-muted">Todavía no hay excursiones asociadas.</p>
            ) : (
              included.map((service) => (
                <article
                  key={service.id}
                  className="rounded-xl border border-meru-border bg-white p-5"
                >
                  <h3 className="text-lg text-meru-charcoal">
                    <Link
                      href={`/excursiones/${service.slug}`}
                      className="hover:text-meru-secondary"
                    >
                      {service.title}
                    </Link>
                  </h3>
                  {service.duration || service.location ? (
                    <p className="mt-1 text-xs text-meru-muted">
                      {[service.duration, service.location].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  {service.description ? (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-meru-muted">
                      {service.description}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-meru-border bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <p className="text-sm text-meru-muted">Precio del paquete</p>
          <p className="mt-1 text-3xl font-semibold text-meru-primary">
            {formatCurrencyARS(pkg.price)}
          </p>
          <p className="mt-1 text-xs text-meru-muted">Por persona</p>
          <p className="mt-2 text-sm text-meru-muted">
            Elegí el rango de fechas y la cantidad de pasajeros. Nosotros armamos el itinerario y
            te lo enviamos por privado.
          </p>
          <div className="mt-6">
            <AddPackageToCartButton package={pkg} services={included} />
          </div>
        </aside>
      </div>
    </div>
  );
}
