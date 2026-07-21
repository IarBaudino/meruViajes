import { z } from "zod";

export const discountPercentSchema = z
  .number()
  .min(0, "El descuento no puede ser negativo")
  .max(100, "El descuento no puede superar 100%");

export const discountOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  percent: z.preprocess(
    (v) => (typeof v === "number" && Number.isNaN(v) ? 0 : v),
    z.number()
  ),
});

export const servicePromotionSchema = z
  .object({
    enabled: z.boolean(),
    price: z.preprocess(
      (v) => (typeof v === "number" && Number.isNaN(v) ? 0 : v),
      z.number()
    ),
    startsAt: z.string(),
    endsAt: z.string(),
    appliesToDiscountIds: z.array(z.string()),
  })
  .superRefine((promo, ctx) => {
    if (!promo.enabled) return;
    if (!(promo.price > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indicá el precio promocional",
        path: ["price"],
      });
    }
    if (!promo.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fecha de inicio",
        path: ["startsAt"],
      });
    }
    if (!promo.endsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fecha de fin",
        path: ["endsAt"],
      });
    }
    if (promo.startsAt && promo.endsAt && promo.endsAt < promo.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin debe ser posterior o igual al inicio",
        path: ["endsAt"],
      });
    }
  });

export const serviceSchema = z
  .object({
    title: z.string().min(3),
    slug: z
      .string()
      .min(3)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug en minúsculas y guiones"),
    description: z.string().min(20),
    price: z.number().positive(),
    duration: z.string().optional(),
    difficulty: z.string().optional(),
    location: z.string().optional(),
    photos: z.array(z.string().url()),
    seasonalPhotos: z
      .array(
        z.object({
          season: z.enum(["verano", "invierno", "primavera", "otono"]),
          url: z.string().url(),
          label: z.string().optional(),
        })
      )
      .optional(),
    category: z.string().optional(),
    meetingPoint: z.string().optional(),
    requirements: z.string().optional(),
    cancellationPolicy: z.string().optional(),
    additionalEquipment: z.string().optional(),
    notIncluded: z.string().optional(),
    discountOptions: z.array(discountOptionSchema).default([]),
    promotion: servicePromotionSchema.optional().nullable(),
    stock: z.number().int().nonnegative(),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    for (let i = 0; i < data.discountOptions.length; i++) {
      const opt = data.discountOptions[i];
      const label = opt.label.trim();
      const empty = !label && !(opt.percent > 0);
      if (empty) continue;
      if (label.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nombre muy corto",
          path: ["discountOptions", i, "label"],
        });
      }
      if (!Number.isFinite(opt.percent) || opt.percent <= 0 || opt.percent > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indicá un % entre 1 y 100",
          path: ["discountOptions", i, "percent"],
        });
      }
    }
  });

export type ServiceFormData = z.infer<typeof serviceSchema>;
export type DiscountOptionFormData = z.infer<typeof discountOptionSchema>;
