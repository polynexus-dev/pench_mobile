import * as SecureStore from "expo-secure-store";

const KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
} as const;

export const tokenUtils = {
  saveTokens: async (access: string, refresh: string): Promise<void> => {
    // Guard: SecureStore only accepts non-empty strings
    if (!access || typeof access !== "string") {
      console.warn("⚠️ saveTokens: access token is invalid", access);
      return;
    }
    if (!refresh || typeof refresh !== "string") {
      console.warn("⚠️ saveTokens: refresh token is invalid", refresh);
      return;
    }
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, access);
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refresh);
  },

  getAccessToken: async (): Promise<string | null> =>
    SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),

  getRefreshToken: async (): Promise<string | null> =>
    SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),

  clearTokens: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
  },
};