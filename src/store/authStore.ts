import { createStore } from "./devtools";
import type { AuthState } from "@/features/auth";

interface AuthStore extends AuthState {
  // Existing actions
  setUser: (user: AuthState["user"]) => void;
  setTokens: (access: string, refresh: string) => void;
  clearAuth: () => void;

  // ← ADD: Map tracking fields => they belong at Store inerface level only
  domain_name: string | null;
  route_id: string | null;
  setDomainAndRoute(domain_name: string, route_id: string | null): void;

  // ← ADD: Guest browsing — no user, no tokens, read-only catalog access
  isGuest: boolean;
  guestCity: string | null;
  setGuest: (city: string, domain_name: string) => void;
  clearGuest: () => void;
}

export const useAuthStore = createStore<AuthStore>("auth", (set) => ({
  // Existing state
  user: null,
  accessToken: null,
  refreshToken: null,

  // ← ADD: Map tracking state
  domain_name: null,
  route_id: null,

  // ← ADD: Guest state
  isGuest: false,
  guestCity: null,

  // Existing actions
  setUser: (user) =>
    set((s) => {
      s.user = user;
    }),
  setTokens: (access, refresh) =>
    set((s) => {
      // ← Only update if values actually changed
      if (s.accessToken === access && s.refreshToken === refresh) return;
      s.accessToken = access;
      s.refreshToken = refresh;
    }),
  clearAuth: () =>
    set((s) => {
      s.user = null;
      s.accessToken = null;
      s.refreshToken = null;
      s.domain_name = null;   // ← clear on logout
      s.route_id = null;      // ← clear on logout
      s.isGuest = false;      // ← a logout ends guest browsing too
      s.guestCity = null;
    }),

  // ← ADD: setter for map tracking
  setDomainAndRoute: (domain_name, route_id) => set((state) => {
    state.domain_name = domain_name;
    state.route_id = route_id;
  }),

  // ← ADD: guest session — domain_name is set from the picked city so the
  // existing catalog calls keep working unchanged
  setGuest: (city, domain_name) =>
    set((s) => {
      s.isGuest = true;
      s.guestCity = city;
      s.user = null;
      s.accessToken = null;
      s.refreshToken = null;
      s.domain_name = domain_name;
      s.route_id = null;
    }),
  clearGuest: () =>
    set((s) => {
      s.isGuest = false;
      s.guestCity = null;
    }),
}));
