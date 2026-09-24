"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

type Props = {
  onNavigate?: () => void;
  className?: string;
};

export function CartNavLink({ onNavigate, className }: Props) {
  const totalItems = useCartStore((s) => s.totalItems());
  const href = "/carrito";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={
        className ??
        "relative inline-flex items-center justify-center rounded-lg p-2 text-meru-charcoal transition-colors hover:bg-meru-ice"
      }
      aria-label={
        totalItems > 0
          ? `Carrito, ${totalItems} producto${totalItems === 1 ? "" : "s"}`
          : "Carrito de reservas"
      }
    >
      <ShoppingCart className="h-5 w-5" aria-hidden />
      {totalItems > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-meru-secondary px-1 text-[10px] font-bold text-white">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      ) : null}
    </Link>
  );
}
