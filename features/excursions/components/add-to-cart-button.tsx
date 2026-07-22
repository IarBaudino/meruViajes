"use client";

import { Button } from "@/components/ui/button";

type Props = {
  serviceTitle?: string;
};

/** Botón legado deshabilitado: las excursiones solo se reservan con turno (fecha/hora). */
export function AddToCartButton(_props: Props) {
  return (
    <Button type="button" variant="secondary" size="lg" className="w-full sm:w-auto" disabled>
      Reservá eligiendo fecha y hora
    </Button>
  );
}
