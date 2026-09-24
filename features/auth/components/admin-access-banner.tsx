"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ShieldCheck } from "lucide-react";

export function AdminAccessBanner() {
  const { data: session } = useSession();

  if (session?.user?.role !== "admin") {
    return null;
  }

  return (
    <div className="mb-8 flex flex-col gap-3 rounded-xl border border-meru-secondary/30 bg-meru-ice/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-meru-secondary" aria-hidden />
        <div>
          <p className="font-semibold text-meru-charcoal">Sos administrador</p>
          <p className="text-sm text-meru-muted">
            Gestioná excursiones, contenido del sitio y consultas desde el panel.
          </p>
        </div>
      </div>
      <Link
        href="/admin"
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-meru-primary px-4 py-2 text-sm font-semibold text-white hover:bg-meru-primary-dark"
      >
        Ir al panel admin
      </Link>
    </div>
  );
}
