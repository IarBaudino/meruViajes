import { z } from "zod";

export const inquirySchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre es demasiado largo"),
  email: z.string().email("Ingresá un correo electrónico válido"),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(2000, "El mensaje es demasiado largo"),
  /** Contexto opcional: desde ficha de excursión/paquete. */
  relatedKind: z.enum(["excursion", "package"]).optional(),
  relatedSlug: z.string().trim().max(160).optional(),
  relatedTitle: z.string().trim().max(200).optional(),
});

export type InquiryFormData = z.infer<typeof inquirySchema>;

/** Schema del formulario visible (sin campos de contexto). */
export const inquiryFormFieldsSchema = inquirySchema.pick({
  name: true,
  email: true,
  message: true,
});

export type InquiryFormFields = z.infer<typeof inquiryFormFieldsSchema>;
