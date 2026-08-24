import type { DiscountOption, Service, ServicePromotion } from "@/types";

export type CartDiscountSeat = {
  optionId: string;
  label: string;
  percent: number;
  quantity: number;
};

export type CartPassengers = {
  adult: number;
  infant: number;
  discounted: CartDiscountSeat[];
};

export const EMPTY_PASSENGERS: CartPassengers = {
  adult: 0,
  infant: 0,
  discounted: [],
};

/** Parsea YYYY-MM-DD como inicio/fin del día en hora local. */
function parseDayBound(isoDate: string, endOfDay: boolean): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (endOfDay) return new Date(y, mo, d, 23, 59, 59, 999);
  return new Date(y, mo, d, 0, 0, 0, 0);
}

export function isPromotionActive(
  promo: ServicePromotion | null | undefined,
  now: Date = new Date()
): boolean {
  if (!promo?.enabled) return false;
  const percent = Number(promo.percent);
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) return false;
  if (!promo.startsAt || !promo.endsAt) return false;
  const start = parseDayBound(promo.startsAt, false);
  const end = parseDayBound(promo.endsAt, true);
  if (!start || !end) return false;
  return now >= start && now <= end;
}

export function getServiceDiscountPercent(
  service: Pick<Service, "promotion">,
  now: Date = new Date()
): number {
  if (!isPromotionActive(service.promotion, now)) return 0;
  return Math.round(Number(service.promotion!.percent));
}

export function getEffectiveAdultPrice(
  service: Pick<Service, "price" | "promotion">,
  now: Date = new Date()
): number {
  const base = Number(service.price) || 0;
  const percent = getServiceDiscountPercent(service, now);
  if (percent <= 0) return base;
  return Math.max(0, Math.round(base * (1 - percent / 100)));
}

/** Descuentos que se pueden elegir ahora (todos, o solo los de la promo activa). */
export function getApplicableDiscountOptions(
  service: Pick<Service, "discountOptions" | "promotion">,
  now: Date = new Date()
): DiscountOption[] {
  const options = service.discountOptions ?? [];
  const promo = service.promotion;
  if (!isPromotionActive(promo, now)) return options;
  const allowed = new Set(promo!.appliesToDiscountIds ?? []);
  return options.filter((o) => allowed.has(o.id));
}

export function applyDiscountPercent(basePrice: number, percent?: number): number {
  if (percent == null || percent <= 0) return basePrice;
  return Math.round(basePrice * (1 - percent / 100));
}

export function hasAnyDiscount(
  service: Pick<Service, "discountOptions" | "promotion" | "discounts">
): boolean {
  if ((service.discountOptions?.length ?? 0) > 0) return true;
  if (isPromotionActive(service.promotion)) return true;
  const d = service.discounts;
  if (!d) return false;
  return (d.minorPercent ?? 0) > 0 || (d.seniorPercent ?? 0) > 0;
}

export function hasActivePromotion(
  service: Pick<Service, "promotion">,
  now: Date = new Date()
): boolean {
  return isPromotionActive(service.promotion, now);
}

export function totalPassengers(passengers: CartPassengers): number {
  return (
    passengers.adult +
    passengers.infant +
    passengers.discounted.reduce((sum, line) => sum + line.quantity, 0)
  );
}

export function mergePassengers(a: CartPassengers, b: CartPassengers): CartPassengers {
  const byId = new Map<string, CartDiscountSeat>();
  for (const line of [...a.discounted, ...b.discounted]) {
    const prev = byId.get(line.optionId);
    if (prev) {
      byId.set(line.optionId, {
        ...prev,
        quantity: prev.quantity + line.quantity,
        percent: line.percent,
        label: line.label,
      });
    } else {
      byId.set(line.optionId, { ...line });
    }
  }
  return {
    adult: a.adult + b.adult,
    infant: a.infant + b.infant,
    discounted: Array.from(byId.values()),
  };
}

/**
 * Total de línea usando el precio adulto vigente y las opciones aplicables del servicio
 * (fuente de verdad en checkout; ignora % enviados por el cliente).
 */
export function computePassengersLineTotalFromService(
  service: Pick<Service, "price" | "promotion" | "discountOptions">,
  passengers: CartPassengers,
  now: Date = new Date()
): number {
  const adultPrice = getEffectiveAdultPrice(service, now);
  const applicable = new Map(
    getApplicableDiscountOptions(service, now).map((o) => [o.id, o])
  );

  let total = passengers.adult * adultPrice;
  // Infantes siempre gratis
  for (const line of passengers.discounted) {
    if (line.quantity <= 0) continue;
    const opt = applicable.get(line.optionId);
    if (!opt) {
      total += line.quantity * adultPrice;
    } else {
      total += line.quantity * applyDiscountPercent(adultPrice, opt.percent);
    }
  }
  return total;
}

/** Total de línea con precio adulto ya resuelto y % de cada asiento descontado. */
export function computePassengersLineTotal(
  adultPrice: number,
  passengers: CartPassengers
): number {
  let total = passengers.adult * adultPrice;
  for (const line of passengers.discounted) {
    if (line.quantity <= 0) continue;
    total += line.quantity * applyDiscountPercent(adultPrice, line.percent);
  }
  return total;
}

export function formatPassengersSummary(passengers: CartPassengers): string {
  const parts: string[] = [];
  if (passengers.adult > 0) {
    parts.push(
      passengers.adult === 1 ? "1 adulto" : `${passengers.adult} adultos`
    );
  }
  for (const line of passengers.discounted) {
    if (line.quantity <= 0) continue;
    const label = line.label.toLowerCase();
    parts.push(
      line.quantity === 1 ? `1 ${label}` : `${line.quantity} ${label}`
    );
  }
  if (passengers.infant > 0) {
    parts.push(
      passengers.infant === 1 ? "1 infante" : `${passengers.infant} infantes`
    );
  }
  return parts.join(" · ");
}

/** Normaliza pasajeros legacy (minor/senior) o incompletos. */
export function normalizeCartPassengers(raw: unknown): CartPassengers | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;

  if (Array.isArray(p.discounted)) {
    return {
      adult: Math.max(0, Number(p.adult) || 0),
      infant: Math.max(0, Number(p.infant) || 0),
      discounted: p.discounted
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const o = item as Record<string, unknown>;
          const optionId = typeof o.optionId === "string" ? o.optionId : "";
          const label = typeof o.label === "string" ? o.label : "Descuento";
          const percent = Number(o.percent) || 0;
          const quantity = Math.max(0, Number(o.quantity) || 0);
          if (!optionId || quantity <= 0) return null;
          return { optionId, label, percent, quantity };
        })
        .filter((x): x is CartDiscountSeat => x !== null),
    };
  }

  // Legacy: adult/minor/infant/senior
  const discounted: CartDiscountSeat[] = [];
  const minor = Math.max(0, Number(p.minor) || 0);
  const senior = Math.max(0, Number(p.senior) || 0);
  if (minor > 0) {
    discounted.push({
      optionId: "minor",
      label: "Menor",
      percent: 0,
      quantity: minor,
    });
  }
  if (senior > 0) {
    discounted.push({
      optionId: "senior",
      label: "Jubilado",
      percent: 0,
      quantity: senior,
    });
  }

  return {
    adult: Math.max(0, Number(p.adult) || 0),
    infant: Math.max(0, Number(p.infant) || 0),
    discounted,
  };
}
