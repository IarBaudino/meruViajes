import type { Metadata } from "next";
import { getActiveServices } from "@/features/excursions/lib/get-services";
import { ExcursionCatalog } from "@/features/excursions/components/excursion-catalog";

export const metadata: Metadata = {
  title: "Excursiones",
  description: "Catálogo de excursiones en Ushuaia — Meru Viajes y Turismo",
};

export default async function ExcursionsPage() {
  const services = await getActiveServices();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-meru-charcoal sm:text-4xl">Nuestras Excursiones</h1>
      <p className="mt-4 max-w-2xl text-meru-muted">
        Experiencias en el Fin del Mundo: navegación, montaña y naturaleza. Filtrá por categoría o
        precio; los valores son referencia hasta confirmar reserva.
      </p>

      <ExcursionCatalog services={services} />
    </div>
  );
}
