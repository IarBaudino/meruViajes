"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, type ServiceFormData } from "@/schemas/service";
import type { Service } from "@/types";
import { slugify } from "@/lib/utils/slugify";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatCurrencyARS } from "@/lib/format";

type ServiceFormProps = {
  service?: Service;
};

function photosToText(photos: string[]): string {
  return photos.join("\n");
}

function textToPhotos(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toFormDefaults(service?: Service): ServiceFormData {
  return {
    title: service?.title ?? "",
    slug: service?.slug ?? "",
    description: service?.description ?? "",
    price: service?.price ?? 0,
    duration: service?.duration ?? "",
    difficulty: service?.difficulty ?? "",
    location: service?.location ?? "",
    photos: service?.photos ?? [],
    category: service?.category ?? "",
    meetingPoint: service?.meetingPoint ?? "",
    requirements: service?.requirements ?? "",
    cancellationPolicy: service?.cancellationPolicy ?? "",
    additionalEquipment: service?.additionalEquipment ?? "",
    notIncluded: service?.notIncluded ?? "",
    discounts: service?.discounts ?? {},
    stock: service?.stock ?? 0,
    active: service?.active ?? true,
  };
}

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const [photosText, setPhotosText] = useState(photosToText(service?.photos ?? []));
  const [error, setError] = useState("");
  const isEdit = Boolean(service?.id);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema) as Resolver<ServiceFormData>,
    defaultValues: toFormDefaults(service),
  });

  const title = watch("title");
  const price = watch("price");

  useEffect(() => {
    if (!isEdit && title) {
      setValue("slug", slugify(title));
    }
  }, [title, isEdit, setValue]);

  async function onSubmit(data: ServiceFormData) {
    setError("");
    const cleanDiscount = (n?: number) =>
      typeof n === "number" && Number.isFinite(n) && n > 0 ? n : undefined;

    const payload: ServiceFormData = {
      ...data,
      photos: textToPhotos(photosText),
      duration: data.duration || undefined,
      difficulty: data.difficulty || undefined,
      location: data.location || undefined,
      category: data.category || undefined,
      meetingPoint: data.meetingPoint || undefined,
      requirements: data.requirements || undefined,
      cancellationPolicy: data.cancellationPolicy || undefined,
      additionalEquipment: data.additionalEquipment || undefined,
      notIncluded: data.notIncluded || undefined,
      discounts: {
        minorPercent: cleanDiscount(data.discounts?.minorPercent),
        infantPercent: cleanDiscount(data.discounts?.infantPercent),
        seniorPercent: cleanDiscount(data.discounts?.seniorPercent),
      },
    };

    const hasDiscounts =
      payload.discounts?.minorPercent ||
      payload.discounts?.infantPercent ||
      payload.discounts?.seniorPercent;
    if (!hasDiscounts) payload.discounts = undefined;

    const url = isEdit ? `/api/admin/services/${service!.id}` : "/api/admin/services";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Error al guardar");
      return;
    }

    router.push("/admin/excursiones");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-5">
        <h2 className="text-lg text-meru-charcoal">Información básica</h2>
        <Input label="Título" error={errors.title?.message} {...register("title")} />
        <Input label="Slug (URL)" error={errors.slug?.message} {...register("slug")} />
        <Textarea
          label="Descripción"
          rows={5}
          error={errors.description?.message}
          {...register("description")}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Precio adulto (ARS)"
            type="number"
            step="1"
            error={errors.price?.message}
            {...register("price", { valueAsNumber: true })}
          />
          {price > 0 ? (
            <p className="self-end text-sm text-meru-muted pb-2">
              Vista previa: {formatCurrencyARS(price)}
            </p>
          ) : null}
          <Input label="Duración" placeholder="Ej. 4 horas" {...register("duration")} />
          <Input label="Dificultad" placeholder="Ej. Moderada" {...register("difficulty")} />
          <Input label="Ubicación" {...register("location")} />
          <Input label="Categoría" {...register("category")} />
          <Input
            label="Stock / cupos"
            type="number"
            {...register("stock", { valueAsNumber: true })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-meru-charcoal">
          <input type="checkbox" className="rounded" {...register("active")} />
          Publicada (visible en el catálogo)
        </label>
      </section>

      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-5">
        <h2 className="text-lg text-meru-charcoal">Descuentos (% sobre precio adulto)</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Menores"
            type="number"
            {...register("discounts.minorPercent", { valueAsNumber: true })}
          />
          <Input
            label="Infantes"
            type="number"
            {...register("discounts.infantPercent", { valueAsNumber: true })}
          />
          <Input
            label="Jubilados"
            type="number"
            {...register("discounts.seniorPercent", { valueAsNumber: true })}
          />
        </div>
      </section>

      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-5">
        <h2 className="text-lg text-meru-charcoal">Detalle y logística</h2>
        <Input label="Punto de encuentro" {...register("meetingPoint")} />
        <Textarea label="Requisitos" rows={3} {...register("requirements")} />
        <Textarea label="Política de cancelación" rows={3} {...register("cancellationPolicy")} />
        <Textarea label="Equipo adicional" rows={2} {...register("additionalEquipment")} />
        <Textarea label="No incluye" rows={2} {...register("notIncluded")} />
      </section>

      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-3">
        <h2 className="text-lg text-meru-charcoal">Fotos (URLs)</h2>
        <p className="text-sm text-meru-muted">
          Una URL por línea. Subí imágenes en{" "}
          <a href="/admin/medios" className="text-meru-secondary hover:underline">
            Medios
          </a>{" "}
          y pegá el enlace aquí.
        </p>
        <Textarea
          label="URLs de fotos"
          rows={4}
          value={photosText}
          onChange={(e) => setPhotosText(e.target.value)}
        />
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? "Guardar cambios" : "Crear excursión"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
