import { z } from "zod";

export const passengersSchema = z.object({
  adult: z.number().int().min(0).max(20),
  minor: z.number().int().min(0).max(20),
  infant: z.number().int().min(0).max(20),
  senior: z.number().int().min(0).max(20),
});

export const checkoutItemSchema = z
  .object({
    kind: z.enum(["service", "package"]).default("service"),
    serviceId: z.string().min(1),
    packageId: z.string().min(1).optional(),
    quantity: z.number().int().positive().max(40),
    passengers: passengersSchema.optional(),
  })
  .superRefine((item, ctx) => {
    if ((item.kind ?? "service") !== "service") return;
    if (!item.passengers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indicá adultos, menores, infantes y/o jubilados",
        path: ["passengers"],
      });
      return;
    }
    const seats =
      item.passengers.adult +
      item.passengers.minor +
      item.passengers.infant +
      item.passengers.senior;
    if (seats < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seleccioná al menos un pasajero",
        path: ["passengers"],
      });
    }
    if (seats !== item.quantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La cantidad no coincide con el desglose de pasajeros",
        path: ["quantity"],
      });
    }
  });

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(15),
  paymentMethod: z.enum(["coordinar", "getnet"]).default("coordinar"),
});

export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type PassengersInput = z.infer<typeof passengersSchema>;
