"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import type { Service } from "@/types";

type Props = {
  service: Service;
};

export function AddToCartButton({ service }: Props) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full sm:w-auto"
      onClick={() =>
        addItem({
          serviceId: service.id,
          slug: service.slug,
          title: service.title,
          price: service.price,
          image: service.photos[0],
        })
      }
    >
      <ShoppingCart className="h-5 w-5" aria-hidden />
      Agregar al carrito
    </Button>
  );
}
