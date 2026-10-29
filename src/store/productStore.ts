import { createStore } from "./devtools";
import { Product, productApi } from "@/features/dashboard/api/productApi";

export interface ProductState {
  products: Product[];
  productPrices: Record<string, number>;
  loading: boolean;
  setProducts: (products: Product[]) => void;
  fetchProducts: (domainName: string) => Promise<Product[]>;
  getProductPrice: (productIdOrName: string | number) => number;
}

export const useProductStore = createStore<ProductState>("product", (set, get) => ({
  products: [],
  productPrices: {},
  loading: false,

  setProducts: (products: Product[]) => {
    const prices: Record<string, number> = {};
    (products || []).forEach((p) => {
      const price = Number(p.unit_price || p.price || 0);
      if (p.id != null) prices[String(p.id)] = price;
      if (p.name) prices[p.name.trim().toLowerCase()] = price;
      if (p.sku) prices[p.sku.trim().toLowerCase()] = price;
    });
    set((state) => {
      state.products = products || [];
      state.productPrices = prices;
    });
  },

  fetchProducts: async (domainName: string) => {
    if (!domainName) return [];
    set((state) => {
      state.loading = true;
    });
    try {
      const products = await productApi.getProducts(domainName);
      const prices: Record<string, number> = {};
      (products || []).forEach((p) => {
        const price = Number(p.unit_price || p.price || 0);
        if (p.id != null) prices[String(p.id)] = price;
        if (p.name) prices[p.name.trim().toLowerCase()] = price;
        if (p.sku) prices[p.sku.trim().toLowerCase()] = price;
      });
      set((state) => {
        state.products = products || [];
        state.productPrices = prices;
        state.loading = false;
      });
      return products || [];
    } catch (err) {
      console.warn("Failed to fetch products in productStore:", err);
      set((state) => {
        state.loading = false;
      });
      return [];
    }
  },

  getProductPrice: (productIdOrName: string | number) => {
    if (productIdOrName == null) return 0;
    const prices = get().productPrices;
    const idKey = String(productIdOrName);
    if (prices[idKey] !== undefined) return prices[idKey];
    const nameKey = idKey.trim().toLowerCase();
    if (prices[nameKey] !== undefined) return prices[nameKey];
    return 0;
  },
}));
