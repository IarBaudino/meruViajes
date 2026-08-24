import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { CatalogSeason, Service } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import { formatCurrencyARS } from "@/lib/format";
import {
  getEffectiveAdultPrice,
  getServiceDiscountPercent,
  hasActivePromotion,
} from "@/features/excursions/lib/pricing";
import { resolveServiceForCatalog } from "@/lib/seasons";

type ExcursionCardProps = {
  service: Service;
  /** Si viene del filtro Verano/Invierno, el detalle abre con esa versión. */
  season?: CatalogSeason | null;
  className?: string;
};

export function ExcursionCard({ service, season = null, className }: ExcursionCardProps) {
  const display = resolveServiceForCatalog(service, season);
  const cover = display.photos[0] ?? null;
  const promo = hasActivePromotion(display);
  const promoPercent = getServiceDiscountPercent(display);
  const href =
    season != null
      ? `/excursiones/${service.slug}?temporada=${season}`
      : `/excursiones/${service.slug}`;

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-shadow hover:shadow-[var(--shadow-elevated)]",
        className
      )}
    >
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-meru-secondary">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
          {cover ? (
            <Image
              src={cover}
              alt={`${display.title} — imagen principal`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-meru-ice to-slate-200 opacity-80">
              <BrandLogo href={null} size="lg" className="opacity-70" />
            </div>
          )}
          {display.category && (
            <span className="absolute left-3 top-3">
              <Badge className="bg-white/95 text-meru-primary shadow-sm">{display.category}</Badge>
            </span>
          )}
          {promo ? (
            <span className="absolute right-3 top-3">
              <Badge className="bg-meru-secondary text-white shadow-sm">
                Promo −{promoPercent}%
              </Badge>
            </span>
          ) : null}
        </div>
        <CardContent className="pt-5">
          <h2 className="text-lg text-meru-charcoal transition-colors group-hover:text-meru-secondary">
            {display.title}
          </h2>
          {display.location && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-meru-muted">
              <MapPin className="h-4 w-4 shrink-0 text-meru-accent" aria-hidden />
              {display.location}
            </p>
          )}
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-meru-charcoal-muted">
            {display.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-meru-border pt-4">
            {promo ? (
              <>
                <span className="text-sm text-meru-muted line-through">
                  {formatCurrencyARS(display.price)}
                </span>
                <span className="text-lg font-medium text-meru-primary">
                  {formatCurrencyARS(getEffectiveAdultPrice(display))}
                </span>
                <span className="text-xs font-medium text-meru-secondary">
                  Promo −{promoPercent}%
                </span>
              </>
            ) : (
              <span className="text-lg font-medium text-meru-primary">
                {formatCurrencyARS(display.price)}
              </span>
            )}
            {display.duration && (
              <span className="text-sm text-meru-muted">Duración: {display.duration}</span>
            )}
          </div>
          <span className="mt-3 block text-sm font-semibold text-meru-secondary">
            Ver detalle →
          </span>
        </CardContent>
      </Link>
    </Card>
  );
}
