import Link from "next/link";
import Image from "next/image";
import type { GroupTrip } from "@/types/catalog";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyARS } from "@/lib/format";
import {
  defaultDurationLabel,
  formatGroupTripDates,
} from "@/features/group-trips/lib/dates";
import {
  getGroupTripChargeNow,
  getGroupTripUnitPrice,
  groupTripHasDeposit,
  isGroupTripPresaleActive,
} from "@/features/group-trips/lib/pricing";

type Props = {
  trip: GroupTrip;
};

export function GroupTripCard({ trip }: Props) {
  const cover = trip.photos[0] ?? null;
  const unit = getGroupTripUnitPrice(trip);
  const presale = isGroupTripPresaleActive(trip);
  const duration = defaultDurationLabel(trip.startDate, trip.endDate);
  const soldOut = trip.stock < 1;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/viajes-grupales/${trip.slug}`} className="relative aspect-[4/3] bg-brand-ice">
        {cover ? (
          <Image
            src={cover}
            alt={trip.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-ice to-brand-sand">
            <BrandLogo href={null} size="lg" className="opacity-70" />
          </div>
        )}
        <span className="absolute left-3 top-3">
          <Badge className="bg-brand-sand text-brand-charcoal shadow-sm">Viaje grupal</Badge>
        </span>
        {soldOut ? (
          <span className="absolute right-3 top-3">
            <Badge className="bg-white/90 text-brand-charcoal">Completo</Badge>
          </span>
        ) : presale ? (
          <span className="absolute right-3 top-3">
            <Badge className="bg-white/90 text-brand-charcoal">Preventa</Badge>
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-secondary">
          {trip.destination}
          {duration ? ` · ${duration}` : ""}
        </p>
        <h3 className="mt-1 text-xl text-brand-charcoal">
          <Link href={`/viajes-grupales/${trip.slug}`} className="hover:text-brand-secondary">
            {trip.title}
          </Link>
        </h3>
        {trip.subtitle ? (
          <p className="mt-1 text-sm text-brand-secondary">{trip.subtitle}</p>
        ) : null}
        <p className="mt-2 text-sm text-brand-muted">
          {formatGroupTripDates(trip.startDate, trip.endDate)}
        </p>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-brand-muted">{trip.description}</p>
        <div className="mt-4">
          {presale ? (
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm text-brand-muted line-through">
                {formatCurrencyARS(trip.price)}
              </span>
              <span className="text-lg font-semibold text-brand-primary">
                {formatCurrencyARS(unit)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-semibold text-brand-primary">
              {formatCurrencyARS(unit)}
            </span>
          )}
          {groupTripHasDeposit(trip) ? (
            <p className="mt-1 text-xs text-brand-muted">
              Seña {formatCurrencyARS(getGroupTripChargeNow(trip))}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
