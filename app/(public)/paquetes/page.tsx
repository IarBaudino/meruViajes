import type { Metadata } from "next";
import { Suspense } from "react";
import { brand, getAppUrl } from "@/config/brand";
import { getActivePackages } from "@/features/packages/lib/get-packages";
import { PackageCatalog } from "@/features/packages/components/package-catalog";

export const revalidate = 60;

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Paquetes",
  description: `Paquetes de excursiones en ${brand.location.city} con precio por persona. Combiná experiencias y reservá online con ${brand.agencyName}.`,
  alternates: { canonical: `${appUrl}/paquetes` },
  openGraph: {
    title: `Paquetes en ${brand.location.city} | ${brand.agencyName}`,
    description:
      "Combinaciones de excursiones con precio especial. Armamos el itinerario según tus fechas.",
    url: `${appUrl}/paquetes`,
  },
};

export default async function PackagesPage() {
  const packages = await getActivePackages();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl text-brand-charcoal">Paquetes</h1>
        <p className="mt-3 text-brand-muted">
          Combinaciones de excursiones con precio especial. Reservá el pack completo.
        </p>
      </header>

      {packages.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-brand-border bg-white py-16 text-center text-brand-muted">
          Todavía no hay paquetes publicados.
        </p>
      ) : (
        <div className="mt-10">
          <Suspense fallback={<p className="text-brand-muted">Cargando paquetes…</p>}>
            <PackageCatalog packages={packages} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
