import type { DepartureSlot } from "@/types";

export type { DepartureSlot };

export function newDepartureId(): string {
  return `dep-${Math.random().toString(36).slice(2, 10)}`;
}

export function slotRemaining(slot: Pick<DepartureSlot, "capacity" | "booked">): number {
  return Math.max(0, Number(slot.capacity) - Number(slot.booked || 0));
}

/** Interpreta fecha+hora en zona local del navegador/servidor. */
export function parseDepartureDateTime(slot: Pick<DepartureSlot, "date" | "time">): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(slot.date.trim());
  const t = /^(\d{1,2}):(\d{2})$/.exec(slot.time.trim());
  if (!m || !t) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const hh = Number(t[1]);
  const mm = Number(t[2]);
  if (hh > 23 || mm > 59) return null;
  const dt = new Date(y, mo, d, hh, mm, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function formatDepartureLabel(slot: Pick<DepartureSlot, "date" | "time">): string {
  const dt = parseDepartureDateTime(slot);
  if (!dt) return `${slot.date} ${slot.time}`;
  const date = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(dt);
  return `${date} · ${slot.time}`;
}

export function hoursUntilDeparture(
  slot: Pick<DepartureSlot, "date" | "time">,
  now: Date = new Date()
): number | null {
  const dt = parseDepartureDateTime(slot);
  if (!dt) return null;
  return (dt.getTime() - now.getTime()) / (1000 * 60 * 60);
}

export function getBookableDepartures(
  departures: DepartureSlot[] | undefined,
  now: Date = new Date()
): DepartureSlot[] {
  if (!departures?.length) return [];
  return departures
    .filter((d) => d.active !== false)
    .filter((d) => slotRemaining(d) > 0)
    .filter((d) => {
      const dt = parseDepartureDateTime(d);
      return dt !== null && dt.getTime() > now.getTime();
    })
    .sort((a, b) => {
      const da = parseDepartureDateTime(a)?.getTime() ?? 0;
      const db = parseDepartureDateTime(b)?.getTime() ?? 0;
      return da - db;
    });
}

export function serviceUsesDepartures(departures: DepartureSlot[] | undefined): boolean {
  return (departures?.length ?? 0) > 0;
}

type GenerateInput = {
  fromDate: string;
  toDate: string;
  time: string;
  capacity: number;
  /** 0=domingo … 6=sábado */
  weekdays: number[];
};

export function generateDepartureSlots(input: GenerateInput): DepartureSlot[] {
  const from = parseDay(input.fromDate);
  const to = parseDay(input.toDate);
  if (!from || !to || to < from) return [];
  if (!input.time || !(input.capacity > 0) || input.weekdays.length === 0) return [];

  const weekdaySet = new Set(input.weekdays);
  const slots: DepartureSlot[] = [];
  const cursor = new Date(from);

  while (cursor <= to) {
    if (weekdaySet.has(cursor.getDay())) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      slots.push({
        id: newDepartureId(),
        date: `${y}-${m}-${d}`,
        time: input.time,
        capacity: Math.floor(input.capacity),
        booked: 0,
        active: true,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return slots;
}

function parseDay(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
}
