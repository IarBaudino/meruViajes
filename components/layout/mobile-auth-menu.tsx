"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { endSession } from "@/lib/auth/session-client";
import { useCartStore } from "@/stores/cart-store";

type MobileAuthMenuProps = {
  onNavigate?: () => void;
};

export function MobileAuthMenu({ onNavigate }: MobileAuthMenuProps) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const totalItems = useCartStore((s) => s.totalItems());
  const cartHref = "/carrito";

  if (status === "loading") {
    return null;
  }

  return (
    <>
      <li>
        <Link
          href={cartHref}
          className="mt-2 block rounded-lg px-3 py-2.5 text-brand-charcoal hover:bg-brand-ice"
          onClick={onNavigate}
        >
          Carrito{totalItems > 0 ? ` (${totalItems})` : ""}
        </Link>
      </li>
      {user?.email ? (
        <>
          <li>
            <Link
              href="/mi-cuenta/perfil"
              className="block rounded-lg px-3 py-2.5 text-brand-charcoal hover:bg-brand-ice"
              onClick={onNavigate}
            >
              Mi cuenta
            </Link>
          </li>
          {user.role === "admin" && (
            <li>
              <Link
                href="/admin"
                className="block rounded-lg px-3 py-2.5 font-semibold text-brand-secondary hover:bg-brand-ice"
                onClick={onNavigate}
              >
                Administración
              </Link>
            </li>
          )}
          <li>
            <button
              type="button"
              className="mt-2 w-full rounded-lg border border-brand-border px-3 py-2.5 text-center font-semibold text-brand-charcoal"
              onClick={() => {
                onNavigate?.();
                void endSession("/");
              }}
            >
              Salir
            </button>
          </li>
        </>
      ) : (
        <>
          <li>
            <Link
              href="/registro"
              className="mt-2 block rounded-lg border border-brand-primary px-3 py-2.5 text-center font-semibold text-brand-primary"
              onClick={onNavigate}
            >
              Registrarse
            </Link>
          </li>
          <li>
            <Link
              href="/login"
              className="mt-2 block rounded-lg border-2 border-brand-charcoal bg-white px-3 py-2.5 text-center font-semibold text-brand-charcoal"
              onClick={onNavigate}
            >
              Iniciar sesión
            </Link>
          </li>
        </>
      )}
    </>
  );
}
