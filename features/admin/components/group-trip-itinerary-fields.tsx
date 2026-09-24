"use client";

import type { Control, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { GroupTripFormData } from "@/schemas/group-trip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SingleImageUpload } from "@/features/admin/components/inline-media-upload";
import { addDaysYmd, weekdayLabel } from "@/features/group-trips/lib/dates";

type Props = {
  control: Control<GroupTripFormData>;
  register: UseFormRegister<GroupTripFormData>;
  watch: UseFormWatch<GroupTripFormData>;
  setValue: UseFormSetValue<GroupTripFormData>;
};

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyBlock() {
  return {
    id: newId(),
    title: "",
    description: "",
    optional: false,
    photo: "",
    whatYouNeed: "",
  };
}

export function emptyDay(dayNumber: number, date = "") {
  return {
    id: newId(),
    dayNumber,
    date,
    title: "",
    blocks: [emptyBlock()],
  };
}

function DayBlocks({
  dayIndex,
  control,
  register,
  watch,
  setValue,
}: Props & { dayIndex: number }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `itineraryDays.${dayIndex}.blocks`,
  });

  return (
    <div className="space-y-4">
      {fields.map((field, blockIndex) => {
        const photo = watch(`itineraryDays.${dayIndex}.blocks.${blockIndex}.photo`) ?? "";
        return (
          <article
            key={field.id}
            className="space-y-3 rounded-lg border border-brand-border/80 bg-brand-ice/30 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-brand-charcoal">Actividad {blockIndex + 1}</p>
              {fields.length > 1 ? (
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => remove(blockIndex)}
                >
                  Quitar actividad
                </button>
              ) : null}
            </div>
            <Input
              label="Título"
              {...register(`itineraryDays.${dayIndex}.blocks.${blockIndex}.title`)}
            />
            <Textarea
              label="Relato"
              rows={5}
              {...register(`itineraryDays.${dayIndex}.blocks.${blockIndex}.description`)}
            />
            <label className="flex items-center gap-2 text-sm text-brand-charcoal">
              <input
                type="checkbox"
                className="rounded"
                {...register(`itineraryDays.${dayIndex}.blocks.${blockIndex}.optional`)}
              />
              Actividad opcional
            </label>
            <Textarea
              label="Qué necesitás (opcional)"
              rows={2}
              placeholder="Abrigo, coca, efectivo…"
              {...register(`itineraryDays.${dayIndex}.blocks.${blockIndex}.whatYouNeed`)}
            />
            <SingleImageUpload
              folder="excursions"
              value={photo}
              onChange={(url) =>
                setValue(`itineraryDays.${dayIndex}.blocks.${blockIndex}.photo`, url, {
                  shouldDirty: true,
                })
              }
              label="Foto de la actividad (opcional)"
            />
          </article>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={() => append(emptyBlock())}>
        Agregar actividad a este día
      </Button>
    </div>
  );
}

export function GroupTripItineraryFields(props: Props) {
  const { control, register, watch, setValue } = props;
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "itineraryDays",
  });
  const startDate = watch("startDate");

  function fillDatesFromStart() {
    if (!startDate) return;
    fields.forEach((_, index) => {
      setValue(`itineraryDays.${index}.date`, addDaysYmd(startDate, index), {
        shouldDirty: true,
      });
      setValue(`itineraryDays.${index}.dayNumber`, index + 1, { shouldDirty: true });
    });
  }

  return (
    <section className="space-y-5 rounded-xl border border-brand-border bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg text-brand-charcoal">Itinerario día por día</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Cada día puede tener varias actividades. No hace falta vincularlas a excursiones del
            catálogo.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={fillDatesFromStart}>
          Completar fechas desde el inicio
        </Button>
      </div>

      {fields.map((field, index) => {
        const date = watch(`itineraryDays.${index}.date`);
        const weekday = weekdayLabel(date);
        return (
          <article key={field.id} className="space-y-4 rounded-xl border border-brand-border p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base text-brand-charcoal">
                Día {index + 1}
                {weekday ? ` · ${weekday}` : ""}
              </h3>
              <div className="flex flex-wrap gap-2">
                {index > 0 ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => move(index, index - 1)}>
                    Subir
                  </Button>
                ) : null}
                {index < fields.length - 1 ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => move(index, index + 1)}>
                    Bajar
                  </Button>
                ) : null}
                {fields.length > 1 ? (
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => remove(index)}
                  >
                    Quitar día
                  </button>
                ) : null}
              </div>
            </div>
            <input type="hidden" {...register(`itineraryDays.${index}.id`)} />
            <input type="hidden" {...register(`itineraryDays.${index}.dayNumber`, { valueAsNumber: true })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Título del día" {...register(`itineraryDays.${index}.title`)} />
              <Input label="Fecha" type="date" {...register(`itineraryDays.${index}.date`)} />
            </div>
            <DayBlocks dayIndex={index} {...props} />
          </article>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append(
            emptyDay(
              fields.length + 1,
              startDate ? addDaysYmd(startDate, fields.length) : ""
            )
          )
        }
      >
        Agregar día
      </Button>
    </section>
  );
}
