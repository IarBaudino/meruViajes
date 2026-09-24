"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, type ServiceFormData } from "@/schemas/service";
import type { Service } from "@/types";
import { slugify } from "@/lib/utils/slugify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ServiceSeasonVariantSection } from "@/features/admin/components/service-season-variant-section";

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

function emptySeasonVariant(enabled = false) {
  return {
    enabled,
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
    discountOptions: defaultDiscountOptions(),
    promotion: {
      enabled: false,
      percent: 0,
      startsAt: "",
      endsAt: "",
      appliesToDiscountIds: [] as string[],
    },
    stock: 0,
    departures: [],
  };
}

function variantFromService(
  variant: Service["seasonalVariants"]["verano"] | undefined,
  fallbackEnabled: boolean
) {
  const promo = variant?.promotion;
  return {
    enabled: variant?.enabled ?? fallbackEnabled,
    title: variant?.title ?? "",
    description: variant?.description ?? "",
    price: variant?.price ?? 0,
    duration: variant?.duration ?? "",
    difficulty: variant?.difficulty ?? "",
    photos: variant?.photos ?? [],
    meetingPoint: variant?.meetingPoint ?? "",
    requirements: variant?.requirements ?? "",
    cancellationPolicy: variant?.cancellationPolicy ?? "",
    additionalEquipment: variant?.additionalEquipment ?? "",
    notIncluded: variant?.notIncluded ?? "",
    discountOptions:
      variant?.discountOptions && variant.discountOptions.length > 0
        ? variant.discountOptions
        : defaultDiscountOptions(),
    promotion: {
      enabled: Boolean(promo?.enabled),
      percent: promo?.percent ?? 0,
      startsAt: promo?.startsAt ?? "",
      endsAt: promo?.endsAt ?? "",
      appliesToDiscountIds: promo?.appliesToDiscountIds ?? [],
    },
    stock: variant?.stock ?? 0,
    departures: variant?.departures ?? [],
  };
}

function toFormDefaults(service?: Service): ServiceFormData {
  if (service?.seasonalVariants) {
    return {
      slug: service.slug ?? "",
      location: service.location ?? "",
      category: service.category ?? "",
      seasonalVariants: {
        verano: variantFromService(service.seasonalVariants.verano, true),
        invierno: variantFromService(service.seasonalVariants.invierno, false),
      },
      featuredOnHome: service.featuredOnHome ?? false,
      homeOrder: service.homeOrder ?? 100,
      active: service.active ?? true,
    };
  }

  return {
    slug: service?.slug ?? "",
    location: service?.location ?? "",
    category: service?.category ?? "",
    seasonalVariants: {
      verano: {
        ...emptySeasonVariant(true),
        title: service?.title ?? "",
        description: service?.description ?? "",
        price: service?.price ?? 0,
        duration: service?.duration ?? "",
        difficulty: service?.difficulty ?? "",
        photos: service?.photos ?? [],
        meetingPoint: service?.meetingPoint ?? "",
        requirements: service?.requirements ?? "",
        cancellationPolicy: service?.cancellationPolicy ?? "",
        additionalEquipment: service?.additionalEquipment ?? "",
        notIncluded: service?.notIncluded ?? "",
        discountOptions:
          service?.discountOptions && service.discountOptions.length > 0
            ? service.discountOptions
            : defaultDiscountOptions(),
        promotion: {
          enabled: Boolean(service?.promotion?.enabled),
          percent: service?.promotion?.percent ?? 0,
          startsAt: service?.promotion?.startsAt ?? "",
          endsAt: service?.promotion?.endsAt ?? "",
          appliesToDiscountIds: service?.promotion?.appliesToDiscountIds ?? [],
        },
        stock: service?.stock ?? 0,
        departures: service?.departures ?? [],
      },
      invierno: emptySeasonVariant(false),
    },
    featuredOnHome: service?.featuredOnHome ?? false,
    homeOrder: service?.homeOrder ?? 100,
    active: service?.active ?? true,
  };
}

function cleanVariant(
  variant: ServiceFormData["seasonalVariants"]["verano"]
): ServiceFormData["seasonalVariants"]["verano"] {
  const cleanedOptions = (variant.discountOptions ?? [])
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

  const promo = variant.promotion;
  const promotion =
    promo?.enabled &&
    Number(promo.percent) > 0 &&
    Number(promo.percent) <= 100 &&
    promo.startsAt &&
    promo.endsAt
      ? {
          enabled: true,
          percent: Math.round(Number(promo.percent)),
          startsAt: promo.startsAt,
          endsAt: promo.endsAt,
          appliesToDiscountIds: (promo.appliesToDiscountIds ?? []).filter((id) =>
            cleanedOptions.some((o) => o.id === id)
          ),
        }
      : null;

  const cleanedDepartures = (variant.departures ?? [])
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
        Boolean(d.date) && Boolean(d.time) && Number.isFinite(d.capacity) && d.capacity > 0
    );

  return {
    ...variant,
    title: variant.title.trim(),
    description: variant.description.trim(),
    duration: variant.duration || "",
    difficulty: variant.difficulty || "",
    meetingPoint: variant.meetingPoint || "",
    requirements: variant.requirements || "",
    cancellationPolicy: variant.cancellationPolicy || "",
    additionalEquipment: variant.additionalEquipment || "",
    notIncluded: variant.notIncluded || "",
    discountOptions: cleanedOptions,
    promotion,
    departures: cleanedDepartures,
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

  const veranoTitle = watch("seasonalVariants.verano.title");
  const inviernoTitle = watch("seasonalVariants.invierno.title");

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
    if (!isEdit) {
      const title = veranoTitle.trim() || inviernoTitle.trim();
      if (title) {
        setValue("slug", slugify(title));
      }
    }
  }, [veranoTitle, inviernoTitle, isEdit, setValue]);

  async function onSubmit(data: ServiceFormData) {
    setError("");

    const payload: ServiceFormData = {
      ...data,
      location: data.location || undefined,
      category: data.category || undefined,
      seasonalVariants: {
        verano: cleanVariant(data.seasonalVariants.verano),
        invierno: cleanVariant(data.seasonalVariants.invierno),
      },
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
        <h2 className="text-lg text-meru-charcoal">Datos compartidos</h2>
        <p className="text-sm text-meru-muted">
          Slug, ubicación y categoría son comunes a ambas temporadas. El título y la descripción se
          cargan por temporada abajo.
        </p>
        <Input label="Slug (URL)" error={errors.slug?.message} {...register("slug")} />
        <div className="grid gap-5 sm:grid-cols-2">
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
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-meru-charcoal">
          <input type="checkbox" className="rounded" {...register("active")} />
          Publicada (visible en el catálogo)
        </label>
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

      <ServiceSeasonVariantSection
        season="verano"
        control={control}
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors.seasonalVariants?.verano as any}
        newDiscountId={newDiscountId}
      />

      <ServiceSeasonVariantSection
        season="invierno"
        control={control}
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors.seasonalVariants?.invierno as any}
        newDiscountId={newDiscountId}
      />

      {errors.seasonalVariants?.message ? (
        <p className="text-sm text-red-600">{String(errors.seasonalVariants.message)}</p>
      ) : null}
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
