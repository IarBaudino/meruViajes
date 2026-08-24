"use client";

import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import type { CatalogSeason, Service } from "@/types";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { canAddQuantity } from "@/lib/excursions/stock";
import { formatCurrencyARS } from "@/lib/format";
import {
  applyDiscountPercent,
  computePassengersLineTotal,
  getApplicableDiscountOptions,
  getEffectiveAdultPrice,
  getServiceDiscountPercent,
  hasActivePromotion,
  totalPassengers,
  type CartPassengers,
} from "@/features/excursions/lib/pricing";
import {
  formatDepartureLabel,
  getBookableDepartures,
  serviceUsesDepartures,
  slotRemaining,
} from "@/features/excursions/lib/departures";
import { DepartureSchedulePicker } from "@/features/excursions/components/departure-schedule-picker";

type Props = {
  service: Service;
  catalogSeason?: CatalogSeason | null;
};

export function ExcursionBookingPanel({ service, catalogSeason = null }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const hasDeparturesConfigured = serviceUsesDepartures(service.departures);
  const bookable = useMemo(
    () => getBookableDepartures(service.departures),
    [service.departures]
  );

  const cartItems = useCartStore((s) => s.items);
  const promoActive = hasActivePromotion(service);
  const promoPercent = getServiceDiscountPercent(service);
  const adultPrice = getEffectiveAdultPrice(service);
  const discountOptions = getApplicableDiscountOptions(service);

  const dates = useMemo(() => {
    const set = new Set(bookable.map((d) => d.date));
    return Array.from(set).sort();
  }, [bookable]);

  const [selectedDate, setSelectedDate] = useState(dates[0] ?? "");
  const [departureId, setDepartureId] = useState(() => {
    const firstDate = dates[0];
    return bookable.find((d) => d.date === firstDate)?.id ?? bookable[0]?.id ?? "";
  });
  const [adult, setAdult] = useState(1);
  const [infant, setInfant] = useState(0);
  const [discountQty, setDiscountQty] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveDate = selectedDate || dates[0] || "";
  const timesForDate = bookable.filter((d) => d.date === effectiveDate);
  const selected = bookable.find((d) => d.id === departureId) ?? timesForDate[0] ?? null;

  const cartQuantity =
    cartItems.find(
      (i) =>
        i.serviceId === service.id &&
        (i.kind ?? "service") === "service" &&
        (i.departureId ?? "") === (selected?.id ?? "") &&
        (i.catalogSeason ?? "") === (catalogSeason ?? "")
    )?.quantity ?? 0;

  const maxStock = selected ? slotRemaining(selected) : 0;

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

  const canBook = Boolean(selected && maxStock > 0);
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

    if (!hasDeparturesConfigured) {
      setError("Esta excursión todavía no tiene salidas cargadas.");
      return;
    }
    if (!selected) {
      setError("Elegí una fecha y hora disponibles.");
      return;
    }
    if (maxStock < 1) {
      setError("Ese turno no tiene cupos disponibles.");
      return;
    }
    if (seats < 1) {
      setError("Seleccioná al menos un pasajero.");
      return;
    }
    if (!canAddQuantity(cartQuantity, seats, maxStock)) {
      setError(
        "No contamos con esa cantidad de lugares para esa fecha y hora. Probá con otra salida o menos pasajeros."
      );
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
      departureId: selected.id,
      departureDate: selected.date,
      departureTime: selected.time,
      catalogSeason: catalogSeason ?? undefined,
      lineTotal,
      maxStock,
    });

    if (!ok) {
      setError(
        "No se pudo agregar. Si ya tenés una reserva pendiente de pago, completala desde el carrito antes de armar otra."
      );
      return;
    }

    setMessage("Agregada al carrito");
    setTimeout(() => setMessage(null), 2500);
  }

  function onPickDate(date: string) {
    setSelectedDate(date);
    const first = bookable.find((d) => d.date === date);
    setDepartureId(first?.id ?? "");
  }

  function onPickTime(id: string) {
    setDepartureId(id);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-meru-muted">
          {promoActive ? `Tarifa promocional (−${promoPercent}%)` : "Tarifa adulto"}
        </p>
        {promoActive ? (
          <div className="mt-1">
            <p className="text-sm text-meru-muted line-through">
              {formatCurrencyARS(service.price)}
            </p>
            <p className="text-3xl font-bold text-meru-primary">
              {formatCurrencyARS(adultPrice)}
            </p>
            {service.promotion?.endsAt ? (
              <p className="mt-1 text-xs text-meru-secondary">
                Promo válida hasta {service.promotion.endsAt.split("-").reverse().join("/")}
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
        {!hasDeparturesConfigured ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Por ahora no hay salidas publicadas para esta excursión. No se puede reservar online
            hasta que se carguen fecha y hora con cupos.
          </p>
        ) : bookable.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            No hay salidas con cupos disponibles en este momento.
          </p>
        ) : (
          <DepartureSchedulePicker
            availableDates={dates}
            selectedDate={effectiveDate}
            onSelectDate={onPickDate}
            timeOptions={timesForDate.map((slot) => ({
              id: slot.id,
              time: slot.time,
              disabled: slotRemaining(slot) < 1,
            }))}
            selectedTimeId={selected?.id ?? ""}
            onSelectTime={onPickTime}
          />
        )}
      </div>

      {canBook ? (
        <>
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
                {selected ? ` · ${formatDepartureLabel(selected)}` : ""}
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
            disabled={seats < 1}
            onClick={handleAdd}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden />
            Agregar al carrito
          </Button>
        </>
      ) : null}

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
