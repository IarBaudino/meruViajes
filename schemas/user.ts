import { z } from "zod";
import { orderBillingSchema } from "@/schemas/billing";

const billingWithoutIdentity = orderBillingSchema.omit({
  fullName: true,
  email: true,
});

/** Perfil de cuenta + datos de facturación (nombre/email de la cuenta se usan en billing). */
export const profileSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email(),
}).and(billingWithoutIdentity);

export type ProfileFormData = z.infer<typeof profileSchema>;
