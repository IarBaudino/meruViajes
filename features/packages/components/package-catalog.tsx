import type { ExcursionPackage } from "@/types/catalog";
import { PackageCard } from "@/features/packages/components/package-card";

type Props = {
  packages: ExcursionPackage[];
};

export function PackageCatalog({ packages }: Props) {
  if (packages.length === 0) {
    return (
      <p className="mt-12 rounded-xl border border-dashed border-brand-border bg-white py-16 text-center text-brand-muted">
        No hay paquetes publicados por ahora.
      </p>
    );
  }

  return (
    <ul className="mt-10 grid list-none gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <li key={pkg.id}>
          <PackageCard package={pkg} />
        </li>
      ))}
    </ul>
  );
}
