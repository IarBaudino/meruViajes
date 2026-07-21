/** Opción de descuento configurable (Menor, Jubilado, Estudiante, etc.). */
export interface DiscountOption {
  id: string;
  label: string;
  /** % sobre la tarifa adulta vigente (habitual o promo). */
  percent: number;
}

/** Promo temporal: cambia el precio adulto y qué descuentos aplican. */
export interface ServicePromotion {
  enabled: boolean;
  /** Precio adulto promocional. */
  price: number;
  /** Fecha inicio (YYYY-MM-DD). */
  startsAt: string;
  /** Fecha fin inclusive (YYYY-MM-DD). */
  endsAt: string;
  /** IDs de DiscountOption que aplican durante la promo. */
  appliesToDiscountIds: string[];
}

/** @deprecated Preferir discountOptions. Se migra al leer de Firestore. */
export interface ServiceDiscounts {
  minorPercent?: number;
  infantPercent?: number;
  seniorPercent?: number;
}

export type PassengerCategory = "adult" | "minor" | "infant" | "senior";

export const PASSENGER_CATEGORY_LABELS: Record<PassengerCategory, string> = {
  adult: "Adulto",
  minor: "Menor",
  infant: "Infante",
  senior: "Jubilado",
};

export function legacyDiscountsToOptions(
  discounts?: ServiceDiscounts
): DiscountOption[] {
  if (!discounts) return [];
  const options: DiscountOption[] = [];
  if ((discounts.minorPercent ?? 0) > 0) {
    options.push({
      id: "minor",
      label: "Menor",
      percent: discounts.minorPercent!,
    });
  }
  if ((discounts.seniorPercent ?? 0) > 0) {
    options.push({
      id: "senior",
      label: "Jubilado",
      percent: discounts.seniorPercent!,
    });
  }
  return options;
}
