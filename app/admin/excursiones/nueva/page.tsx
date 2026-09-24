import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { ServiceForm } from "@/features/admin/components/service-form";

export default function NewExcursionPage() {
  return (
    <div>
      <PageHeader
        title="Nueva excursión"
        description="Completá los datos y publicá en el catálogo."
        action={
          <Link href="/admin/excursiones" className="text-sm text-meru-secondary hover:underline">
            ← Volver al listado
          </Link>
        }
      />
      <ServiceForm />
    </div>
  );
}
