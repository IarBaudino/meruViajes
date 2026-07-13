import { notFound } from "next/navigation";
import { PackageForm } from "@/features/admin/components/package-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getPackageByIdAdmin } from "@/features/packages/lib/get-packages";

type Props = { params: Promise<{ id: string }> };

export default async function EditPackagePage({ params }: Props) {
  const { id } = await params;
  const pkg = await getPackageByIdAdmin(id);
  if (!pkg) notFound();

  return (
    <div>
      <PageHeader title="Editar paquete" description={pkg.title} />
      <PackageForm package={pkg} />
    </div>
  );
}
