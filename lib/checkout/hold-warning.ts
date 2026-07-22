import type { SiteSettings } from "@/types/site-settings";

export const DEFAULT_HOLD_WARNING =
  "Importante: al confirmar, el cupo queda reservado por {horas}. Si el pago no se confirma a tiempo, la reserva se cancela y el lugar vuelve a estar disponible.";

export function formatHoldHoursLabel(hours: number): string {
  const rounded = Math.max(0, Math.round(hours * 10) / 10);
  if (rounded === 1) return "1 hora";
  if (rounded % 24 === 0) {
    const days = rounded / 24;
    return days === 1 ? "1 día" : `${days} días`;
  }
  if (Number.isInteger(rounded)) return `${rounded} horas`;
  return `${rounded} horas`;
}

export function maxHoldHoursAfterBooking(
  booking: SiteSettings["booking"] | undefined
): number {
  const normal = Number(booking?.orderHoldHours);
  if (Number.isFinite(normal) && normal >= 24) {
    return Math.min(Math.floor(normal), 336);
  }
  return 48;
}

/** Horas antes de la salida en que debe caer una reserva sin pago. */
export function hoursBeforeDeparture(
  booking: SiteSettings["booking"] | undefined
): number {
  const raw = Number(
    booking?.hoursBeforeDeparture ?? booking?.shortHoldHours ?? 2
  );
  if (Number.isFinite(raw) && raw >= 1) {
    return Math.min(Math.floor(raw), 72);
  }
  return 2;
}

export function computeHoldExpiresAtDate(
  booking: SiteSettings["booking"] | undefined,
  from: Date = new Date(),
  departureAt?: Date | null
): Date {
  const maxHold = new Date(
    from.getTime() + maxHoldHoursAfterBooking(booking) * 60 * 60 * 1000
  );

  if (!departureAt || Number.isNaN(departureAt.getTime())) {
    return maxHold;
  }

  const cutoff = new Date(
    departureAt.getTime() - hoursBeforeDeparture(booking) * 60 * 60 * 1000
  );

  return new Date(Math.min(maxHold.getTime(), cutoff.getTime()));
}

/** Horas efectivas de reserva (para mensajes), redondeadas. */
export function resolveActiveHoldHours(
  booking: SiteSettings["booking"] | undefined,
  departureAt?: Date | null,
  from: Date = new Date()
): number {
  const expires = computeHoldExpiresAtDate(booking, from, departureAt);
  return Math.max(0, (expires.getTime() - from.getTime()) / (1000 * 60 * 60));
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

/** true si ya no se puede reservar ese turno (el cutoff de pago ya pasó o es inmediato). */
export function isDeparturePastPaymentCutoff(
  booking: SiteSettings["booking"] | undefined,
  departureAt: Date,
  from: Date = new Date()
): boolean {
  const expires = computeHoldExpiresAtDate(booking, from, departureAt);
  return expires.getTime() <= from.getTime() + 60 * 1000; // 1 min de margen
}
