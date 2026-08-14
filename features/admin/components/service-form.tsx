"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, type ServiceFormData } from "@/schemas/service";
import type { Service } from "@/types";
import { slugify } from "@/lib/utils/slugify";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatCurrencyARS } from "@/lib/format";
import { PhotoGalleryUpload } from "@/features/admin/components/inline-media-upload";
import { SeasonSelector } from "@/features/admin/components/season-selector";
import { ServiceDeparturesFields } from "@/features/admin/components/service-departures-fields";

type ServiceFormProps = {
  service?: Service;
};

function newDiscountId() {
  return `d-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultDiscountOptions() {
  return [
    { id: newDiscountId(), label: "Menor", percent: 50 },
    { id: newDiscountId(), label: "Jubilado", percent: 20 },
  ];
}

function emptySeasonalOverride() {
  return {
    title: "",
    description: "",
    price: 0,
    duration: "",
    difficulty: "",
    photos: [] as string[],
    meetingPoint: "",
    requirements: "",
    cancellationPolicy: "",
    additionalEquipment: "",
    notIncluded: "",
  };
}

function toSeasonalOverrideDefaults(override?: {
  title?: string;
  description?: string;
  price?: number;
  duration?: string;
  difficulty?: string;
  photos?: string[];
  meetingPoint?: string;
  requirements?: string;
  cancellationPolicy?: string;
  additionalEquipment?: string;
  notIncluded?: string;
}) {
  return {
    ...emptySeasonalOverride(),
    title: override?.title ?? "",
    description: override?.description ?? "",
    price: override?.price && override.price > 0 ? override.price : 0,
    duration: override?.duration ?? "",
    difficulty: override?.difficulty ?? "",
    photos: override?.photos ?? [],
    meetingPoint: override?.meetingPoint ?? "",
    requirements: override?.requirements ?? "",
    cancellationPolicy: override?.cancellationPolicy ?? "",
    additionalEquipment: override?.additionalEquipment ?? "",
    notIncluded: override?.notIncluded ?? "",
  };
}

function toFormDefaults(service?: Service): ServiceFormData {
  const options =
    service?.discountOptions && service.discountOptions.length > 0
      ? service.discountOptions
      : service
        ? []
        : defaultDiscountOptions();

  const promo = service?.promotion;

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
    seasons: service?.seasons ?? ["todo-el-ano"],
    seasonalContent: {
      verano: toSeasonalOverrideDefaults(service?.seasonalContent?.verano),
      invierno: toSeasonalOverrideDefaults(service?.seasonalContent?.invierno),
    },
    meetingPoint: service?.meetingPoint ?? "",
    requirements: service?.requirements ?? "",
    cancellationPolicy: service?.cancellationPolicy ?? "",
    additionalEquipment: service?.additionalEquipment ?? "",
    notIncluded: service?.notIncluded ?? "",
    discountOptions: options,
    promotion: {
      enabled: Boolean(promo?.enabled),
      price: promo?.price ?? 0,
      startsAt: promo?.startsAt ?? "",
      endsAt: promo?.endsAt ?? "",
      appliesToDiscountIds: promo?.appliesToDiscountIds ?? [],
    },
    stock: service?.stock ?? 0,
    departures: service?.departures ?? [],
    featuredOnHome: service?.featuredOnHome ?? false,
    homeOrder: service?.homeOrder ?? 100,
    active: service?.active ?? true,
  };
}

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const isEdit = Boolean(service?.id);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema) as Resolver<ServiceFormData>,
    defaultValues: toFormDefaults(service),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "discountOptions",
  });

  const title = watch("title");
  const price = watch("price");
  const photos = watch("photos") ?? [];
  const veranoPhotos = watch("seasonalContent.verano.photos") ?? [];
  const inviernoPhotos = watch("seasonalContent.invierno.photos") ?? [];
  const seasons = watch("seasons") ?? ["todo-el-ano"];
  const promoEnabled = watch("promotion.enabled");
  const discountOptions = watch("discountOptions") ?? [];
  const appliesTo = watch("promotion.appliesToDiscountIds") ?? [];

  useEffect(() => {
    async function loadCategorySuggestions() {
      const res = await fetch("/api/admin/services");
      if (!res.ok) return;
      const data = await res.json();
      const names = new Set<string>();
      for (const s of (data.services ?? []) as Service[]) {
        if (s.category?.trim()) names.add(s.category.trim());
      }
      setCategorySuggestions(Array.from(names).sort((a, b) => a.localeCompare(b, "es")));
    }
    void loadCategorySuggestions();
  }, []);

  useEffect(() => {
    if (!isEdit && title) {
      setValue("slug", slugify(title));
    }
  }, [title, isEdit, setValue]);

  function toggleAppliesTo(optionId: string, checked: boolean) {
    const next = checked
      ? Array.from(new Set([...appliesTo, optionId]))
      : appliesTo.filter((id) => id !== optionId);
    setValue("promotion.appliesToDiscountIds", next, { shouldDirty: true });
  }

  async function onSubmit(data: ServiceFormData) {
    setError("");

    const cleanedOptions = (data.discountOptions ?? [])
      .map((opt) => ({
        id: opt.id || newDiscountId(),
        label: opt.label.trim(),
        percent: Number(opt.percent),
      }))
      .filter(
        (opt) =>
          opt.label.length >= 2 &&
          Number.isFinite(opt.percent) &&
          opt.percent > 0 &&
          opt.percent <= 100
      );

    const promo = data.promotion;
    const promotion =
      promo?.enabled &&
      Number(promo.price) > 0 &&
      promo.startsAt &&
      promo.endsAt
        ? {
            enabled: true,
            price: Number(promo.price),
            startsAt: promo.startsAt,
            endsAt: promo.endsAt,
            appliesToDiscountIds: (promo.appliesToDiscountIds ?? []).filter((id) =>
              cleanedOptions.some((o) => o.id === id)
            ),
          }
        : null;

    const cleanedDepartures = (data.departures ?? [])
      .map((d) => ({
        id: d.id || `dep-${Math.random().toString(36).slice(2, 10)}`,
        date: d.date,
        time: d.time,
        capacity: Number(d.capacity),
        booked: Math.max(0, Number(d.booked) || 0),
        active: d.active !== false,
      }))
      .filter(
        (d) =>
          Boolean(d.date) &&
          Boolean(d.time) &&
          Number.isFinite(d.capacity) &&
          d.capacity > 0
      );

    const payload: ServiceFormData = {
      ...data,
      photos,
      duration: data.duration || undefined,
      difficulty: data.difficulty || undefined,
      location: data.location || undefined,
      category: data.category || undefined,
      meetingPoint: data.meetingPoint || undefined,
      requirements: data.requirements || undefined,
      cancellationPolicy: data.cancellationPolicy || undefined,
      additionalEquipment: data.additionalEquipment || undefined,
      notIncluded: data.notIncluded || undefined,
      discountOptions: cleanedOptions,
      promotion,
      departures: cleanedDepartures,
    };

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
        <p className="-mt-3 text-xs text-meru-muted">
          Usá Enter para separar párrafos. Se respetan en la ficha pública.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Precio adulto habitual (ARS)"
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
          <div>
            <Input
              label="Categoría (opcional)"
              list="service-category-suggestions"
              placeholder="Ej. Trekking, Convencionales, Experiencias"
              {...register("category")}
            />
            <datalist id="service-category-suggestions">
              {categorySuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-meru-muted">
              Escribí una nueva o elegí una ya usada. Sirve para filtrar en el catálogo. Para
              combinar varias excursiones con un precio, usá{" "}
              <a href="/admin/paquetes" className="text-meru-secondary hover:underline">
                Paquetes
              </a>
              .
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-meru-charcoal">
          <input type="checkbox" className="rounded" {...register("active")} />
          Publicada (visible en el catálogo)
        </label>
        <SeasonSelector
          value={seasons}
          onChange={(next) => setValue("seasons", next, { shouldDirty: true, shouldValidate: true })}
        />
        <label className="flex items-center gap-2 text-sm text-meru-charcoal">
          <input type="checkbox" className="rounded" {...register("featuredOnHome")} />
          Destacar en el home
        </label>
        <Input
          label="Orden en el home (menor = primero)"
          type="number"
          min={0}
          max={999}
          {...register("homeOrder", { valueAsNumber: true })}
        />
      </section>

      <ServiceDeparturesFields
        control={control}
        register={register}
        watch={watch}
        setValue={setValue}
      />

      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-5">
        <div>
          <h2 className="text-lg text-meru-charcoal">Descuentos por tipo de pasajero</h2>
          <p className="mt-1 text-sm text-meru-muted">
            Agregá las categorías que necesites (menor, jubilado, estudiante, etc.). El % se
            aplica sobre la tarifa adulta vigente (habitual o promo). Los infantes siempre son
            gratis.
          </p>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end"
            >
              <input type="hidden" {...register(`discountOptions.${index}.id`)} />
              <Input
                label={index === 0 ? "Nombre" : undefined}
                placeholder="Ej. Menor, Jubilado…"
                error={errors.discountOptions?.[index]?.label?.message}
                {...register(`discountOptions.${index}.label`)}
              />
              <Input
                label={index === 0 ? "% descuento" : undefined}
                type="number"
                min={1}
                max={100}
                error={errors.discountOptions?.[index]?.percent?.message}
                {...register(`discountOptions.${index}.percent`, { valueAsNumber: true })}
              />
              <Button
                type="button"
                variant="outline"
                className="mb-0.5"
                onClick={() => {
                  const removedId = discountOptions[index]?.id;
                  remove(index);
                  if (removedId) {
                    setValue(
                      "promotion.appliesToDiscountIds",
                      appliesTo.filter((id) => id !== removedId),
                      { shouldDirty: true }
                    );
                  }
                }}
              >
                Quitar
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({ id: newDiscountId(), label: "", percent: 10 })
          }
        >
          Agregar descuento
        </Button>
      </section>

      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-5">
        <div>
          <h2 className="text-lg text-meru-charcoal">Promoción temporal</h2>
          <p className="mt-1 text-sm text-meru-muted">
            Precio adulto especial entre dos fechas. Al vencer, vuelve solo al precio habitual.
            Podés elegir qué descuentos siguen aplicando durante la promo.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-meru-charcoal">
          <input type="checkbox" className="rounded" {...register("promotion.enabled")} />
          Activar promoción con fechas
        </label>

        {promoEnabled ? (
          <div className="space-y-5 border-t border-meru-border pt-5">
            <div className="grid gap-5 sm:grid-cols-3">
              <Input
                label="Precio promocional (ARS)"
                type="number"
                step="1"
                error={errors.promotion?.price?.message}
                {...register("promotion.price", { valueAsNumber: true })}
              />
              <Input
                label="Desde"
                type="date"
                error={errors.promotion?.startsAt?.message}
                {...register("promotion.startsAt")}
              />
              <Input
                label="Hasta (inclusive)"
                type="date"
                error={errors.promotion?.endsAt?.message}
                {...register("promotion.endsAt")}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-meru-charcoal">
                Descuentos que aplican en esta promo
              </p>
              {discountOptions.length === 0 ? (
                <p className="text-sm text-meru-muted">
                  Primero agregá al menos un tipo de descuento arriba.
                </p>
              ) : (
                <ul className="space-y-2">
                  {discountOptions.map((opt) => {
                    if (!opt?.id) return null;
                    const checked = appliesTo.includes(opt.id);
                    return (
                      <li key={opt.id}>
                        <label className="flex items-center gap-2 text-sm text-meru-charcoal">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={checked}
                            onChange={(e) => toggleAppliesTo(opt.id, e.target.checked)}
                          />
                          {opt.label?.trim() || "Sin nombre"}
                          {Number.isFinite(opt.percent) ? ` (−${opt.percent}%)` : ""}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="mt-2 text-xs text-meru-muted">
                Si no marcás ninguno, durante la promo solo se vende tarifa adulta promocional
                (más infantes gratis).
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-5">
        <h2 className="text-lg text-meru-charcoal">Detalle y logística</h2>
        <Input label="Punto de encuentro" {...register("meetingPoint")} />
        <Textarea label="Requisitos" rows={3} {...register("requirements")} />
        <Textarea label="Política de cancelación" rows={3} {...register("cancellationPolicy")} />
        <Textarea label="Equipo adicional" rows={2} {...register("additionalEquipment")} />
        <Textarea label="No incluye" rows={2} {...register("notIncluded")} />
      </section>

      <section className="rounded-xl border border-meru-border bg-white p-6">
        <PhotoGalleryUpload
          folder="excursions"
          photos={photos}
          onChange={(next) => setValue("photos", next, { shouldDirty: true })}
          label="Galería de fotos (ficha base)"
          hint="La primera foto es la portada. Usá ↑ ↓ para cambiar el orden. Se comprimen automáticamente."
        />
      </section>

      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-8">
        <div>
          <h2 className="text-lg text-meru-charcoal">Versiones por temporada</h2>
          <p className="mt-1 text-sm text-meru-muted">
            Opcional. Si completás algo acá, al entrar desde Verano o Invierno en el menú se muestra
            esa versión (texto, fotos, precio, etc.). Los campos vacíos siguen usando la ficha base
            de arriba.
          </p>
        </div>

        {(["verano", "invierno"] as const).map((seasonKey) => {
          const seasonPhotos = seasonKey === "verano" ? veranoPhotos : inviernoPhotos;
          const seasonLabel = seasonKey === "verano" ? "Verano" : "Invierno";
          return (
            <div
              key={seasonKey}
              className="space-y-4 rounded-lg border border-dashed border-meru-border p-4"
            >
              <h3 className="font-medium text-meru-charcoal">Versión {seasonLabel}</h3>
              <Input
                label={`Título (${seasonLabel})`}
                placeholder="Vacío = usar título base"
                {...register(`seasonalContent.${seasonKey}.title`)}
              />
              <Textarea
                label={`Descripción (${seasonLabel})`}
                rows={5}
                placeholder="Vacío = usar descripción base"
                {...register(`seasonalContent.${seasonKey}.description`)}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label={`Precio adulto (${seasonLabel})`}
                  type="number"
                  min={0}
                  step={100}
                  placeholder="0 = precio base"
                  {...register(`seasonalContent.${seasonKey}.price`, { valueAsNumber: true })}
                />
                <Input
                  label="Duración"
                  placeholder="Vacío = base"
                  {...register(`seasonalContent.${seasonKey}.duration`)}
                />
                <Input
                  label="Dificultad"
                  placeholder="Vacío = base"
                  {...register(`seasonalContent.${seasonKey}.difficulty`)}
                />
              </div>
              <Textarea
                label="Punto de encuentro"
                rows={2}
                placeholder="Vacío = base"
                {...register(`seasonalContent.${seasonKey}.meetingPoint`)}
              />
              <Textarea
                label="Requisitos"
                rows={2}
                placeholder="Vacío = base"
                {...register(`seasonalContent.${seasonKey}.requirements`)}
              />
              <Textarea
                label="Equipo adicional"
                rows={2}
                placeholder="Vacío = base"
                {...register(`seasonalContent.${seasonKey}.additionalEquipment`)}
              />
              <Textarea
                label="No incluye"
                rows={2}
                placeholder="Vacío = base"
                {...register(`seasonalContent.${seasonKey}.notIncluded`)}
              />
              <Textarea
                label="Cancelaciones"
                rows={2}
                placeholder="Vacío = base"
                {...register(`seasonalContent.${seasonKey}.cancellationPolicy`)}
              />
              <PhotoGalleryUpload
                folder="excursions"
                photos={seasonPhotos}
                onChange={(next) =>
                  setValue(`seasonalContent.${seasonKey}.photos`, next, { shouldDirty: true })
                }
                label={`Fotos ${seasonLabel}`}
                hint="Si cargás fotos acá, reemplazan la galería base al ver esa temporada."
              />
            </div>
          );
        })}
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
