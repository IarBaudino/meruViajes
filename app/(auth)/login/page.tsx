import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-meru-sand px-4 py-12">
      <Suspense fallback={<div className="text-meru-muted">Cargando…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
