"use client";

import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import type { Service } from "@/types";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { canAddQuantity, hasAvailableStock } from "@/lib/excursions/stock";
import { formatCurrencyARS } from "@/lib/format";
import {
  applyDiscountPercent,
  computePassengersLineTotal,
  getApplicableDiscountOptions,
  getEffectiveAdultPrice,
  hasActivePromotion,
  totalPassengers,
  type CartPassengers,
} from "@/features/excursions/lib/pricing";

type Props = {
  service: Service;
};

export function ExcursionBookingPanel({ service }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const cartQuantity = useCartStore(
    (s) =>
      s.items.find((i) => i.serviceId === service.id && (i.kind ?? "service") === "service")
        ?.quantity ?? 0
  );

  const promoActive = hasActivePromotion(service);
  const adultPrice = getEffectiveAdultPrice(service);
  const discountOptions = getApplicableDiscountOptions(service);

  const [adult, setAdult] = useState(1);
  const [infant, setInfant] = useState(0);
  const [discountQty, setDiscountQty] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const passengers: CartPassengers = useMemo(
    () => ({
      adult,
      infant,
      discounted: discountOptions
        .map((opt) => ({
          optionId: opt.id,
          label: opt.label,
          percent: opt.percent,
          quantity: discountQty[opt.id] ?? 0,
        }))
        .filter((line) => line.quantity > 0),
    }),
    [adult, infant, discountOptions, discountQty]
  );

  const inStock = hasAvailableStock(service.stock);
  const seats = totalPassengers(passengers);
  const lineTotal = useMemo(
    () => computePassengersLineTotal(adultPrice, passengers),
    [adultPrice, passengers]
  );

  function clamp(value: number) {
    return Math.max(0, Math.min(20, value));
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
      price: adultPrice,
      image: service.photos[0],
      passengers,
      discountOptions: service.discountOptions,
      promotionApplied: promoActive,
      unitAdultPrice: adultPrice,
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

  const promoEnds = service.promotion?.endsAt;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-meru-muted">
          {promoActive ? "Tarifa promocional" : "Tarifa adulto"}
        </p>
        {promoActive ? (
          <div className="mt-1">
            <p className="text-sm text-meru-muted line-through">
              {formatCurrencyARS(service.price)}
            </p>
            <p className="text-3xl font-bold text-meru-primary">
              {formatCurrencyARS(adultPrice)}
            </p>
            {promoEnds ? (
              <p className="mt-1 text-xs text-meru-secondary">
                Promo válida hasta {promoEnds.split("-").reverse().join("/")}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-1 text-3xl font-bold text-meru-primary">
            {formatCurrencyARS(adultPrice)}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-meru-charcoal">¿Quiénes viajan?</p>

        <PassengerRow
          label="Adulto"
          unitLabel={formatCurrencyARS(adultPrice)}
          count={adult}
          onChange={(n) => {
            setAdult(clamp(n));
            setError(null);
          }}
        />

        {discountOptions.map((opt) => {
          const unit = applyDiscountPercent(adultPrice, opt.percent);
          return (
            <PassengerRow
              key={opt.id}
              label={opt.label}
              unitLabel={`${formatCurrencyARS(unit)} c/u (−${opt.percent}%)`}
              count={discountQty[opt.id] ?? 0}
              onChange={(n) => {
                setDiscountQty((prev) => ({ ...prev, [opt.id]: clamp(n) }));
                setError(null);
              }}
            />
          );
        })}

        <PassengerRow
          label="Infante"
          unitLabel="Gratis"
          count={infant}
          onChange={(n) => {
            setInfant(clamp(n));
            setError(null);
          }}
        />
      </div>

      <div className="rounded-lg bg-meru-sand/80 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-meru-muted">
            {seats} pasajero{seats === 1 ? "" : "s"}
          </span>
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

function PassengerRow({
  label,
  unitLabel,
  count,
  onChange,
}: {
  label: string;
  unitLabel: string;
  count: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-meru-border px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-meru-charcoal">{label}</p>
        <p className="text-xs text-meru-muted">{unitLabel}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-meru-border text-meru-charcoal hover:bg-meru-ice"
          aria-label={`Menos ${label}`}
          onClick={() => onChange(count - 1)}
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums text-meru-charcoal">
          {count}
        </span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-meru-border text-meru-charcoal hover:bg-meru-ice"
          aria-label={`Más ${label}`}
          onClick={() => onChange(count + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
