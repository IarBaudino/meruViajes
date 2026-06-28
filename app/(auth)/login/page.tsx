import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-meru-sand px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-bold text-meru-charcoal">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-meru-muted">
          El acceso con Firebase Auth estará disponible en la Fase 4.
        </p>
        <Link href="/" className="mt-6 inline-block text-meru-secondary hover:underline">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
