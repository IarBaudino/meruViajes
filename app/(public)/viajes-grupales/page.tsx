import type { Metadata } from "next";
import { Suspense } from "react";
import { brand, getAppUrl } from "@/config/brand";
import { getActiveGroupTrips } from "@/features/group-trips/lib/get-group-trips";
import { GroupTripCatalog } from "@/features/group-trips/components/group-trip-catalog";

export const revalidate = 60;

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Viajes grupales",
  description: `Viajes grupales de ${brand.agencyName}: fechas fijas, itinerario y cupos. Turismo comunitario en ${brand.location.region}.`,
  alternates: { canonical: `${appUrl}/viajes-grupales` },
  openGraph: {
    title: `Viajes grupales | ${brand.agencyName}`,
    description: "Ediciones con fecha de salida, itinerario día por día y seña para confirmar el lugar.",
    url: `${appUrl}/viajes-grupales`,
  },
};

export default async function GroupTripsPage() {
  const trips = await getActiveGroupTrips();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl text-brand-charcoal">Viajes grupales</h1>
        <p className="mt-3 text-brand-muted">
          Experiencias de varios días con fechas fijas, relato e itinerario. Independientes de las
          excursiones que se venden por separado.
        </p>
      </header>

      <Suspense fallback={<p className="mt-10 text-brand-muted">Cargando viajes…</p>}>
        <GroupTripCatalog trips={trips} />
      </Suspense>
    </div>
  );
}
