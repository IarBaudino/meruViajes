import { z } from "zod";

const optionalYmd = z.union([
  z.literal(""),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
]);

export const couponAppliesToSchema = z.enum(["excursion", "package", "groupTrip"]);

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Mínimo 3 caracteres")
      .max(24, "Máximo 24 caracteres")
      .regex(/^[A-Za-z0-9_-]+$/, "Solo letras, números, guión y guión bajo"),
    sellerName: z.string().trim().min(2, "Indicá la vendedora o el canal"),
    note: z.string().optional().default(""),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.preprocess(
      (v) => (typeof v === "number" && Number.isNaN(v) ? 0 : v),
      z.number().positive("Indicá el descuento")
    ),
    commissionPercent: z.preprocess(
      (v) => (typeof v === "number" && Number.isNaN(v) ? 0 : v),
      z.number().min(0).max(100)
    ),
    maxUses: z.preprocess(
      (v) => (typeof v === "number" && Number.isNaN(v) ? 0 : v),
      z.number().int().nonnegative()
    ),
    startsAt: optionalYmd.optional().default(""),
    endsAt: optionalYmd.optional().default(""),
    appliesTo: z.array(couponAppliesToSchema).min(1, "Elegí al menos un tipo de producto"),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === "percent" && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El % no puede superar 100",
        path: ["discountValue"],
      });
    }
    if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin no puede ser anterior al inicio",
        path: ["endsAt"],
      });
    }
  });

export type CouponFormData = z.infer<typeof couponSchema>;
export type CouponAppliesTo = z.infer<typeof couponAppliesToSchema>;
