import { create } from "zustand";

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string | number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addToCart: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),
  removeFromCart: (itemId) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return {
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
          ),
        };
      }
      return { items: state.items.filter((i) => i.id !== itemId) };
    }),
  clearCart: () => set({ items: [] }),
}));
