import {
  FileText,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  ShoppingBag,
  Users,
} from "lucide-react";
import type { DashboardNavItem } from "@/components/dashboard/dashboard-shell";

export const ADMIN_NAV: DashboardNavItem[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/admin/excursiones", label: "Excursiones", icon: LayoutGrid },
  { href: "/admin/contenido", label: "Contenido web", icon: FileText },
  { href: "/admin/consultas", label: "Consultas", icon: MessageSquare },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/ordenes", label: "Órdenes", icon: ShoppingBag },
];
