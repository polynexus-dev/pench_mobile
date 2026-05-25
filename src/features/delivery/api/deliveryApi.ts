import { httpClient } from "@services/api/httpClient";
import { buildUrl } from "@services/api/buildUrl";
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
      // `https://${domainName}/api/erp/orders/driver/${orderId}/submit-delivery/`,
      buildUrl(domainName, `/api/erp/orders/driver/${orderId}/submit-delivery/`),
      payload
    ),

  submitUndelivered: (
    domainName: string,
    lastOrderId: string,
    payload: FormData
  ): Promise<SubmitUndeliveredResponse> =>
    httpClient.post(
      // `https://${domainName}/api/erp/orders/driver/${lastOrderId}/submit-undelivered/`,
      buildUrl(domainName, `/api/erp/orders/driver/${lastOrderId}/submit-undelivered/`),
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ),
};