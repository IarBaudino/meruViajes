import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAllServicesAdmin } from "@/features/excursions/lib/get-services";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, MessageSquare, ShoppingBag, Users } from "lucide-react";

async function getCounts() {
  const db = getAdminFirestore();
  if (!db) return { inquiries: 0, users: 0, orders: 0 };

  const [inquiries, users, orders] = await Promise.all([
    db.collection("inquiries").where("status", "==", "nuevo").count().get(),
    db.collection("users").count().get(),
    db.collection("orders").count().get(),
  ]);

  return {
    inquiries: inquiries.data().count,
    users: users.data().count,
    orders: orders.data().count,
  };
}

export default async function AdminDashboardPage() {
  const [services, counts] = await Promise.all([getAllServicesAdmin(), getCounts()]);
  const active = services.filter((s) => s.active).length;

  const stats = [
    { label: "Excursiones activas", value: active, href: "/admin/excursiones", icon: LayoutGrid },
    { label: "Consultas nuevas", value: counts.inquiries, href: "/admin/consultas", icon: MessageSquare },
    { label: "Usuarios", value: counts.users, href: "/admin/usuarios", icon: Users },
    { label: "Órdenes", value: counts.orders, href: "/admin/ordenes", icon: ShoppingBag },
  ];

  return (
    <div>
      <PageHeader
        title="Panel de administración"
        description="Gestioná excursiones, contenido del sitio, consultas y usuarios desde un solo lugar."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="transition-shadow hover:shadow-[var(--shadow-card)]">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-lg bg-meru-ice p-3">
                  <Icon className="h-5 w-5 text-meru-primary" aria-hidden />
                </div>
                <div>
                  <p className="text-2xl text-meru-charcoal">{value}</p>
                  <p className="text-sm text-meru-muted">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-meru-border bg-white p-6">
        <h2 className="text-lg text-meru-charcoal">Accesos rápidos</h2>
        <ul className="mt-4 flex flex-wrap gap-3 text-sm">
          <li>
            <Link href="/admin/excursiones/nueva" className="text-meru-secondary hover:underline">
              + Nueva excursión
            </Link>
          </li>
          <li>
            <Link href="/admin/contenido" className="text-meru-secondary hover:underline">
              Editar contenido web
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
