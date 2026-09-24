"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PayMercadoPagoButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "No se pudo iniciar Mercado Pago");
      }
      if (typeof json.checkoutUrl === "string" && json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }
      throw new Error("Mercado Pago no devolvió URL");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al pagar");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button type="button" onClick={() => void pay()} isLoading={busy} className="w-full">
        Pagar con Mercado Pago
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
