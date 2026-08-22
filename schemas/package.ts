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
  featuredOnHome: z.boolean().default(false),
  homeOrder: z.number().int().min(0).max(999).default(100),
  category: z.string().optional(),
  seasons: z
    .array(z.enum(["verano", "invierno", "todo-el-ano"]))
    .min(1, "Elegí al menos una temporada")
    .default(["todo-el-ano"]),
  promotion: z
    .object({
      enabled: z.boolean(),
      percent: z.preprocess(
        (v) => (typeof v === "number" && Number.isNaN(v) ? 0 : v),
        z.number().min(0).max(100)
      ),
    })
    .superRefine((promo, ctx) => {
      if (!promo.enabled) return;
      if (!(promo.percent > 0 && promo.percent <= 100)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indicá un % entre 1 y 100",
          path: ["percent"],
        });
      }
    })
    .optional(),
});

export type PackageFormData = z.infer<typeof packageSchema>;
