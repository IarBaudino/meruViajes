import type {
  Service,
  SeasonalPhoto,
  DiscountOption,
  ServicePromotion,
  DepartureSlot,
  Season,
  SeasonalContentOverride,
} from "@/types";
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

function mapSeasons(value: unknown): Season[] {
  if (!Array.isArray(value)) return ["todo-el-ano"];
  const valid = value.filter(
    (season): season is Season =>
      season === "verano" || season === "invierno" || season === "todo-el-ano"
  );
  return valid.length > 0 ? valid : ["todo-el-ano"];
}

function mapSeasonalOverride(value: unknown): SeasonalContentOverride | undefined {
  if (!value || typeof value !== "object") return undefined;
  const o = value as Record<string, unknown>;
  const photos = asStringArray(o.photos);
  const price = asNumber(o.price, 0);
  const title = asString(o.title);
  const description = asString(o.description);
  const duration = asString(o.duration);
  const difficulty = asString(o.difficulty);
  const meetingPoint = asString(o.meetingPoint);
  const requirements = asString(o.requirements);
  const cancellationPolicy = asString(o.cancellationPolicy);
  const additionalEquipment = asString(o.additionalEquipment);
  const notIncluded = asString(o.notIncluded);

  const hasAnything =
    title ||
    description ||
    duration ||
    difficulty ||
    meetingPoint ||
    requirements ||
    cancellationPolicy ||
    additionalEquipment ||
    notIncluded ||
    photos.length > 0 ||
    price > 0;

  if (!hasAnything) return undefined;

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(price > 0 ? { price } : {}),
    ...(duration ? { duration } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(photos.length ? { photos } : {}),
    ...(meetingPoint ? { meetingPoint } : {}),
    ...(requirements ? { requirements } : {}),
    ...(cancellationPolicy ? { cancellationPolicy } : {}),
    ...(additionalEquipment ? { additionalEquipment } : {}),
    ...(notIncluded ? { notIncluded } : {}),
  };
}

function mapSeasonalContent(value: unknown): Service["seasonalContent"] | undefined {
  if (!value || typeof value !== "object") return undefined;
  const o = value as Record<string, unknown>;
  const verano = mapSeasonalOverride(o.verano);
  const invierno = mapSeasonalOverride(o.invierno);
  if (!verano && !invierno) return undefined;
  return {
    ...(verano ? { verano } : {}),
    ...(invierno ? { invierno } : {}),
  };
}

function overrideToFirestore(override: SeasonalContentOverride | undefined | null) {
  if (!override) return null;
  const photos = (override.photos ?? []).filter(Boolean);
  const price = typeof override.price === "number" && override.price > 0 ? override.price : 0;
  const title = override.title?.trim() ?? "";
  const description = override.description?.trim() ?? "";
  const duration = override.duration?.trim() ?? "";
  const difficulty = override.difficulty?.trim() ?? "";
  const meetingPoint = override.meetingPoint?.trim() ?? "";
  const requirements = override.requirements?.trim() ?? "";
  const cancellationPolicy = override.cancellationPolicy?.trim() ?? "";
  const additionalEquipment = override.additionalEquipment?.trim() ?? "";
  const notIncluded = override.notIncluded?.trim() ?? "";

  const hasAnything =
    title ||
    description ||
    duration ||
    difficulty ||
    meetingPoint ||
    requirements ||
    cancellationPolicy ||
    additionalEquipment ||
    notIncluded ||
    photos.length > 0 ||
    price > 0;

  if (!hasAnything) return null;

  return {
    title: title || null,
    description: description || null,
    price: price > 0 ? price : null,
    duration: duration || null,
    difficulty: difficulty || null,
    photos,
    meetingPoint: meetingPoint || null,
    requirements: requirements || null,
    cancellationPolicy: cancellationPolicy || null,
    additionalEquipment: additionalEquipment || null,
    notIncluded: notIncluded || null,
  };
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
      minorPercent: typeof d.minorPercent === "number" ? d.minorPercent : undefined,
      infantPercent: typeof d.infantPercent === "number" ? d.infantPercent : undefined,
      seniorPercent: typeof d.seniorPercent === "number" ? d.seniorPercent : undefined,
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

function mapDepartures(value: unknown): DepartureSlot[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const id = asString(o.id);
      const date = asString(o.date);
      const time = asString(o.time);
      const capacity = asNumber(o.capacity, NaN);
      if (!id || !date || !time || Number.isNaN(capacity) || capacity < 1) return null;
      return {
        id,
        date,
        time,
        capacity,
        booked: Math.max(0, asNumber(o.booked, 0)),
        active: o.active !== false,
      } as DepartureSlot;
    })
    .filter((d): d is DepartureSlot => d !== null);
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
    seasons: mapSeasons(data.seasons),
    seasonalContent: mapSeasonalContent(data.seasonalContent),
    meetingPoint: asString(data.meetingPoint) || undefined,
    requirements: asString(data.requirements) || undefined,
    cancellationPolicy: asString(data.cancellationPolicy) || undefined,
    additionalEquipment: asString(data.additionalEquipment) || undefined,
    notIncluded: asString(data.notIncluded) || undefined,
    discountOptions,
    promotion: mapPromotion(data),
    stock: asNumber(data.stock, 0),
    departures: mapDepartures(data.departures),
    featuredOnHome: asBool(data.featuredOnHome, false),
    homeOrder: asNumber(data.homeOrder, 100),
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
  seasons?: Season[];
  seasonalContent?: {
    verano?: SeasonalContentOverride | null;
    invierno?: SeasonalContentOverride | null;
  } | null;
  meetingPoint?: string | null;
  requirements?: string | null;
  cancellationPolicy?: string | null;
  additionalEquipment?: string | null;
  notIncluded?: string | null;
  discountOptions?: DiscountOption[];
  promotion?: ServicePromotion | null;
  stock: number;
  departures?: DepartureSlot[];
  featuredOnHome?: boolean;
  homeOrder?: number;
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

  const departures = (data.departures ?? []).map((d) => ({
    id: d.id,
    date: d.date,
    time: d.time,
    capacity: d.capacity,
    booked: Math.max(0, d.booked ?? 0),
    active: d.active !== false,
  }));

  const verano = overrideToFirestore(data.seasonalContent?.verano);
  const invierno = overrideToFirestore(data.seasonalContent?.invierno);
  const seasonalContent =
    verano || invierno
      ? {
          ...(verano ? { verano } : {}),
          ...(invierno ? { invierno } : {}),
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
    seasons: data.seasons?.length ? data.seasons : ["todo-el-ano"],
    seasonalContent,
    meetingPoint: data.meetingPoint ?? null,
    requirements: data.requirements ?? null,
    cancellationPolicy: data.cancellationPolicy ?? null,
    additionalEquipment: data.additionalEquipment ?? null,
    notIncluded: data.notIncluded ?? null,
    discountOptions: data.discountOptions ?? [],
    promotion,
    discounts: null,
    stock: data.stock,
    departures,
    featuredOnHome: data.featuredOnHome === true,
    homeOrder: Number.isFinite(data.homeOrder) ? Number(data.homeOrder) : 100,
    active: data.active,
  };
}
