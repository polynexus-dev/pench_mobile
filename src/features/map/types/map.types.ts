export type RouteStop = {
  id: string;
  sequence_number: number;
  order: string | null;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_company?: string;
  customer_zone_name?: string;
  address: string;
  latitude: number;
  longitude: number;
  order_status: "in_transit" | "delivered" | "cancelled" | "undelivered" | string;
  order_notes?: string;
  order_total?: number;
  delivered_at?: string | null;
  pod_image?: string | null;
  pod_latitude?: number | null;
  pod_longitude?: number | null;

  product_list?: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
  }[];

  subscription_details?: {
    id: string;
    frequency?: string;
    is_paused?: boolean;
    special_instructions?: string;
    items?: {
      product_name: string;
      quantity: number;
      unit: string;
    }[];
  };
};

export type RouteResponse = {
  // id: string;
  // name?: string;
  // stops: RouteStop[];
  // route_geometry?: unknown;
  id: string;
  name?: string;
  driver?: number;
  driver_name?: string;
  delivery_date?: string;
  is_completed?: boolean;
  route_geometry?: any;
  stops: RouteStop[];
  expires_in_seconds?: number;
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

export type TripStatusResponse = {
  on_trip: boolean;
  active_route: string | null;
};