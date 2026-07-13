import { getActivePackages } from "@/features/packages/lib/get-packages";
import { PackageCard } from "@/features/packages/components/package-card";

export const revalidate = 60;

export default async function PackagesPage() {
  const packages = await getActivePackages();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl text-meru-charcoal sm:text-4xl">Paquetes</h1>
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
