import { httpClient } from "../../../services/api/httpClient";
import { buildUrl } from "../../../services/api/buildUrl";

export interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface Order {
  id: string;
  status: string;
  status_display: string;
  total_amount: string;
  scheduled_delivery_date: string;
  delivered_at: string | null;
  items: OrderItem[];
}

export const orderApi = {
  getOrders: (domainName: string, customerId?: string): Promise<Order[]> => {
    let url = `/api/erp/orders/`;
    if (customerId) {
      url += `?customer=${customerId}`;
    }
    return httpClient.get(buildUrl(domainName, url));
  },
};
