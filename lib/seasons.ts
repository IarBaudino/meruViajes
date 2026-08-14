import type { CatalogSeason, Season, SeasonalContentOverride, Service } from "@/types";

export type { CatalogSeason };

export const SEASON_LABELS: Record<Season, string> = {
  verano: "Verano",
  invierno: "Invierno",
  "todo-el-ano": "Todo el año",
};

/** Los registros antiguos sin temporada se consideran disponibles todo el año. */
export function isAvailableInSeason(seasons: Season[] | undefined, season: "verano" | "invierno") {
  const effective = seasons?.length ? seasons : ["todo-el-ano"];
  return effective.includes("todo-el-ano") || effective.includes(season);
}

export function parseCatalogSeason(
  value: string | string[] | null | undefined
): CatalogSeason | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "verano" || raw === "invierno") return raw;
  return null;
}

function pickOverrideText(
  override: string | undefined,
  base: string | undefined
): string | undefined {
  const trimmed = override?.trim();
  if (trimmed) return trimmed;
  return base;
}

/**
 * Aplica el contenido de temporada sobre la ficha base.
 * Campos vacíos en el override no reemplazan; se mantiene lo de la ficha principal.
 */
export function resolveServiceForSeason(
  service: Service,
  season: CatalogSeason | null | undefined
): Service {
  if (!season) return service;

  const override: SeasonalContentOverride | undefined = service.seasonalContent?.[season];
  if (!override) {
    const seasonalOnly = service.seasonalPhotos?.filter((p) => p.season === season);
    if (seasonalOnly?.length) {
      return {
        ...service,
        photos: seasonalOnly.map((p) => p.url),
        seasonalPhotos: undefined,
      };
    }
    return service;
  }

  const overridePhotos = override.photos?.filter((url) => typeof url === "string" && url.length > 0);
  const price =
    typeof override.price === "number" && override.price > 0 ? override.price : service.price;

  return {
    ...service,
    title: pickOverrideText(override.title, service.title) ?? service.title,
    description: pickOverrideText(override.description, service.description) ?? service.description,
    price,
    duration: pickOverrideText(override.duration, service.duration),
    difficulty: pickOverrideText(override.difficulty, service.difficulty),
    photos: overridePhotos?.length ? overridePhotos : service.photos,
    meetingPoint: pickOverrideText(override.meetingPoint, service.meetingPoint),
    requirements: pickOverrideText(override.requirements, service.requirements),
    cancellationPolicy: pickOverrideText(override.cancellationPolicy, service.cancellationPolicy),
    additionalEquipment: pickOverrideText(
      override.additionalEquipment,
      service.additionalEquipment
    ),
    notIncluded: pickOverrideText(override.notIncluded, service.notIncluded),
    seasonalPhotos: overridePhotos?.length ? undefined : service.seasonalPhotos,
  };
}
