import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { AdminAccessBanner } from "@/features/auth/components/admin-access-banner";
import { getSessionUser } from "@/lib/auth/require-auth";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, ShoppingBag, ShoppingCart, User } from "lucide-react";

export default async function AccountHomePage() {
  const user = await getSessionUser();

  const links = [
    { href: "/mi-cuenta/perfil", label: "Completar perfil", icon: User },
    { href: "/mi-cuenta/carrito", label: "Ver carrito", icon: ShoppingCart },
    { href: "/mi-cuenta/pedidos", label: "Mis pedidos", icon: ShoppingBag },
    { href: "/mi-cuenta/reservas", label: "Reservas", icon: CalendarCheck },
  ];

  return (
    <div>
      <PageHeader
        title={`Hola${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Gestioná tu perfil, carrito y reservas desde el menú lateral."
      />
      <AdminAccessBanner />
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-shadow hover:shadow-[var(--shadow-card)]">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-lg bg-meru-ice p-3">
                  <Icon className="h-5 w-5 text-meru-primary" aria-hidden />
                </div>
                <span className="text-meru-charcoal">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
