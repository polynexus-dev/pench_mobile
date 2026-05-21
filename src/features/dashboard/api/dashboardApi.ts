import type { TripActionResponse } from "../types/dashboard.types";

export const dashboardApi = {
  startTrip: async (domainName: string, token: string): Promise<TripActionResponse> => {
    const res = await fetch(
      `https://${domainName}/api/erp/orders/driver/start-tracking/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = await res.text();
    if (!res.ok) throw new Error(text || `Start trip failed: ${res.status}`);
    return JSON.parse(text);
  },

  stopTrip: async (domainName: string, token: string): Promise<TripActionResponse> => {
    const res = await fetch(
      `https://${domainName}/api/erp/orders/driver/stop-tracking/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = await res.text();
    if (!res.ok) throw new Error(text || `Stop trip failed: ${res.status}`);
    return JSON.parse(text);
  },
};