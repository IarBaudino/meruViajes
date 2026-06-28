"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inquirySchema, type InquiryFormData } from "@/schemas/inquiry";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";

export function InquiryForm() {
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
  });

  async function onSubmit(data: InquiryFormData) {
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Error al enviar la consulta");
      }

      setSubmitStatus("success");
      reset();
    } catch (err) {
      setSubmitStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  return (
    <section id="consulta" className="scroll-mt-24 bg-meru-primary py-20 text-white">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">¿Tienes alguna consulta?</h2>
          <p className="mt-3 text-meru-sand/85">
            Estamos aquí para ayudarte a planificar tu próxima aventura
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-10 space-y-5 rounded-xl bg-white p-6 shadow-[var(--shadow-elevated)] sm:p-8"
          noValidate
        >
          <Input
            label="Nombre completo"
            placeholder="Tu nombre"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Textarea
            label="Tu consulta"
            placeholder="Contanos sobre tu viaje ideal..."
            error={errors.message?.message}
            {...register("message")}
          />

          {submitStatus === "success" && (
            <div
              className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-800"
              role="status"
            >
              <CheckCircle className="h-5 w-5 shrink-0" aria-hidden />
              <p>¡Consulta enviada! Te responderemos a la brevedad.</p>
            </div>
          )}

          {submitStatus === "error" && (
            <div
              className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-800"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
              <p>{errorMessage}</p>
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={isSubmitting}>
            Enviar consulta
          </Button>
        </form>
      </div>
    </section>
  );
}