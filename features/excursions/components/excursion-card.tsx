import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Service } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import { formatCurrencyARS } from "@/lib/format";
import {
  getEffectiveAdultPrice,
  hasActivePromotion,
  hasAnyDiscount,
} from "@/features/excursions/lib/pricing";

type ExcursionCardProps = {
  service: Service;
  className?: string;
};

export function ExcursionCard({ service, className }: ExcursionCardProps) {
  const cover = service.photos[0] ?? null;

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-shadow hover:shadow-[var(--shadow-elevated)]",
        className
      )}
    >
      <Link href={`/excursiones/${service.slug}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-meru-secondary">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
          {cover ? (
            <Image
              src={cover}
              alt={`${service.title} — imagen principal`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-meru-ice to-slate-200 opacity-80">
              <BrandLogo href={null} size="lg" className="opacity-70" />
            </div>
          )}
          {service.category && (
            <span className="absolute left-3 top-3">
              <Badge className="bg-white/95 text-meru-primary shadow-sm">{service.category}</Badge>
            </span>
          )}
        </div>
        <CardContent className="pt-5">
          <h2 className="text-lg text-meru-charcoal transition-colors group-hover:text-meru-secondary">
            {service.title}
          </h2>
          {service.location && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-meru-muted">
              <MapPin className="h-4 w-4 shrink-0 text-meru-accent" aria-hidden />
              {service.location}
            </p>
          )}
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-meru-charcoal-muted">{service.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-meru-border pt-4">
            {hasActivePromotion(service) ? (
              <>
                <span className="text-sm text-meru-muted line-through">
                  {formatCurrencyARS(service.price)}
                </span>
                <span className="text-lg font-medium text-meru-primary">
                  {formatCurrencyARS(getEffectiveAdultPrice(service))}
                </span>
                <span className="text-xs font-medium text-meru-secondary">Promo</span>
              </>
            ) : (
              <span className="text-lg font-medium text-meru-primary">
                {formatCurrencyARS(service.price)}
              </span>
            )}
            {hasAnyDiscount(service) && (
              <span className="text-xs font-medium text-meru-secondary">
                Descuentos disponibles
              </span>
            )}
            {service.duration && (
              <span className="text-sm text-meru-muted">Duración: {service.duration}</span>
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
