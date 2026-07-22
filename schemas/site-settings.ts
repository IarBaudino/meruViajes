import { z } from "zod";

const valueBlockSchema = z.object({
  title: z.string().min(2),
  text: z.string().min(10),
});

const heroMediaSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().url(),
});

export const siteSettingsSchema = z.object({
  hero: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(5),
    subtitle: z.string().min(2),
    ctaPrimaryLabel: z.string().min(2),
    ctaPrimaryHref: z.string().min(1),
    ctaSecondaryLabel: z.string().min(2),
    ctaSecondaryHref: z.string().min(1),
    backgroundImages: z.array(z.string().url()).max(15).default([]),
    backgroundMedia: z.array(heroMediaSchema).max(15).default([]),
  }),
  excursionsPreview: z.object({
    title: z.string().min(3),
    description: z.string().min(10),
  }),
  packagesPreview: z.object({
    title: z.string().min(3),
    description: z.string().min(10),
  }),
  about: z.object({
    title: z.string().min(3),
    quote: z.string().min(5),
    values: z.array(valueBlockSchema).min(1).max(6),
    closingText: z.string().min(20),
  }),
  inquiry: z.object({
    title: z.string().min(5),
    subtitle: z.string().min(5),
  }),
  footer: z.object({
    brandName: z.string().min(3),
    tagline: z.string().min(10),
    address: z.string().min(5),
    email: z.string().email(),
    phoneLabel: z.string().min(3),
    phoneNumber: z.union([
      z.literal(""),
      z.string().regex(/^\d{8,15}$/, "Solo dígitos, 8 a 15 caracteres"),
    ]),
  }),
  googleReviews: z.object({
    enabled: z.boolean(),
    placeId: z.string(),
    title: z.string().min(3),
  }),
  booking: z.object({
    orderHoldHours: z
      .number()
      .int("Usá horas enteras")
      .min(24, "Mínimo 24 horas (1 día)")
      .max(336, "Máximo 14 días (336 horas)"),
    hoursBeforeDeparture: z
      .number()
      .int()
      .min(1, "Mínimo 1 hora")
      .max(72, "Máximo 72 horas antes de la salida"),
    holdWarningMessage: z.string().max(600),
  }),
});

export type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;
