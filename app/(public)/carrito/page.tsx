import type { Metadata } from "next";
import { CartView } from "@/features/account/components/cart-view";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false, follow: false },
};

export default function PublicCartPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <CartView />
    </div>
  );
}
