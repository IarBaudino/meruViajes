import type { DocumentData } from "firebase-admin/firestore";
import type { CouponAppliesTo } from "@/schemas/coupon";
import type { Coupon } from "@/types/coupon";

export const COUPONS_COLLECTION = "coupons";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapAppliesTo(value: unknown): CouponAppliesTo[] {
  if (!Array.isArray(value) || value.length === 0) {
    return ["excursion", "package", "groupTrip"];
  }
  const valid = value.filter(
    (item): item is CouponAppliesTo =>
      item === "excursion" || item === "package" || item === "groupTrip"
  );
  return valid.length > 0 ? valid : ["excursion", "package", "groupTrip"];
}

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export function mapFirestoreCoupon(id: string, data: DocumentData): Coupon {
  return {
    id,
    code: normalizeCouponCode(asString(data.code)),
    sellerName: asString(data.sellerName),
    note: asString(data.note),
    discountType: data.discountType === "fixed" ? "fixed" : "percent",
    discountValue: asNumber(data.discountValue),
    commissionPercent: Math.min(100, Math.max(0, asNumber(data.commissionPercent))),
    maxUses: Math.max(0, Math.round(asNumber(data.maxUses))),
    usedCount: Math.max(0, Math.round(asNumber(data.usedCount))),
    startsAt: asString(data.startsAt),
    endsAt: asString(data.endsAt),
    appliesTo: mapAppliesTo(data.appliesTo),
    active: data.active !== false,
  };
}

export function couponToFirestore(data: Omit<Coupon, "id" | "usedCount"> & { usedCount?: number }) {
  return {
    code: normalizeCouponCode(data.code),
    sellerName: data.sellerName.trim(),
    note: data.note?.trim() || "",
    discountType: data.discountType,
    discountValue: data.discountValue,
    commissionPercent: Math.min(100, Math.max(0, Number(data.commissionPercent) || 0)),
    maxUses: Math.max(0, Math.round(Number(data.maxUses) || 0)),
    usedCount: Math.max(0, Math.round(Number(data.usedCount) || 0)),
    startsAt: data.startsAt?.trim() || "",
    endsAt: data.endsAt?.trim() || "",
    appliesTo: data.appliesTo,
    active: data.active,
  };
}
