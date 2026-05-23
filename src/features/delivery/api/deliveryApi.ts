// import { httpClient } from "@services/api/httpClient";
// import type {
//   SubmitDeliveryPayload,
//   SubmitDeliveryResponse,
//   SubmitUndeliveredResponse,
// } from "../types/delivery.types";

// export const deliveryApi = {
//   submitDelivery: (
//     domainName: string,
//     orderId: string,
//     payload: SubmitDeliveryPayload
//   ): Promise<SubmitDeliveryResponse> => httpClient.post(`https://${domainName}/api/erp/orders/driver/${orderId}/submit-delivery/`, payload ),

//   submitUndelivered: async (
//     domainName: string,
//     lastOrderId: string,
//     payload: FormData
//   ): Promise<SubmitUndeliveredResponse> => {
//     const res = await fetch(
//       `https://${domainName}/api/erp/orders/driver/${lastOrderId}/submit-undelivered/`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${useAuthTokenFromStorageOrStore()}`,
//         },
//         body: payload,
//       }
//     );

//     const text = await res.text();
//     if (!res.ok) {
//       throw new Error(text || `Submit undelivered failed: ${res.status}`);
//     }

//     return JSON.parse(text);
//   },
// };

// function useAuthTokenFromStorageOrStore() {
//   return "";
// }

import { httpClient } from "@services/api/httpClient";
import type {
  SubmitDeliveryPayload,
  SubmitDeliveryResponse,
  SubmitUndeliveredResponse,
} from "../types/delivery.types";

export type TripCompleteResponse = {
  detail: string;
  completed_at: string;
  expires_in_seconds: number;
};

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

  submitUndelivered: (
    domainName: string,
    lastOrderId: string,
    payload: FormData
  ): Promise<SubmitUndeliveredResponse> =>
    httpClient.post(
      `https://${domainName}/api/erp/orders/driver/${lastOrderId}/submit-undelivered/`,
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ),

  startTrip: (
    domainName: string,
    routeId: string
  ): Promise<void> =>
    httpClient.post(
      `https://${domainName}/api/erp/orders/driver/${routeId}/start-trip/`,
      {}
    ),

  completeTrip: (
    domainName: string,
    routeId: string
  ): Promise<TripCompleteResponse> =>
    httpClient.post(
      `https://${domainName}/api/erp/orders/driver/${routeId}/complete-trip/`,
      {}
    ),
};