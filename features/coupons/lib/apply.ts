import type { CouponAppliesTo } from "@/schemas/coupon";
import type { AppliedCoupon, Coupon } from "@/types/coupon";

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function computeCouponDiscount(subtotal: number, coupon: Coupon) {
  if (!(subtotal > 0) || !(coupon.discountValue > 0)) return 0;
  if (coupon.discountType === "percent") {
    const percent = Math.min(100, coupon.discountValue);
    return Math.min(subtotal, Math.round((subtotal * percent) / 100));
  }
  return Math.min(subtotal, Math.round(coupon.discountValue));
}

export function computeCouponCommission(subtotal: number, coupon: Coupon) {
  const percent = Math.min(100, Math.max(0, coupon.commissionPercent || 0));
  if (!(subtotal > 0) || percent <= 0) return 0;
  return Math.round((subtotal * percent) / 100);
}

export function couponAvailabilityError(coupon: Coupon): string | null {
  if (!coupon.active) return "Este cupón no está activo.";
  const today = todayYmd();
  if (coupon.startsAt && today < coupon.startsAt) return "Este cupón todavía no está vigente.";
  if (coupon.endsAt && today > coupon.endsAt) return "Este cupón ya venció.";
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return "Este cupón ya alcanzó el máximo de usos.";
  }
  return null;
}

export function couponAppliesToCart(coupon: Coupon, kinds: CouponAppliesTo[]) {
  if (kinds.length === 0) return false;
  return kinds.every((kind) => coupon.appliesTo.includes(kind));
}

export function applyCouponToSubtotal(
  coupon: Coupon,
  subtotal: number,
  kinds: CouponAppliesTo[]
): { ok: true; applied: AppliedCoupon } | { ok: false; error: string } {
  const availability = couponAvailabilityError(coupon);
  if (availability) return { ok: false, error: availability };
  if (!couponAppliesToCart(coupon, kinds)) {
    return { ok: false, error: "Este cupón no aplica a los productos de esta reserva." };
  }
  if (!(subtotal > 0)) {
    return { ok: false, error: "No hay un total al que aplicar el cupón." };
  }

  const discountAmount = computeCouponDiscount(subtotal, coupon);
  return {
    ok: true,
    applied: {
      id: coupon.id,
      code: coupon.code,
      sellerName: coupon.sellerName,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      commissionPercent: coupon.commissionPercent,
      commissionAmount: computeCouponCommission(subtotal, coupon),
      subtotal,
    },
  };
}
