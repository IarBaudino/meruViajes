"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfile } from "firebase/auth";
import { AlertCircle } from "lucide-react";
import { registerSchema, type RegisterFormData } from "@/schemas/auth";
import {
  firebaseEmailRegister,
  mapFirebaseAuthError,
} from "@/lib/auth/firebase-auth-client";
import { establishSession } from "@/lib/auth/session-client";
import { useGoogleRedirectAuth } from "@/features/auth/hooks/use-google-redirect-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const callbackUrl = "/mi-cuenta/perfil";

  const {
    resolvingRedirect,
    googleLoading,
    googleError,
    setGoogleError,
    startGoogleSignIn,
  } = useGoogleRedirectAuth(callbackUrl);

  const displayError = formError || googleError;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function completeSignIn(getIdToken: () => Promise<string>) {
    const idToken = await getIdToken();
    const session = await establishSession(idToken);
    if (!session.ok) {
      throw new Error(session.error ?? "Error de sesión");
    }
    router.push("/mi-cuenta/perfil");
    router.refresh();
  }

  async function onSubmit(data: RegisterFormData) {
    setFormError("");
    try {
      const credential = await firebaseEmailRegister(data.email, data.password);
      await updateProfile(credential.user, { displayName: data.name });
      await completeSignIn(() => credential.user.getIdToken(true));
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setFormError(mapFirebaseAuthError(code));
    }
  }

  async function onGoogleSignIn() {
    setFormError("");
    setGoogleError("");
    await startGoogleSignIn();
  }

  if (resolvingRedirect) {
    return (
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-[var(--shadow-card)]">
        <p className="text-center text-meru-muted">Completando registro con Google…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-[var(--shadow-card)]">
      <h1 className="text-2xl font-bold text-meru-charcoal">Crear cuenta</h1>
      <p className="mt-2 text-sm text-meru-muted">
        Registrate para reservar excursiones y guardar tu información de contacto.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <Input
          label="Nombre completo"
          autoComplete="name"
          placeholder="Tu nombre"
          error={errors.name?.message}
          {...register("name")}
        />
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
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Repetí la contraseña"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {displayError && (
          <p className="flex items-start gap-2 text-sm text-red-600" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {displayError}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Crear cuenta
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
        Registrarse con Google
      </Button>

      <p className="mt-6 text-center text-sm text-meru-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-semibold text-meru-secondary hover:underline">
          Iniciar sesión
        </Link>
      </p>

      <Link href="/" className="mt-4 inline-block text-sm text-meru-muted hover:text-meru-charcoal">
        ← Volver al inicio
      </Link>
    </div>
  );
}
