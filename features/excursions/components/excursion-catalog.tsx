"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Service } from "@/types";
import { ExcursionCard } from "@/features/excursions/components/excursion-card";
import { getServiceCategories } from "@/features/excursions/lib/excursion-utils";
import { isAvailableInSeason, resolveServiceForCatalog } from "@/lib/seasons";

type Props = {
  services: Service[];
};

export function ExcursionCatalog({ services }: Props) {
  const searchParams = useSearchParams();
  const initialSeason = searchParams.get("temporada");
  const categoryOptions = useMemo(() => getServiceCategories(services), [services]);
  const [category, setCategory] = useState<string>("");
  const [season, setSeason] = useState<"" | "verano" | "invierno">(
    initialSeason === "verano" || initialSeason === "invierno"
      ? initialSeason
      : ""
  );
  const [maxPrice, setMaxPrice] = useState<string>("");

  const maxInCatalog = useMemo(
    () => (services.length ? Math.max(...services.map((s) => s.price)) : 0),
    [services]
  );

  const filtered = useMemo(() => {
    let list = services;
    if (category) {
      list = list.filter((s) => s.category === category);
    }
    if (season) {
      list = list.filter((s) => isAvailableInSeason(s, season));
    }
    if (maxPrice.trim()) {
      const n = Number(maxPrice);
      if (!Number.isNaN(n) && n > 0) {
        list = list.filter((s) => resolveServiceForCatalog(s, season || null).price <= n);
      }
    }
    return list;
  }, [services, category, season, maxPrice]);

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-xl border border-meru-border bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[180px] flex-1">
          <label htmlFor="filter-category" className="block text-sm font-medium text-meru-charcoal">
            Categoría
          </label>
          <select
            id="filter-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-meru-border bg-white px-3 py-2.5 text-meru-charcoal"
          >
            <option value="">Todas</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px] flex-1">
          <label htmlFor="filter-season" className="block text-sm font-medium text-meru-charcoal">
            Temporada
          </label>
          <select
            id="filter-season"
            value={season}
            onChange={(e) => setSeason(e.target.value as "" | "verano" | "invierno")}
            className="mt-1.5 w-full rounded-lg border border-meru-border bg-white px-3 py-2.5 text-meru-charcoal"
          >
            <option value="">Todas las temporadas</option>
            <option value="verano">Verano</option>
            <option value="invierno">Invierno</option>
          </select>
        </div>
        <div className="min-w-[180px] flex-1">
          <label htmlFor="filter-price" className="block text-sm font-medium text-meru-charcoal">
            Precio máximo (ARS)
          </label>
          <input
            id="filter-price"
            type="number"
            min={0}
            placeholder={maxInCatalog ? `Ej. ${maxInCatalog}` : "Sin tope"}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-meru-border bg-white px-3 py-2.5 text-meru-charcoal placeholder:text-meru-muted/60"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setCategory("");
            setSeason("");
            setMaxPrice("");
          }}
          className="rounded-lg border border-meru-border px-4 py-2.5 text-sm font-medium text-meru-charcoal hover:bg-meru-ice"
        >
          Limpiar filtros
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-meru-border bg-white py-16 text-center text-meru-muted">
          No hay excursiones con esos filtros. Probá otra categoría o precio.
        </p>
      ) : (
        <ul className="mt-10 grid list-none gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => (
            <li key={service.id}>
              <ExcursionCard service={service} season={season || null} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
