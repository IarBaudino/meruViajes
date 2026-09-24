import { notFound } from "next/navigation";
import { GroupTripForm } from "@/features/admin/components/group-trip-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getGroupTripByIdAdmin } from "@/features/group-trips/lib/get-group-trips";

type Props = { params: Promise<{ id: string }> };

export default async function EditGroupTripPage({ params }: Props) {
  const { id } = await params;
  const trip = await getGroupTripByIdAdmin(id);
  if (!trip) notFound();

  return (
    <div>
      <PageHeader title="Editar viaje grupal" description={trip.title} />
      <GroupTripForm trip={trip} />
    </div>
  );
}
