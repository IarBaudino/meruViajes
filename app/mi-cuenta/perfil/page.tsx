import Link from "next/link";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { AdminAccessBanner } from "@/features/auth/components/admin-access-banner";

export default function ProfilePage() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
      <AdminAccessBanner />
      <h1 className="text-2xl font-bold text-meru-charcoal">Mi perfil</h1>
      <p className="mt-2 text-sm text-meru-muted">
        Actualizá tus datos de contacto. Los usaremos al confirmar reservas.
      </p>

      <ProfileForm />

      <div className="mt-8 flex flex-wrap gap-4 border-t border-meru-border pt-6 text-sm">
        <Link href="/mi-cuenta/carrito" className="text-meru-secondary hover:underline">
          Ver carrito →
        </Link>
        <Link href="/excursiones" className="text-meru-muted hover:text-meru-charcoal">
          Explorar excursiones
        </Link>
      </div>
    </div>
  );
}
