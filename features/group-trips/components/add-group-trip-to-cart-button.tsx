"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import type { GroupTrip } from "@/types/catalog";
import { formatCurrencyARS } from "@/lib/format";
import { formatYmdEs } from "@/features/group-trips/lib/dates";
import {
  getGroupTripBalancePerPerson,
  getGroupTripChargeNow,
  getGroupTripUnitPrice,
  groupTripHasDeposit,
} from "@/features/group-trips/lib/pricing";

type Props = {
  trip: GroupTrip;
};

export function AddGroupTripToCartButton({ trip }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [error, setError] = useState("");
  const [passengers, setPassengers] = useState(1);

  const unit = getGroupTripUnitPrice(trip);
  const chargeNow = getGroupTripChargeNow(trip);
  const balance = getGroupTripBalancePerPerson(trip);
  const hasDeposit = groupTripHasDeposit(trip);
  const remaining = Math.max(0, trip.stock);
  const soldOut = remaining < 1;

  function handleAdd() {
    setError("");
    if (soldOut) {
      setError("Este viaje está completo.");
      return;
    }
    if (passengers < 1 || passengers > remaining) {
      setError(`Hay ${remaining} lugar${remaining === 1 ? "" : "es"} disponible${remaining === 1 ? "" : "s"}.`);
      return;
    }

    const ok = addItem({
      kind: "groupTrip",
      serviceId: trip.id,
      groupTripId: trip.id,
      slug: trip.slug,
      title: trip.title,
      price: chargeNow,
      image: trip.photos[0],
      quantity: passengers,
      stayFrom: trip.startDate,
      stayTo: trip.endDate,
      depositAmount: hasDeposit ? trip.depositAmount : 0,
      fullUnitPrice: unit,
      balanceDueDate: trip.balanceDueDate,
      maxStock: remaining,
    });

    if (!ok) {
      setError(
        "No se pudo agregar. Si ya tenés una reserva pendiente, completala desde el carrito."
      );
      return;
    }

    router.push("/carrito");
  }

  if (soldOut) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        Este viaje está completo.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        {hasDeposit ? (
          <>
            <p className="text-sm text-brand-muted">Seña por persona</p>
            <p className="text-3xl font-semibold text-brand-primary">
              {formatCurrencyARS(chargeNow)}
            </p>
            <p className="mt-1 text-sm text-brand-muted">
              Tarifa {formatCurrencyARS(unit)}. Saldo {formatCurrencyARS(balance)}
              {trip.balanceDueDate ? ` hasta el ${formatYmdEs(trip.balanceDueDate)}` : ""}.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-brand-muted">Por persona</p>
            <p className="text-3xl font-semibold text-brand-primary">
              {formatCurrencyARS(chargeNow)}
            </p>
          </>
        )}
      </div>

      <p className="text-sm text-brand-muted">
        {remaining} lugar{remaining === 1 ? "" : "es"} disponible{remaining === 1 ? "" : "s"} de{" "}
        {trip.capacity}.
      </p>

      <div>
        <label className="mb-1.5 block text-xs text-brand-muted">Pasajeros</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border"
            aria-label="Menos pasajeros"
            onClick={() => setPassengers((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums">{passengers}</span>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border"
            aria-label="Más pasajeros"
            onClick={() => setPassengers((q) => Math.min(remaining, q + 1))}
          >
            +
          </button>
        </div>
      </div>

      <p className="text-sm font-semibold text-brand-charcoal">
        Ahora: {formatCurrencyARS(chargeNow * passengers)}
      </p>

      <Button type="button" onClick={handleAdd} className="w-full" size="lg">
        Reservar lugar
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
