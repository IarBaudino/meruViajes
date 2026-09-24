"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { useCartStore } from "@/stores/cart-store";
import { cartWhatsAppHref } from "@/lib/whatsapp";
import { formatCurrencyARS } from "@/lib/format";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const items = useCartStore((s) => s.items);
  const holdOrderId = useCartStore((s) => s.holdOrderId);
  const total = useCartStore((s) => s.totalPrice());
  const effectiveOrderId = orderId || holdOrderId || "";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <CheckCircle className="mx-auto h-12 w-12 text-meru-secondary" aria-hidden />
      <h1 className="mt-4 text-3xl text-meru-charcoal">Reserva recibida</h1>
      <p className="mt-3 text-meru-muted">
        El cupo quedó reservado con pago pendiente.
        {effectiveOrderId
          ? ` Pedido #${effectiveOrderId.slice(0, 8).toUpperCase()}.`
          : ""}{" "}
        Te enviamos un mail con el detalle.
      </p>
      {total > 0 ? (
        <p className="mt-2 text-lg font-semibold text-meru-primary">
          Total: {formatCurrencyARS(total)}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col items-center gap-3">
        {effectiveOrderId ? (
          <WhatsAppButton
            href={cartWhatsAppHref({
              items,
              total,
              orderId: effectiveOrderId,
            })}
          >
            Coordinar pago por WhatsApp
          </WhatsAppButton>
        ) : null}
        <Link href="/carrito">
          <Button variant="outline">Ver carrito</Button>
        </Link>
        <Link href="/excursiones" className="text-sm text-meru-secondary hover:underline">
          Seguir explorando
        </Link>
      </div>

      <p className="mt-8 text-sm text-meru-muted">
        Cuando confirmemos el pago, generamos la orden de servicio y te avisamos por mail.
      </p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-meru-muted">Cargando…</p>}>
      <SuccessContent />
    </Suspense>
  );
}
