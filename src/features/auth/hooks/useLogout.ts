import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { tokenUtils } from "../utils/tokenUtils";
import { ROUTES } from "@/constants/route";
import { asyncStorage } from "@/services/storage";
import { useGeofenceStore } from "@/store/geofenceStore";
import { useTrackingStore } from "@/store/trackingStore";
import { useCartStore } from "@/store/useCartStore";
import { queryClient } from "@/services/api/queryClient";

export function useLogout() {
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const router = useRouter();

    const logout = async () => {
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

        // Clear all items in async storage
        await asyncStorage.clear();

        // Reset all zustand stores
        // useGeofenceStore.getState().resetStore();
        useTrackingStore.getState().resetStore();
        useCartStore.getState().clearCart();
        clearAuth();

        // Reset query client cache
        queryClient.clear();

        router.replace(ROUTES.AUTH.LOGIN as any);
    };

    return { logout };
}