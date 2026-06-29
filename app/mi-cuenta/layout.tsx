import { requireAuth } from "@/lib/auth/require-auth";
import { AccountDashboardLayout } from "@/features/account/components/account-dashboard-layout";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  return (
    <AccountDashboardLayout email={user.email} isAdmin={user.role === "admin"}>
      {children}
    </AccountDashboardLayout>
  );
}
