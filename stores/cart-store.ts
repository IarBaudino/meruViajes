import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, DiscountOption } from "@/types";
import { canAddQuantity } from "@/lib/excursions/stock";
import {
  computePassengersLineTotal,
  mergePassengers,
  normalizeCartPassengers,
  totalPassengers,
  type CartPassengers,
} from "@/features/excursions/lib/pricing";

type AddItemInput = Omit<CartItem, "quantity" | "lineTotal"> & {
  quantity?: number;
  maxStock?: number;
  passengers?: CartPassengers;
  discountOptions?: DiscountOption[];
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

function emptyPassengersFromQty(quantity: number): CartPassengers {
  return { adult: quantity, infant: 0, discounted: [] };
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

          const passengers =
            item.passengers ??
            emptyPassengersFromQty(item.quantity ?? 1);
          const seats = totalPassengers(passengers);
          if (seats < 1) return state;

          const currentSeats = existing?.quantity ?? 0;
          if (maxStock !== undefined && !canAddQuantity(currentSeats, seats, maxStock)) {
            return state;
          }

          added = true;
          const adultPrice = item.unitAdultPrice ?? item.price;

          if (existing) {
            const existingPassengers =
              normalizeCartPassengers(existing.passengers) ??
              emptyPassengersFromQty(existing.quantity);
            const mergedPassengers = mergePassengers(existingPassengers, passengers);
            const nextQty = totalPassengers(mergedPassengers);
            const nextTotal = computePassengersLineTotal(adultPrice, mergedPassengers);

            return {
              items: state.items.map((i) =>
                i.serviceId === item.serviceId && (i.kind ?? "service") === "service"
                  ? {
                      ...i,
                      passengers: mergedPassengers,
                      discountOptions: item.discountOptions ?? existing.discountOptions,
                      promotionApplied: item.promotionApplied ?? existing.promotionApplied,
                      unitAdultPrice: adultPrice,
                      quantity: nextQty,
                      price: adultPrice,
                      lineTotal: nextTotal,
                    }
                  : i
              ),
            };
          }

          const lineTotal =
            item.lineTotal ?? computePassengersLineTotal(adultPrice, passengers);

          return {
            items: [
              ...state.items,
              {
                kind: "service",
                serviceId: item.serviceId,
                slug: item.slug,
                title: item.title,
                price: adultPrice,
                image: item.image,
                passengers,
                discountOptions: item.discountOptions,
                promotionApplied: item.promotionApplied,
                unitAdultPrice: adultPrice,
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
            return {
              ...i,
              quantity,
              lineTotal: i.price * quantity,
              passengers: undefined,
            };
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
    { name: "meru-cart-v3" }
  )
);
