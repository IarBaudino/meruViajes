import Link from "next/link";
import Image from "next/image";
import type { ExcursionPackage } from "@/types/catalog";
import { BrandLogo } from "@/components/brand-logo";
import { formatCurrencyARS } from "@/lib/format";

type Props = {
  package: ExcursionPackage;
};

export function PackageCard({ package: pkg }: Props) {
  const cover = pkg.photos[0] ?? null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-meru-border bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/paquetes/${pkg.slug}`} className="relative aspect-[4/3] bg-meru-ice">
        {cover ? (
          <Image
            src={cover}
            alt={pkg.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-meru-ice to-slate-200">
            <BrandLogo href={null} size="lg" className="opacity-70" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-meru-secondary">
          Paquete · {pkg.serviceIds.length} excursiones
        </p>
        <h3 className="mt-1 text-xl text-meru-charcoal">
          <Link href={`/paquetes/${pkg.slug}`} className="hover:text-meru-secondary">
            {pkg.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-meru-muted">{pkg.description}</p>
        <p className="mt-4 text-lg font-semibold text-meru-primary">
          {formatCurrencyARS(pkg.price)}
        </p>
      </div>
    </article>
  );
}
