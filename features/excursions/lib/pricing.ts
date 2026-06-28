import type { PassengerCategory, ServiceDiscounts } from "@/types/discounts";

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

export function getPriceForCategory(
  basePrice: number,
  discounts: ServiceDiscounts | undefined,
  category: PassengerCategory
): number {
  if (category === "adult") return basePrice;
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
  if (!discounts) return [];

  const lines: DiscountLine[] = [];
  const entries: { category: Exclude<PassengerCategory, "adult">; label: string; percent?: number }[] =
    [
      { category: "minor", label: "Menores", percent: discounts.minorPercent },
      { category: "infant", label: "Infantes", percent: discounts.infantPercent },
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

  return lines;
}
