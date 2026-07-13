import { z } from "zod";

export const serviceCategorySchema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug en minúsculas y guiones"),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0),
  visible: z.boolean(),
});

export type ServiceCategoryFormData = z.infer<typeof serviceCategorySchema>;
