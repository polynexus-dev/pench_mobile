import { httpClient } from "@services/api/httpClient";
import { buildUrl } from "@services/api/buildUrl";
import type {
  ResolveQrResponse,
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
      buildUrl(domainName, `/api/erp/orders/driver/${orderId}/submit-delivery/`),
      payload
    ),

  submitUndelivered: (
    domainName: string,
    lastOrderId: string,
    payload: FormData
  ): Promise<SubmitUndeliveredResponse> =>
    httpClient.post(
      buildUrl(domainName, `/api/erp/orders/driver/${lastOrderId}/submit-undelivered/`),
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ),

  resolveDriverQr: (
    domainName: string,
    qrId: string
  ): Promise<ResolveQrResponse> =>
    httpClient.get(
      buildUrl(domainName, `/api/erp/orders/driver/resolve-qr/${qrId}`)
    ),
};