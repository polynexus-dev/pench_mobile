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
}

export const useAuthStore = createStore<AuthStore>("auth", (set) => ({
  // Existing state
  user: null,
  accessToken: null,
  refreshToken: null,

  // ← ADD: Map tracking state
  domain_name: null,
  route_id: null,

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
    }),

  // ← ADD: setter for map tracking
  setDomainAndRoute: (domain_name, route_id) => set((state) => {
    state.domain_name = domain_name;
    state.route_id = route_id;
  }),
}));

// import type { AuthState } from "@/features/auth";
// import { createPersistedStore } from "./devtools";

// interface AuthStore extends AuthState {
//   setUser: (user: AuthState["user"]) => void;
//   setTokens: (access: string, refresh: string) => void;
//   clearAuth: () => void;

//   domain_name: string | null;
//   route_id: string | null;
//   setDomainAndRoute: (domain_name: string, route_id: string | null) => void;

//   hasHydrated: boolean;
//   setHasHydrated: (value: boolean) => void;
// }

// export const useAuthStore = createPersistedStore<AuthStore>(
//   "auth",
//   (set) => ({
//     user: null,
//     accessToken: null,
//     refreshToken: null,
//     domain_name: null,
//     route_id: null,
//     hasHydrated: false,

//     setHasHydrated: (value) =>
//       set((state) => {
//         state.hasHydrated = value;
//       }),

//     setUser: (user) =>
//       set((s) => {
//         s.user = user;
//       }),

//     setTokens: (access, refresh) =>
//       set((s) => {
//         if (s.accessToken === access && s.refreshToken === refresh) return;
//         s.accessToken = access;
//         s.refreshToken = refresh;
//       }),

//     clearAuth: () =>
//       set((s) => {
//         s.user = null;
//         s.accessToken = null;
//         s.refreshToken = null;
//         s.domain_name = null;
//         s.route_id = null;
//       }),

//     setDomainAndRoute: (domain_name, route_id) =>
//       set((state) => {
//         state.domain_name = domain_name;
//         state.route_id = route_id;
//       }),
//   }),
//   (state) => ({
//     user: state.user,
//     accessToken: state.accessToken,
//     refreshToken: state.refreshToken,
//     domain_name: state.domain_name,
//     route_id: state.route_id,
//   })
// );