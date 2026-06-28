import { z } from "zod";

export const discountPercentSchema = z
  .number()
  .min(0, "El descuento no puede ser negativo")
  .max(100, "El descuento no puede superar 100%");

export const serviceDiscountsSchema = z.object({
  minorPercent: discountPercentSchema.optional(),
  infantPercent: discountPercentSchema.optional(),
  seniorPercent: discountPercentSchema.optional(),
});

export type ServiceDiscountsFormData = z.infer<typeof serviceDiscountsSchema>;

export const serviceSchema = z.object({
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
  photos: z.array(z.string().url()).default([]),
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
  discounts: serviceDiscountsSchema.optional(),
  stock: z.number().int().nonnegative().default(0),
  active: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
