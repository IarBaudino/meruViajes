import type { Service, SeasonalPhoto } from "@/types";
import type { ServiceDiscounts } from "@/types/discounts";
import type { DocumentData } from "firebase-admin/firestore";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function mapDiscounts(data: DocumentData): ServiceDiscounts | undefined {
  const raw = data.discounts;
  if (!raw || typeof raw !== "object") return undefined;

  const d = raw as Record<string, unknown>;
  const minorPercent = asNumber(d.minorPercent, NaN);
  const infantPercent = asNumber(d.infantPercent, NaN);
  const seniorPercent = asNumber(d.seniorPercent, NaN);

  const discounts: ServiceDiscounts = {};
  if (!Number.isNaN(minorPercent)) discounts.minorPercent = minorPercent;
  if (!Number.isNaN(infantPercent)) discounts.infantPercent = infantPercent;
  if (!Number.isNaN(seniorPercent)) discounts.seniorPercent = seniorPercent;

  return Object.keys(discounts).length > 0 ? discounts : undefined;
}

function mapSeasonalPhotos(value: unknown): SeasonalPhoto[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const photos = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const season = o.season;
      const url = o.url;
      if (
        season !== "verano" &&
        season !== "invierno" &&
        season !== "primavera" &&
        season !== "otono"
      ) {
        return null;
      }
      if (typeof url !== "string") return null;
      return {
        season,
        url,
        ...(typeof o.label === "string" ? { label: o.label } : {}),
      } as SeasonalPhoto;
    })
    .filter((p): p is SeasonalPhoto => p !== null);

  return photos.length > 0 ? photos : undefined;
}

export function mapFirestoreService(id: string, data: DocumentData): Service {
  return {
    id,
    title: asString(data.title),
    slug: asString(data.slug),
    description: asString(data.description),
    price: asNumber(data.price),
    duration: asString(data.duration) || undefined,
    difficulty: asString(data.difficulty) || undefined,
    location: asString(data.location) || undefined,
    photos: asStringArray(data.photos),
    seasonalPhotos: mapSeasonalPhotos(data.seasonalPhotos),
    category: asString(data.category) || undefined,
    meetingPoint: asString(data.meetingPoint) || undefined,
    requirements: asString(data.requirements) || undefined,
    cancellationPolicy: asString(data.cancellationPolicy) || undefined,
    additionalEquipment: asString(data.additionalEquipment) || undefined,
    notIncluded: asString(data.notIncluded) || undefined,
    discounts: mapDiscounts(data),
    stock: asNumber(data.stock, 0),
    active: asBool(data.active, true),
  };
}

export function serviceToFirestore(data: Omit<Service, "id">): DocumentData {
  return {
    title: data.title,
    slug: data.slug,
    description: data.description,
    price: data.price,
    duration: data.duration ?? null,
    difficulty: data.difficulty ?? null,
    location: data.location ?? null,
    photos: data.photos,
    seasonalPhotos: data.seasonalPhotos ?? null,
    category: data.category ?? null,
    meetingPoint: data.meetingPoint ?? null,
    requirements: data.requirements ?? null,
    cancellationPolicy: data.cancellationPolicy ?? null,
    additionalEquipment: data.additionalEquipment ?? null,
    notIncluded: data.notIncluded ?? null,
    discounts: data.discounts ?? null,
    stock: data.stock,
    active: data.active,
  };
}
