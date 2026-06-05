import { useEffect, useRef } from "react";
import { useGeofenceStore } from "@store/geofenceStore";
import { useTrackingStore } from "@store/trackingStore";

type RouteStop = {
    id: string;
    sequence_number: number;
    order: string | null;
    customer_name: string;
    address: string;
    latitude: number;
    longitude: number;
    order_status?: "in_transit" | "delivered" | "cancelled" | "undelivered" | string;
};

type RouteResponse = {
    id: string;
    name?: string;
    stops?: RouteStop[];
};

export function useSyncRouteToGeofence(data: RouteResponse | null | undefined) {
    const setRoute = useGeofenceStore((s) => s.setRoute);
    const setActiveStopId = useGeofenceStore((s) => s.setActiveStopId);
    const setSelectedStopId = useGeofenceStore((s) => s.setSelectedStopId);
    const syncedRouteIdRef = useRef<string | null>(null);

    useEffect(() => {
        // DEBUG: Remove after fix is verified
        console.log("[SYNC-DEBUG] data:", data?.id, "stops:", data?.stops?.length);
        
        if (!data?.id) {
            console.log("[SYNC-DEBUG] No route data, clearing.");
            useTrackingStore.getState().setCanStopTrip(false);
            return;
        }

        if (syncedRouteIdRef.current === data.id) {
            console.log("[SYNC-DEBUG] Already synced route:", data.id);
            return;
        }

        const normalizedStops = (data.stops ?? []).map((stop) => ({
            ...stop,
            order_status: stop.order_status ?? "in_transit",
        }));

        const normalizedRoute = {
            ...data,
            stops: normalizedStops,
        };

        console.log("[SYNC-DEBUG] Setting route:", data.id, "with", normalizedStops.length, "stops");
        setRoute(normalizedRoute);

        const firstTransit =
            normalizedStops.find((stop) => stop.order_status !== "delivered" && stop.order_status !== "cancelled") ?? null;

        console.log("[SYNC-DEBUG] firstTransit:", firstTransit?.id, firstTransit?.customer_name);
        setActiveStopId(firstTransit?.id ?? null);
        setSelectedStopId(firstTransit?.id ?? null);

        const hasActiveStops = normalizedStops.some(
            (stop) => stop.order_status !== "delivered" && stop.order_status !== "cancelled"
        );

        useTrackingStore.getState().setCanStopTrip(!hasActiveStops);

        syncedRouteIdRef.current = data.id;
    }, [data, setRoute, setActiveStopId, setSelectedStopId]);
}