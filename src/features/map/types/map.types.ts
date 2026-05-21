export type RouteStop = {
  id: string;
  latitude: number;
  longitude: number;
  customer_name: string;
  address: string;
  sequence_number: number;
  order_status?: "in_transit" | "delivered" | "cancelled" | string;
  order?: string | null;
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