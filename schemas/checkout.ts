import { z } from "zod";

export const checkoutItemSchema = z.object({
  kind: z.enum(["service", "package"]).default("service"),
  serviceId: z.string().min(1),
  packageId: z.string().min(1).optional(),
  quantity: z.number().int().positive().max(20),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(15),
  paymentMethod: z.enum(["coordinar", "getnet"]).default("coordinar"),
});

export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
