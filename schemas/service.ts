import { z } from "zod";

export const serviceSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().min(20),
  price: z.number().positive(),
  duration: z.string().optional(),
  difficulty: z.string().optional(),
  location: z.string().optional(),
  photos: z.array(z.string().url()).default([]),
  category: z.string().optional(),
  meetingPoint: z.string().optional(),
  requirements: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  additionalEquipment: z.string().optional(),
  notIncluded: z.string().optional(),
  stock: z.number().int().nonnegative().default(0),
  active: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
