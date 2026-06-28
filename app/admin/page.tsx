import { AdminMediaUploader } from "@/features/admin/components/admin-media-uploader";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-meru-charcoal">Panel de administración</h1>
        <p className="mt-2 text-meru-muted">
          Subida de medios con compresión (Supabase Storage). Auth admin completo en Fase 4.
        </p>
      </div>
      <AdminMediaUploader folder="excursions" />
    </div>
  );
}
