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
import { formatPassengersSummary } from "@/features/excursions/lib/pricing";

type ProfileCheck = {
  ok: boolean;
  missing: string[];
};

type PaymentMethod = "coordinar" | "getnet";

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("coordinar");
  const [getnetReady, setGetnetReady] = useState(false);

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

  useEffect(() => {
    async function checkGetnet() {
      const res = await fetch("/api/payments/getnet/status");
      if (!res.ok) return;
      const data = await res.json();
      setGetnetReady(Boolean(data.configured));
    }
    void checkGetnet();
  }, []);

  async function handleCheckout() {
    setCheckoutError("");
    setCheckingOut(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          items: items.map((item) => ({
            kind: item.kind ?? "service",
            serviceId: item.serviceId,
            packageId: item.packageId,
            quantity: item.quantity,
            passengers: item.passengers,
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "No se pudo confirmar la reserva");
      }

      if (paymentMethod === "getnet" && json.checkoutUrl) {
        clearCart();
        window.location.href = json.checkoutUrl as string;
        return;
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
        description="Revisá tus excursiones o paquetes y confirmá la reserva."
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
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/excursiones">
              <Button>Explorar excursiones</Button>
            </Link>
            <Link href="/paquetes">
              <Button variant="outline">Ver paquetes</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {items.map((item) => {
              const isPackage = item.kind === "package";
              const href = isPackage
                ? `/paquetes/${item.slug}`
                : `/excursiones/${item.slug}`;
              const lineTotal = item.lineTotal ?? item.price * item.quantity;
              return (
                <li
                  key={`${item.kind ?? "service"}-${item.serviceId}`}
                  className="flex gap-4 rounded-xl border border-meru-border bg-white p-4"
                >
                  {item.image ? (
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <Image src={item.image} alt="" fill className="object-cover" />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    {isPackage ? (
                      <p className="text-xs font-medium uppercase tracking-wider text-meru-secondary">
                        Paquete
                      </p>
                    ) : null}
                    <Link href={href} className="text-meru-charcoal hover:text-meru-secondary">
                      {item.title}
                    </Link>
                    {item.passengers ? (
                      <p className="mt-1 text-sm text-meru-muted">
                        {formatPassengersSummary(item.passengers)}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-meru-muted">
                        Cantidad: {item.quantity}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-semibold text-meru-primary">
                      {formatCurrencyARS(lineTotal)}
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
              );
            })}
          </ul>

          <fieldset className="mt-6 rounded-xl border border-meru-border bg-white p-5">
            <legend className="px-1 text-sm font-medium text-meru-charcoal">
              Forma de pago
            </legend>
            <div className="mt-2 space-y-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  className="mt-1"
                  checked={paymentMethod === "coordinar"}
                  onChange={() => setPaymentMethod("coordinar")}
                />
                <span>
                  <span className="block text-sm text-meru-charcoal">
                    Coordinar con la agencia
                  </span>
                  <span className="text-xs text-meru-muted">
                    Reservamos el cupo y te contactamos para el pago.
                  </span>
                </span>
              </label>
              <label
                className={`flex items-start gap-3 ${getnetReady ? "cursor-pointer" : "opacity-60"}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  className="mt-1"
                  checked={paymentMethod === "getnet"}
                  disabled={!getnetReady}
                  onChange={() => setPaymentMethod("getnet")}
                />
                <span>
                  <span className="block text-sm text-meru-charcoal">Pagar con Getnet</span>
                  <span className="text-xs text-meru-muted">
                    {getnetReady
                      ? "Te redirigimos al checkout seguro de Getnet."
                      : "Disponible cuando estén configuradas las credenciales de Getnet."}
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

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
                ) : paymentMethod === "getnet" ? (
                  "Pagar con Getnet"
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
        </>
      )}
    </div>
  );
}
