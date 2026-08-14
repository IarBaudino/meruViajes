"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { ExcursionPackage } from "@/types/catalog";
import { isAvailableInSeason } from "@/lib/seasons";
import { PackageCard } from "@/features/packages/components/package-card";

type Props = {
  packages: ExcursionPackage[];
};

export function PackageCatalog({ packages }: Props) {
  const searchParams = useSearchParams();
  const season = searchParams.get("temporada");
  const filtered = useMemo(() => {
    if (season !== "verano" && season !== "invierno") return packages;
    return packages.filter((pkg) => isAvailableInSeason(pkg.seasons, season));
  }, [packages, season]);

  if (filtered.length === 0) {
    return (
      <p className="mt-12 rounded-xl border border-dashed border-meru-border bg-white py-16 text-center text-meru-muted">
        No hay paquetes disponibles para esta temporada por ahora.
      </p>
    );
  }

  return (
    <ul className="mt-10 grid list-none gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((pkg) => (
        <li key={pkg.id}>
          <PackageCard package={pkg} />
        </li>
      ))}
    </ul>
  );
}
