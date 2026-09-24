import { GroupTripCard } from "@/features/group-trips/components/group-trip-card";
import type { GroupTrip } from "@/types/catalog";

type Props = {
  trips: GroupTrip[];
};

export function GroupTripCatalog({ trips }: Props) {
  if (trips.length === 0) {
    return (
      <p className="mt-12 rounded-xl border border-dashed border-brand-border bg-white py-16 text-center text-brand-muted">
        No hay viajes grupales publicados por ahora.
      </p>
    );
  }

  return (
    <ul className="mt-10 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <li key={trip.id}>
          <GroupTripCard trip={trip} />
        </li>
      ))}
    </ul>
  );
}
