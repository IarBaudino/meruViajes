"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { siteSettingsSchema, type SiteSettingsFormData } from "@/schemas/site-settings";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings/defaults";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { SingleImageUpload } from "@/features/admin/components/inline-media-upload";

export function SiteSettingsForm() {
  const [loadError, setLoadError] = useState("");
  const [saveOk, setSaveOk] = useState(false);
  const [saveError, setSaveError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<SiteSettingsFormData>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: DEFAULT_SITE_SETTINGS,
  });

  const { fields } = useFieldArray({ control, name: "about.values" });
  const heroBackground = watch("hero.backgroundImageUrl") ?? "";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/site-settings");
        if (!res.ok) throw new Error("No se pudo cargar");
        const data = await res.json();
        reset(data);
      } catch {
        setLoadError("No se pudo cargar la configuración");
      }
    }
    void load();
  }, [reset]);

  async function onSubmit(data: SiteSettingsFormData) {
    setSaveOk(false);
    setSaveError("");
    const res = await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setSaveError(json.error ?? "Error al guardar");
      return;
    }
    setSaveOk(true);
  }

  if (loadError) return <p className="text-red-600">{loadError}</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-4">
        <h2 className="text-lg text-meru-charcoal">Hero (inicio)</h2>
        <Input label="Etiqueta superior" {...register("hero.eyebrow")} />
        <Input label="Título principal" {...register("hero.title")} />
        <Input label="Subtítulo decorativo" {...register("hero.subtitle")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Botón principal — texto" {...register("hero.ctaPrimaryLabel")} />
          <Input label="Botón principal — enlace" {...register("hero.ctaPrimaryHref")} />
          <Input label="Botón secundario — texto" {...register("hero.ctaSecondaryLabel")} />
          <Input label="Botón secundario — enlace" {...register("hero.ctaSecondaryHref")} />
        </div>
        <SingleImageUpload
          folder="content"
          value={heroBackground}
          onChange={(url) =>
            setValue("hero.backgroundImageUrl", url, { shouldDirty: true })
          }
          label="Imagen de fondo (opcional)"
          hint="Se muestra detrás del texto del inicio, con un degradado encima."
        />
      </section>

      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-4">
        <h2 className="text-lg text-meru-charcoal">Sección excursiones (home)</h2>
        <Input label="Título" {...register("excursionsPreview.title")} />
        <Textarea label="Descripción" rows={3} {...register("excursionsPreview.description")} />
      </section>

      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-4">
        <h2 className="text-lg text-meru-charcoal">Sobre nosotros</h2>
        <Input label="Título de sección" {...register("about.title")} />
        <Input label="Cita" {...register("about.quote")} />
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border border-meru-border p-4 space-y-3">
            <Input label={`Bloque ${index + 1} — título`} {...register(`about.values.${index}.title`)} />
            <Textarea label="Texto" rows={3} {...register(`about.values.${index}.text`)} />
          </div>
        ))}
        <Textarea label="Párrafo final" rows={4} {...register("about.closingText")} />
      </section>

      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-4">
        <h2 className="text-lg text-meru-charcoal">Formulario de consultas</h2>
        <Input label="Título" {...register("inquiry.title")} />
        <Input label="Subtítulo" {...register("inquiry.subtitle")} />
      </section>

      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-4">
        <h2 className="text-lg text-meru-charcoal">Footer y contacto</h2>
        <Input label="Nombre de marca" {...register("footer.brandName")} />
        <Textarea label="Descripción" rows={3} {...register("footer.tagline")} />
        <Input label="Dirección" {...register("footer.address")} />
        <Input label="Email" type="email" {...register("footer.email")} />
        <Input label="Teléfono / WhatsApp (texto)" {...register("footer.phoneLabel")} />
      </section>

      {saveOk ? (
        <p className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" /> Contenido guardado. Los cambios se ven en la home al recargar.
        </p>
      ) : null}
      {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}

      <Button type="submit" isLoading={isSubmitting}>
        Guardar contenido web
      </Button>
    </form>
  );
}
