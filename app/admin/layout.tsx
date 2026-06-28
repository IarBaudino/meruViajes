import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Panel de administración
            </p>
            <p className="text-sm text-slate-700">{user.email}</p>
          </div>
          <Link href="/" className="text-sm text-meru-secondary hover:underline">
            ← Volver al sitio
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
