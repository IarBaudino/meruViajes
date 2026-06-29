import { CalendarCheck, LayoutDashboard, ShoppingCart, ShoppingBag, User } from "lucide-react";
import type { DashboardNavItem } from "@/components/dashboard/dashboard-shell";

export const ACCOUNT_NAV: DashboardNavItem[] = [
  { href: "/mi-cuenta", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/mi-cuenta/perfil", label: "Mi perfil", icon: User },
  { href: "/mi-cuenta/carrito", label: "Carrito", icon: ShoppingCart },
  { href: "/mi-cuenta/pedidos", label: "Mis pedidos", icon: ShoppingBag },
  { href: "/mi-cuenta/reservas", label: "Reservas", icon: CalendarCheck },
];
