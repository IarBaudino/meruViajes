import type { PassengerCategory, ServiceDiscounts } from "@/types/discounts";

export type CartPassengers = {
  adult: number;
  minor: number;
  infant: number;
  senior: number;
};

export const EMPTY_PASSENGERS: CartPassengers = {
  adult: 0,
  minor: 0,
  infant: 0,
  senior: 0,
};

export function applyDiscountPercent(basePrice: number, percent?: number): number {
  if (percent == null || percent <= 0) return basePrice;
  return Math.round(basePrice * (1 - percent / 100));
}

export function getDiscountPercent(
  discounts: ServiceDiscounts | undefined,
  category: Exclude<PassengerCategory, "adult">
): number | undefined {
  if (!discounts) return undefined;
  switch (category) {
    case "minor":
      return discounts.minorPercent;
    case "infant":
      return discounts.infantPercent;
    case "senior":
      return discounts.seniorPercent;
  }
}

/** Infantes no pagan. Menores/jubilados usan % si está configurado; si no, tarifa adulto. */
export function getPriceForCategory(
  basePrice: number,
  discounts: ServiceDiscounts | undefined,
  category: PassengerCategory
): number {
  if (category === "adult") return basePrice;
  if (category === "infant") return 0;
  const percent = getDiscountPercent(discounts, category);
  return applyDiscountPercent(basePrice, percent);
}

export function hasAnyDiscount(discounts?: ServiceDiscounts): boolean {
  if (!discounts) return false;
  return (
    (discounts.minorPercent ?? 0) > 0 ||
    (discounts.infantPercent ?? 0) > 0 ||
    (discounts.seniorPercent ?? 0) > 0
  );
}

export type DiscountLine = {
  category: Exclude<PassengerCategory, "adult">;
  label: string;
  percent: number;
  price: number;
};

export function getDiscountLines(
  basePrice: number,
  discounts?: ServiceDiscounts
): DiscountLine[] {
  const lines: DiscountLine[] = [
    {
      category: "infant",
      label: "Infantes",
      percent: 100,
      price: 0,
    },
  ];

  if (discounts) {
    const entries: {
      category: Exclude<PassengerCategory, "adult" | "infant">;
      label: string;
      percent?: number;
    }[] = [
      { category: "minor", label: "Menores", percent: discounts.minorPercent },
      { category: "senior", label: "Jubilados", percent: discounts.seniorPercent },
    ];

    for (const { category, label, percent } of entries) {
      if (percent != null && percent > 0) {
        lines.push({
          category,
          label,
          percent,
          price: applyDiscountPercent(basePrice, percent),
        });
      }
    }
  }

  return lines;
}

export function totalPassengers(passengers: CartPassengers): number {
  return (
    passengers.adult + passengers.minor + passengers.infant + passengers.senior
  );
}

export function mergePassengers(a: CartPassengers, b: CartPassengers): CartPassengers {
  return {
    adult: a.adult + b.adult,
    minor: a.minor + b.minor,
    infant: a.infant + b.infant,
    senior: a.senior + b.senior,
  };
}

export function computePassengersLineTotal(
  basePrice: number,
  discounts: ServiceDiscounts | undefined,
  passengers: CartPassengers
): number {
  return (
    passengers.adult * getPriceForCategory(basePrice, discounts, "adult") +
    passengers.minor * getPriceForCategory(basePrice, discounts, "minor") +
    passengers.infant * getPriceForCategory(basePrice, discounts, "infant") +
    passengers.senior * getPriceForCategory(basePrice, discounts, "senior")
  );
}

export function formatPassengersSummary(passengers: CartPassengers): string {
  const parts: string[] = [];
  if (passengers.adult > 0) {
    parts.push(
      passengers.adult === 1 ? "1 adulto" : `${passengers.adult} adultos`
    );
  }
  if (passengers.minor > 0) {
    parts.push(
      passengers.minor === 1 ? "1 menor" : `${passengers.minor} menores`
    );
  }
  if (passengers.infant > 0) {
    parts.push(
      passengers.infant === 1 ? "1 infante" : `${passengers.infant} infantes`
    );
  }
  if (passengers.senior > 0) {
    parts.push(
      passengers.senior === 1 ? "1 jubilado" : `${passengers.senior} jubilados`
    );
  }
  return parts.join(" · ");
}
