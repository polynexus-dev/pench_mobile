// ─── Screens ────────────────────────────────────────────────
export { default as LoginScreen } from "./screens/LoginScreen";
export { default as OTPScreen } from "./screens/OTPScreen";
// export { default as ForgotPasswordScreen } from "./screens/ForgotPasswordScreen";
export { default as RegisterScreen } from "./screens/RegisterScreen";

// // ─── Hooks ──────────────────────────────────────────────────
export { useLogin } from "./hooks/useLogin";
export { useLogout } from "./hooks/useLogout";
export { useRequestOTP, useVerifyOTP } from "./hooks/useOTP";
export { useRegister } from "./hooks/useRegister";

// // ─── Types ──────────────────────────────────────────────────
export type {
    LoginPayload,
    OTPRequestPayload,
    OTPVerifyPayload,
    RegisterPayload,
    AuthResponse,
    AuthState,
    LoginMethod,
} from "./types/auth.types";