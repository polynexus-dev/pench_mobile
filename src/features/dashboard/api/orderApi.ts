import { httpClient } from "../../../services/api/httpClient";
import { buildUrl } from "../../../services/api/buildUrl";
import type { LatestPayment } from "@/features/ecommerce/types/ecommerce.types";

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
  latest_payment?: LatestPayment | null;
}

export interface CreateOrderPayload {
  scheduled_delivery_date: string;
  items: Array<{ product: string | number; quantity: number }>;
  delivery_address?: string;
  payment_amount?: number | string;
  payment_screenshot?: {
    uri: string;
    name?: string;
    type?: string;
  } | null;
  payment_transaction_id?: string;
}

export const orderApi = {
  getOrders: (domainName: string, customerId?: string, isSpecial?: boolean): Promise<Order[]> => {
    let url = `/api/erp/orders/`;
    const params = new URLSearchParams();
    if (customerId) params.append("customer", customerId);
    if (isSpecial) params.append("is_special", "true");
    const query = params.toString();
    if (query) url += `?${query}`;
    return httpClient.get(buildUrl(domainName, url));
  },

  getOrder: (domainName: string, orderId: string): Promise<Order> => {
    return httpClient.get(buildUrl(domainName, `/api/erp/orders/${orderId}/`));
  },

  createOrder: (
    domainName: string,
    orderData: CreateOrderPayload
  ): Promise<Order> => {
    if (orderData.payment_screenshot) {
      const formData = new FormData();
      formData.append("scheduled_delivery_date", orderData.scheduled_delivery_date);
      if (orderData.delivery_address) {
        formData.append("delivery_address", orderData.delivery_address);
      }
      formData.append("items", JSON.stringify(orderData.items));
      formData.append("payment_screenshot", {
        uri: orderData.payment_screenshot.uri,
        name: orderData.payment_screenshot.name || `order_payment_${Date.now()}.jpg`,
        type: orderData.payment_screenshot.type || "image/jpeg",
      } as any);

      if (orderData.payment_amount != null) {
        formData.append("payment_amount", String(orderData.payment_amount));
      }

      if (orderData.payment_transaction_id) {
        formData.append("payment_transaction_id", orderData.payment_transaction_id);
      }

      return httpClient.post(buildUrl(domainName, `/api/erp/orders/`), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    return httpClient.post(buildUrl(domainName, `/api/erp/orders/`), orderData);
  },

  deleteOrder: (domainName: string, orderId: string): Promise<void> => {
    return httpClient.delete(buildUrl(domainName, `/api/erp/orders/${orderId}/`));
  },
};