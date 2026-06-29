import { z } from "zod";

const valueBlockSchema = z.object({
  title: z.string().min(2),
  text: z.string().min(10),
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
    backgroundImageUrl: z.string().url().optional().or(z.literal("")),
  }),
  excursionsPreview: z.object({
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
  }),
});

export type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;
