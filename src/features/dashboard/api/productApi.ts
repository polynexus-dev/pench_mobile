import { httpClient } from "@services/api/httpClient";
import { buildUrl } from "@services/api/buildUrl";

export interface Product {
  id: string | number;
  name: string;
  sku: string;
  description: string;
  unit_price: string | number;
  unit: string;
  is_active: boolean;
  bottle_type?: any;
  is_returnable: boolean;
  category?: string;
  price?: number;
  mrp?: number;
}

export const productApi = {
  getProducts: (domainName: string): Promise<Product[]> =>
    httpClient.get(
      buildUrl(domainName, `/api/erp/inventory/products/`)
    ),
};
