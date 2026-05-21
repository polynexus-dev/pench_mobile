import { httpClient } from "@services/api/httpClient";
import type {
  SubmitDeliveryPayload,
  SubmitDeliveryResponse,
  SubmitUndeliveredResponse,
} from "../types/delivery.types";

export const deliveryApi = {
  submitDelivery: (
    domainName: string,
    orderId: string,
    payload: SubmitDeliveryPayload
  ): Promise<SubmitDeliveryResponse> =>
    httpClient.post(
      `https://${domainName}/api/erp/orders/driver/${orderId}/submit-delivery/`,
      payload
    ),

  submitUndelivered: async (
    domainName: string,
    lastOrderId: string,
    payload: FormData
  ): Promise<SubmitUndeliveredResponse> => {
    const res = await fetch(
      `https://${domainName}/api/erp/orders/driver/${lastOrderId}/submit-undelivered/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${useAuthTokenFromStorageOrStore()}`,
        },
        body: payload,
      }
    );

    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || `Submit undelivered failed: ${res.status}`);
    }

    return JSON.parse(text);
  },
};

function useAuthTokenFromStorageOrStore() {
  return "";
}