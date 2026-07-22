"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"] as const;

function parseYmd(ymd: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) };
}

function toYmd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function monthLabel(y: number, m: number): string {
  const label = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatSelectedDate(ymd: string): string {
  const p = parseYmd(ymd);
  if (!p) return ymd;
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(p.y, p.m, p.d));
}

export type ScheduleTimeOption = {
  id: string;
  time: string;
  disabled?: boolean;
};

type Props = {
  availableDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  timeOptions: ScheduleTimeOption[];
  selectedTimeId: string;
  onSelectTime: (id: string) => void;
};

export function DepartureSchedulePicker({
  availableDates,
  selectedDate,
  onSelectDate,
  timeOptions,
  selectedTimeId,
  onSelectTime,
}: Props) {
  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);
  const sortedDates = useMemo(() => [...availableDates].sort(), [availableDates]);

  const initial = parseYmd(selectedDate || sortedDates[0] || "") ?? {
    y: new Date().getFullYear(),
    m: new Date().getMonth(),
    d: 1,
  };
  const [viewY, setViewY] = useState(initial.y);
  const [viewM, setViewM] = useState(initial.m);

  useEffect(() => {
    const p = parseYmd(selectedDate || sortedDates[0] || "");
    if (!p) return;
    setViewY(p.y);
    setViewM(p.m);
  }, [selectedDate, sortedDates]);

  const minMonth = useMemo(() => {
    const p = parseYmd(sortedDates[0] ?? "");
    return p ? p.y * 12 + p.m : null;
  }, [sortedDates]);
  const maxMonth = useMemo(() => {
    const p = parseYmd(sortedDates[sortedDates.length - 1] ?? "");
    return p ? p.y * 12 + p.m : null;
  }, [sortedDates]);

  const viewKey = viewY * 12 + viewM;
  const canPrev = minMonth == null || viewKey > minMonth;
  const canNext = maxMonth == null || viewKey < maxMonth;

  const cells = useMemo(() => {
    const first = new Date(viewY, viewM, 1);
    const startPad = (first.getDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
    const items: Array<{
      key: string;
      day: number | null;
      ymd: string | null;
      available: boolean;
      selected: boolean;
    }> = [];

    for (let i = 0; i < startPad; i++) {
      items.push({ key: `pad-${i}`, day: null, ymd: null, available: false, selected: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const ymd = toYmd(viewY, viewM, day);
      items.push({
        key: ymd,
        day,
        ymd,
        available: availableSet.has(ymd),
        selected: selectedDate === ymd,
      });
    }
    while (items.length % 7 !== 0) {
      items.push({
        key: `trail-${items.length}`,
        day: null,
        ymd: null,
        available: false,
        selected: false,
      });
    }
    return items;
  }, [viewY, viewM, availableSet, selectedDate]);

  function shiftMonth(delta: number) {
    const next = new Date(viewY, viewM + delta, 1);
    setViewY(next.getFullYear());
    setViewM(next.getMonth());
  }

  if (sortedDates.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-meru-charcoal">Elegí la fecha</p>
        <div className="rounded-xl border border-meru-border bg-white p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-meru-border text-meru-charcoal disabled:opacity-30"
              aria-label="Mes anterior"
              disabled={!canPrev}
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <p className="text-sm font-semibold text-meru-charcoal">{monthLabel(viewY, viewM)}</p>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-meru-border text-meru-charcoal disabled:opacity-30"
              aria-label="Mes siguiente"
              disabled={!canNext}
              onClick={() => shiftMonth(1)}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-meru-muted">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              if (cell.day == null || !cell.ymd) {
                return <span key={cell.key} className="h-9" aria-hidden />;
              }
              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={!cell.available}
                  aria-pressed={cell.selected}
                  aria-label={
                    cell.available
                      ? `Disponible ${cell.ymd}`
                      : `Sin salidas el ${cell.ymd}`
                  }
                  onClick={() => onSelectDate(cell.ymd!)}
                  className={cn(
                    "h-9 rounded-lg text-sm tabular-nums transition-colors",
                    cell.selected
                      ? "bg-meru-primary font-semibold text-white"
                      : cell.available
                        ? "bg-meru-ice/70 font-medium text-meru-charcoal hover:bg-meru-ice"
                        : "cursor-not-allowed text-meru-border"
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-meru-muted">
            Solo se pueden elegir los días marcados (con al menos un horario con lugar).
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-meru-charcoal">
          Horarios disponibles
          {selectedDate ? (
            <span className="font-normal text-meru-muted">
              {" "}
              · {formatSelectedDate(selectedDate)}
            </span>
          ) : null}
        </p>
        {timeOptions.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            No hay horarios con lugar para esa fecha.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {timeOptions.map((opt) => {
              const selected = selectedTimeId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={opt.disabled}
                  aria-pressed={selected}
                  onClick={() => onSelectTime(opt.id)}
                  className={cn(
                    "min-w-[4.5rem] rounded-lg border px-3 py-2.5 text-sm font-semibold tabular-nums transition-colors",
                    selected
                      ? "border-meru-primary bg-meru-primary text-white"
                      : "border-meru-border bg-white text-meru-charcoal hover:border-meru-primary/40 hover:bg-meru-ice/50",
                    opt.disabled && "cursor-not-allowed opacity-40"
                  )}
                >
                  {opt.time}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
