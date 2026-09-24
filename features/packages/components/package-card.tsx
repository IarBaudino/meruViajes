import Link from "next/link";
import Image from "next/image";
import type { ExcursionPackage } from "@/types/catalog";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyARS } from "@/lib/format";
import {
  getEffectivePackagePrice,
  getPackageDiscountPercent,
  hasActivePackagePromotion,
} from "@/features/packages/lib/pricing";

type Props = {
  package: ExcursionPackage;
};

export function PackageCard({ package: pkg }: Props) {
  const cover = pkg.photos[0] ?? null;
  const promo = hasActivePackagePromotion(pkg);
  const percent = getPackageDiscountPercent(pkg);
  const effective = getEffectivePackagePrice(pkg);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/paquetes/${pkg.slug}`} className="relative aspect-[4/3] bg-brand-ice">
        {cover ? (
          <Image
            src={cover}
            alt={pkg.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-ice to-brand-sand">
            <BrandLogo href={null} size="lg" className="opacity-70" />
          </div>
        )}
        {promo ? (
          <span className="absolute right-3 top-3">
            <Badge className="bg-brand-sand text-brand-charcoal shadow-sm">
              Promo −{percent}%
            </Badge>
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-secondary">
          Paquete · {pkg.serviceIds.length} excursiones
        </p>
        <h3 className="mt-1 text-xl text-brand-charcoal">
          <Link href={`/paquetes/${pkg.slug}`} className="hover:text-brand-secondary">
            {pkg.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-brand-muted">{pkg.description}</p>
        <div className="mt-4 flex flex-wrap items-baseline gap-2">
          {promo ? (
            <>
              <span className="text-sm text-brand-muted line-through">
                {formatCurrencyARS(pkg.price)}
              </span>
              <span className="text-lg font-semibold text-brand-primary">
                {formatCurrencyARS(effective)}
              </span>
              <span className="text-xs font-medium text-brand-secondary">Promo −{percent}%</span>
            </>
          ) : (
            <span className="text-lg font-semibold text-brand-primary">
              {formatCurrencyARS(pkg.price)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
