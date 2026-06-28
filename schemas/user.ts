import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email(),
  dni: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
