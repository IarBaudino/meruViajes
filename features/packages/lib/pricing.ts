import type { ExcursionPackage, PackagePromotion } from "@/types/catalog";

export function isPackagePromotionActive(
  promotion: PackagePromotion | null | undefined
): boolean {
  if (!promotion?.enabled) return false;
  const percent = Number(promotion.percent);
  return Number.isFinite(percent) && percent > 0 && percent <= 100;
}

export function hasActivePackagePromotion(
  pkg: Pick<ExcursionPackage, "promotion">
): boolean {
  return isPackagePromotionActive(pkg.promotion);
}

export function getPackageDiscountPercent(
  pkg: Pick<ExcursionPackage, "promotion">
): number {
  if (!isPackagePromotionActive(pkg.promotion)) return 0;
  return Math.round(Number(pkg.promotion!.percent));
}

/** Precio por persona con promo aplicada (redondeado a entero ARS). */
export function getEffectivePackagePrice(
  pkg: Pick<ExcursionPackage, "price" | "promotion">
): number {
  const base = Number(pkg.price) || 0;
  const percent = getPackageDiscountPercent(pkg);
  if (percent <= 0) return base;
  return Math.max(0, Math.round(base * (1 - percent / 100)));
}
