import {
  FileText,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Package,
  ShoppingBag,
  TicketPercent,
  Users,
  UsersRound,
} from "lucide-react";
import type { DashboardNavItem } from "@/components/dashboard/dashboard-shell";

export const ADMIN_NAV: DashboardNavItem[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/admin/excursiones", label: "Excursiones", icon: LayoutGrid },
  { href: "/admin/paquetes", label: "Paquetes", icon: Package },
  { href: "/admin/viajes-grupales", label: "Viajes grupales", icon: UsersRound },
  { href: "/admin/cupones", label: "Cupones", icon: TicketPercent },
  { href: "/admin/contenido", label: "Contenido web", icon: FileText },
  { href: "/admin/consultas", label: "Consultas", icon: MessageSquare },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/ordenes", label: "Órdenes", icon: ShoppingBag },
];
