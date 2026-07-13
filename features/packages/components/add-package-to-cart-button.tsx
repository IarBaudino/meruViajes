"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import type { ExcursionPackage } from "@/types/catalog";

type Props = {
  package: ExcursionPackage;
};

export function AddPackageToCartButton({ package: pkg }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [error, setError] = useState("");

  function handleAdd() {
    setError("");
    const ok = addItem({
      kind: "package",
      serviceId: pkg.id,
      packageId: pkg.id,
      slug: pkg.slug,
      title: pkg.title,
      price: pkg.price,
      image: pkg.photos[0],
      quantity: 1,
      maxStock: pkg.stock,
    });

    if (!ok) {
      setError("No hay cupos suficientes para este paquete.");
      return;
    }

    router.push("/mi-cuenta/carrito");
  }

  return (
    <div>
      <Button type="button" onClick={handleAdd} disabled={pkg.stock <= 0}>
        {pkg.stock <= 0 ? "Sin cupos" : "Agregar paquete al carrito"}
      </Button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
