import { z } from "zod";

export const checkoutItemSchema = z.object({
  serviceId: z.string().min(1),
  quantity: z.number().int().positive().max(20),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(15),
});

export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
