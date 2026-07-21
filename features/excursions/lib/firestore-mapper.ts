import type { Service, SeasonalPhoto, DiscountOption, ServicePromotion } from "@/types";
import { legacyDiscountsToOptions } from "@/types/discounts";
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

function mapDiscountOptions(data: DocumentData): DiscountOption[] {
  const raw = data.discountOptions;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const o = item as Record<string, unknown>;
        const id = asString(o.id);
        const label = asString(o.label);
        const percent = asNumber(o.percent, NaN);
        if (!id || !label || Number.isNaN(percent)) return null;
        return { id, label, percent } as DiscountOption;
      })
      .filter((o): o is DiscountOption => o !== null);
  }

  const legacy = data.discounts;
  if (legacy && typeof legacy === "object") {
    const d = legacy as Record<string, unknown>;
    return legacyDiscountsToOptions({
      minorPercent:
        typeof d.minorPercent === "number" ? d.minorPercent : undefined,
      infantPercent:
        typeof d.infantPercent === "number" ? d.infantPercent : undefined,
      seniorPercent:
        typeof d.seniorPercent === "number" ? d.seniorPercent : undefined,
    });
  }

  return [];
}

function mapPromotion(data: DocumentData): ServicePromotion | null {
  const raw = data.promotion;
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const price = asNumber(p.price, NaN);
  const startsAt = asString(p.startsAt);
  const endsAt = asString(p.endsAt);
  if (Number.isNaN(price) || !startsAt || !endsAt) return null;
  return {
    enabled: p.enabled !== false,
    price,
    startsAt,
    endsAt,
    appliesToDiscountIds: asStringArray(p.appliesToDiscountIds),
  };
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
  const discountOptions = mapDiscountOptions(data);
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
    discountOptions,
    promotion: mapPromotion(data),
    stock: asNumber(data.stock, 0),
    active: asBool(data.active, true),
  };
}

export function serviceToFirestore(data: {
  title: string;
  slug: string;
  description: string;
  price: number;
  duration?: string | null;
  difficulty?: string | null;
  location?: string | null;
  photos: string[];
  seasonalPhotos?: SeasonalPhoto[] | null;
  category?: string | null;
  meetingPoint?: string | null;
  requirements?: string | null;
  cancellationPolicy?: string | null;
  additionalEquipment?: string | null;
  notIncluded?: string | null;
  discountOptions?: DiscountOption[];
  promotion?: ServicePromotion | null;
  stock: number;
  active: boolean;
}): DocumentData {
  const promotion =
    data.promotion && data.promotion.enabled
      ? {
          enabled: true,
          price: data.promotion.price,
          startsAt: data.promotion.startsAt,
          endsAt: data.promotion.endsAt,
          appliesToDiscountIds: data.promotion.appliesToDiscountIds ?? [],
        }
      : null;

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
    discountOptions: data.discountOptions ?? [],
    promotion,
    discounts: null,
    stock: data.stock,
    active: data.active,
  };
}
