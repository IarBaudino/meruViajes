import { z } from "zod";

export const discountedSeatSchema = z.object({
  optionId: z.string().min(1),
  label: z.string().min(1),
  percent: z.number().min(0).max(100),
  quantity: z.number().int().min(0).max(20),
});

export const passengersSchema = z.object({
  adult: z.number().int().min(0).max(20),
  infant: z.number().int().min(0).max(20),
  discounted: z.array(discountedSeatSchema).max(20).default([]),
});

const ymdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const checkoutItemSchema = z
  .object({
    kind: z.enum(["service", "package"]).default("service"),
    serviceId: z.string().min(1),
    packageId: z.string().min(1).optional(),
    quantity: z.number().int().positive().max(40),
    passengers: passengersSchema.optional(),
    departureId: z.string().min(1).optional(),
    departureDate: z.string().optional(),
    departureTime: z.string().optional(),
    catalogSeason: z.enum(["verano", "invierno"]).optional(),
    stayFrom: ymdSchema.optional(),
    stayTo: ymdSchema.optional(),
  })
  .superRefine((item, ctx) => {
    const kind = item.kind ?? "service";

    if (kind === "package") {
      if (!item.stayFrom || !item.stayTo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indicá el rango de fechas de tu estadía",
          path: ["stayFrom"],
        });
        return;
      }
      if (item.stayTo < item.stayFrom) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La fecha hasta no puede ser anterior a la fecha desde",
          path: ["stayTo"],
        });
      }
      return;
    }

    if (!item.departureDate || !item.departureTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Elegí fecha y hora de la salida",
        path: ["departureDate"],
      });
    }

    if (!item.passengers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indicá el desglose de pasajeros",
        path: ["passengers"],
      });
      return;
    }
    if (!item.departureId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Elegí fecha y hora de la salida",
        path: ["departureId"],
      });
    }
    const seats =
      item.passengers.adult +
      item.passengers.infant +
      item.passengers.discounted.reduce((sum, line) => sum + line.quantity, 0);
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
