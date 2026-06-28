import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Registro",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-meru-sand px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-bold text-meru-charcoal">Crear cuenta</h1>
        <p className="mt-2 text-sm text-meru-muted">
          El registro estará disponible en la Fase 4.
        </p>
        <Link href="/login" className="mt-6 mr-4 inline-block text-meru-secondary hover:underline">
          Iniciar sesión
        </Link>
        <Link href="/" className="mt-6 inline-block text-meru-muted hover:underline">
          ← Inicio
        </Link>
      </div>
    </div>
  );
}
