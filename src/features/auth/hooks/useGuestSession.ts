import { useRouter } from "expo-router";

import { ROUTES } from "@/constants/route";
import {
  fetchGuestCities,
  guestCityFromSchema,
  type GuestCity,
} from "@/constants/guestTenants";
import { asyncStorage } from "@/services/storage/asyncStorage";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";

/** AsyncStorage key holding the tenant schema a guest picked, e.g. "nagpur". */
export const GUEST_CITY_KEY = "guest_city";

/**
 * Restores a guest session on cold start. Called from useAuthInit before the
 * navigator decides where to send the user, so a guest is never bounced to login.
 * Returns true when a guest session was restored.
 */
export async function restoreGuestSession(): Promise<boolean> {
  try {
    const stored = await asyncStorage.getItem(GUEST_CITY_KEY);
    // Derived from the stored schema name so a cold start needs no network
    const city = guestCityFromSchema(stored);
    if (!city?.domain) return false;
    useAuthStore.getState().setGuest(city.value, city.domain);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears a guest session. Called when a guest signs in or registers, so the real
 * session's domain_name is not competing with the guest one.
 */
export async function endGuestSession(): Promise<void> {
  try {
    await asyncStorage.removeItem(GUEST_CITY_KEY);
  } catch {
    // Non-fatal — the in-memory flag below is what gates the UI
  }
  useAuthStore.getState().clearGuest();
}

export function useGuestSession() {
  const router = useRouter();
  const isGuest = useAuthStore((s) => s.isGuest);
  const guestCity = useAuthStore((s) => s.guestCity);

  /** Starts browsing as a guest in the given city and opens the customer home. */
  const startGuestSession = async (city: GuestCity) => {
    await asyncStorage.setItem(GUEST_CITY_KEY, city.value);
    useAuthStore.getState().setGuest(city.value, city.domain);
    router.replace(ROUTES.CUSTOMER.DASHBOARD as any);
  };

  /** Leaves guest browsing and returns to the login screen. */
  const exitGuestSession = async () => {
    await endGuestSession();
    // A guest cart would otherwise carry into the next session
    useCartStore.getState().clearCart();
    router.replace(ROUTES.AUTH.LOGIN as any);
  };

  return {
    isGuest,
    guestCity,
    fetchGuestCities,
    startGuestSession,
    exitGuestSession,
  };
}
