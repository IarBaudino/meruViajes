import type { SiteSettings } from "@/types/site-settings";

export const DEFAULT_HOLD_WARNING =
  "Importante: al confirmar, el cupo queda reservado por {horas} horas. Si el pago no se confirma en ese plazo, la reserva se cancela y el lugar vuelve a estar disponible.";

export function formatHoldHoursLabel(hours: number): string {
  if (hours === 1) return "1 hora";
  if (hours % 24 === 0) {
    const days = hours / 24;
    return days === 1 ? "1 día" : `${days} días`;
  }
  return `${hours} horas`;
}

function shortHoldHours(booking: SiteSettings["booking"] | undefined): number {
  const short = Number(booking?.shortHoldHours);
  if (Number.isFinite(short) && short >= 1) {
    return Math.min(Math.floor(short), 23);
  }
  return 2;
}

function normalHoldHours(booking: SiteSettings["booking"] | undefined): number {
  const normal = Number(booking?.orderHoldHours);
  if (Number.isFinite(normal) && normal >= 24) {
    return Math.min(Math.floor(normal), 336);
  }
  return 48;
}

/**
 * Plazo vigente.
 * - Si shortHoldEnabled: siempre plazo corto.
 * - Si hay salida y faltan ≤ shortHoldThresholdHours (default = plazo normal, mín. 24): plazo corto.
 * - Si no: plazo normal.
 */
export function resolveActiveHoldHours(
  booking: SiteSettings["booking"] | undefined,
  departureAt?: Date | null
): number {
  if (booking?.shortHoldEnabled) {
    return shortHoldHours(booking);
  }

  if (departureAt && !Number.isNaN(departureAt.getTime())) {
    const hoursUntil = (departureAt.getTime() - Date.now()) / (1000 * 60 * 60);
    const threshold = normalHoldHours(booking);
    if (hoursUntil > 0 && hoursUntil <= threshold) {
      return shortHoldHours(booking);
    }
  }

  return normalHoldHours(booking);
}

export function resolveHoldWarningMessage(
  booking: SiteSettings["booking"] | undefined,
  hours?: number,
  departureAt?: Date | null
): string {
  const activeHours = hours ?? resolveActiveHoldHours(booking, departureAt);
  const raw = booking?.holdWarningMessage?.trim();
  const template = raw || DEFAULT_HOLD_WARNING;
  return template
    .replaceAll("{horas}", formatHoldHoursLabel(activeHours))
    .replaceAll("{hours}", formatHoldHoursLabel(activeHours));
}
