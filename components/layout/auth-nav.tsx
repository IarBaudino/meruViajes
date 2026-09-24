"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { endSession } from "@/lib/auth/session-client";

export function AuthNav() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const user = session?.user;

  if (isLoading) {
    return <span className="hidden text-sm text-meru-muted md:inline">…</span>;
  }

  if (user?.email) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/mi-cuenta/perfil"
          className="hidden rounded-lg px-3 py-2 text-sm font-medium text-meru-charcoal transition-colors hover:bg-meru-ice lg:inline"
        >
          Mi cuenta
        </Link>
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-meru-secondary transition-colors hover:bg-meru-ice lg:inline"
          >
            Admin
          </Link>
        )}
        <button
          type="button"
          onClick={() => endSession("/")}
          className="rounded-lg border border-meru-border px-3 py-2 text-sm font-medium text-meru-charcoal transition-colors hover:bg-meru-ice"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/registro"
        className="rounded-lg px-3 py-2 text-sm font-semibold text-meru-primary transition-colors hover:bg-meru-ice"
      >
        Registrarse
      </Link>
      <Link
        href="/login"
        className="rounded-lg bg-meru-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-meru-primary-dark"
      >
        Iniciar sesión
      </Link>
    </div>
  );
}
