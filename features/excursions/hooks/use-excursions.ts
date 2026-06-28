"use client";

/**
 * Hook para listar excursiones desde Firestore — Fase 3.
 * Por ahora retorna estado vacío.
 */
export function useExcursions() {
  return {
    excursions: [] as never[],
    isLoading: false,
    error: null as string | null,
  };
}
