"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  billingToFormValues,
  orderBillingSchema,
  parseStoredBilling,
  type OrderBillingFormData,
} from "@/schemas/billing";
import { BillingFormFields } from "@/features/checkout/components/billing-form-fields";
import { TransferBankDetails } from "@/features/checkout/components/transfer-bank-details";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CheckoutPaymentMethod } from "@/lib/payments/methods";
import { formatCurrencyARS } from "@/lib/format";
import type { AppliedCoupon } from "@/types/coupon";
import type { CouponAppliesTo } from "@/schemas/coupon";
import { formatPassengersSummary, normalizeCartPassengers } from "@/features/excursions/lib/pricing";
import { formatDepartureLabel } from "@/features/excursions/lib/departures";

type PaymentMethodsResponse = {
  mercadopago: boolean;
  transfer: {
    bankName: string;
    accountHolder: string;
    cbu: string;
    alias: string;
    notes: string;
  };
};

export function CheckoutBillingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const items = useCartStore((s) => s.items);
  const holdOrderId = useCartStore((s) => s.holdOrderId);
  const setHoldOrderId = useCartStore((s) => s.setHoldOrderId);
  const total = useCartStore((s) => s.totalPrice());
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("transfer");
  const [methods, setMethods] = useState<PaymentMethodsResponse | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrderBillingFormData>({
    resolver: zodResolver(orderBillingSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneCountryCode: "+54",
      phoneNumber: "",
      identificationType: "DNI",
      identificationNumber: "",
      addressCountry: "Argentina",
      addressCity: "",
      addressStreet: "",
      addressApartment: "",
      addressPostalCode: "",
    },
  });

  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    if (useCartStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    async function loadMethods() {
      try {
        const res = await fetch("/api/payments/methods");
        if (!res.ok) return;
        const data = (await res.json()) as PaymentMethodsResponse;
        setMethods(data);
      } catch {
        // silencioso
      }
    }
    void loadMethods();
  }, []);

  useEffect(() => {
    async function prefillFromProfile() {
      if (status !== "authenticated") return;
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) return;
        const data = await res.json();
        const stored = parseStoredBilling(data.billing);
        reset(
          billingToFormValues(stored, {
            fullName: data.name?.trim() || "",
            email: data.email?.trim() || session?.user?.email || "",
            phoneNumber: stored?.phoneNumber || "",
            identificationNumber: data.dni?.trim() || "",
            addressStreet:
              typeof data.address === "string" && !stored ? data.address.trim() : "",
          })
        );
      } catch {
        // silencioso
      }
    }
    void prefillFromProfile();
  }, [status, session?.user?.email, reset]);

  async function applyCoupon() {
    setCouponError("");
    const code = couponInput.trim();
    if (code.length < 3) {
      setCouponError("Ingresá un código.");
      return;
    }
    const kinds = Array.from(
      new Set(
        items.map((item): CouponAppliesTo => {
          if (item.kind === "package") return "package";
          if (item.kind === "groupTrip") return "groupTrip";
          return "excursion";
        })
      )
    );
    setCouponBusy(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: total, kinds }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCoupon(null);
        throw new Error(json.error ?? "No se pudo aplicar el cupón");
      }
      setCoupon(json.coupon as AppliedCoupon);
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "No se pudo aplicar el cupón");
    } finally {
      setCouponBusy(false);
    }
  }

  const payable = Math.max(0, total - (coupon?.discountAmount ?? 0));

  async function onSubmit(billing: OrderBillingFormData) {
    setError("");
    setSubmitting(true);
    try {
      if (holdOrderId) {
          throw new Error(
            "Ya tenés una reserva pendiente de pago. Completala desde el carrito."
          );
      }
      if (items.length === 0) {
        throw new Error("Tu carrito está vacío.");
      }

      const missingDeparture = items.some((item) => {
        if ((item.kind ?? "service") === "package" || item.kind === "groupTrip") {
          return item.kind === "package" && (!item.stayFrom || !item.stayTo);
        }
        return !item.departureDate || !item.departureTime || !item.departureId;
      });
      if (missingDeparture) {
        throw new Error("Hay ítems sin fechas. Volvé al carrito y revisá la reserva.");
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          couponCode: coupon?.code,
          billing,
          items: items.map((item) => ({
            kind: item.kind ?? "service",
            serviceId: item.serviceId,
            packageId: item.packageId,
            groupTripId: item.groupTripId,
            quantity: item.quantity,
            passengers: item.passengers,
            departureId: item.departureId,
            departureDate: item.departureDate,
            departureTime: item.departureTime,
            catalogSeason: item.catalogSeason,
            stayFrom: item.stayFrom,
            stayTo: item.stayTo,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "No se pudo confirmar la reserva");
      }

      const orderId = String(json.orderId ?? "");
      if (orderId) setHoldOrderId(orderId);
      if (typeof json.checkoutUrl === "string" && json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }
      router.replace(`/checkout/exito?orderId=${encodeURIComponent(orderId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al confirmar");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return <p className="text-brand-muted">Cargando…</p>;
  }

  if (items.length === 0 && !holdOrderId) {
    return (
      <div className="rounded-xl border border-dashed border-brand-border bg-white p-10 text-center">
        <p className="text-brand-charcoal">No hay ítems para facturar.</p>
        <Link href="/carrito" className="mt-4 inline-block">
          <Button>Volver al carrito</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {status !== "authenticated" ? (
          <div className="rounded-xl border border-brand-border bg-brand-ice/60 p-4 text-sm text-brand-charcoal">
            <p className="font-medium">¿Querés agilizar la compra?</p>
            <p className="mt-1 text-brand-muted">
              Podés reservar sin cuenta. Si{" "}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent("/checkout")}`}
                className="font-semibold text-brand-secondary underline"
              >
                iniciás sesión
              </Link>{" "}
              o{" "}
              <Link
                href={`/registro?callbackUrl=${encodeURIComponent("/checkout")}`}
                className="font-semibold text-brand-secondary underline"
              >
                creás una cuenta
              </Link>
              , autocompletamos tus datos y podés ver tus reservas después.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            Sesión iniciada como {session?.user?.email}. Completá o revisá los datos de
            facturación.
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-xl border border-brand-border bg-white p-6"
          noValidate
        >
          <div>
            <h2 className="text-lg text-brand-charcoal">Datos de facturación</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Los usamos para la reserva y la orden de servicio cuando se confirma el pago.
            </p>
          </div>

          <BillingFormFields register={register} errors={errors} />

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-brand-charcoal">Forma de pago</legend>
            <label className="flex items-start gap-3 rounded-lg border border-brand-border p-3">
              <input
                type="radio"
                name="paymentMethod"
                className="mt-1"
                checked={paymentMethod === "transfer"}
                onChange={() => setPaymentMethod("transfer")}
              />
              <span>
                <span className="block text-sm font-medium text-brand-charcoal">Transferencia</span>
                <span className="text-xs text-brand-muted">
                  Te mostramos CBU y alias. El cupo queda reservado hasta que confirmemos el pago.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-brand-border p-3">
              <input
                type="radio"
                name="paymentMethod"
                className="mt-1"
                checked={paymentMethod === "mercadopago"}
                disabled={!methods?.mercadopago}
                onChange={() => setPaymentMethod("mercadopago")}
              />
              <span>
                <span className="block text-sm font-medium text-brand-charcoal">Mercado Pago</span>
                <span className="text-xs text-brand-muted">
                  {methods?.mercadopago
                    ? "Te redirigimos a Mercado Pago para pagar ahora."
                    : "Todavía no está habilitado en el sitio."}
                </span>
              </span>
            </label>
            {paymentMethod === "transfer" && methods?.transfer ? (
              <TransferBankDetails transfer={methods.transfer} />
            ) : null}
          </fieldset>

          {error ? (
            <p className="flex items-start gap-2 text-sm text-red-600" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Confirmando…
                </>
              ) : (
                paymentMethod === "mercadopago" ? "Ir a Mercado Pago" : "Confirmar reserva"
              )}
            </Button>
            <Link href="/carrito">
              <Button type="button" variant="outline" disabled={submitting}>
                Volver al carrito
              </Button>
            </Link>
          </div>
        </form>
      </div>

      <aside className="h-fit rounded-xl border border-brand-border bg-white p-5 lg:sticky lg:top-24">
        <h2 className="text-lg text-brand-charcoal">Resumen</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((item) => (
            <li
              key={`${item.kind}-${item.serviceId}-${item.departureId ?? item.stayFrom ?? ""}`}
              className="border-b border-brand-border/60 pb-3 last:border-0"
            >
              <p className="font-medium text-brand-charcoal">{item.title}</p>
              {item.kind === "package" && item.stayFrom && item.stayTo ? (
                <p className="text-brand-muted">
                  {item.stayFrom.split("-").reverse().join("/")} →{" "}
                  {item.stayTo.split("-").reverse().join("/")}
                </p>
              ) : item.kind === "groupTrip" && item.stayFrom && item.stayTo ? (
                <p className="text-brand-muted">
                  Viaje grupal · {item.stayFrom.split("-").reverse().join("/")} →{" "}
                  {item.stayTo.split("-").reverse().join("/")}
                </p>
              ) : item.departureDate && item.departureTime ? (
                <p className="text-brand-muted">
                  {formatDepartureLabel({
                    date: item.departureDate,
                    time: item.departureTime,
                  })}
                </p>
              ) : null}
              {item.passengers ? (
                <p className="text-brand-muted">
                  {formatPassengersSummary(
                    normalizeCartPassengers(item.passengers) ?? {
                      adult: item.quantity,
                      infant: 0,
                      discounted: [],
                    }
                  )}
                </p>
              ) : (
                <p className="text-brand-muted">
                  {item.quantity} pasajero{item.quantity === 1 ? "" : "s"}
                </p>
              )}
              <p className="mt-1 font-semibold text-brand-primary">
                {formatCurrencyARS(item.lineTotal ?? item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2 border-t border-brand-border pt-4">
          <p className="text-sm font-medium text-brand-charcoal">Cupón de vendedora</p>
          {coupon ? (
            <div className="rounded-lg border border-brand-border bg-brand-ice/50 p-3 text-sm">
              <p className="font-medium text-brand-charcoal">{coupon.code}</p>
              <p className="text-brand-muted">
                −{formatCurrencyARS(coupon.discountAmount)}
                {coupon.sellerName ? ` · ${coupon.sellerName}` : ""}
              </p>
              <button
                type="button"
                className="mt-1 text-xs text-red-600 hover:underline"
                onClick={() => {
                  setCoupon(null);
                  setCouponInput("");
                }}
              >
                Quitar cupón
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Código"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              />
              <Button type="button" variant="outline" onClick={() => void applyCoupon()} disabled={couponBusy}>
                Aplicar
              </Button>
            </div>
          )}
          {couponError ? <p className="text-xs text-red-600">{couponError}</p> : null}
        </div>
        {coupon ? (
          <p className="mt-3 text-sm text-brand-muted">
            Subtotal {formatCurrencyARS(total)} · descuento {formatCurrencyARS(coupon.discountAmount)}
          </p>
        ) : null}
        <p className="mt-4 text-lg text-brand-charcoal">
          Total: <span className="font-semibold text-brand-primary">{formatCurrencyARS(payable)}</span>
        </p>
        <p className="mt-3 text-xs text-brand-muted">
          Al confirmar reservamos el cupo. Si elegís transferencia, el pago queda pendiente hasta
          que lo acreditemos. Con Mercado Pago se confirma al aprobar el pago.
        </p>
      </aside>
    </div>
  );
}
