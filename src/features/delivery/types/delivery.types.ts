export type SubmitDeliveryPayload = {
  bottle_transactions: Array<{
    bottle_type_id: string;
    issued: number;
    returned: number;
    broken: number;
  }>;
};

export type SubmitDeliveryResponse = {
  id: string;
  customer: string;
  customer_name: string;
  status: string;
  status_display: string;
  scheduled_delivery_date: string;
  total: string;
  items: Array<{
    id: string;
    product: string;
    product_name: string;
    quantity: number;
    unit_price: string;
    line_total: number;
  }>;
  delivery_address: string;
  latitude: number;
  longitude: number;
  expires_in_seconds: number;
};

export type SubmitUndeliveredPayload = {
  pod_image: string;
  pod_latitude: string;
  pod_longitude: string;
};

export type SubmitUndeliveredResponse = SubmitDeliveryResponse;

export type ResolveQrOrderItem = {
  id: number;
  product: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
};

export type ResolveQrCustomerDashboard = {
  active_subscriptions: number;
  pending_balance: number;
  total_orders: number;
};

export type ResolveQrProductRate = {
  product_id: string;
  product_name: string;
  mrp: number;
  discount: number;
  final_amount: number;
};

export type ResolveQrCustomer = {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  is_active?: boolean;
  qr_code_id?: string;
  created_at?: string;
  zone?: string;
  zone_name?: string;
  dashboard?: ResolveQrCustomerDashboard;
  product_rates?: ResolveQrProductRate[];
};

export type ResolveQrBottleBalance = {
  bottle_type: string;
  balance: number;
};

export type ResolveQrOrder = {
  id: string;
  customer: string;
  customer_name: string;
  status: string;
  status_display?: string;
  scheduled_delivery_date?: string;
  total?: string;
  items?: ResolveQrOrderItem[];
  delivery_address?: string;
  latitude?: number;
  longitude?: number;
  driver_name?: string;
  zone_name?: string;
  pod_image?: string | null;
  pod_latitude?: number | null;
  pod_longitude?: number | null;
  delivered_at?: string | null;
};

export type ResolveQrResponse = {
  customer: ResolveQrCustomer;
  order: ResolveQrOrder | null;
  bottle_balances: ResolveQrBottleBalance[];
  detail?: string;
};