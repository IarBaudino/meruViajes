import { z } from "zod";

export const packageSchema = z.object({
  title: z.string().min(3),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug en minúsculas y guiones"),
  description: z.string().min(20),
  price: z.number().positive(),
  photos: z.array(z.string().url()),
  serviceIds: z.array(z.string().min(1)).min(1, "Elegí al menos una excursión"),
  stock: z.number().int().nonnegative(),
  active: z.boolean(),
  category: z.string().optional(),
});

export type PackageFormData = z.infer<typeof packageSchema>;
