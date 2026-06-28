"use client";

import { useEffect, useState } from "react";
import type { Service } from "@/types";

/**
 * Hook cliente para listar excursiones vía API (Fase 3+).
 */
export function useExcursions() {
  const [excursions, setExcursions] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/services");
        if (!res.ok) throw new Error("No se pudo cargar el catálogo");
        const data = await res.json();
        if (!cancelled) setExcursions(data.services ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error desconocido");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { excursions, isLoading, error };
}
