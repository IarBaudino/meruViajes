"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { groupTripSchema, type GroupTripFormData } from "@/schemas/group-trip";
import type { GroupTrip } from "@/types/catalog";
import { slugify } from "@/lib/utils/slugify";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PhotoGalleryUpload } from "@/features/admin/components/inline-media-upload";
import { StringListEditor } from "@/features/admin/components/string-list-editor";
import {
  emptyDay,
  GroupTripItineraryFields,
} from "@/features/admin/components/group-trip-itinerary-fields";
import { formatCurrencyARS } from "@/lib/format";
import { defaultDurationLabel } from "@/features/group-trips/lib/dates";

type Props = {
  trip?: GroupTrip;
};

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyLodging() {
  return { id: newId(), name: "", place: "", includes: "" };
}

function toDefaults(trip?: GroupTrip): GroupTripFormData {
  return {
    title: trip?.title ?? "",
    subtitle: trip?.subtitle ?? "",
    slug: trip?.slug ?? "",
    destination: trip?.destination ?? "",
    description: trip?.description ?? "",
    photos: trip?.photos ?? [],
    startDate: trip?.startDate ?? "",
    endDate: trip?.endDate ?? "",
    durationLabel: trip?.durationLabel ?? "",
    checkInTime: trip?.checkInTime ?? "",
    checkOutTime: trip?.checkOutTime ?? "",
    lodgings: trip?.lodgings?.length
      ? trip.lodgings.map((item) => ({
          id: item.id,
          name: item.name,
          place: item.place ?? "",
          includes: item.includes ?? "",
        }))
      : trip?.lodgingName
        ? [{ id: newId(), name: trip.lodgingName, place: "", includes: trip.lodgingNotes ?? "" }]
        : [emptyLodging()],
    included: trip?.included?.length ? trip.included : [""],
    notIncluded: trip?.notIncluded?.length ? trip.notIncluded : [""],
    itineraryDays: trip?.itineraryDays?.length
      ? trip.itineraryDays.map((day) => ({
          id: day.id,
          dayNumber: day.dayNumber,
          date: day.date ?? "",
          title: day.title,
          blocks: day.blocks.map((block) => ({
            id: block.id,
            title: block.title,
            description: block.description,
            optional: block.optional,
            photo: block.photo ?? "",
            whatYouNeed: block.whatYouNeed ?? "",
          })),
        }))
      : [emptyDay(1)],
    packingList: trip?.packingList?.length ? trip.packingList : [""],
    price: trip?.price ?? 0,
    presalePrice: trip?.presalePrice ?? 0,
    presaleUntil: trip?.presaleUntil ?? "",
    depositAmount: trip?.depositAmount ?? 0,
    balanceDueDate: trip?.balanceDueDate ?? "",
    depositNonRefundable: trip?.depositNonRefundable ?? true,
    cancellationPolicy: trip?.cancellationPolicy ?? "",
    reservationPolicy: trip?.reservationPolicy ?? "",
    capacity: trip?.capacity ?? 12,
    stock: trip?.stock ?? trip?.capacity ?? 12,
    active: trip?.active ?? true,
    featuredOnHome: trip?.featuredOnHome ?? false,
    homeOrder: trip?.homeOrder ?? 100,
  };
}

export function GroupTripForm({ trip }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const isEdit = Boolean(trip?.id);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GroupTripFormData>({
    resolver: zodResolver(groupTripSchema) as Resolver<GroupTripFormData>,
    defaultValues: toDefaults(trip),
  });

  const { fields: lodgingFields, append: appendLodging, remove: removeLodging } = useFieldArray({
    control,
    name: "lodgings",
  });

  const title = watch("title");
  const photos = watch("photos") ?? [];
  const included = watch("included") ?? [];
  const notIncluded = watch("notIncluded") ?? [];
  const packingList = watch("packingList") ?? [];
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const price = watch("price") ?? 0;
  const presalePrice = watch("presalePrice") ?? 0;
  const depositAmount = watch("depositAmount") ?? 0;
  const capacity = watch("capacity");

  useEffect(() => {
    if (!isEdit && title) {
      setValue("slug", slugify(title));
    }
  }, [title, isEdit, setValue]);

  useEffect(() => {
    if (!isEdit && Number.isFinite(capacity) && capacity > 0) {
      setValue("stock", capacity, { shouldDirty: false });
    }
  }, [capacity, isEdit, setValue]);

  async function onSubmit(data: GroupTripFormData) {
    setError("");
    const payload: GroupTripFormData = {
      ...data,
      photos,
      included: data.included.map((s) => s.trim()).filter(Boolean),
      notIncluded: data.notIncluded.map((s) => s.trim()).filter(Boolean),
      packingList: data.packingList.map((s) => s.trim()).filter(Boolean),
      lodgings: data.lodgings
        .map((item) => ({
          ...item,
          name: item.name.trim(),
          place: item.place.trim(),
          includes: item.includes.trim(),
        }))
        .filter((item) => item.name),
      durationLabel: defaultDurationLabel(data.startDate, data.endDate),
      stock: isEdit ? data.stock : data.capacity,
    };

    const url = isEdit ? `/api/admin/group-trips/${trip!.id}` : "/api/admin/group-trips";
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

    router.push("/admin/viajes-grupales");
    router.refresh();
  }

  const suggestedDuration = defaultDurationLabel(startDate, endDate);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-5 rounded-xl border border-brand-border bg-white p-6">
        <h2 className="text-lg text-brand-charcoal">Portada</h2>
        <p className="text-sm text-brand-muted">
          Un viaje grupal es una edición cerrada: fechas fijas, relato e itinerario propios. No se
          arma eligiendo excursiones del catálogo.
        </p>
        <Input label="Título" error={errors.title?.message} {...register("title")} />
        <Input
          label="Subtítulo"
          placeholder="Ej. Especial Día de las Almas"
          error={errors.subtitle?.message}
          {...register("subtitle")}
        />
        <Input label="Slug (URL)" error={errors.slug?.message} {...register("slug")} />
        <Input
          label="Destino"
          placeholder="Ej. Tilcara / Quebrada de Humahuaca"
          error={errors.destination?.message}
          {...register("destination")}
        />
        <Textarea
          label="Relato de apertura"
          rows={7}
          error={errors.description?.message}
          {...register("description")}
        />
        <p className="-mt-3 text-xs text-brand-muted">
          Usá Enter para separar párrafos. Se respetan en la ficha pública.
        </p>
        <PhotoGalleryUpload
          folder="excursions"
          photos={photos}
          onChange={(next) => setValue("photos", next, { shouldDirty: true })}
          label="Galería"
          hint="La primera foto es la portada."
        />
        {errors.photos?.message ? (
          <p className="text-sm text-red-600">{errors.photos.message}</p>
        ) : null}
      </section>

      <section className="space-y-5 rounded-xl border border-brand-border bg-white p-6">
        <h2 className="text-lg text-brand-charcoal">Fecha del viaje</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Fecha de inicio"
            type="date"
            error={errors.startDate?.message}
            {...register("startDate")}
          />
          <Input
            label="Fecha de fin"
            type="date"
            error={errors.endDate?.message}
            {...register("endDate")}
          />
          <div className="sm:col-span-2 rounded-lg border border-brand-border bg-brand-ice/40 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-brand-muted">Duración</p>
            <p className="mt-1 text-brand-charcoal">
              {suggestedDuration || "Se calcula al cargar inicio y fin."}
            </p>
          </div>
          <Input label="Check-in" placeholder="14:00" {...register("checkInTime")} />
          <Input label="Check-out" placeholder="10:30" {...register("checkOutTime")} />
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-brand-border bg-white p-6">
        <div>
          <h2 className="text-lg text-brand-charcoal">Alojamiento</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Si el viaje pasa por varios lugares, agregá un alojamiento por cada uno.
          </p>
        </div>
        {lodgingFields.map((field, index) => (
          <article key={field.id} className="space-y-4 rounded-xl border border-brand-border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-brand-charcoal">Alojamiento {index + 1}</p>
              {lodgingFields.length > 1 ? (
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => removeLodging(index)}
                >
                  Quitar
                </button>
              ) : null}
            </div>
            <input type="hidden" {...register(`lodgings.${index}.id`)} />
            <Input
              label="Alojamiento"
              placeholder="Ej. CAPEC"
              error={errors.lodgings?.[index]?.name?.message}
              {...register(`lodgings.${index}.name`)}
            />
            <Input
              label="Lugar"
              placeholder="Ej. Tilcara"
              {...register(`lodgings.${index}.place`)}
            />
            <Textarea
              label="Qué incluye el alojamiento"
              placeholder="Ej. Habitación con baño privado y desayuno"
              rows={3}
              {...register(`lodgings.${index}.includes`)}
            />
          </article>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => appendLodging(emptyLodging())}>
          Agregar otro alojamiento
        </Button>
      </section>

      <section className="space-y-6 rounded-xl border border-brand-border bg-white p-6">
        <h2 className="text-lg text-brand-charcoal">Incluye y no incluye</h2>
        <StringListEditor
          label="Incluye"
          placeholder="Hospedaje, desayuno, guías locales…"
          values={included}
          onChange={(next) => setValue("included", next, { shouldDirty: true, shouldValidate: true })}
          error={errors.included?.message as string | undefined}
        />
        <StringListEditor
          label="No incluye"
          placeholder="Entradas, propinas…"
          values={notIncluded}
          onChange={(next) => setValue("notIncluded", next, { shouldDirty: true })}
        />
      </section>

      <GroupTripItineraryFields
        control={control}
        register={register}
        watch={watch}
        setValue={setValue}
      />

      <section className="space-y-5 rounded-xl border border-brand-border bg-white p-6">
        <h2 className="text-lg text-brand-charcoal">Qué llevar</h2>
        <StringListEditor
          label="Lista"
          placeholder="Calzado cómodo, campera…"
          values={packingList}
          onChange={(next) => setValue("packingList", next, { shouldDirty: true })}
        />
      </section>

      <section className="space-y-5 rounded-xl border border-brand-border bg-white p-6">
        <h2 className="text-lg text-brand-charcoal">Precios, seña y cupos</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Tarifa normal (ARS)"
            type="number"
            error={errors.price?.message}
            {...register("price", { valueAsNumber: true })}
          />
          {price > 0 ? (
            <p className="self-end pb-2 text-sm text-brand-muted">
              Vista previa: {formatCurrencyARS(price)}
            </p>
          ) : null}
          <Input
            label="Precio preventa (opcional)"
            type="number"
            error={errors.presalePrice?.message}
            {...register("presalePrice", { valueAsNumber: true })}
          />
          <Input label="Preventa hasta" type="date" {...register("presaleUntil")} />
          <Input
            label="Seña por persona (ARS)"
            type="number"
            error={errors.depositAmount?.message}
            {...register("depositAmount", { valueAsNumber: true })}
          />
          <Input
            label="Saldo hasta"
            type="date"
            {...register("balanceDueDate")}
          />
          <Input
            label="Cupo total"
            type="number"
            error={errors.capacity?.message}
            {...register("capacity", { valueAsNumber: true })}
          />
          {isEdit ? (
            <Input
              label="Lugares restantes"
              type="number"
              error={errors.stock?.message}
              {...register("stock", { valueAsNumber: true })}
            />
          ) : (
            <p className="self-end pb-2 text-sm text-brand-muted">
              Al crear, los lugares restantes coinciden con el cupo.
            </p>
          )}
        </div>
        {depositAmount > 0 && price > 0 ? (
          <p className="text-sm text-brand-muted">
            Al reservar se cobra {formatCurrencyARS(depositAmount)} de seña. El saldo queda en{" "}
            {formatCurrencyARS(Math.max(0, (presalePrice > 0 ? presalePrice : price) - depositAmount))}{" "}
            por persona.
          </p>
        ) : (
          <p className="text-sm text-brand-muted">
            Si la seña queda en 0, al reservar se cobra el precio vigente completo.
          </p>
        )}
        <label className="flex items-center gap-2 text-sm text-brand-charcoal">
          <input type="checkbox" className="rounded" {...register("depositNonRefundable")} />
          Seña no reembolsable
        </label>
        <Textarea
          label="Política de reserva"
          rows={4}
          {...register("reservationPolicy")}
        />
        <Textarea
          label="Política de cancelación"
          rows={4}
          {...register("cancellationPolicy")}
        />
        <label className="flex items-center gap-2 text-sm text-brand-charcoal">
          <input type="checkbox" className="rounded" {...register("active")} />
          Publicado (visible en /viajes-grupales)
        </label>
        <label className="flex items-center gap-2 text-sm text-brand-charcoal">
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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" isLoading={isSubmitting}>
        {isEdit ? "Guardar viaje grupal" : "Crear viaje grupal"}
      </Button>
    </form>
  );
}
