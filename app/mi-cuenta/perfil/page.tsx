import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { AdminAccessBanner } from "@/features/auth/components/admin-access-banner";

export default function ProfilePage() {
  return (
    <div className="rounded-xl border border-meru-border bg-white p-6 sm:p-8">
      <PageHeader
        title="Mi perfil"
        description="Actualizá tus datos de contacto para reservas."
      />
      <AdminAccessBanner />
      <ProfileForm />
    </div>
  );
}
