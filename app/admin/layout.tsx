import { requireAdmin } from "@/lib/auth/require-auth";
import { AdminDashboardLayout } from "@/features/admin/components/admin-dashboard-layout";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <AdminDashboardLayout email={user.email}>{children}</AdminDashboardLayout>;
}
