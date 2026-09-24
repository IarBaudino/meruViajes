"use client";

import { useMemo, useState } from "react";
import type { Control, FieldPath, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
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

const PAGE_SIZE = 12;

type Props = {
  control: Control<ServiceFormData>;
  register: UseFormRegister<ServiceFormData>;
  watch: UseFormWatch<ServiceFormData>;
  setValue: UseFormSetValue<ServiceFormData>;
  departuresPath: FieldPath<ServiceFormData>;
};

export function ServiceDeparturesFields({
  control,
  register,
  watch,
  setValue,
  departuresPath,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: departuresPath as "seasonalVariants.verano.departures",
  });

  const departures = (watch(departuresPath) ?? []) as ServiceFormData["seasonalVariants"]["verano"]["departures"];

  function depPath(index: number, field: "id" | "booked" | "date" | "time" | "capacity" | "active") {
    return `${departuresPath}.${index}.${field}` as FieldPath<ServiceFormData>;
  }

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [genTime, setGenTime] = useState("09:00");
  const [genCapacity, setGenCapacity] = useState(12);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [genError, setGenError] = useState("");
  const [genOk, setGenOk] = useState("");
  const [filter, setFilter] = useState<"upcoming" | "all" | "past">("upcoming");
  const [page, setPage] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const indexed = useMemo(
    () =>
      departures.map((d, index) => ({
        ...d,
        index,
        sortKey: `${d.date || ""}|${d.time || ""}`,
      })),
    [departures]
  );

  const filtered = useMemo(() => {
    const list = [...indexed].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    if (filter === "all") return list;
    if (filter === "past") return list.filter((d) => d.date && d.date < today);
    return list.filter((d) => !d.date || d.date >= today);
  }, [indexed, filter, today]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function generate() {
    setGenError("");
    setGenOk("");
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

    const existingKeys = new Set(departures.map((d) => `${d.date}|${d.time}`));
    const toAdd = generated.filter((d) => !existingKeys.has(`${d.date}|${d.time}`));
    if (toAdd.length === 0) {
      setGenError("Esos turnos ya estaban cargados.");
      return;
    }
    setValue(departuresPath, [...departures, ...toAdd], { shouldDirty: true });
    setFilter("upcoming");
    setPage(0);
    setGenOk(`Se agregaron ${toAdd.length} turno${toAdd.length === 1 ? "" : "s"}.`);
  }

  return (
    <section className="rounded-xl border border-brand-border bg-white p-6 space-y-5">
      <div>
        <h2 className="text-lg text-brand-charcoal">Salidas (fecha y hora)</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Obligatorio para vender online. Generá por rango (semana/mes) y revisá solo los próximos
          turnos.
        </p>
      </div>

      <div className="rounded-lg border border-brand-border bg-brand-sand/40 p-4 space-y-4">
        <p className="text-sm font-medium text-brand-charcoal">Generar varios turnos</p>
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
          <p className="mb-2 text-xs text-brand-muted">Días de la semana</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const on = weekdays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    on
                      ? "border-brand-primary bg-brand-ice text-brand-primary"
                      : "border-brand-border text-brand-muted"
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
        {genOk ? <p className="text-sm text-green-700">{genOk}</p> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["upcoming", "Próximos"],
              ["all", "Todos"],
              ["past", "Pasados"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                filter === key
                  ? "border-brand-primary bg-brand-ice text-brand-primary"
                  : "border-brand-border text-brand-muted"
              }`}
              onClick={() => {
                setFilter(key);
                setPage(0);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-brand-muted">
          {filtered.length} en esta vista · {departures.length} en total
        </p>
      </div>

      {/* Campos RHF ocultos para que no se pierdan al paginar */}
      <div className="hidden">
        {fields.map((field, index) => (
          <div key={field.id}>
            <input type="hidden" {...register(depPath(index, "id"))} />
            <input
              type="hidden"
              {...register(depPath(index, "booked"), { valueAsNumber: true })}
            />
            <input type="hidden" {...register(depPath(index, "date"))} />
            <input type="hidden" {...register(depPath(index, "time"))} />
            <input
              type="hidden"
              {...register(depPath(index, "capacity"), { valueAsNumber: true })}
            />
            <input type="hidden" {...register(depPath(index, "active"))} />
          </div>
        ))}
      </div>

      {pageItems.length === 0 ? (
        <p className="text-sm text-brand-muted">No hay turnos en esta vista.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-brand-border">
          <table className="min-w-full text-sm">
            <thead className="bg-brand-sand/50 text-left text-brand-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Salida</th>
                <th className="px-3 py-2 font-medium">Cupos</th>
                <th className="px-3 py-2 font-medium">Libres</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => {
                const remaining = slotRemaining(item);
                const isEditing = editingIndex === item.index;
                return (
                  <tr key={fields[item.index]?.id ?? item.index} className="border-t border-brand-border/70">
                    <td className="px-3 py-2 text-brand-charcoal">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="date"
                            className="rounded border border-brand-border px-2 py-1"
                            value={item.date}
                            onChange={(e) =>
                              setValue(depPath(item.index, "date"), e.target.value, {
                                shouldDirty: true,
                              })
                            }
                          />
                          <input
                            type="time"
                            className="rounded border border-brand-border px-2 py-1"
                            value={item.time}
                            onChange={(e) =>
                              setValue(depPath(item.index, "time"), e.target.value, {
                                shouldDirty: true,
                              })
                            }
                          />
                        </div>
                      ) : item.date && item.time ? (
                        formatDepartureLabel(item)
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min={1}
                          className="w-20 rounded border border-brand-border px-2 py-1"
                          value={item.capacity}
                          onChange={(e) =>
                            setValue(depPath(item.index, "capacity"), Number(e.target.value), {
                              shouldDirty: true,
                            })
                          }
                        />
                      ) : (
                        item.capacity
                      )}
                    </td>
                    <td className="px-3 py-2 text-brand-muted">{remaining}</td>
                    <td className="px-3 py-2">
                      <label className="inline-flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={item.active !== false}
                          onChange={(e) =>
                            setValue(depPath(item.index, "active"), e.target.checked, {
                              shouldDirty: true,
                            })
                          }
                        />
                        Activo
                      </label>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="text-brand-secondary hover:underline"
                          onClick={() =>
                            setEditingIndex(isEditing ? null : item.index)
                          }
                        >
                          {isEditing ? "Listo" : "Editar"}
                        </button>
                        <button
                          type="button"
                          className="text-red-700 hover:underline"
                          onClick={() => {
                            remove(item.index);
                            setEditingIndex(null);
                          }}
                        >
                          Quitar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-brand-muted">
            Página {safePage + 1} de {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          append({
            id: newDepartureId(),
            date: "",
            time: "09:00",
            capacity: 12,
            booked: 0,
            active: true,
          });
          setFilter("all");
          setEditingIndex(departures.length);
        }}
      >
        Agregar un turno
      </Button>
    </section>
  );
}
