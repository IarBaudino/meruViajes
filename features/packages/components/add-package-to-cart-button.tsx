"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import type { ExcursionPackage } from "@/types/catalog";
import type { Service } from "@/types";
import { getCommonPackageSlots } from "@/features/excursions/lib/departures";
import { DepartureSchedulePicker } from "@/features/excursions/components/departure-schedule-picker";

type Props = {
  package: ExcursionPackage;
  services: Service[];
};

export function AddPackageToCartButton({ package: pkg, services }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const [error, setError] = useState("");

  const common = useMemo(() => getCommonPackageSlots(services), [services]);
  const dates = useMemo(() => Array.from(new Set(common.map((c) => c.date))).sort(), [common]);

  const [selectedDate, setSelectedDate] = useState(dates[0] ?? "");
  const times = common.filter((c) => c.date === (selectedDate || dates[0]));
  const [selectedKey, setSelectedKey] = useState(() =>
    times[0] ? `${times[0].date}|${times[0].time}` : ""
  );

  const selected =
    common.find((c) => `${c.date}|${c.time}` === selectedKey) ?? times[0] ?? null;

  const cartQty =
    cartItems.find(
      (i) =>
        (i.kind ?? "service") === "package" &&
        i.serviceId === pkg.id &&
        i.departureDate === selected?.date &&
        i.departureTime === selected?.time
    )?.quantity ?? 0;

  const maxAvailable = selected
    ? Math.min(pkg.stock > 0 ? pkg.stock : Number.POSITIVE_INFINITY, selected.remaining)
    : 0;

  function onPickDate(date: string) {
    setSelectedDate(date);
    const first = common.find((c) => c.date === date);
    setSelectedKey(first ? `${first.date}|${first.time}` : "");
    setError("");
  }

  function handleAdd() {
    setError("");
    if (!selected) {
      setError("Elegí fecha y hora disponibles para el paquete.");
      return;
    }
    if (maxAvailable < 1 || cartQty + 1 > maxAvailable) {
      setError(
        "No contamos con esa cantidad de lugares para esa fecha y hora. Probá con otra salida."
      );
      return;
    }

    const ok = addItem({
      kind: "package",
      serviceId: pkg.id,
      packageId: pkg.id,
      slug: pkg.slug,
      title: pkg.title,
      price: pkg.price,
      image: pkg.photos[0],
      quantity: 1,
      departureDate: selected.date,
      departureTime: selected.time,
      maxStock: maxAvailable,
    });

    if (!ok) {
      setError(
        "No contamos con esa cantidad de lugares para esa fecha y hora. Probá con otra salida."
      );
      return;
    }

    router.push("/mi-cuenta/carrito");
  }

  if (common.length === 0) {
    return (
      <p className="text-sm text-amber-950 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        Este paquete no se puede reservar online: hace falta que todas las excursiones incluidas
        tengan la misma fecha y hora con cupos.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <DepartureSchedulePicker
        availableDates={dates}
        selectedDate={selectedDate || dates[0] || ""}
        onSelectDate={onPickDate}
        timeOptions={times.map((slot) => ({
          id: `${slot.date}|${slot.time}`,
          time: slot.time,
          disabled: slot.remaining < 1,
        }))}
        selectedTimeId={selected ? `${selected.date}|${selected.time}` : ""}
        onSelectTime={(id) => {
          setSelectedKey(id);
          setError("");
        }}
      />

      <Button type="button" onClick={handleAdd} disabled={!selected || maxAvailable < 1}>
        Agregar paquete al carrito
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
