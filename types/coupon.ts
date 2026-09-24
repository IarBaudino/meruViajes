import type { CouponAppliesTo } from "@/schemas/coupon";

export interface Coupon {
  id: string;
  code: string;
  sellerName: string;
  note?: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  commissionPercent: number;
  maxUses: number;
  usedCount: number;
  startsAt?: string;
  endsAt?: string;
  appliesTo: CouponAppliesTo[];
  active: boolean;
}

export interface AppliedCoupon {
  id: string;
  code: string;
  sellerName: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  subtotal: number;
}
