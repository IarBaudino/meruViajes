import type {
  CatalogSeason,
  Season,
  Service,
} from "@/types";

export type { CatalogSeason };

export const SEASON_LABELS: Record<CatalogSeason, string> = {
  verano: "Verano",
  invierno: "Invierno",
};

export const CATALOG_SEASONS: CatalogSeason[] = ["verano", "invierno"];

export function parseCatalogSeason(
  value: string | string[] | null | undefined
): CatalogSeason | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "verano" || raw === "invierno") return raw;
  return null;
}

export function isSeasonVariantEnabled(
  service: Pick<Service, "seasonalVariants">,
  season: CatalogSeason
): boolean {
  return service.seasonalVariants?.[season]?.enabled === true;
}

export function getEnabledCatalogSeasons(
  service: Pick<Service, "seasonalVariants" | "seasons">
): CatalogSeason[] {
  const enabled: CatalogSeason[] = [];
  if (isSeasonVariantEnabled(service, "verano")) enabled.push("verano");
  if (isSeasonVariantEnabled(service, "invierno")) enabled.push("invierno");
  if (enabled.length > 0) return enabled;

  const legacy = service.seasons?.length ? service.seasons : (["todo-el-ano"] as Season[]);
  if (legacy.includes("todo-el-ano") || legacy.includes("verano")) enabled.push("verano");
  if (legacy.includes("todo-el-ano") || legacy.includes("invierno")) enabled.push("invierno");
  return Array.from(new Set(enabled));
}

/** Filtra excursiones o paquetes disponibles en una temporada del menú. */
export function isAvailableInSeason(
  serviceOrSeasons:
    | Pick<Service, "seasonalVariants" | "seasons">
    | Season[]
    | undefined,
  season: CatalogSeason
): boolean {
  if (Array.isArray(serviceOrSeasons) || serviceOrSeasons === undefined) {
    const legacy = serviceOrSeasons?.length ? serviceOrSeasons : (["todo-el-ano"] as Season[]);
    return legacy.includes("todo-el-ano") || legacy.includes(season);
  }

  if (serviceOrSeasons.seasonalVariants) {
    return isSeasonVariantEnabled(serviceOrSeasons, season);
  }

  const legacy = serviceOrSeasons.seasons?.length
    ? serviceOrSeasons.seasons
    : (["todo-el-ano"] as Season[]);
  return legacy.includes("todo-el-ano") || legacy.includes(season);
}

export function pickDefaultCatalogSeason(
  service: Pick<Service, "seasonalVariants" | "seasons">
): CatalogSeason | null {
  const enabled = getEnabledCatalogSeasons(service);
  if (enabled.includes("verano")) return "verano";
  return enabled[0] ?? null;
}

/**
 * Devuelve la excursión con los campos planos de la temporada pedida.
 */
export function resolveServiceForSeason(
  service: Service,
  season: CatalogSeason | null | undefined
): Service {
  if (!season) return service;

  const variant = service.seasonalVariants?.[season];
  if (!variant?.enabled) return service;

  return {
    ...service,
    title: variant.title,
    description: variant.description,
    price: variant.price,
    duration: variant.duration,
    difficulty: variant.difficulty,
    photos: variant.photos,
    meetingPoint: variant.meetingPoint,
    requirements: variant.requirements,
    cancellationPolicy: variant.cancellationPolicy,
    additionalEquipment: variant.additionalEquipment,
    notIncluded: variant.notIncluded,
    discountOptions: variant.discountOptions,
    promotion: variant.promotion ?? null,
    stock: variant.stock,
    departures: variant.departures,
    seasonalPhotos: undefined,
    seasons: getEnabledCatalogSeasons(service) as Season[],
  };
}

/** Cuando no hay filtro de temporada, muestra la variante por defecto (verano si está). */
export function resolveServiceForCatalog(
  service: Service,
  season: CatalogSeason | null | undefined
): Service {
  const effective = season ?? pickDefaultCatalogSeason(service);
  if (!effective) return service;
  return resolveServiceForSeason(service, effective);
}
