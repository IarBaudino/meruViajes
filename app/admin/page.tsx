import Link from "next/link";
import { ImageIcon, LayoutGrid, MessageSquare, Users } from "lucide-react";
import { AdminMediaUploader } from "@/features/admin/components/admin-media-uploader";

const upcomingSections = [
  {
    icon: LayoutGrid,
    title: "Excursiones",
    description: "Crear, editar precios, descuentos y fotos (Fase 6).",
  },
  {
    icon: MessageSquare,
    title: "Consultas",
    description: "Ver y responder consultas del formulario de contacto.",
  },
  {
    icon: Users,
    title: "Usuarios y reservas",
    description: "Órdenes, reservas y gestión de clientes (Fase 5–6).",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-meru-charcoal">Panel de administración</h1>
        <p className="mt-2 max-w-2xl text-meru-muted">
          Acceso restringido a administradores. Por ahora podés subir imágenes y vídeos para
          excursiones; el CRUD completo de excursiones llegará en la Fase 6.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-meru-ice p-2">
            <ImageIcon className="h-5 w-5 text-meru-primary" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-meru-charcoal">Medios (Supabase)</h2>
            <p className="text-sm text-meru-muted">
              Subí fotos o vídeos comprimidos. Copiá la URL resultante para usarla en Firestore.
            </p>
          </div>
        </div>
        <AdminMediaUploader folder="excursions" />
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Próximamente</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {upcomingSections.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-5 text-slate-600"
            >
              <Icon className="h-5 w-5 text-slate-400" aria-hidden />
              <h3 className="mt-3 font-semibold text-meru-charcoal">{title}</h3>
              <p className="mt-1 text-sm">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-sm text-meru-muted">
        ¿No ves este panel al iniciar sesión?{" "}
        <Link href="/mi-cuenta/perfil" className="text-meru-secondary hover:underline">
          Revisá tu perfil
        </Link>{" "}
        o cerrá sesión y entrá con{" "}
        <strong className="font-medium text-meru-charcoal">evtmueru@gmail.com</strong>.
      </p>
    </div>
  );
}
