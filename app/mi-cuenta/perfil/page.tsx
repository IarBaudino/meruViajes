import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { AdminAccessBanner } from "@/features/auth/components/admin-access-banner";

export default function ProfilePage() {
  return (
    <div className="rounded-xl border border-meru-border bg-white p-6 sm:p-8">
      <PageHeader
        title="Mi perfil"
        description="Datos personales y de facturación para agilizar tus reservas."
      />
      <AdminAccessBanner />
      <ProfileForm />
      <ChangePasswordForm />
    </div>
  );
}
