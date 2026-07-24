import type { Metadata } from "next";
import { AdminDashboardLayout } from "@/features/admin/components/admin-dashboard-layout";
import { requireAdmin } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <AdminDashboardLayout email={user.email}>{children}</AdminDashboardLayout>;
}
