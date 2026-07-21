"use client";

import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import type { Service } from "@/types";
import { PASSENGER_CATEGORY_LABELS } from "@/types/discounts";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { canAddQuantity, hasAvailableStock } from "@/lib/excursions/stock";
import { formatCurrencyARS } from "@/lib/format";
import {
  computePassengersLineTotal,
  getPriceForCategory,
  totalPassengers,
  type CartPassengers,
} from "@/features/excursions/lib/pricing";

type Props = {
  service: Service;
};

type PassengerKey = keyof CartPassengers;

const ROWS: { key: PassengerKey; hint: string }[] = [
  { key: "adult", hint: "Tarifa completa" },
  { key: "minor", hint: "Con descuento si está configurado" },
  { key: "infant", hint: "No abonan" },
  { key: "senior", hint: "Con descuento si está configurado" },
];

export function ExcursionBookingPanel({ service }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const cartQuantity = useCartStore(
    (s) =>
      s.items.find((i) => i.serviceId === service.id && (i.kind ?? "service") === "service")
        ?.quantity ?? 0
  );

  const [passengers, setPassengers] = useState<CartPassengers>({
    adult: 1,
    minor: 0,
    infant: 0,
    senior: 0,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inStock = hasAvailableStock(service.stock);
  const seats = totalPassengers(passengers);
  const lineTotal = useMemo(
    () => computePassengersLineTotal(service.price, service.discounts, passengers),
    [service.price, service.discounts, passengers]
  );

  function setCount(key: PassengerKey, value: number) {
    const next = Math.max(0, Math.min(20, value));
    setPassengers((prev) => ({ ...prev, [key]: next }));
    setError(null);
  }

  function handleAdd() {
    setError(null);
    setMessage(null);

    if (!inStock) {
      setError("Esta excursión no tiene cupos disponibles por el momento.");
      return;
    }
    if (seats < 1) {
      setError("Seleccioná al menos un pasajero.");
      return;
    }
    if (!canAddQuantity(cartQuantity, seats, service.stock)) {
      setError("No hay suficientes lugares para esa cantidad de pasajeros.");
      return;
    }

    const ok = addItem({
      kind: "service",
      serviceId: service.id,
      slug: service.slug,
      title: service.title,
      price: service.price,
      image: service.photos[0],
      passengers,
      discounts: service.discounts,
      lineTotal,
      maxStock: service.stock,
    });

    if (!ok) {
      setError("No hay suficientes lugares para esa cantidad de pasajeros.");
      return;
    }

    setMessage("Agregada al carrito");
    setTimeout(() => setMessage(null), 2500);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-meru-muted">Tarifa adulto</p>
        <p className="mt-1 text-3xl font-bold text-meru-primary">
          {formatCurrencyARS(service.price)}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-meru-charcoal">¿Quiénes viajan?</p>
        {ROWS.map(({ key, hint }) => {
          const unit = getPriceForCategory(service.price, service.discounts, key);
          const count = passengers[key];
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-lg border border-meru-border px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-meru-charcoal">
                  {PASSENGER_CATEGORY_LABELS[key]}
                </p>
                <p className="text-xs text-meru-muted">
                  {key === "infant"
                    ? "Gratis · ocupa lugar"
                    : `${formatCurrencyARS(unit)} c/u`}
                  {key !== "infant" && key !== "adult" ? ` · ${hint}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-meru-border text-meru-charcoal hover:bg-meru-ice"
                  aria-label={`Menos ${PASSENGER_CATEGORY_LABELS[key]}`}
                  onClick={() => setCount(key, count - 1)}
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold tabular-nums text-meru-charcoal">
                  {count}
                </span>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-meru-border text-meru-charcoal hover:bg-meru-ice"
                  aria-label={`Más ${PASSENGER_CATEGORY_LABELS[key]}`}
                  onClick={() => setCount(key, count + 1)}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-meru-sand/80 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-meru-muted">{seats} pasajero{seats === 1 ? "" : "s"}</span>
          <span className="font-semibold text-meru-charcoal">
            Total {formatCurrencyARS(lineTotal)}
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={!inStock || seats < 1}
        onClick={handleAdd}
      >
        <ShoppingCart className="h-5 w-5" aria-hidden />
        {inStock ? "Agregar al carrito" : "Sin cupos"}
      </Button>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-meru-secondary" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
