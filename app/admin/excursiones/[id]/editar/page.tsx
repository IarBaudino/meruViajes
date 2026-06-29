import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { ServiceForm } from "@/features/admin/components/service-form";
import { getServiceByIdAdmin } from "@/features/excursions/lib/get-services";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditExcursionPage({ params }: PageProps) {
  const { id } = await params;
  const service = await getServiceByIdAdmin(id);
  if (!service) notFound();

  return (
    <div>
      <PageHeader
        title="Editar excursión"
        description={service.title}
        action={
          <Link href="/admin/excursiones" className="text-sm text-meru-secondary hover:underline">
            ← Volver al listado
          </Link>
        }
      />
      <ServiceForm service={service} />
    </div>
  );
}
