"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { formatCurrencyARS } from "@/lib/format";

type ProfileCheck = {
  ok: boolean;
  missing: string[];
};

export function CartView() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.totalPrice());

  const [profileCheck, setProfileCheck] = useState<ProfileCheck | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutOk, setCheckoutOk] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch("/api/users/me");
      if (!res.ok) {
        setProfileCheck({ ok: false, missing: ["perfil"] });
        return;
      }
      const data = await res.json();
      const missing: string[] = [];
      if (!data.dni?.trim() || data.dni.trim().length < 6) missing.push("DNI / pasaporte");
      if (!data.phone?.trim() || data.phone.trim().length < 6) missing.push("teléfono");
      if (!data.name?.trim()) missing.push("nombre");
      setProfileCheck({ ok: missing.length === 0, missing });
    }
    void loadProfile();
  }, []);

  async function handleCheckout() {
    setCheckoutError("");
    setCheckingOut(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            serviceId: item.serviceId,
            quantity: item.quantity,
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "No se pudo confirmar la reserva");
      }

      clearCart();
      setCheckoutOk(true);
      router.push("/mi-cuenta/reservas?reserva=ok");
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Error al confirmar");
    } finally {
      setCheckingOut(false);
    }
  }

  const profileIncomplete = profileCheck && !profileCheck.ok;

  return (
    <div>
      <PageHeader
        title="Carrito"
        description="Revisá tus excursiones y confirmá la reserva. El pago se coordina con la agencia."
      />

      {checkoutOk ? (
        <p className="mb-6 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" aria-hidden />
          Reserva confirmada. Te enviamos un email con el detalle.
        </p>
      ) : null}

      {profileIncomplete ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Completá tu{" "}
              {profileCheck.missing.join(", ")} en{" "}
              <Link href="/mi-cuenta/perfil" className="font-semibold underline">
                Mi perfil
              </Link>{" "}
              antes de confirmar.
            </span>
          </p>
        </div>
      ) : null}

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
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={clearCart} disabled={checkingOut}>
                Vaciar carrito
              </Button>
              <Button
                type="button"
                disabled={checkingOut || profileIncomplete === true}
                onClick={() => void handleCheckout()}
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Confirmando…
                  </>
                ) : (
                  "Confirmar reserva"
                )}
              </Button>
            </div>
          </div>

          {checkoutError ? (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {checkoutError}
            </p>
          ) : null}

          <p className="mt-4 text-xs text-meru-muted">
            Al confirmar, reservamos los cupos y te contactamos para el pago. Estado inicial:{" "}
            <strong>pendiente</strong>.
          </p>
        </>
      )}
    </div>
  );
}
