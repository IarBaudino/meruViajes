"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { changePasswordSchema, type ChangePasswordFormData } from "@/schemas/auth";
import {
  firebaseChangePassword,
  firebaseLinkEmailPassword,
  mapFirebaseAuthError,
} from "@/lib/auth/firebase-auth-client";
import { formatAuthProvider } from "@/lib/auth/auth-providers";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ChangePasswordForm() {
  const { data: session } = useSession();
  const [hasPasswordLogin, setHasPasswordLogin] = useState<boolean | null>(null);
  const [authProviders, setAuthProviders] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users/me");
      if (!res.ok) return;
      const data = await res.json();
      setHasPasswordLogin(Boolean(data.hasPasswordLogin));
      setAuthProviders(data.authProviders ?? []);
    }
    if (session?.user) void load();
  }, [session]);

  async function onSubmit(data: ChangePasswordFormData) {
    setStatus("idle");
    setError("");

    const email = session?.user?.email;
    if (!email) {
      setError("No se encontró el correo de la sesión.");
      setStatus("error");
      return;
    }

    try {
      if (hasPasswordLogin) {
        if (!data.currentPassword?.trim()) {
          setError("Ingresá tu contraseña actual.");
          setStatus("error");
          return;
        }
        await firebaseChangePassword(email, data.currentPassword, data.newPassword);
      } else {
        await firebaseLinkEmailPassword(email, data.newPassword);
        setHasPasswordLogin(true);
        setAuthProviders((prev) => (prev.includes("password") ? prev : [...prev, "password"]));
      }

      reset();
      setStatus("success");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(mapFirebaseAuthError(code) || (err instanceof Error ? err.message : "Error"));
      setStatus("error");
    }
  }

  if (hasPasswordLogin === null) {
    return <p className="text-sm text-meru-muted">Cargando acceso…</p>;
  }

  return (
    <div className="mt-10 border-t border-meru-border pt-8">
      <h2 className="text-lg text-meru-charcoal">Contraseña de acceso</h2>
      <p className="mt-2 text-sm text-meru-muted">
        {hasPasswordLogin
          ? "Cambiá la contraseña con la que ingresás por email."
          : "Entraste con Google. Podés crear una contraseña para ingresar también con email."}
      </p>

      {authProviders.length > 0 ? (
        <p className="mt-2 text-xs text-meru-muted">
          Métodos vinculados: {authProviders.map(formatAuthProvider).join(", ")}
        </p>
      ) : null}

      <div className="mt-4 flex gap-2 rounded-lg border border-meru-border bg-meru-sand/50 p-3 text-xs text-meru-charcoal-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-meru-secondary" aria-hidden />
        <p>
          Usá <strong>Mostrar</strong> al lado del campo si querés ver lo que escribís. La contraseña
          guardada no se puede recuperar después.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        {hasPasswordLogin ? (
          <PasswordInput
            label="Contraseña actual"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
        ) : null}

        <PasswordInput
          label={hasPasswordLogin ? "Nueva contraseña" : "Contraseña nueva"}
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />

        <PasswordInput
          label="Confirmar contraseña"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {status === "success" ? (
          <p className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" aria-hidden />
            Contraseña actualizada correctamente.
          </p>
        ) : null}

        {status === "error" ? (
          <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden />
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            {hasPasswordLogin ? "Cambiar contraseña" : "Crear contraseña"}
          </Button>
          <Link
            href="/recuperar-contrasena"
            className="inline-flex items-center text-sm font-medium text-meru-secondary hover:underline"
          >
            Olvidé mi contraseña
          </Link>
        </div>
      </form>
    </div>
  );
}
