"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/schemas/auth";
import {
  firebaseEmailSignIn,
  firebaseGoogleSignInPopup,
  mapFirebaseAuthError,
} from "@/lib/auth/firebase-auth-client";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-destination";
import { establishSession } from "@/lib/auth/session-client";
import { navigateAfterLogin } from "@/lib/auth/navigate-after-login";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/mi-cuenta/perfil";
  const queryError = searchParams.get("error");

  const [formError, setFormError] = useState(
    queryError === "admin" ? "Necesitás una cuenta de administrador." : ""
  );
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function completeSignIn(getIdToken: () => Promise<string>) {
    const idToken = await getIdToken();
    const session = await establishSession(idToken);
    if (!session.ok) {
      throw new Error(session.error ?? "Error de sesión");
    }
    const destination = resolvePostLoginDestination(callbackUrl, session.role);
    navigateAfterLogin(destination);
  }

  async function onSubmit(data: LoginFormData) {
    setFormError("");
    try {
      const credential = await firebaseEmailSignIn(data.email, data.password);
      await completeSignIn(() => credential.user.getIdToken());
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setFormError(mapFirebaseAuthError(code));
    }
  }

  async function onGoogleSignIn() {
    setFormError("");
    setGoogleLoading(true);
    try {
      const credential = await firebaseGoogleSignInPopup();
      await completeSignIn(() => credential.user.getIdToken());
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setFormError(mapFirebaseAuthError(code));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-[var(--shadow-card)]">
      <h1 className="text-2xl font-bold text-meru-charcoal">Iniciar sesión</h1>
      <p className="mt-2 text-sm text-meru-muted">
        Accedé a tu cuenta para reservar excursiones y gestionar tu perfil.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        {formError && (
          <p className="flex items-start gap-2 text-sm text-red-600" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Ingresar
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-meru-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-meru-muted">o</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onGoogleSignIn}
        isLoading={googleLoading}
      >
        Continuar con Google
      </Button>

      <p className="mt-6 text-center text-sm text-meru-muted">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-semibold text-meru-secondary hover:underline">
          Registrate
        </Link>
      </p>

      <Link href="/" className="mt-4 inline-block text-sm text-meru-muted hover:text-meru-charcoal">
        ← Volver al inicio
      </Link>
    </div>
  );
}
