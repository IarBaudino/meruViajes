import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import { canAddQuantity } from "@/lib/excursions/stock";

type AddItemInput = Omit<CartItem, "quantity"> & {
  quantity?: number;
  maxStock?: number;
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

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const quantityToAdd = item.quantity ?? 1;
        const maxStock = item.maxStock;
        let added = false;

        set((state) => {
          const existing = state.items.find((i) => i.serviceId === item.serviceId);
          const currentQty = existing?.quantity ?? 0;

          if (maxStock !== undefined && !canAddQuantity(currentQty, quantityToAdd, maxStock)) {
            return state;
          }

          added = true;

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.serviceId === item.serviceId
                  ? { ...i, quantity: i.quantity + quantityToAdd }
                  : i
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                serviceId: item.serviceId,
                slug: item.slug,
                title: item.title,
                price: item.price,
                image: item.image,
                quantity: quantityToAdd,
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
          items: state.items.map((i) =>
            i.serviceId === serviceId ? { ...i, quantity } : i
          ),
        }));
        return true;
      },
      removeItem: (serviceId) =>
        set((state) => ({
          items: state.items.filter((i) => i.serviceId !== serviceId),
        })),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    }),
    { name: "meru-cart" }
  )
);
