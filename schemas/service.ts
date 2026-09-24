import { z } from "zod";
import { CATALOG_SEASONS } from "@/lib/seasons";

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
    percent: z.preprocess(
      (v) => (typeof v === "number" && Number.isNaN(v) ? 0 : v),
      z.number()
    ),
    startsAt: z.string(),
    endsAt: z.string(),
    appliesToDiscountIds: z.array(z.string()),
  })
  .superRefine((promo, ctx) => {
    if (!promo.enabled) return;
    const percent = Number(promo.percent);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indicá un % de descuento entre 1 y 100",
        path: ["percent"],
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

export const departureSlotSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  capacity: z.number().int().positive(),
  booked: z.number().int().nonnegative(),
  active: z.boolean(),
});

export const serviceSeasonVariantSchema = z.object({
  enabled: z.boolean(),
  title: z.string(),
  description: z.string(),
  price: z.preprocess(
    (v) => (typeof v === "number" && Number.isNaN(v) ? 0 : v),
    z.number()
  ),
  duration: z.string().optional().default(""),
  difficulty: z.string().optional().default(""),
  photos: z.array(z.string().url()),
  meetingPoint: z.string().optional().default(""),
  requirements: z.string().optional().default(""),
  cancellationPolicy: z.string().optional().default(""),
  additionalEquipment: z.string().optional().default(""),
  notIncluded: z.string().optional().default(""),
  discountOptions: z.array(discountOptionSchema).default([]),
  promotion: servicePromotionSchema.optional().nullable(),
  stock: z.preprocess(
    (v) => (typeof v === "number" && Number.isNaN(v) ? 0 : v),
    z.number().int().nonnegative()
  ),
  departures: z.array(departureSlotSchema).default([]),
});

export const serviceSchema = z
  .object({
    slug: z
      .string()
      .min(3)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug en minúsculas y guiones"),
    location: z.string().optional(),
    category: z.string().optional(),
    seasonalVariants: z.object({
      verano: serviceSeasonVariantSchema,
      invierno: serviceSeasonVariantSchema,
    }),
    featuredOnHome: z.boolean().default(false),
    homeOrder: z.number().int().min(0).max(999).default(100),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const enabledSeasons = CATALOG_SEASONS.filter(
      (season) => data.seasonalVariants[season].enabled
    );

    if (enabledSeasons.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Habilitá al menos una temporada (verano o invierno)",
        path: ["seasonalVariants"],
      });
      return;
    }

    for (const season of enabledSeasons) {
      const variant = data.seasonalVariants[season];
      const base = `seasonalVariants.${season}` as const;

      if (variant.title.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Título muy corto",
          path: [base, "title"],
        });
      }
      if (variant.description.trim().length < 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La descripción debe tener al menos 20 caracteres",
          path: [base, "description"],
        });
      }
      if (!(variant.price > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indicá un precio adulto",
          path: [base, "price"],
        });
      }
      if (variant.photos.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Agregá al menos una foto",
          path: [base, "photos"],
        });
      }

      for (let i = 0; i < variant.discountOptions.length; i++) {
        const opt = variant.discountOptions[i];
        const label = opt.label.trim();
        const empty = !label && !(opt.percent > 0);
        if (empty) continue;
        if (label.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Nombre muy corto",
            path: [base, "discountOptions", i, "label"],
          });
        }
        if (!Number.isFinite(opt.percent) || opt.percent <= 0 || opt.percent > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Indicá un % entre 1 y 100",
            path: [base, "discountOptions", i, "percent"],
          });
        }
      }
    }
  });

export type ServiceFormData = z.infer<typeof serviceSchema>;
export type ServiceSeasonVariantFormData = z.infer<typeof serviceSeasonVariantSchema>;
export type DiscountOptionFormData = z.infer<typeof discountOptionSchema>;
