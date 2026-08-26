"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores/cart-store";
import type { ExcursionPackage } from "@/types/catalog";
import type { Service } from "@/types";
import { formatCurrencyARS } from "@/lib/format";
import {
  getEffectivePackagePrice,
  getPackageDiscountPercent,
  hasActivePackagePromotion,
} from "@/features/packages/lib/pricing";

type Props = {
  package: ExcursionPackage;
  services: Service[];
};

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AddPackageToCartButton({ package: pkg, services }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [error, setError] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [stayFrom, setStayFrom] = useState("");
  const [stayTo, setStayTo] = useState("");

  const minDate = useMemo(() => todayYmd(), []);
  const maxPassengers = 40;
  const promo = hasActivePackagePromotion(pkg);
  const percent = getPackageDiscountPercent(pkg);
  const unitPrice = getEffectivePackagePrice(pkg);

  function handleAdd() {
    setError("");

    if (services.length === 0) {
      setError("Este paquete no tiene excursiones asociadas.");
      return;
    }
    if (!stayFrom || !stayTo) {
      setError("Indicá desde qué fecha hasta qué fecha vas a estar.");
      return;
    }
    if (stayTo < stayFrom) {
      setError("La fecha hasta no puede ser anterior a la fecha desde.");
      return;
    }
    if (passengers < 1) {
      setError("Indicá al menos 1 pasajero.");
      return;
    }

    const ok = addItem({
      kind: "package",
      serviceId: pkg.id,
      packageId: pkg.id,
      slug: pkg.slug,
      title: pkg.title,
      price: unitPrice,
      image: pkg.photos[0],
      quantity: passengers,
      stayFrom,
      stayTo,
      promotionApplied: promo,
      includedServices: services.map((s) => ({
        serviceId: s.id,
        title: s.title,
        slug: s.slug,
        description: s.description?.slice(0, 280) || undefined,
      })),
      maxStock: maxPassengers,
    });

    if (!ok) {
      setError(
        "No se pudo agregar. Si ya tenés una reserva pendiente, completala desde el carrito."
      );
      return;
    }

    router.push("/carrito");
  }

  if (services.length === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        Este paquete no tiene excursiones asociadas.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-meru-muted">
        Indicá el rango de fechas y cuántos pasajeros van. La agencia arma el itinerario y te lo
        envía por privado.
      </p>

      {promo ? (
        <p className="rounded-lg border border-meru-secondary/30 bg-meru-secondary/5 px-3 py-2 text-sm text-meru-charcoal">
          Promo −{percent}% · {formatCurrencyARS(unitPrice)} por persona
          <span className="ml-2 text-meru-muted line-through">
            {formatCurrencyARS(pkg.price)}
          </span>
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Desde"
          type="date"
          min={minDate}
          value={stayFrom}
          onChange={(e) => {
            setStayFrom(e.target.value);
            if (stayTo && e.target.value && stayTo < e.target.value) {
              setStayTo(e.target.value);
            }
            setError("");
          }}
        />
        <Input
          label="Hasta"
          type="date"
          min={stayFrom || minDate}
          value={stayTo}
          onChange={(e) => {
            setStayTo(e.target.value);
            setError("");
          }}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-meru-muted">Pasajeros</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-meru-border"
            aria-label="Menos pasajeros"
            onClick={() => setPassengers((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums">{passengers}</span>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-meru-border"
            aria-label="Más pasajeros"
            onClick={() => setPassengers((q) => Math.min(maxPassengers, q + 1))}
          >
            +
          </button>
        </div>
      </div>

      <Button type="button" onClick={handleAdd} className="w-full" size="lg">
        Agregar paquete al carrito
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
