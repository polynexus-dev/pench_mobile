import { httpClient } from "../../../services/api/httpClient";
import { buildUrl } from "../../../services/api/buildUrl";
import { Subscription, CustomerMonthlySummaryResponse } from "../types/ecommerce.types";

export interface CreateSubscriptionPayload {
  customer: string;
  frequency: string;
  start_date: string;
  end_date: string;
  delivery_address?: string;
  special_instructions?: string;
  items: Array<{
    product: string | number;
    quantity: number;
  }>;
  payment_amount?: number | string;
  payment_screenshot?: {
    uri: string;
    name?: string;
    type?: string;
  } | null;
  payment_transaction_id?: string;
}

export const subscriptionApi = {
  getSubscriptions: (domainName: string, customerId?: string): Promise<Subscription[]> => {
    let url = `/api/erp/subscriptions/`;
    if (customerId) {
      url += `?customer=${customerId}`;
    }
    return httpClient.get(buildUrl(domainName, url));
  },

  getSubscription: (domainName: string, subscriptionId: string): Promise<Subscription> => {
    return httpClient.get(buildUrl(domainName, `/api/erp/subscriptions/${subscriptionId}/`));
  },

  getCustomerMonthlySummary: (domainName: string, customerId: string, year: number, month: number): Promise<CustomerMonthlySummaryResponse> => {
    return httpClient.get(
      buildUrl(domainName, `/api/erp/subscriptions/customer-monthly-summary/?customer_id=${customerId}&year=${year}&month=${month}`)
    );
  },

  addVacationGap: (domainName: string, subscriptionId: string, pause_start: string, pause_end: string): Promise<any> => {
    return httpClient.post(
      buildUrl(domainName, `/api/erp/subscriptions/${subscriptionId}/vacation/`),
      { pause_start, pause_end }
    );
  },

  getGroupedSummary: (domainName: string): Promise<any[]> => {
    return httpClient.get(buildUrl(domainName, `/api/erp/subscriptions/grouped-summary/`));
  },

  createSubscription: async (
    domainName: string,
    subscription: CreateSubscriptionPayload
  ): Promise<any> => {
    if (subscription.payment_screenshot) {
      const formData = new FormData();
      formData.append("customer", subscription.customer);
      formData.append("frequency", subscription.frequency);
      formData.append("start_date", subscription.start_date);
      formData.append("end_date", subscription.end_date);
      if (subscription.delivery_address) {
        formData.append("delivery_address", subscription.delivery_address);
      }
      if (subscription.special_instructions) {
        formData.append("special_instructions", subscription.special_instructions);
      }
      // items must be a JSON string when sent as multipart
      formData.append("items", JSON.stringify(subscription.items));

      formData.append("payment_screenshot", {
        uri: subscription.payment_screenshot.uri,
        name: subscription.payment_screenshot.name || `payment_${Date.now()}.jpg`,
        type: subscription.payment_screenshot.type || "image/jpeg",
      } as any);

      if (subscription.payment_amount != null) {
        formData.append("payment_amount", String(subscription.payment_amount));
      }

      if (subscription.payment_transaction_id) {
        formData.append("payment_transaction_id", subscription.payment_transaction_id);
      }

      return httpClient.post(
        buildUrl(domainName, `/api/erp/subscriptions/`),
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    }

    return httpClient.post(buildUrl(domainName, `/api/erp/subscriptions/`), subscription);
  },

  createSubscriptions: async (
    domainName: string,
    subscriptions: CreateSubscriptionPayload[]
  ): Promise<any> => {
    const results = [];
    for (const sub of subscriptions) {
      const res = await subscriptionApi.createSubscription(domainName, sub);
      results.push(res);
    }
    return results.length === 1 ? results[0] : results;
  },

  updateSubscription: (
    domainName: string,
    subscriptionId: string,
    payload: FormData | Partial<CreateSubscriptionPayload> | any
  ): Promise<Subscription> => {
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
    return httpClient.patch(
      buildUrl(domainName, `/api/erp/subscriptions/${subscriptionId}/`),
      payload,
      isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
    );
  },

  updateSubscriptionQuantity: (
    domainName: string,
    subscriptionId: string,
    payload: { quantity: number; product?: string | number }
  ): Promise<any> => {
    return httpClient.post(
      buildUrl(domainName, `/api/erp/subscriptions/${subscriptionId}/update-quantity/`),
      payload
    );
  },

  deleteSubscription: (
    domainName: string,
    subscriptionId: string
  ): Promise<any> => {
    return httpClient.delete(
      buildUrl(domainName, `/api/erp/subscriptions/${subscriptionId}/`)
    );
  },
};
