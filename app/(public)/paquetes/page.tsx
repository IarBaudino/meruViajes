import type { Metadata } from "next";
import { Suspense } from "react";
import { getActivePackages } from "@/features/packages/lib/get-packages";
import { PackageCatalog } from "@/features/packages/components/package-catalog";

export const revalidate = 60;

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://meruviajes.tur.ar").replace(
  /\/$/,
  ""
);

export const metadata: Metadata = {
  title: "Paquetes",
  description:
    "Paquetes de excursiones en Ushuaia con precio por persona. Combiná experiencias y reservá online con Meru Viajes y Turismo.",
  alternates: { canonical: `${appUrl}/paquetes` },
  openGraph: {
    title: "Paquetes en Ushuaia | Meru Viajes y Turismo",
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
        <h1 className="text-3xl text-meru-charcoal">Paquetes</h1>
        <p className="mt-3 text-meru-muted">
          Combinaciones de excursiones con precio especial. Reservá el pack completo.
        </p>
      </header>

      {packages.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-meru-border bg-white py-16 text-center text-meru-muted">
          Todavía no hay paquetes publicados.
        </p>
      ) : (
        <div className="mt-10">
          <Suspense fallback={<p className="text-meru-muted">Cargando paquetes…</p>}>
            <PackageCatalog packages={packages} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
