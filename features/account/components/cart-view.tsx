"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/stores/cart-store";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { formatCurrencyARS } from "@/lib/format";

export function CartView() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.totalPrice());

  return (
    <div>
      <PageHeader
        title="Carrito"
        description="Excursiones que agregaste. El checkout con pago online llegará pronto."
      />

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-meru-border bg-white p-10 text-center">
          <p className="text-meru-charcoal">Tu carrito está vacío.</p>
          <Link href="/excursiones" className="mt-4 inline-block">
            <Button>Explorar excursiones</Button>
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.serviceId}
                className="flex gap-4 rounded-xl border border-meru-border bg-white p-4"
              >
                {item.image ? (
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <Image src={item.image} alt="" fill className="object-cover" />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/excursiones/${item.slug}`}
                    className="text-meru-charcoal hover:text-meru-secondary"
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm text-meru-muted">
                    {formatCurrencyARS(item.price)} × {item.quantity}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => removeItem(item.serviceId)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-meru-border bg-white p-5">
            <p className="text-lg text-meru-charcoal">
              Total: <span className="text-meru-primary">{formatCurrencyARS(total)}</span>
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={clearCart}>
                Vaciar carrito
              </Button>
              <Button disabled title="Próximamente">
                Confirmar reserva
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
