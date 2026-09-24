import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { brand, getAppUrl } from "@/config/brand";
import { getActiveServices } from "@/features/excursions/lib/get-services";
import { ExcursionCatalog } from "@/features/excursions/components/excursion-catalog";

export const metadata: Metadata = {
  title: "Excursiones",
  description: `Catálogo de excursiones en ${brand.location.city} y ${brand.location.region}. Reservá online con ${brand.agencyName}.`,
  alternates: {
    canonical: `${getAppUrl()}/excursiones`,
  },
  openGraph: {
    title: `Excursiones en ${brand.location.city} | ${brand.agencyName}`,
    description: `Trekking, navegación y experiencias en ${brand.location.city}. Filtrá y reservá online.`,
  },
};

export const revalidate = 60;

export default async function ExcursionsPage() {
  const services = await getActiveServices();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl text-brand-charcoal">Nuestras Excursiones</h1>
      <p className="mt-4 max-w-2xl text-brand-muted">
        Experiencias en {brand.location.city}. Filtrá por categoría o precio. Tarifa adulto; menores,
        infantes y jubilados pueden tener descuento según cada excursión.
      </p>

      {services.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-brand-border bg-white p-10 text-center">
          <p className="text-lg font-medium text-brand-charcoal">
            Todavía no hay excursiones publicadas
          </p>
          <p className="mt-2 text-sm text-brand-muted">
            El equipo está cargando el catálogo. Mientras tanto, consultanos desde la home.
          </p>
          <Link
            href="/#consulta"
            className="mt-6 inline-block rounded-lg border-2 border-brand-charcoal bg-white px-6 py-2.5 font-semibold text-brand-charcoal hover:bg-brand-sand"
          >
            Enviar consulta
          </Link>
        </div>
      ) : (
        <div className="mt-10">
          <Suspense fallback={<p className="text-brand-muted">Cargando catálogo…</p>}>
            <ExcursionCatalog services={services} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
