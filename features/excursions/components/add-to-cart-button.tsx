"use client";

import { useCartStore } from "@/stores/cart-store";
import { canAddQuantity, hasAvailableStock } from "@/lib/excursions/stock";
import { Button } from "@/components/ui/button";
import type { Service } from "@/types";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";

type Props = {
  service: Service;
};

export function AddToCartButton({ service }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const cartQuantity = useCartStore(
    (s) => s.items.find((i) => i.serviceId === service.id)?.quantity ?? 0
  );
  const [message, setMessage] = useState<string | null>(null);

  const inStock = hasAvailableStock(service.stock);

  function handleAdd() {
    if (!inStock) return;

    if (!canAddQuantity(cartQuantity, 1, service.stock)) {
      setMessage(`Solo hay ${service.stock} cupo${service.stock === 1 ? "" : "s"} disponibles.`);
      return;
    }

    addItem({
      serviceId: service.id,
      slug: service.slug,
      title: service.title,
      price: service.price,
      image: service.photos[0],
      maxStock: service.stock,
    });
    setMessage("Agregada al carrito");
    setTimeout(() => setMessage(null), 2500);
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full sm:w-auto"
        disabled={!inStock}
        onClick={handleAdd}
      >
        <ShoppingCart className="h-5 w-5" aria-hidden />
        {inStock ? "Agregar al carrito" : "Sin cupos"}
      </Button>
      {message ? (
        <p className="text-sm text-meru-secondary" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
