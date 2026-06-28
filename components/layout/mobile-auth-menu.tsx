"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { endSession } from "@/lib/auth/session-client";

type MobileAuthMenuProps = {
  onNavigate?: () => void;
};

export function MobileAuthMenu({ onNavigate }: MobileAuthMenuProps) {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") {
    return null;
  }

  if (user?.email) {
    return (
      <>
        <li>
          <Link
            href="/mi-cuenta/perfil"
            className="mt-2 block rounded-lg px-3 py-2.5 text-meru-charcoal hover:bg-meru-ice"
            onClick={onNavigate}
          >
            Mi cuenta
          </Link>
        </li>
        {user.role === "admin" && (
          <li>
            <Link
              href="/admin"
              className="block rounded-lg px-3 py-2.5 font-semibold text-meru-secondary hover:bg-meru-ice"
              onClick={onNavigate}
            >
              Administración
            </Link>
          </li>
        )}
        <li>
          <button
            type="button"
            className="mt-2 w-full rounded-lg border border-meru-border px-3 py-2.5 text-center font-semibold text-meru-charcoal"
            onClick={() => {
              onNavigate?.();
              void endSession("/");
            }}
          >
            Salir
          </button>
        </li>
      </>
    );
  }

  return (
    <>
      <li>
        <Link
          href="/registro"
          className="mt-2 block rounded-lg border border-meru-primary px-3 py-2.5 text-center font-semibold text-meru-primary"
          onClick={onNavigate}
        >
          Registrarse
        </Link>
      </li>
      <li>
        <Link
          href="/login"
          className="mt-2 block rounded-lg bg-meru-primary px-3 py-2.5 text-center font-semibold text-white"
          onClick={onNavigate}
        >
          Iniciar sesión
        </Link>
      </li>
    </>
  );
}
