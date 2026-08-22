"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { packageSchema, type PackageFormData } from "@/schemas/package";
import type { ExcursionPackage } from "@/types/catalog";
import type { Service } from "@/types";
import { slugify } from "@/lib/utils/slugify";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PhotoGalleryUpload } from "@/features/admin/components/inline-media-upload";
import { SeasonSelector } from "@/features/admin/components/season-selector";
import { formatCurrencyARS } from "@/lib/format";

type PackageFormProps = {
  package?: ExcursionPackage;
};

function toDefaults(pkg?: ExcursionPackage): PackageFormData {
  return {
    title: pkg?.title ?? "",
    slug: pkg?.slug ?? "",
    description: pkg?.description ?? "",
    price: pkg?.price ?? 0,
    photos: pkg?.photos ?? [],
    serviceIds: pkg?.serviceIds ?? [],
    stock: pkg?.stock ?? 0,
    active: pkg?.active ?? true,
    featuredOnHome: pkg?.featuredOnHome ?? false,
    homeOrder: pkg?.homeOrder ?? 100,
    category: pkg?.category ?? "",
    seasons: pkg?.seasons ?? ["todo-el-ano"],
    promotion: {
      enabled: Boolean(pkg?.promotion?.enabled),
      percent: pkg?.promotion?.percent ?? 0,
    },
  };
}

export function PackageForm({ package: pkg }: PackageFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const isEdit = Boolean(pkg?.id);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema) as Resolver<PackageFormData>,
    defaultValues: toDefaults(pkg),
  });

  const title = watch("title");
  const photos = watch("photos") ?? [];
  const serviceIds = watch("serviceIds") ?? [];
  const price = watch("price");
  const seasons = watch("seasons") ?? ["todo-el-ano"];
  const promoEnabled = watch("promotion.enabled");
  const promoPercent = watch("promotion.percent") ?? 0;

  useEffect(() => {
    if (!isEdit && title) {
      setValue("slug", slugify(title));
    }
  }, [title, isEdit, setValue]);

  useEffect(() => {
    async function loadServices() {
      const res = await fetch("/api/admin/services");
      if (!res.ok) return;
      const data = await res.json();
      setServices(data.services ?? []);
    }
    void loadServices();
  }, []);

  function toggleService(id: string) {
    const next = serviceIds.includes(id)
      ? serviceIds.filter((s) => s !== id)
      : [...serviceIds, id];
    setValue("serviceIds", next, { shouldValidate: true, shouldDirty: true });
  }

  async function onSubmit(data: PackageFormData) {
    setError("");
    const payload = {
      ...data,
      photos,
      category: data.category || undefined,
    };

    const url = isEdit ? `/api/admin/packages/${pkg!.id}` : "/api/admin/packages";
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

    router.push("/admin/paquetes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-5">
        <h2 className="text-lg text-meru-charcoal">Datos del paquete</h2>
        <p className="text-sm text-meru-muted">
          Combiná 2, 3 o más excursiones existentes a un precio único. El cliente indica un rango
          de fechas; ustedes arman el itinerario y descuentan cupos a mano. El sistema no toca el
          stock de las excursiones.
        </p>
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
            label="Precio del paquete (ARS)"
            type="number"
            error={errors.price?.message}
            {...register("price", { valueAsNumber: true })}
          />
          {price > 0 ? (
            <p className="self-end pb-2 text-sm text-meru-muted">
              Vista previa: {formatCurrencyARS(price)}
              {promoEnabled && promoPercent > 0 ? (
                <>
                  {" "}
                  → promo{" "}
                  <span className="font-medium text-meru-primary">
                    {formatCurrencyARS(
                      Math.max(0, Math.round(price * (1 - promoPercent / 100)))
                    )}
                  </span>{" "}
                  (−{Math.round(promoPercent)}%)
                </>
              ) : null}
            </p>
          ) : null}
          <div>
            <Input
              label="Límite de ventas del paquete (opcional)"
              type="number"
              min={0}
              {...register("stock", { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-meru-muted">
              Dejá <strong>0</strong> si no querés poner un máximo. Si ponés un número (ej. 10),
              solo se podrán confirmar esa cantidad de reservas de este paquete. El cupo de cada
              excursión lo manejás aparte al armar el itinerario.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-meru-border bg-meru-ice/40 p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm text-meru-charcoal">
            <input type="checkbox" className="rounded" {...register("promotion.enabled")} />
            Activar promo (descuento %)
          </label>
          {promoEnabled ? (
            <Input
              label="Porcentaje de descuento"
              type="number"
              min={1}
              max={100}
              error={errors.promotion?.percent?.message}
              {...register("promotion.percent", { valueAsNumber: true })}
            />
          ) : null}
          <p className="text-xs text-meru-muted">
            En el catálogo se muestra “Promo” y el %; el precio tachado es el habitual y el
            destacado es el promocional.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-meru-charcoal">
          <input type="checkbox" className="rounded" {...register("active")} />
          Publicado (visible en /paquetes)
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

      <section className="rounded-xl border border-meru-border bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg text-meru-charcoal">Excursiones incluidas</h2>
            <p className="mt-1 text-sm text-meru-muted">
              Elegí de las ya creadas. Si falta alguna, creala primero en Excursiones.
            </p>
          </div>
          <a
            href="/admin/excursiones/nueva"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-meru-secondary hover:underline"
          >
            + Nueva excursión
          </a>
        </div>
        {errors.serviceIds?.message ? (
          <p className="text-sm text-red-600">{errors.serviceIds.message}</p>
        ) : null}
        {services.length === 0 ? (
          <p className="rounded-lg border border-dashed border-meru-border p-4 text-sm text-meru-muted">
            Todavía no hay excursiones. Creá al menos una en{" "}
            <a href="/admin/excursiones/nueva" className="text-meru-secondary hover:underline">
              Excursiones
            </a>{" "}
            y volvé a armar el paquete.
          </p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {services.map((service) => (
              <li key={service.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-meru-border px-3 py-2 hover:bg-meru-ice/50">
                  <input
                    type="checkbox"
                    checked={serviceIds.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                  />
                  <span className="text-sm text-meru-charcoal">
                    {service.title}
                    {!service.active ? (
                      <span className="ml-2 text-xs text-meru-muted">(inactiva)</span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {serviceIds.length > 0 ? (
          <p className="text-xs text-meru-muted">
            {serviceIds.length} excursión{serviceIds.length === 1 ? "" : "es"} seleccionada
            {serviceIds.length === 1 ? "" : "s"}.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-meru-border bg-white p-6">
        <PhotoGalleryUpload
          folder="excursions"
          photos={photos}
          onChange={(urls) => setValue("photos", urls, { shouldDirty: true })}
          label="Fotos del paquete"
          hint="La primera foto es la portada. Usá ↑ ↓ para cambiar el orden."
        />
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" isLoading={isSubmitting}>
        {isEdit ? "Guardar paquete" : "Crear paquete"}
      </Button>
    </form>
  );
}
