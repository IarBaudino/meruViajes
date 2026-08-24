import type {
  CatalogSeason,
  Service,
  ServiceSeasonVariant,
  SeasonalPhoto,
  DiscountOption,
  ServicePromotion,
  DepartureSlot,
  Season,
  SeasonalContentOverride,
} from "@/types";
import { legacyDiscountsToOptions } from "@/types/discounts";
import { getEnabledCatalogSeasons } from "@/lib/seasons";
import type { ServiceFormData } from "@/schemas/service";
import type { DocumentData } from "firebase-admin/firestore";

const CATALOG_SEASONS: CatalogSeason[] = ["verano", "invierno"];

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

function mapDiscountOptionsFromRaw(value: unknown, data?: DocumentData): DiscountOption[] {
  if (Array.isArray(value) && value.length > 0) {
    return value
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

  if (!data) return [];

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

function mapPromotionFromRaw(value: unknown, basePrice?: number): ServicePromotion | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Record<string, unknown>;
  const startsAt = asString(p.startsAt);
  const endsAt = asString(p.endsAt);
  if (!startsAt || !endsAt) return null;

  let percent = asNumber(p.percent, NaN);
  if (Number.isNaN(percent) || percent <= 0) {
    const legacyPrice = asNumber(p.price, NaN);
    if (
      !Number.isNaN(legacyPrice) &&
      legacyPrice > 0 &&
      typeof basePrice === "number" &&
      basePrice > 0
    ) {
      percent = Math.round((1 - legacyPrice / basePrice) * 100);
    }
  }
  if (Number.isNaN(percent) || percent <= 0 || percent > 100) return null;

  return {
    enabled: p.enabled !== false,
    percent: Math.round(percent),
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

function emptyVariant(): ServiceSeasonVariant {
  return {
    enabled: false,
    title: "",
    description: "",
    price: 0,
    duration: "",
    difficulty: "",
    photos: [],
    meetingPoint: "",
    requirements: "",
    cancellationPolicy: "",
    additionalEquipment: "",
    notIncluded: "",
    discountOptions: [],
    promotion: null,
    stock: 0,
    departures: [],
  };
}

function mapVariantFromRaw(
  value: unknown,
  fallback: ServiceSeasonVariant
): ServiceSeasonVariant {
  if (!value || typeof value !== "object") return fallback;
  const o = value as Record<string, unknown>;
  const variantPrice = asNumber(o.price, fallback.price);
  const promotion = mapPromotionFromRaw(o.promotion, variantPrice);
  return {
    enabled: typeof o.enabled === "boolean" ? o.enabled : fallback.enabled,
    title: asString(o.title, fallback.title),
    description: asString(o.description, fallback.description),
    price: asNumber(o.price, fallback.price),
    duration: asString(o.duration, fallback.duration ?? "") || undefined,
    difficulty: asString(o.difficulty, fallback.difficulty ?? "") || undefined,
    photos: asStringArray(o.photos).length ? asStringArray(o.photos) : fallback.photos,
    meetingPoint: asString(o.meetingPoint, fallback.meetingPoint ?? "") || undefined,
    requirements: asString(o.requirements, fallback.requirements ?? "") || undefined,
    cancellationPolicy:
      asString(o.cancellationPolicy, fallback.cancellationPolicy ?? "") || undefined,
    additionalEquipment:
      asString(o.additionalEquipment, fallback.additionalEquipment ?? "") || undefined,
    notIncluded: asString(o.notIncluded, fallback.notIncluded ?? "") || undefined,
    discountOptions: mapDiscountOptionsFromRaw(o.discountOptions).length
      ? mapDiscountOptionsFromRaw(o.discountOptions)
      : fallback.discountOptions,
    promotion: promotion ?? fallback.promotion ?? null,
    stock: asNumber(o.stock, fallback.stock),
    departures: mapDepartures(o.departures).length
      ? mapDepartures(o.departures)
      : fallback.departures,
  };
}

function migrateLegacyToVariants(data: DocumentData): Service["seasonalVariants"] {
  const seasons = mapSeasons(data.seasons);
  const baseDiscountOptions = mapDiscountOptionsFromRaw(data.discountOptions, data);
  const basePromotion = mapPromotionFromRaw(data.promotion, asNumber(data.price));
  const baseDepartures = mapDepartures(data.departures);
  const seasonalPhotos = mapSeasonalPhotos(data.seasonalPhotos);
  const seasonalContent = mapSeasonalContent(data.seasonalContent);

  const veranoEnabled = seasons.includes("verano") || seasons.includes("todo-el-ano");
  const inviernoEnabled = seasons.includes("invierno") || seasons.includes("todo-el-ano");

  function build(
    season: CatalogSeason,
    enabled: boolean,
    override?: SeasonalContentOverride
  ): ServiceSeasonVariant {
    const seasonPhotoUrls =
      seasonalPhotos?.filter((p) => p.season === season).map((p) => p.url) ?? [];
    const photos = override?.photos?.length
      ? override.photos
      : seasonPhotoUrls.length
        ? seasonPhotoUrls
        : asStringArray(data.photos);

    return {
      enabled,
      title: override?.title?.trim() || asString(data.title),
      description: override?.description?.trim() || asString(data.description),
      price:
        typeof override?.price === "number" && override.price > 0
          ? override.price
          : asNumber(data.price),
      duration: override?.duration?.trim() || asString(data.duration) || undefined,
      difficulty: override?.difficulty?.trim() || asString(data.difficulty) || undefined,
      photos,
      meetingPoint: override?.meetingPoint?.trim() || asString(data.meetingPoint) || undefined,
      requirements: override?.requirements?.trim() || asString(data.requirements) || undefined,
      cancellationPolicy:
        override?.cancellationPolicy?.trim() || asString(data.cancellationPolicy) || undefined,
      additionalEquipment:
        override?.additionalEquipment?.trim() || asString(data.additionalEquipment) || undefined,
      notIncluded: override?.notIncluded?.trim() || asString(data.notIncluded) || undefined,
      discountOptions: baseDiscountOptions,
      promotion: basePromotion,
      stock: asNumber(data.stock, 0),
      departures: baseDepartures,
    };
  }

  return {
    verano: build("verano", veranoEnabled, seasonalContent?.verano),
    invierno: build("invierno", inviernoEnabled, seasonalContent?.invierno),
  };
}

function mapSeasonalVariants(data: DocumentData): Service["seasonalVariants"] {
  const raw = data.seasonalVariants;
  if (raw && typeof raw === "object") {
    const legacy = migrateLegacyToVariants(data);
    const o = raw as Record<string, unknown>;
    return {
      verano: mapVariantFromRaw(o.verano, legacy.verano),
      invierno: mapVariantFromRaw(o.invierno, legacy.invierno),
    };
  }
  return migrateLegacyToVariants(data);
}

function pickPrimaryVariant(variants: Service["seasonalVariants"]): ServiceSeasonVariant {
  if (variants.verano.enabled) return variants.verano;
  if (variants.invierno.enabled) return variants.invierno;
  return variants.verano;
}

function variantToFirestore(variant: ServiceSeasonVariant): DocumentData {
  const promotion =
    variant.promotion && variant.promotion.enabled
      ? {
          enabled: true,
          percent: Math.min(100, Math.max(1, Math.round(Number(variant.promotion.percent)))),
          startsAt: variant.promotion.startsAt,
          endsAt: variant.promotion.endsAt,
          appliesToDiscountIds: variant.promotion.appliesToDiscountIds ?? [],
        }
      : null;

  return {
    enabled: variant.enabled,
    title: variant.title,
    description: variant.description,
    price: variant.price,
    duration: variant.duration ?? null,
    difficulty: variant.difficulty ?? null,
    photos: variant.photos,
    meetingPoint: variant.meetingPoint ?? null,
    requirements: variant.requirements ?? null,
    cancellationPolicy: variant.cancellationPolicy ?? null,
    additionalEquipment: variant.additionalEquipment ?? null,
    notIncluded: variant.notIncluded ?? null,
    discountOptions: variant.discountOptions ?? [],
    promotion,
    stock: variant.stock,
    departures: (variant.departures ?? []).map((d) => ({
      id: d.id,
      date: d.date,
      time: d.time,
      capacity: d.capacity,
      booked: Math.max(0, d.booked ?? 0),
      active: d.active !== false,
    })),
  };
}

export function mapFirestoreService(id: string, data: DocumentData): Service {
  const seasonalVariants = mapSeasonalVariants(data);
  const primary = pickPrimaryVariant(seasonalVariants);
  const enabledSeasons = getEnabledCatalogSeasons({ seasonalVariants });

  return {
    id,
    slug: asString(data.slug),
    location: asString(data.location) || undefined,
    category: asString(data.category) || undefined,
    seasonalVariants,
    featuredOnHome: asBool(data.featuredOnHome, false),
    homeOrder: asNumber(data.homeOrder, 100),
    active: asBool(data.active, true),
    title: primary.title,
    description: primary.description,
    price: primary.price,
    duration: primary.duration,
    difficulty: primary.difficulty,
    photos: primary.photos,
    seasonalPhotos: mapSeasonalPhotos(data.seasonalPhotos),
    seasons: enabledSeasons.length
      ? (enabledSeasons as Season[])
      : mapSeasons(data.seasons),
    seasonalContent: mapSeasonalContent(data.seasonalContent),
    meetingPoint: primary.meetingPoint,
    requirements: primary.requirements,
    cancellationPolicy: primary.cancellationPolicy,
    additionalEquipment: primary.additionalEquipment,
    notIncluded: primary.notIncluded,
    discountOptions: primary.discountOptions,
    promotion: primary.promotion ?? null,
    stock: primary.stock,
    departures: primary.departures,
  };
}

function pickPrimaryFromForm(data: ServiceFormData): ServiceSeasonVariant | null {
  if (data.seasonalVariants.verano.enabled) return data.seasonalVariants.verano;
  if (data.seasonalVariants.invierno.enabled) return data.seasonalVariants.invierno;
  return null;
}

export function serviceToFirestore(data: ServiceFormData): DocumentData {
  const seasonalVariants = {
    verano: variantToFirestore(data.seasonalVariants.verano),
    invierno: variantToFirestore(data.seasonalVariants.invierno),
  };
  const primary = pickPrimaryFromForm(data);
  const enabledSeasons = CATALOG_SEASONS.filter((s) => data.seasonalVariants[s].enabled);

  return {
    slug: data.slug,
    location: data.location ?? null,
    category: data.category ?? null,
    active: data.active,
    featuredOnHome: data.featuredOnHome === true,
    homeOrder: Number.isFinite(data.homeOrder) ? Number(data.homeOrder) : 100,
    seasonalVariants,
    title: primary?.title ?? "",
    description: primary?.description ?? "",
    price: primary?.price ?? 0,
    duration: primary?.duration ?? null,
    difficulty: primary?.difficulty ?? null,
    photos: primary?.photos ?? [],
    meetingPoint: primary?.meetingPoint ?? null,
    requirements: primary?.requirements ?? null,
    cancellationPolicy: primary?.cancellationPolicy ?? null,
    additionalEquipment: primary?.additionalEquipment ?? null,
    notIncluded: primary?.notIncluded ?? null,
    discountOptions: primary?.discountOptions ?? [],
    promotion:
      primary?.promotion && primary.promotion.enabled
        ? {
            enabled: true,
            percent: Math.min(
              100,
              Math.max(1, Math.round(Number(primary.promotion.percent)))
            ),
            startsAt: primary.promotion.startsAt,
            endsAt: primary.promotion.endsAt,
            appliesToDiscountIds: primary.promotion.appliesToDiscountIds ?? [],
          }
        : null,
    stock: primary?.stock ?? 0,
    departures: (primary?.departures ?? []).map((d) => ({
      id: d.id,
      date: d.date,
      time: d.time,
      capacity: d.capacity,
      booked: Math.max(0, d.booked ?? 0),
      active: d.active !== false,
    })),
    seasons: enabledSeasons.length ? enabledSeasons : ["verano"],
    seasonalContent: null,
    seasonalPhotos: null,
    discounts: null,
  };
}
