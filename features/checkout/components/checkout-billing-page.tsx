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
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { formatCurrencyARS } from "@/lib/format";
import { formatPassengersSummary, normalizeCartPassengers } from "@/features/excursions/lib/pricing";
import { formatDepartureLabel } from "@/features/excursions/lib/departures";

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

  async function onSubmit(billing: OrderBillingFormData) {
    setError("");
    setSubmitting(true);
    try {
      if (holdOrderId) {
        throw new Error(
          "Ya tenés una reserva pendiente de pago. Completala por WhatsApp desde el carrito."
        );
      }
      if (items.length === 0) {
        throw new Error("Tu carrito está vacío.");
      }

      const missingDeparture = items.some((item) => {
        if ((item.kind ?? "service") === "package") {
          return !item.stayFrom || !item.stayTo;
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
          paymentMethod: "coordinar",
          billing,
          items: items.map((item) => ({
            kind: item.kind ?? "service",
            serviceId: item.serviceId,
            packageId: item.packageId,
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
      router.replace(`/checkout/exito?orderId=${encodeURIComponent(orderId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al confirmar");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return <p className="text-meru-muted">Cargando…</p>;
  }

  if (items.length === 0 && !holdOrderId) {
    return (
      <div className="rounded-xl border border-dashed border-meru-border bg-white p-10 text-center">
        <p className="text-meru-charcoal">No hay ítems para facturar.</p>
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
          <div className="rounded-xl border border-meru-secondary/30 bg-meru-ice/60 p-4 text-sm text-meru-charcoal">
            <p className="font-medium">¿Querés agilizar la compra?</p>
            <p className="mt-1 text-meru-muted">
              Podés reservar sin cuenta. Si{" "}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent("/checkout")}`}
                className="font-semibold text-meru-secondary underline"
              >
                iniciás sesión
              </Link>{" "}
              o{" "}
              <Link
                href={`/registro?callbackUrl=${encodeURIComponent("/checkout")}`}
                className="font-semibold text-meru-secondary underline"
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
          className="space-y-6 rounded-xl border border-meru-border bg-white p-6"
          noValidate
        >
          <div>
            <h2 className="text-lg text-meru-charcoal">Datos de facturación</h2>
            <p className="mt-1 text-sm text-meru-muted">
              Los usamos para la reserva y la orden de servicio cuando se confirma el pago.
            </p>
          </div>

          <BillingFormFields register={register} errors={errors} />

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
                "Confirmar reserva"
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

      <aside className="h-fit rounded-xl border border-meru-border bg-white p-5 lg:sticky lg:top-24">
        <h2 className="text-lg text-meru-charcoal">Resumen</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((item) => (
            <li
              key={`${item.kind}-${item.serviceId}-${item.departureId ?? item.stayFrom ?? ""}`}
              className="border-b border-meru-border/60 pb-3 last:border-0"
            >
              <p className="font-medium text-meru-charcoal">{item.title}</p>
              {item.kind === "package" && item.stayFrom && item.stayTo ? (
                <p className="text-meru-muted">
                  {item.stayFrom.split("-").reverse().join("/")} →{" "}
                  {item.stayTo.split("-").reverse().join("/")}
                </p>
              ) : item.departureDate && item.departureTime ? (
                <p className="text-meru-muted">
                  {formatDepartureLabel({
                    date: item.departureDate,
                    time: item.departureTime,
                  })}
                </p>
              ) : null}
              {item.passengers ? (
                <p className="text-meru-muted">
                  {formatPassengersSummary(
                    normalizeCartPassengers(item.passengers) ?? {
                      adult: item.quantity,
                      infant: 0,
                      discounted: [],
                    }
                  )}
                </p>
              ) : (
                <p className="text-meru-muted">
                  {item.quantity} pasajero{item.quantity === 1 ? "" : "s"}
                </p>
              )}
              <p className="mt-1 font-semibold text-meru-primary">
                {formatCurrencyARS(item.lineTotal ?? item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-lg text-meru-charcoal">
          Total: <span className="font-semibold text-meru-primary">{formatCurrencyARS(total)}</span>
        </p>
        <p className="mt-3 text-xs text-meru-muted">
          Al confirmar reservamos el cupo. Después coordinamos el pago por WhatsApp. Cuando lo
          confirmemos, se genera la orden de servicio.
        </p>
      </aside>
    </div>
  );
}
