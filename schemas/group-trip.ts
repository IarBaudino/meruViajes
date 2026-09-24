import { z } from "zod";

const ymdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

const optionalYmd = z.union([z.literal(""), ymdSchema]);

export const groupTripBlockSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2, "Título muy corto"),
  description: z.string().min(10, "Describí la actividad"),
  optional: z.boolean().default(false),
  photo: z.string().optional().default(""),
  whatYouNeed: z.string().optional().default(""),
});

export const groupTripLodgingSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  place: z.string().optional().default(""),
  includes: z.string().optional().default(""),
});

export const groupTripDaySchema = z.object({
  id: z.string().min(1),
  dayNumber: z.number().int().positive(),
  date: optionalYmd.optional().default(""),
  title: z.string().min(2, "Poné un título al día"),
  blocks: z.array(groupTripBlockSchema).min(1, "Agregá al menos una actividad"),
});

export const groupTripSchema = z
  .object({
    title: z.string().min(3, "Título muy corto"),
    subtitle: z.string().optional().default(""),
    slug: z
      .string()
      .min(3)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug en minúsculas y guiones"),
    destination: z.string().min(2, "Indicá el destino"),
    description: z.string().min(20, "El relato debe tener al menos 20 caracteres"),
    photos: z.array(z.string().url()).min(1, "Agregá al menos una foto"),
    startDate: ymdSchema,
    endDate: ymdSchema,
    durationLabel: z.string().optional().default(""),
    checkInTime: z.string().optional().default(""),
    checkOutTime: z.string().optional().default(""),
    lodgings: z.array(groupTripLodgingSchema).default([]),
    included: z.array(z.string()).default([]),
    notIncluded: z.array(z.string()).default([]),
    itineraryDays: z.array(groupTripDaySchema).min(1, "Agregá al menos un día"),
    packingList: z.array(z.string()).default([]),
    price: z.number().positive("Indicá la tarifa"),
    presalePrice: z.preprocess(
      (v) => (typeof v === "number" && Number.isNaN(v) ? 0 : v),
      z.number().nonnegative().default(0)
    ),
    presaleUntil: optionalYmd.optional().default(""),
    depositAmount: z.preprocess(
      (v) => (typeof v === "number" && Number.isNaN(v) ? 0 : v),
      z.number().nonnegative().default(0)
    ),
    balanceDueDate: optionalYmd.optional().default(""),
    depositNonRefundable: z.boolean().default(true),
    cancellationPolicy: z.string().optional().default(""),
    reservationPolicy: z.string().optional().default(""),
    capacity: z.number().int().positive("Indicá los cupos del grupo"),
    stock: z.preprocess(
      (v) => (typeof v === "number" && Number.isNaN(v) ? 0 : v),
      z.number().int().nonnegative()
    ),
    active: z.boolean(),
    featuredOnHome: z.boolean().default(false),
    homeOrder: z.number().int().min(0).max(999).default(100),
  })
  .superRefine((data, ctx) => {
    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin no puede ser anterior al inicio",
        path: ["endDate"],
      });
    }
    if (data.presalePrice > 0 && data.presalePrice >= data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La preventa tiene que ser menor que la tarifa normal",
        path: ["presalePrice"],
      });
    }
    if (data.depositAmount > 0 && data.depositAmount >= data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La seña tiene que ser menor que la tarifa",
        path: ["depositAmount"],
      });
    }
    if (data.stock > data.capacity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Los lugares restantes no pueden superar el cupo total",
        path: ["stock"],
      });
    }
    const included = data.included.map((s) => s.trim()).filter(Boolean);
    if (included.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Agregá al menos un ítem incluido",
        path: ["included"],
      });
    }
  });

export type GroupTripFormData = z.infer<typeof groupTripSchema>;
export type GroupTripDayFormData = z.infer<typeof groupTripDaySchema>;
export type GroupTripBlockFormData = z.infer<typeof groupTripBlockSchema>;
export type GroupTripLodgingFormData = z.infer<typeof groupTripLodgingSchema>;
