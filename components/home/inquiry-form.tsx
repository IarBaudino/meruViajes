"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  inquiryFormFieldsSchema,
  type InquiryFormFields,
} from "@/schemas/inquiry";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import type { SiteSettings } from "@/types/site-settings";

type InquiryFormProps = {
  inquiry: SiteSettings["inquiry"];
};

function relatedLabel(kind?: string) {
  if (kind === "package") return "paquete";
  if (kind === "excursion") return "excursión";
  if (kind === "groupTrip") return "viaje grupal";
  return "producto";
}

export function InquiryForm({ inquiry }: InquiryFormProps) {
  const searchParams = useSearchParams();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [relatedKind, setRelatedKind] = useState<"excursion" | "package" | "groupTrip" | undefined>();
  const [relatedSlug, setRelatedSlug] = useState("");
  const [relatedTitle, setRelatedTitle] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormFields>({
    resolver: zodResolver(inquiryFormFieldsSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  useEffect(() => {
    const kindRaw = searchParams.get("consulta")?.trim() || searchParams.get("kind")?.trim();
    const kind =
      kindRaw === "excursion" || kindRaw === "package" || kindRaw === "groupTrip"
        ? kindRaw
        : undefined;
    const slug = searchParams.get("slug")?.trim() || "";
    const title = searchParams.get("titulo")?.trim() || searchParams.get("title")?.trim() || "";

    setRelatedKind(kind);
    setRelatedSlug(slug);
    setRelatedTitle(title);
  }, [searchParams]);

  async function onSubmit(data: InquiryFormFields) {
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          ...(relatedKind ? { relatedKind } : {}),
          ...(relatedSlug ? { relatedSlug } : {}),
          ...(relatedTitle ? { relatedTitle } : {}),
        }),
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
    <section id="consulta" className="scroll-mt-24 bg-brand-surface py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl text-brand-charcoal">{inquiry.title}</h2>
          <p className="mt-3 text-brand-muted">{inquiry.subtitle}</p>
          {relatedTitle ? (
            <p className="mt-4 inline-block rounded-lg bg-brand-sand px-4 py-2 text-sm text-brand-charcoal">
              Consultando por {relatedLabel(relatedKind)}:{" "}
              <span className="font-semibold">{relatedTitle}</span>
            </p>
          ) : null}
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
