import { GroupTripForm } from "@/features/admin/components/group-trip-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default function NewGroupTripPage() {
  return (
    <div>
      <PageHeader
        title="Nuevo viaje grupal"
        description="Armá una edición con fechas fijas, itinerario y seña."
      />
      <GroupTripForm />
    </div>
  );
}
