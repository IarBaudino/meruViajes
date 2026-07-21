import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, ServiceDiscounts } from "@/types";
import { canAddQuantity } from "@/lib/excursions/stock";
import {
  computePassengersLineTotal,
  mergePassengers,
  totalPassengers,
  type CartPassengers,
} from "@/features/excursions/lib/pricing";

type AddItemInput = Omit<CartItem, "quantity" | "lineTotal"> & {
  quantity?: number;
  maxStock?: number;
  passengers?: CartPassengers;
  discounts?: ServiceDiscounts;
  lineTotal?: number;
};

interface CartState {
  items: CartItem[];
  addItem: (item: AddItemInput) => boolean;
  updateQuantity: (serviceId: string, quantity: number, maxStock?: number) => boolean;
  removeItem: (serviceId: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

function itemLineTotal(item: CartItem): number {
  if (typeof item.lineTotal === "number") return item.lineTotal;
  return item.price * item.quantity;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const kind = item.kind ?? "service";
        const maxStock = item.maxStock;
        let added = false;

        set((state) => {
          const existing = state.items.find(
            (i) => i.serviceId === item.serviceId && (i.kind ?? "service") === kind
          );

          if (kind === "package") {
            const quantityToAdd = item.quantity ?? 1;
            const currentQty = existing?.quantity ?? 0;
            if (maxStock !== undefined && !canAddQuantity(currentQty, quantityToAdd, maxStock)) {
              return state;
            }
            added = true;
            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.serviceId === item.serviceId && (i.kind ?? "service") === "package"
                    ? {
                        ...i,
                        quantity: i.quantity + quantityToAdd,
                        lineTotal: i.price * (i.quantity + quantityToAdd),
                      }
                    : i
                ),
              };
            }
            return {
              items: [
                ...state.items,
                {
                  kind: "package",
                  serviceId: item.serviceId,
                  packageId: item.packageId,
                  slug: item.slug,
                  title: item.title,
                  price: item.price,
                  image: item.image,
                  quantity: quantityToAdd,
                  lineTotal: item.price * quantityToAdd,
                },
              ],
            };
          }

          const passengers = item.passengers ?? {
            adult: item.quantity ?? 1,
            minor: 0,
            infant: 0,
            senior: 0,
          };
          const seats = totalPassengers(passengers);
          if (seats < 1) return state;

          const currentSeats = existing?.quantity ?? 0;
          if (maxStock !== undefined && !canAddQuantity(currentSeats, seats, maxStock)) {
            return state;
          }

          added = true;
          const discounts = item.discounts;

          if (existing) {
            const mergedPassengers = mergePassengers(
              existing.passengers ?? {
                adult: existing.quantity,
                minor: 0,
                infant: 0,
                senior: 0,
              },
              passengers
            );
            const nextQty = totalPassengers(mergedPassengers);
            const nextTotal = computePassengersLineTotal(
              item.price,
              discounts ?? existing.discounts,
              mergedPassengers
            );

            return {
              items: state.items.map((i) =>
                i.serviceId === item.serviceId && (i.kind ?? "service") === "service"
                  ? {
                      ...i,
                      passengers: mergedPassengers,
                      discounts: discounts ?? existing.discounts,
                      quantity: nextQty,
                      price: item.price,
                      lineTotal: nextTotal,
                    }
                  : i
              ),
            };
          }

          const lineTotal =
            item.lineTotal ??
            computePassengersLineTotal(item.price, discounts, passengers);

          return {
            items: [
              ...state.items,
              {
                kind: "service",
                serviceId: item.serviceId,
                slug: item.slug,
                title: item.title,
                price: item.price,
                image: item.image,
                passengers,
                discounts,
                quantity: seats,
                lineTotal,
              },
            ],
          };
        });

        return added;
      },
      updateQuantity: (serviceId, quantity, maxStock) => {
        if (quantity < 1) {
          set((state) => ({
            items: state.items.filter((i) => i.serviceId !== serviceId),
          }));
          return true;
        }

        if (maxStock !== undefined && quantity > maxStock) {
          return false;
        }

        set((state) => ({
          items: state.items.map((i) => {
            if (i.serviceId !== serviceId) return i;
            if (i.kind === "package") {
              return { ...i, quantity, lineTotal: i.price * quantity };
            }
            // Para excursiones con desglose, no usar updateQuantity genérico.
            return { ...i, quantity, lineTotal: i.price * quantity, passengers: undefined };
          }),
        }));
        return true;
      },
      removeItem: (serviceId) =>
        set((state) => ({
          items: state.items.filter((i) => i.serviceId !== serviceId),
        })),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      totalPrice: () => get().items.reduce((acc, i) => acc + itemLineTotal(i), 0),
    }),
    { name: "meru-cart-v2" }
  )
);
