import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  loadCart: () => Promise<void>;
}

const STORAGE_KEY = "pench-cart-items";

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addToCart: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      let newItems;
      if (existing) {
        newItems = state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        newItems = [...state.items, { ...item, quantity: 1 }];
      }
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems)).catch((err) =>
        console.error("Error saving cart items:", err)
      );
      return { items: newItems };
    });
  },
  removeFromCart: (itemId) => {
    set((state) => {
      const existing = state.items.find((i) => i.id === itemId);
      let newItems;
      if (existing && existing.quantity > 1) {
        newItems = state.items.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      } else {
        newItems = state.items.filter((i) => i.id !== itemId);
      }
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems)).catch((err) =>
        console.error("Error saving cart items:", err)
      );
      return { items: newItems };
    });
  },
  clearCart: () => {
    AsyncStorage.removeItem(STORAGE_KEY).catch((err) =>
      console.error("Error removing cart items:", err)
    );
    set({ items: [] });
  },
  loadCart: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          set({ items: parsed });
        }
      }
    } catch (err) {
      console.error("Error loading cart items:", err);
    }
  },
}));

// Auto-load storage on store module evaluation
useCartStore.getState().loadCart();
