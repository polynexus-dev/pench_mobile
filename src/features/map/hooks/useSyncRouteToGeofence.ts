import { useEffect, useRef } from "react";
import { useGeofenceStore } from "@store/geofenceStore";

type RouteStop = {
    id: string;
    sequence_number: number;
    order: string | null ;
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

type SyncRouteToGeofenceParams = {
    data: RouteResponse | undefined;
};

export function useSyncRouteToGeofence({ data }: SyncRouteToGeofenceParams) {
    const setRoute = useGeofenceStore((s) => s.setRoute);
    const setActiveStopId = useGeofenceStore((s) => s.setActiveStopId);
    const setSelectedStopId = useGeofenceStore((s) => s.setSelectedStopId);
    const syncedRouteIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!data?.id) return;
        if (syncedRouteIdRef.current === data.id) return;

        setRoute({
            ...data,
            stops: (data.stops ?? []).map((stop) => ({
                ...stop,
                order_status: stop.order_status ?? "in_transit",
            })),
        });

        const firstTransit = data.stops?.find((stop) => stop.order_status === "in_transit") ?? null;

        setActiveStopId(firstTransit?.id ?? null);
        setSelectedStopId(firstTransit?.id ?? null);

        syncedRouteIdRef.current = data.id;
    }, [data, setRoute, setActiveStopId, setSelectedStopId]);
}