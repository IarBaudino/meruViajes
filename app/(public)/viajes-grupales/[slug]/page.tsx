import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getActiveGroupTrips,
  getGroupTripBySlug,
} from "@/features/group-trips/lib/get-group-trips";
import { AddGroupTripToCartButton } from "@/features/group-trips/components/add-group-trip-to-cart-button";
import { GroupTripItinerary } from "@/features/group-trips/components/group-trip-itinerary";
import { ExcursionGallery } from "@/features/excursions/components/excursion-gallery";
import { formatCurrencyARS } from "@/lib/format";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { brand, getAppUrl } from "@/config/brand";
import {
  defaultDurationLabel,
  formatGroupTripDates,
  formatYmdEs,
} from "@/features/group-trips/lib/dates";
import {
  getGroupTripUnitPrice,
  isGroupTripPresaleActive,
} from "@/features/group-trips/lib/pricing";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

const appUrl = getAppUrl();

export async function generateStaticParams() {
  const trips = await getActiveGroupTrips();
  return trips.map((trip) => ({ slug: trip.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getGroupTripBySlug(slug);
  if (!trip) return { title: "Viaje grupal no encontrado" };
  const description = trip.description.slice(0, 160);
  const url = `${appUrl}/viajes-grupales/${trip.slug}`;
  const image = trip.photos[0];
  return {
    title: trip.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: brand.locale,
      url,
      title: trip.title,
      description: trip.description.slice(0, 180),
      siteName: brand.agencyName,
      images: image ? [{ url: image, alt: trip.title }] : undefined,
    },
  };
}

export default async function GroupTripDetailPage({ params }: Props) {
  const { slug } = await params;
  const trip = await getGroupTripBySlug(slug);
  if (!trip) notFound();

  const unit = getGroupTripUnitPrice(trip);
  const presale = isGroupTripPresaleActive(trip);
  const duration = defaultDurationLabel(trip.startDate, trip.endDate);
  const cover = trip.photos[0];

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: trip.title,
    description: trip.description.slice(0, 300),
    image: trip.photos.slice(0, 5),
    brand: { "@type": "Brand", name: brand.agencyName },
    offers: {
      "@type": "Offer",
      priceCurrency: brand.currency,
      price: unit,
      availability:
        trip.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: `${appUrl}/viajes-grupales/${trip.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd data={productLd} />
      <p className="text-sm text-brand-muted">
        <Link href="/viajes-grupales" className="hover:text-brand-secondary">
          Viajes grupales
        </Link>{" "}
        / {trip.title}
      </p>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          {trip.photos.length > 1 ? (
            <ExcursionGallery photos={trip.photos} title={trip.title} />
          ) : cover ? (
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-brand-ice">
              <Image
                src={cover}
                alt={trip.title}
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 60vw"
                priority
              />
            </div>
          ) : null}

          <p className="mt-6 text-xs font-medium uppercase tracking-wider text-brand-secondary">
            Viaje grupal · {trip.destination}
          </p>
          <h1 className="mt-2 text-3xl text-brand-charcoal">{trip.title}</h1>
          {trip.subtitle ? (
            <p className="mt-2 text-lg text-brand-secondary">{trip.subtitle}</p>
          ) : null}
          <p className="mt-4 whitespace-pre-line text-brand-muted leading-relaxed">
            {trip.description}
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-brand-border bg-white p-4">
              <dt className="text-xs uppercase tracking-wider text-brand-muted">Fecha del viaje</dt>
              <dd className="mt-1 text-brand-charcoal">
                {formatGroupTripDates(trip.startDate, trip.endDate)}
                {duration ? ` · ${duration}` : ""}
              </dd>
            </div>
            {trip.checkInTime || trip.checkOutTime ? (
              <div className="rounded-xl border border-brand-border bg-white p-4">
                <dt className="text-xs uppercase tracking-wider text-brand-muted">Horarios</dt>
                <dd className="mt-1 text-brand-charcoal">
                  {[
                    trip.checkInTime ? `Check-in ${trip.checkInTime}` : null,
                    trip.checkOutTime ? `Check-out ${trip.checkOutTime}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </dd>
              </div>
            ) : null}
          </dl>

          {trip.lodgings.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-xl text-brand-charcoal">Alojamiento</h2>
              <ul className="mt-4 space-y-3">
                {trip.lodgings.map((lodging) => (
                  <li
                    key={lodging.id}
                    className="rounded-xl border border-brand-border bg-white p-4"
                  >
                    <p className="text-brand-charcoal">{lodging.name}</p>
                    {lodging.place ? (
                      <p className="mt-1 text-sm text-brand-muted">{lodging.place}</p>
                    ) : null}
                    {lodging.includes ? (
                      <p className="mt-2 whitespace-pre-line text-sm text-brand-muted">
                        {lodging.includes}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {trip.included.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-xl text-brand-charcoal">Incluye</h2>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-brand-muted">
                {trip.included.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {trip.notIncluded.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-xl text-brand-charcoal">No incluye</h2>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-brand-muted">
                {trip.notIncluded.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {trip.itineraryDays.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-xl text-brand-charcoal">Itinerario</h2>
              <div className="mt-6">
                <GroupTripItinerary days={trip.itineraryDays} />
              </div>
            </section>
          ) : null}

          {trip.packingList.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-xl text-brand-charcoal">Qué llevar</h2>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-brand-muted">
                {trip.packingList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {trip.reservationPolicy || trip.cancellationPolicy ? (
            <section className="mt-10 space-y-4">
              <h2 className="text-xl text-brand-charcoal">Reserva y cancelación</h2>
              {trip.reservationPolicy ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-brand-muted">
                  {trip.reservationPolicy}
                </p>
              ) : null}
              {trip.cancellationPolicy ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-brand-muted">
                  {trip.cancellationPolicy}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="h-fit rounded-2xl border border-brand-border bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-brand-muted">Tarifa por persona</p>
            {presale ? <Badge className="bg-brand-sand text-brand-secondary">Preventa</Badge> : null}
          </div>
          {presale ? (
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <p className="text-lg text-brand-muted line-through">
                {formatCurrencyARS(trip.price)}
              </p>
              <p className="text-2xl font-semibold text-brand-primary">
                {formatCurrencyARS(unit)}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-2xl font-semibold text-brand-primary">
              {formatCurrencyARS(unit)}
            </p>
          )}
          {trip.balanceDueDate ? (
            <p className="mt-2 text-xs text-brand-muted">
              Saldo hasta el {formatYmdEs(trip.balanceDueDate)}
            </p>
          ) : null}
          {trip.depositNonRefundable && trip.depositAmount > 0 ? (
            <p className="mt-1 text-xs text-brand-muted">Seña no reembolsable.</p>
          ) : null}

          <div className="mt-6">
            <AddGroupTripToCartButton trip={trip} />
          </div>
          <Link
            href={`/?${new URLSearchParams({
              consulta: "groupTrip",
              slug: trip.slug,
              titulo: trip.title,
            }).toString()}#consulta`}
            className="mt-3 flex h-12 w-full items-center justify-center rounded-lg border-2 border-brand-primary font-semibold text-brand-primary transition-colors hover:bg-brand-ice"
          >
            Consultar por este viaje
          </Link>
        </aside>
      </div>

      <div className="mt-12">
        <Link href="/viajes-grupales" className="font-semibold text-brand-secondary hover:underline">
          ← Ver todos los viajes grupales
        </Link>
      </div>
    </div>
  );
}
