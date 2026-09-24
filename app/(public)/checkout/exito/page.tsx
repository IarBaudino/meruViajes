"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { useCartStore } from "@/stores/cart-store";
import { cartWhatsAppHref } from "@/lib/whatsapp";
import { formatCurrencyARS } from "@/lib/format";
import { TransferBankDetails } from "@/features/checkout/components/transfer-bank-details";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const items = useCartStore((s) => s.items);
  const holdOrderId = useCartStore((s) => s.holdOrderId);
  const total = useCartStore((s) => s.totalPrice());
  const effectiveOrderId = orderId || holdOrderId || "";
  const [transfer, setTransfer] = useState<{
    bankName: string;
    accountHolder: string;
    cbu: string;
    alias: string;
    notes: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/payments/methods");
        if (!res.ok) return;
        const data = await res.json();
        if (data.transfer) setTransfer(data.transfer);
      } catch {
        // silencioso
      }
    }
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <CheckCircle className="mx-auto h-12 w-12 text-brand-secondary" aria-hidden />
      <h1 className="mt-4 text-3xl text-brand-charcoal">Reserva recibida</h1>
      <p className="mt-3 text-brand-muted">
        El cupo quedó reservado.
        {effectiveOrderId
          ? ` Pedido #${effectiveOrderId.slice(0, 8).toUpperCase()}.`
          : ""}{" "}
        Te enviamos un mail con el detalle.
      </p>
      {total > 0 ? (
        <p className="mt-2 text-lg font-semibold text-brand-primary">
          Total: {formatCurrencyARS(total)}
        </p>
      ) : null}

      {transfer ? (
        <div className="mt-6">
          <TransferBankDetails transfer={transfer} />
        </div>
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
            Enviar comprobante por WhatsApp
          </WhatsAppButton>
        ) : null}
        <Link href="/carrito">
          <Button variant="outline">Ver carrito</Button>
        </Link>
        <Link href="/viajes-grupales" className="text-sm text-brand-secondary hover:underline">
          Seguir explorando
        </Link>
      </div>

      <p className="mt-8 text-sm text-brand-muted">
        Cuando confirmemos el pago (o Mercado Pago lo apruebe), generamos la orden de servicio y te
        avisamos por mail.
      </p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-brand-muted">Cargando…</p>}>
      <SuccessContent />
    </Suspense>
  );
}
