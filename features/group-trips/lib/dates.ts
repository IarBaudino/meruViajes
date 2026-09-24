const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export function formatYmdEs(ymd?: string) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

export function addDaysYmd(ymd: string, days: number) {
  const dt = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return ymd;
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function nightsAndDays(startDate: string, endDate: string) {
  const a = new Date(`${startDate}T12:00:00`);
  const b = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) {
    return { nights: 0, days: 0 };
  }
  const nights = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  return { nights, days: nights + 1 };
}

export function defaultDurationLabel(startDate: string, endDate: string) {
  const { nights, days } = nightsAndDays(startDate, endDate);
  if (days < 1) return "";
  if (nights === 0) return "1 día";
  return `${nights} noche${nights === 1 ? "" : "s"} / ${days} días`;
}

export function weekdayLabel(ymd?: string) {
  if (!ymd) return "";
  const dt = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return "";
  const name = WEEKDAYS[dt.getDay()] ?? "";
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
}

export function formatGroupTripDates(startDate: string, endDate: string) {
  const from = formatYmdEs(startDate);
  const to = formatYmdEs(endDate);
  if (!from || !to) return "";
  return `${from} — ${to}`;
}
