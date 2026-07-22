"use client";

import { useMemo, useState } from "react";
import type { Control, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { ServiceFormData } from "@/schemas/service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  formatDepartureLabel,
  generateDepartureSlots,
  newDepartureId,
  slotRemaining,
} from "@/features/excursions/lib/departures";

const WEEKDAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

type Props = {
  control: Control<ServiceFormData>;
  register: UseFormRegister<ServiceFormData>;
  watch: UseFormWatch<ServiceFormData>;
  setValue: UseFormSetValue<ServiceFormData>;
};

export function ServiceDeparturesFields({ control, register, watch, setValue }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "departures",
  });

  const departures = watch("departures") ?? [];

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [genTime, setGenTime] = useState("09:00");
  const [genCapacity, setGenCapacity] = useState(12);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [genError, setGenError] = useState("");

  const sortedPreview = useMemo(() => {
    return [...departures].sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    );
  }, [departures]);

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function generate() {
    setGenError("");
    const generated = generateDepartureSlots({
      fromDate,
      toDate,
      time: genTime,
      capacity: genCapacity,
      weekdays,
    });
    if (generated.length === 0) {
      setGenError("No se generaron turnos. Revisá fechas, días y cupos.");
      return;
    }

    const existingKeys = new Set(
      departures.map((d) => `${d.date}|${d.time}`)
    );
    const toAdd = generated.filter((d) => !existingKeys.has(`${d.date}|${d.time}`));
    if (toAdd.length === 0) {
      setGenError("Esos turnos ya estaban cargados.");
      return;
    }
    setValue("departures", [...departures, ...toAdd], { shouldDirty: true });
  }

  return (
    <section className="rounded-xl border border-meru-border bg-white p-6 space-y-5">
      <div>
        <h2 className="text-lg text-meru-charcoal">Salidas (fecha y hora)</h2>
        <p className="mt-1 text-sm text-meru-muted">
          Obligatorio para vender online: sin turnos no se puede reservar (así no hay sobreventa).
          El cliente elige fecha y hora, y el cupo se descuenta solo de ese turno.
        </p>
      </div>

      <div className="rounded-lg border border-meru-border bg-meru-sand/40 p-4 space-y-4">
        <p className="text-sm font-medium text-meru-charcoal">Generar varios turnos</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Desde"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <Input
            label="Hasta"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <Input
            label="Hora"
            type="time"
            value={genTime}
            onChange={(e) => setGenTime(e.target.value)}
          />
          <Input
            label="Cupos por turno"
            type="number"
            min={1}
            value={genCapacity}
            onChange={(e) => setGenCapacity(Number(e.target.value))}
          />
        </div>
        <div>
          <p className="mb-2 text-xs text-meru-muted">Días de la semana</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const on = weekdays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    on
                      ? "border-meru-primary bg-meru-ice text-meru-primary"
                      : "border-meru-border text-meru-muted"
                  }`}
                  onClick={() => toggleWeekday(day.value)}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
        <Button type="button" variant="outline" onClick={generate}>
          Generar turnos
        </Button>
        {genError ? <p className="text-sm text-red-600">{genError}</p> : null}
      </div>

      <div className="space-y-3">
        {fields.length === 0 ? (
          <p className="text-sm text-meru-muted">Todavía no hay turnos cargados.</p>
        ) : (
          fields.map((field, index) => {
            const current = departures[index];
            const remaining = current
              ? slotRemaining(current)
              : 0;
            return (
              <div
                key={field.id}
                className="grid gap-3 rounded-lg border border-meru-border p-3 sm:grid-cols-[1fr_1fr_100px_100px_auto] sm:items-end"
              >
                <input type="hidden" {...register(`departures.${index}.id`)} />
                <input type="hidden" {...register(`departures.${index}.booked`, { valueAsNumber: true })} />
                <Input
                  label="Fecha"
                  type="date"
                  {...register(`departures.${index}.date`)}
                />
                <Input
                  label="Hora"
                  type="time"
                  {...register(`departures.${index}.time`)}
                />
                <Input
                  label="Cupos"
                  type="number"
                  min={1}
                  {...register(`departures.${index}.capacity`, { valueAsNumber: true })}
                />
                <div className="pb-2 text-xs text-meru-muted">
                  Libres: {remaining}
                  {current ? (
                    <span className="block">{formatDepartureLabel(current)}</span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 pb-1">
                  <label className="flex items-center gap-2 text-xs text-meru-charcoal">
                    <input
                      type="checkbox"
                      className="rounded"
                      {...register(`departures.${index}.active`)}
                    />
                    Activo
                  </label>
                  <Button type="button" variant="outline" size="sm" onClick={() => remove(index)}>
                    Quitar
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            id: newDepartureId(),
            date: "",
            time: "09:00",
            capacity: 12,
            booked: 0,
            active: true,
          })
        }
      >
        Agregar un turno
      </Button>

      {sortedPreview.length > 0 ? (
        <p className="text-xs text-meru-muted">
          {sortedPreview.length} turno{sortedPreview.length === 1 ? "" : "s"} cargado
          {sortedPreview.length === 1 ? "" : "s"}.
        </p>
      ) : null}
    </section>
  );
}
