"use client";

import type { Control, FieldPath, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { CatalogSeason } from "@/types";
import type { ServiceFormData } from "@/schemas/service";
import { SEASON_LABELS } from "@/lib/seasons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatCurrencyARS } from "@/lib/format";
import { PhotoGalleryUpload } from "@/features/admin/components/inline-media-upload";
import { ServiceDeparturesFields } from "@/features/admin/components/service-departures-fields";

type Props = {
  season: CatalogSeason;
  control: Control<ServiceFormData>;
  register: UseFormRegister<ServiceFormData>;
  watch: UseFormWatch<ServiceFormData>;
  setValue: UseFormSetValue<ServiceFormData>;
  errors?: {
    title?: { message?: string };
    description?: { message?: string };
    price?: { message?: string };
    photos?: { message?: string };
    discountOptions?: Array<{ label?: { message?: string }; percent?: { message?: string } }>;
    promotion?: {
      percent?: { message?: string };
      startsAt?: { message?: string };
      endsAt?: { message?: string };
    };
  };
  newDiscountId: () => string;
};

export function ServiceSeasonVariantSection({
  season,
  control,
  register,
  watch,
  setValue,
  errors,
  newDiscountId,
}: Props) {
  const base = `seasonalVariants.${season}` as const;
  const departuresPath = `${base}.departures` as FieldPath<ServiceFormData>;
  const enabled = watch(`${base}.enabled`);
  const price = watch(`${base}.price`) ?? 0;
  const photos = watch(`${base}.photos`) ?? [];
  const promoEnabled = watch(`${base}.promotion.enabled`);
  const discountOptions = watch(`${base}.discountOptions`) ?? [];
  const appliesTo = watch(`${base}.promotion.appliesToDiscountIds`) ?? [];

  const { fields, append, remove } = useFieldArray({
    control,
    name: `${base}.discountOptions`,
  });

  function toggleAppliesTo(optionId: string, checked: boolean) {
    const next = checked
      ? Array.from(new Set([...appliesTo, optionId]))
      : appliesTo.filter((id) => id !== optionId);
    setValue(`${base}.promotion.appliesToDiscountIds`, next, { shouldDirty: true });
  }

  return (
    <section className="rounded-xl border border-meru-border bg-white p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg text-meru-charcoal">Temporada {SEASON_LABELS[season]}</h2>
          <p className="mt-1 text-sm text-meru-muted">
            Ficha completa para {SEASON_LABELS[season].toLowerCase()}: título, precio, salidas,
            descuentos y promo propios.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-meru-charcoal">
          <input type="checkbox" className="rounded" {...register(`${base}.enabled`)} />
          Habilitada
        </label>
      </div>

      {enabled ? (
        <>
          <Input
            label="Título"
            error={errors?.title?.message}
            {...register(`${base}.title`)}
          />
          <Textarea
            label="Descripción"
            rows={5}
            error={errors?.description?.message}
            {...register(`${base}.description`)}
          />
          <p className="-mt-3 text-xs text-meru-muted">
            Usá Enter para separar párrafos. Se respetan en la ficha pública.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Precio adulto habitual (ARS)"
              type="number"
              step="1"
              error={errors?.price?.message}
              {...register(`${base}.price`, { valueAsNumber: true })}
            />
            {price > 0 ? (
              <p className="self-end text-sm text-meru-muted pb-2">
                Vista previa: {formatCurrencyARS(price)}
              </p>
            ) : null}
            <Input label="Duración" placeholder="Ej. 4 horas" {...register(`${base}.duration`)} />
            <Input label="Dificultad" placeholder="Ej. Moderada" {...register(`${base}.difficulty`)} />
          </div>

          <ServiceDeparturesFields
            control={control}
            register={register}
            watch={watch}
            setValue={setValue}
            departuresPath={departuresPath}
          />

          <div className="space-y-5 border-t border-meru-border pt-5">
            <div>
              <h3 className="text-base text-meru-charcoal">Descuentos por tipo de pasajero</h3>
              <p className="mt-1 text-sm text-meru-muted">
                El % se aplica sobre la tarifa adulta vigente (habitual o promo). Los infantes son
                gratis.
              </p>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end"
                >
                  <input type="hidden" {...register(`${base}.discountOptions.${index}.id`)} />
                  <Input
                    label={index === 0 ? "Nombre" : undefined}
                    placeholder="Ej. Menor, Jubilado…"
                    error={errors?.discountOptions?.[index]?.label?.message}
                    {...register(`${base}.discountOptions.${index}.label`)}
                  />
                  <Input
                    label={index === 0 ? "% descuento" : undefined}
                    type="number"
                    min={1}
                    max={100}
                    error={errors?.discountOptions?.[index]?.percent?.message}
                    {...register(`${base}.discountOptions.${index}.percent`, {
                      valueAsNumber: true,
                    })}
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
                          `${base}.promotion.appliesToDiscountIds`,
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
              onClick={() => append({ id: newDiscountId(), label: "", percent: 10 })}
            >
              Agregar descuento
            </Button>
          </div>

          <div className="space-y-5 border-t border-meru-border pt-5">
            <div>
              <h3 className="text-base text-meru-charcoal">Promoción temporal</h3>
              <p className="mt-1 text-sm text-meru-muted">
                Descuento % sobre la tarifa adulto habitual entre dos fechas. Podés elegir qué
                descuentos por pasajero siguen aplicando durante la promo.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm text-meru-charcoal">
              <input type="checkbox" className="rounded" {...register(`${base}.promotion.enabled`)} />
              Activar promoción con fechas
            </label>

            {promoEnabled ? (
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-3">
                  <Input
                    label="Porcentaje de descuento"
                    type="number"
                    min={1}
                    max={100}
                    error={errors?.promotion?.percent?.message}
                    {...register(`${base}.promotion.percent`, { valueAsNumber: true })}
                  />
                  <Input
                    label="Desde"
                    type="date"
                    error={errors?.promotion?.startsAt?.message}
                    {...register(`${base}.promotion.startsAt`)}
                  />
                  <Input
                    label="Hasta (inclusive)"
                    type="date"
                    error={errors?.promotion?.endsAt?.message}
                    {...register(`${base}.promotion.endsAt`)}
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
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-5 border-t border-meru-border pt-5">
            <h3 className="text-base text-meru-charcoal">Detalle y logística</h3>
            <Input label="Punto de encuentro" {...register(`${base}.meetingPoint`)} />
            <Textarea label="Requisitos" rows={3} {...register(`${base}.requirements`)} />
            <Textarea
              label="Política de cancelación"
              rows={3}
              {...register(`${base}.cancellationPolicy`)}
            />
            <Textarea label="Equipo adicional" rows={2} {...register(`${base}.additionalEquipment`)} />
            <Textarea label="No incluye" rows={2} {...register(`${base}.notIncluded`)} />
          </div>

          <PhotoGalleryUpload
            folder="excursions"
            photos={photos}
            onChange={(next) => setValue(`${base}.photos`, next, { shouldDirty: true })}
            label={`Galería de fotos (${SEASON_LABELS[season]})`}
            hint="La primera foto es la portada. Se comprimen automáticamente."
          />
          {errors?.photos?.message ? (
            <p className="text-sm text-red-600">{errors.photos.message}</p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-meru-muted">
          Esta temporada está deshabilitada. No aparecerá en el catálogo ni se podrá reservar.
        </p>
      )}
    </section>
  );
}
