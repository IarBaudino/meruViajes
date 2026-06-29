import { PageHeader } from "@/components/dashboard/page-header";
import { SiteSettingsForm } from "@/features/admin/components/site-settings-form";

export default function AdminContentPage() {
  return (
    <div>
      <PageHeader
        title="Contenido web"
        description="Editá textos del inicio, sobre nosotros, consultas y footer sin tocar código."
      />
      <SiteSettingsForm />
    </div>
  );
}
