import { httpClient } from "../../../services/api/httpClient";
import { buildUrl } from "../../../services/api/buildUrl";

export interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface Order {
  id: string;
  status: string;
  status_display: string;
  total: string;
  scheduled_delivery_date: string;
  delivered_at: string | null;
  items: OrderItem[];
  is_special?: boolean;
}


export const orderApi = {
  getOrders: (domainName: string, customerId?: string): Promise<Order[]> => {
    let url = `/api/erp/orders/`;
    if (customerId) {
      url += `?customer=${customerId}`;
    }
    return httpClient.get(buildUrl(domainName, url));
  },
  createOrder: (
    domainName: string,
    orderData: {
      scheduled_delivery_date: string;
      items: Array<{ product: string | number; quantity: number }>;
      delivery_address?: string;
    }
  ): Promise<Order> => {
    return httpClient.post(buildUrl(domainName, `/api/erp/orders/`), orderData);
  },
  deleteOrder: (domainName: string, orderId: string): Promise<void> => {
    return httpClient.delete(buildUrl(domainName, `/api/erp/orders/${orderId}/`));
  },
};
