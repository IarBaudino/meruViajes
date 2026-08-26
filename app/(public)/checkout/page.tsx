import type { Metadata } from "next";
import { CheckoutBillingPage } from "@/features/checkout/components/checkout-billing-page";

export const metadata: Metadata = {
  title: "Datos de facturación",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl text-meru-charcoal">Confirmar reserva</h1>
        <p className="mt-2 text-meru-muted">
          Completá tus datos de facturación para reservar el cupo.
        </p>
      </header>
      <CheckoutBillingPage />
    </div>
  );
}
