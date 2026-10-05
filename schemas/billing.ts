import { z } from "zod";

export const IDENTIFICATION_TYPES = [
  "CUIT",
  "DNI",
  "CUIL",
  "IVA",
  "Passport",
  "ID extranjera",
  "SIGD",
] as const;

export type IdentificationType = (typeof IDENTIFICATION_TYPES)[number];

export const orderBillingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Indicá el nombre completo")
    .max(120, "El nombre es demasiado largo"),
  email: z.string().trim().email("Ingresá un correo válido"),
  phoneCountryCode: z.string().trim().min(2, "Elegí el código de país"),
  phoneNumber: z
    .string()
    .trim()
    .min(6, "Indicá un teléfono válido")
    .max(20, "El teléfono es demasiado largo")
    .regex(/^[\d\s\-()]+$/, "Usá solo números y guiones"),
  identificationType: z.enum(IDENTIFICATION_TYPES),
  identificationNumber: z
    .string()
    .trim()
    .min(4, "Indicá el número de identificación")
    .max(40, "El número es demasiado largo"),
  addressCountry: z.string().trim().min(2, "Indicá el país"),
  addressCity: z.string().trim().min(2, "Indicá la ciudad"),
  addressStreet: z.string().trim().min(3, "Indicá calle y número"),
  addressApartment: z.string().trim().max(40).optional().or(z.literal("")),
  addressPostalCode: z.string().trim().min(2, "Indicá el código postal").max(20),
});

export type OrderBillingFormData = z.infer<typeof orderBillingSchema>;

export type OrderBilling = {
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  /** Teléfono completo E.164-ish para WhatsApp / contacto. */
  phoneFull: string;
  identificationType: IdentificationType;
  identificationNumber: string;
  address: {
    country: string;
    city: string;
    street: string;
    apartment?: string;
    postalCode: string;
  };
};

export function normalizeBilling(data: OrderBillingFormData): OrderBilling {
  const phoneDigits = data.phoneNumber.replace(/[^\d]/g, "");
  const code = data.phoneCountryCode.startsWith("+")
    ? data.phoneCountryCode
    : `+${data.phoneCountryCode}`;
  const apartment = data.addressApartment?.trim() || undefined;

  return {
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    phoneCountryCode: code,
    phoneNumber: phoneDigits,
    phoneFull: `${code}${phoneDigits}`,
    identificationType: data.identificationType,
    identificationNumber: data.identificationNumber.trim(),
    address: {
      country: data.addressCountry.trim(),
      city: data.addressCity.trim(),
      street: data.addressStreet.trim(),
      ...(apartment ? { apartment } : {}),
      postalCode: data.addressPostalCode.trim(),
    },
  };
}

export function formatBillingAddress(billing: OrderBilling): string {
  const a = billing.address;
  const apt = a.apartment ? `, ${a.apartment}` : "";
  return `${a.street}${apt}, ${a.city}, ${a.country} (${a.postalCode})`;
}

export function billingToFormValues(
  billing?: OrderBilling | null,
  fallbacks?: Partial<OrderBillingFormData>
): OrderBillingFormData {
  return {
    fullName: billing?.fullName || fallbacks?.fullName || "",
    email: billing?.email || fallbacks?.email || "",
    phoneCountryCode: billing?.phoneCountryCode || fallbacks?.phoneCountryCode || "+54",
    phoneNumber: billing?.phoneNumber || fallbacks?.phoneNumber || "",
    identificationType: billing?.identificationType || fallbacks?.identificationType || "DNI",
    identificationNumber:
      billing?.identificationNumber || fallbacks?.identificationNumber || "",
    addressCountry: billing?.address.country || fallbacks?.addressCountry || "Argentina",
    addressCity: billing?.address.city || fallbacks?.addressCity || "",
    addressStreet: billing?.address.street || fallbacks?.addressStreet || "",
    addressApartment: billing?.address.apartment || fallbacks?.addressApartment || "",
    addressPostalCode: billing?.address.postalCode || fallbacks?.addressPostalCode || "",
  };
}

/** Tolera documentos viejos / parciales en Firestore. */
export function parseStoredBilling(raw: unknown): OrderBilling | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const address =
    b.address && typeof b.address === "object"
      ? (b.address as Record<string, unknown>)
      : null;
  const fullName = String(b.fullName ?? "").trim();
  const email = String(b.email ?? "").trim();
  const phoneCountryCode = String(b.phoneCountryCode ?? "").trim();
  const phoneNumber = String(b.phoneNumber ?? "").trim();
  const identificationType = String(b.identificationType ?? "").trim();
  const identificationNumber = String(b.identificationNumber ?? "").trim();
  const country = String(address?.country ?? "").trim();
  const city = String(address?.city ?? "").trim();
  const street = String(address?.street ?? "").trim();
  const postalCode = String(address?.postalCode ?? "").trim();
  if (
    !fullName ||
    !email ||
    !phoneCountryCode ||
    !phoneNumber ||
    !identificationType ||
    !identificationNumber ||
    !country ||
    !city ||
    !street ||
    !postalCode
  ) {
    return null;
  }
  if (!(IDENTIFICATION_TYPES as readonly string[]).includes(identificationType)) {
    return null;
  }
  const apartment = String(address?.apartment ?? "").trim();
  return {
    fullName,
    email,
    phoneCountryCode,
    phoneNumber,
    phoneFull: String(b.phoneFull ?? `${phoneCountryCode}${phoneNumber}`),
    identificationType: identificationType as IdentificationType,
    identificationNumber,
    address: {
      country,
      city,
      street,
      ...(apartment ? { apartment } : {}),
      postalCode,
    },
  };
}
