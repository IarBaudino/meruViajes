"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { endSession } from "@/lib/auth/session-client";

export function AuthNav() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const user = session?.user;

  if (isLoading) {
    return <span className="hidden text-sm text-brand-muted md:inline">…</span>;
  }

  if (user?.email) {
    return (
      <div className="flex items-center gap-1">
        <Link
          href="/mi-cuenta/perfil"
          className="hidden rounded-md px-2.5 py-1.5 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-ice lg:inline"
        >
          Mi cuenta
        </Link>
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="hidden rounded-md px-2.5 py-1.5 text-sm font-semibold text-brand-secondary transition-colors hover:bg-brand-ice lg:inline"
          >
            Admin
          </Link>
        )}
        <button
          type="button"
          onClick={() => endSession("/")}
          className="rounded-md border border-brand-border px-2.5 py-1.5 text-sm font-medium leading-none text-brand-charcoal transition-colors hover:bg-brand-ice"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/registro"
        className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-ice"
      >
        Registrarse
      </Link>
      <Link
        href="/login"
        className="rounded-md border border-brand-charcoal bg-white px-3 py-1.5 text-sm font-semibold leading-none text-brand-charcoal transition-colors hover:bg-brand-sand"
      >
        Iniciar sesión
      </Link>
    </div>
  );
}
