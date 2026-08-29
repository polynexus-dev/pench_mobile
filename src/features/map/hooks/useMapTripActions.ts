import { useTrackingStore } from "@store/trackingStore";
import { useAuthStore } from "@store/authStore";

export function useMapTripActions() {
    const isTripStarted = useTrackingStore((s) => s.isTripStarted);
    const loading = useTrackingStore((s) => s.loading);

    const handleTripToggle = async () => {
        const { accessToken } = useAuthStore.getState();
        const { route_id } = useAuthStore.getState();
        
        // const { hasHydrated, route_id } = useAuthStore.getState();
        // if (!hasHydrated) return;

        if (!accessToken) return;
        if (!route_id) return;

        const { startTrip, stopTrip, isTripStarted, loading } = useTrackingStore.getState();

        if (loading) return;

        if (isTripStarted) {
            await stopTrip();
            return;
        }

        await startTrip();
    };

    return {
        isTripStarted,
        loading,
        handleTripToggle,
    };
}