import type { Service } from "@/types";
import { SAMPLE_SERVICES } from "@/features/excursions/lib/sample-services";

const USE_SAMPLE_DATA = true;

/**
 * Lista servicios activos. Cuando USE_SAMPLE_DATA es false, leer desde Firestore (Fase 3).
 */
export async function getActiveServices(): Promise<Service[]> {
  if (USE_SAMPLE_DATA) {
    return SAMPLE_SERVICES.filter((s) => s.active);
  }
  // TODO Fase 3: Firestore Admin
  return [];
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  if (USE_SAMPLE_DATA) {
    return SAMPLE_SERVICES.find((s) => s.slug === slug && s.active) ?? null;
  }
  // TODO Fase 3
  return null;
}
