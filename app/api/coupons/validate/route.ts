import { NextResponse } from "next/server";
import { z } from "zod";
import { findCouponByCode } from "@/features/coupons/lib/get-coupons";
import { applyCouponToSubtotal } from "@/features/coupons/lib/apply";
import { couponAppliesToSchema } from "@/schemas/coupon";

const bodySchema = z.object({
  code: z.string().trim().min(3),
  subtotal: z.number().positive(),
  kinds: z.array(couponAppliesToSchema).min(1),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const coupon = await findCouponByCode(parsed.data.code);
  if (!coupon) {
    return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
  }

  const result = applyCouponToSubtotal(coupon, parsed.data.subtotal, parsed.data.kinds);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ coupon: result.applied });
}
