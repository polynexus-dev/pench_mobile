import type { User } from "@/types/domain/user.types";

export type { User };

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  // ── OTP login response fields ──────────────────────────────
  tenant_schema?: string;       // ← replaces sid
  tenant_name?: string;         // ← replaces city_name
  tenant_domain?: string;       // ← replaces domain_name
  // ── Password login response fields ────────────────────────
  sid?: string;
  city_name?: string;
  domain_name?: string;
  active_route_id?: string | null;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface OTPRequestPayload {
  phone: string;
}
export interface OTPRequestResponse {
  message: string;
  otp?: string; // ← present in dev/test, absent in production
}

export interface OTPVerifyPayload {
  phone: string;
  code: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  phone: string;          // ← was phone_number, now phone
  role: "Customers";      // ← was "Customer", now "Customers"
  is_customer: true;      // ← new required field, always true for app registration
  tenant_schema: string;
}

export type LoginMethod = "password" | "otp";

// export interface ForgotPasswordPayload {
//   email: string;
// }
