import type { Metadata } from "next";
import { getActivePackages } from "@/features/packages/lib/get-packages";
import { PackageCard } from "@/features/packages/components/package-card";

export const revalidate = 60;

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://meruviajes.tur.ar").replace(
  /\/$/,
  ""
);

export const metadata: Metadata = {
  title: "Paquetes",
  description:
    "Paquetes de excursiones en Ushuaia con precio por persona. Combiná experiencias con Meru Viajes y Turismo.",
  alternates: { canonical: `${appUrl}/paquetes` },
  openGraph: {
    title: "Paquetes | Meru Viajes y Turismo",
    description: "Combinaciones de excursiones en Ushuaia con precio especial.",
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
        <ul className="mt-10 grid list-none gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <li key={pkg.id}>
              <PackageCard package={pkg} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
