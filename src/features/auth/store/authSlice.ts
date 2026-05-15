import type { AuthState } from "../types/auth.types";

/** Auth slice — internal store state managed by authStore.ts */
export const authSlice = (set: (fn: (s: AuthState) => void) => void) => ({
  user: null as AuthState["user"],
  accessToken: null as string | null,
  refreshToken: null as string | null,
});
