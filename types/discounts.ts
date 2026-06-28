/** Porcentajes de descuento configurables por excursión (0–100). */
export interface ServiceDiscounts {
  /** Menores (ej. 6–12 años) */
  minorPercent?: number;
  /** Infantes (ej. 0–5 años) */
  infantPercent?: number;
  /** Jubilados */
  seniorPercent?: number;
}

export type PassengerCategory = "adult" | "minor" | "infant" | "senior";

export const PASSENGER_CATEGORY_LABELS: Record<PassengerCategory, string> = {
  adult: "Adulto",
  minor: "Menor",
  infant: "Infante",
  senior: "Jubilado",
};
