import { asyncStorage } from "@/services/storage";
import { queryClient } from "@/services/api/queryClient";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";
import { useGeofenceStore } from "@/store/geofenceStore";
import { useTrackingStore } from "@/store/trackingStore";
import { tokenUtils } from "./tokenUtils";

/**
 * Tears down everything a session left on the device: background trackers,
 * secure-store tokens, AsyncStorage, zustand stores and the query cache.
 *
 * Shared by logout and account deletion — after a deletion the server-side
 * account is gone, so leaving any of this behind would strand the app with
 * credentials that no longer resolve.
 */
export async function clearLocalSession(): Promise<void> {
    // Stop tracking & geofencing first to avoid bg location updates posting with empty tokens
    try {
        useGeofenceStore.getState().stopGeofenceTracking();
    } catch (e) {
        console.warn("Error stopping geofence tracking:", e);
    }

    try {
        useTrackingStore.getState().stopTracking();
        useTrackingStore.getState().disconnectSocket();
    } catch (e) {
        console.warn("Error stopping tracking or disconnecting socket:", e);
    }

    // Clear tokens from secure storage
    await tokenUtils.clearTokens();

    // Clear all items in async storage (includes domain_name and guest_city)
    await asyncStorage.clear();

    // Reset all zustand stores
    useTrackingStore.getState().resetStore();
    useCartStore.getState().clearCart();
    useAuthStore.getState().clearAuth();

    // Reset query client cache
    queryClient.clear();
}
