export type RouteStop = {
  id: string;
  sequence_number: number;
  order?: string | null;
  customer_name: string;
  address: string;
  latitude: number;
  longitude: number;
  order_status?: "in_transit" | "delivered" | "undelivered" | string;
};

export type RouteResponse = {
  id: string;
  name?: string;
  stops: RouteStop[];
  route_geometry?: unknown;
};

export type MapLocation = {
  lat: number;
  lng: number;
};

export type TripCompleteResponse = {
  detail: string;
  completed_at: string;
  expires_in_seconds: number;
};