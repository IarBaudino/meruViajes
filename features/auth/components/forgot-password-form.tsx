"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/schemas/auth";
import { firebaseSendPasswordReset, mapFirebaseAuthError } from "@/lib/auth/firebase-auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setFormError("");
    try {
      await firebaseSendPasswordReset(data.email);
      setSent(true);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setFormError(mapFirebaseAuthError(code));
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-[var(--shadow-card)]">
      <h1 className="text-2xl text-meru-charcoal">Recuperar contraseña</h1>
      <p className="mt-2 text-sm text-meru-muted">
        Te enviamos un correo con un enlace para elegir una nueva contraseña.
      </p>

      {sent ? (
        <div className="mt-8 space-y-4">
          <p className="flex items-start gap-2 text-sm text-green-700">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Si el correo está registrado, recibirás las instrucciones en unos minutos. Revisá también
            spam.
          </p>
          <Link href="/login" className="inline-block text-sm font-semibold text-meru-secondary hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            error={errors.email?.message}
            {...register("email")}
          />

          {formError ? (
            <p className="flex items-start gap-2 text-sm text-red-600" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Enviar enlace
          </Button>
        </form>
      )}

      <Link href="/login" className="mt-6 inline-block text-sm text-meru-muted hover:text-meru-charcoal">
        ← Volver a iniciar sesión
      </Link>
    </div>
  );
}
