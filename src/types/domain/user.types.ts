export interface CustomerDashboard {
  active_subscriptions: number;
  pending_balance: number;
  total_orders: number;
  schema: string;
}

export interface User {
  id: number;
  customer_uuid?: string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_erp_user?: boolean;
  is_driver: boolean;
  is_customer: boolean;
  portal: string;
  phone: string;
  tenant_schema: string;
  groups?: string[];
  role?: "Driver" | "Customer";
  customer_dashboard?: CustomerDashboard; // ← new
  city_name?: string;
  vehicle_plate?: string;
  vehicle_type?: string;
  warehouse_name?: string;
  zone_name?: string;
  has_password?: boolean;
}

export type UserRole = "driver" | "customer";