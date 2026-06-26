import { httpClient } from "../../../services/api/httpClient";
import { buildUrl } from "../../../services/api/buildUrl";

export interface Subscription {
  id: string;
  status: string;
  status_display?: string;
  frequency: string;
  frequency_display: string;
  is_paused: boolean;
  pause_start: string | null;
  pause_end: string | null;
  start_date: string;
  end_date: string | null;
  delivery_address?: string;
  special_instructions?: string;
  items: any[];
}

export interface DailySummary {
  date: string;
  status: "not_active" | "vacation" | "skipped" | "off_day" | "delivered" | "undelivered" | "in_transit" | "pending" | "scheduled";
  order_id?: string;
  order_status?: string;
}

export interface SubscriptionItem {
  product_id: string;
  product_name: string;
  quantity: number;
}

export interface SubscriptionSummary {
  subscription_id: string;
  frequency: string;
  frequency_display: string;
  status: string;
  is_paused: boolean;
  pause_start: string | null;
  pause_end: string | null;
  subscription_start: string;
  subscription_end: string | null;
  items: SubscriptionItem[];
  summary: {
    total_scheduled: number;
    total_delivered: number;
    total_undelivered: number;
    total_in_transit: number;
    total_pending: number;
    total_skipped: number;
    total_vacation: number;
    total_off_days?: number;
    total_not_active?: number;
  };
  daily: DailySummary[];
}

export interface CustomerMonthlySummaryResponse {
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  year: number;
  month: number;
  overall_summary: any;
  subscriptions: SubscriptionSummary[];
}

export const subscriptionApi = {
  getSubscriptions: (domainName: string, customerId?: string): Promise<Subscription[]> => {
    let url = `/api/erp/subscriptions/`;
    if (customerId) {
      url += `?customer=${customerId}`;
    }
    return httpClient.get(buildUrl(domainName, url));
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
};
