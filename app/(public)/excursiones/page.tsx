import type { Metadata } from "next";
import Link from "next/link";
import { getActiveServices } from "@/features/excursions/lib/get-services";
import { ExcursionCatalog } from "@/features/excursions/components/excursion-catalog";

export const metadata: Metadata = {
  title: "Excursiones",
  description: "Catálogo de excursiones en Ushuaia — Meru Viajes y Turismo",
};

export const revalidate = 60;

export default async function ExcursionsPage() {
  const services = await getActiveServices();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-meru-charcoal sm:text-4xl">Nuestras Excursiones</h1>
      <p className="mt-4 max-w-2xl text-meru-muted">
        Experiencias en el Fin del Mundo: navegación, montaña y naturaleza. Filtrá por categoría o
        precio. Tarifa adulto; menores, infantes y jubilados pueden tener descuento según cada
        excursión.
      </p>

      {services.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-meru-border bg-white p-10 text-center">
          <p className="text-lg font-medium text-meru-charcoal">
            Todavía no hay excursiones publicadas
          </p>
          <p className="mt-2 text-sm text-meru-muted">
            El equipo está cargando el catálogo. Mientras tanto, consultanos desde la home.
          </p>
          <Link
            href="/#consulta"
            className="mt-6 inline-block rounded-lg bg-meru-primary px-6 py-2.5 font-semibold text-white hover:bg-meru-primary-dark"
          >
            Enviar consulta
          </Link>
        </div>
      ) : (
        <ExcursionCatalog services={services} />
      )}
    </div>
  );
}
