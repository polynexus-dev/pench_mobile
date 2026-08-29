import { httpClient } from "../../../services/api/httpClient";
import { buildUrl } from "../../../services/api/buildUrl";
import { Subscription, CustomerMonthlySummaryResponse } from "../types/ecommerce.types";

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
