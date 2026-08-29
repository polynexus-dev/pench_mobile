import { createStore } from "./devtools";

type ColorScheme = "light" | "dark" | "system";

interface AppState {
  colorScheme: ColorScheme;
  isNetworkConnected: boolean;
  isAppLoading: boolean;
  setColorScheme: (scheme: ColorScheme) => void;
  setNetworkStatus: (connected: boolean) => void;
  setAppLoading: (loading: boolean) => void;
}

export const useAppStore = createStore<AppState>("app", (set) => ({
  colorScheme: "system",
  isNetworkConnected: true,
  isAppLoading: false,

  setColorScheme: (scheme) =>
    set((s) => {
      s.colorScheme = scheme;
    }),
  setNetworkStatus: (connected) =>
    set((s) => {
      s.isNetworkConnected = connected;
    }),
  setAppLoading: (loading) =>
    set((s) => {
      s.isAppLoading = loading;
    }),
}));
