import Link from "next/link";
import { getHomeFeaturedGroupTrips } from "@/features/group-trips/lib/get-group-trips";
import { Button } from "@/components/ui/button";
import { GroupTripCard } from "@/features/group-trips/components/group-trip-card";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  section: SiteSettings["groupTripsPreview"];
};

export async function GroupTripsPreview({ section }: Props) {
  const preview = await getHomeFeaturedGroupTrips(6);
  if (preview.length === 0) return null;

  return (
    <section id="viajes-grupales" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl text-brand-charcoal">{section.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-brand-muted">{section.description}</p>
        </div>

        <ul className="mt-12 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((trip) => (
            <li key={trip.id}>
              <GroupTripCard trip={trip} />
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link href="/viajes-grupales">
            <Button variant="primary">Ver todos los viajes grupales</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
