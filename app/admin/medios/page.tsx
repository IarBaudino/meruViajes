import { PageHeader } from "@/components/dashboard/page-header";
import { AdminMediaUploader } from "@/features/admin/components/admin-media-uploader";

export default function AdminMediaPage() {
  return (
    <div>
      <PageHeader
        title="Medios"
        description="Subí imágenes y vídeos comprimidos a Supabase. Copiá las URLs en excursiones o contenido."
      />
      <div className="rounded-xl border border-meru-border bg-white p-6">
        <AdminMediaUploader folder="excursions" />
      </div>
    </div>
  );
}
