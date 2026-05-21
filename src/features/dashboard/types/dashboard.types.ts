// export type StartDeliveryTrackingPayload = {
//     routeId: string;
//     stopId?: string;
//     orderId?: string;
// };

// export type StartDeliveryTrackingResponse = {
//     message: string;
//     route_id?: string;
//     stop_id?: string;
//     order_id?: string;
//     started_at?: string;
// };
export type TripActionResponse = {
  detail: string;
  completed_at?: string;
  expires_in_seconds?: number;
};

export type TripActionPayload = {
  accessToken: string;
};