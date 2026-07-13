import { PackageForm } from "@/features/admin/components/package-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default function NewPackagePage() {
  return (
    <div>
      <PageHeader title="Nuevo paquete" description="Combiná excursiones en un pack." />
      <PackageForm />
    </div>
  );
}
