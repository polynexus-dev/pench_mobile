import { createStore } from "./devtools";
import * as Location from "expo-location";

type RouteStop = {
    id: string;
    sequence_number: number;
    order: string | null;
    customer_name: string;
    address: string;
    latitude: number;
    longitude: number;
    order_status: "in_transit" | "delivered" | "cancelled" | "undelivered" | string;
    product_list?: Array<{
        product_id: string;
        product_name: string;
        quantity: number;
        unit: string;
        unit_price: number;
    }>;
};

type RouteResponse = {
    id: string;
    name?: string;
    driver?: number;
    driver_name?: string;
    delivery_date?: string;
    is_completed?: boolean;
    route_geometry?: any;
    stops: RouteStop[];
    expires_in_seconds?: number;
};

type LocationState = { lat: number; lng: number };

type GeofenceStore = {
    route: RouteResponse | null;
    routeLoading: boolean;
    routeError: string | null;
    location: LocationState | null;
    nearStopId: string | null;
    activeStopId: string | null;
    selectedStopId: string | null;
    geofenceMeters: number;
    loading: boolean;
    error: string | null;
    setRoute: (route: RouteResponse | null) => void;
    startGeofenceTracking: () => Promise<void>;
    stopGeofenceTracking: () => void;
    setActiveStopId: (id: string | null) => void;
    setSelectedStopId: (id: string | null) => void;
    markStopDelivered: (orderId: string) => void;
    markStopUndelivered: (orderId: string) => void;
    getActiveStop: () => RouteStop | null;
    getNearStop: () => RouteStop | null;
    isNearActiveStop: () => boolean;
    canMarkActiveStopDelivered: () => boolean;
};

let geofenceWatcher: Location.LocationSubscription | null = null;

export const useGeofenceStore = createStore<GeofenceStore>("geofence", (set, get) => ({
    route: null,
    routeLoading: false,
    routeError: null,
    location: null,
    nearStopId: null,
    activeStopId: null,
    selectedStopId: null,
    geofenceMeters: 30,
    loading: false,
    error: null,

    setRoute: (route) => {
        set((s) => {
            s.route = route;
            s.routeLoading = false;
            s.routeError = null;
            if (!s.activeStopId && route?.stops?.length) {
                const first = route.stops.find((stop) => stop.order_status === "in_transit");
                s.activeStopId = first?.id ?? route.stops[0].id;
            }
        });
    },

    startGeofenceTracking: async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            set((s) => {
                s.error = "Location permission denied";
            });
            return;
        }

        if (geofenceWatcher) {
            geofenceWatcher.remove();
            geofenceWatcher = null;
        }

        geofenceWatcher = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 1000,
                distanceInterval: 3,
            },
            (loc) => {
                const location = { lat: loc.coords.latitude, lng: loc.coords.longitude };
                const { route, geofenceMeters } = get();

                let nearStopId: string | null = null;
                if (route?.stops?.length) {
                    let closestStop: { id: string; distance: number } | null = null;

                    for (const stop of route.stops) {
                        if (stop.order_status !== "in_transit") continue;

                        const distance = getDistanceMeters(
                            location.lat,
                            location.lng,
                            stop.latitude,
                            stop.longitude
                        );

                        if (!closestStop || distance < closestStop.distance) {
                            closestStop = { id: stop.id, distance };
                        }
                    }

                    if (closestStop && closestStop.distance <= geofenceMeters + 5) {
                        nearStopId = closestStop.id;
                    }
                }

                set((s) => {
                    s.location = location;
                    s.nearStopId = nearStopId;
                    s.activeStopId = nearStopId;
                });
            }
        );
    },

    stopGeofenceTracking: () => {
        if (geofenceWatcher) {
            geofenceWatcher.remove();
            geofenceWatcher = null;
        }
    },

    setActiveStopId: (id) => {
        set((s) => {
            s.activeStopId = id;
        });
    },

    setSelectedStopId: (id) => {
        set((s) => {
            s.selectedStopId = id;
        });
    },

    markStopDelivered: (orderId) => {
        set((s) => {
            if (!s.route) return;

            const deliveredStop = s.route.stops.find((stop) => stop.order === orderId);

            s.route = {
                ...s.route,
                stops: s.route.stops.map((stop) =>
                    stop.order === orderId ? { ...stop, order_status: "delivered" } : stop
                ),
            };

            if (deliveredStop && s.activeStopId === deliveredStop.id) {
                s.activeStopId = null;
                s.nearStopId = null;
                s.selectedStopId = null;
            }
        });
    },

    markStopUndelivered: (orderId) => {
        set((s) => {
            if (!s.route) return;

            const undeliveredStop = s.route.stops.find((stop) => stop.order === orderId);

            s.route = {
                ...s.route,
                stops: s.route.stops.map((stop) =>
                    stop.order === orderId ? { ...stop, order_status: "undelivered" } : stop
                ),
            };

            if (undeliveredStop && s.activeStopId === undeliveredStop.id) {
                s.activeStopId = null;
                s.nearStopId = null;
                s.selectedStopId = null;
            }
        });
    },

    getActiveStop: () => {
        const state = get();
        return state.route?.stops?.find((s) => s.id === state.activeStopId) ?? null;
    },

    getNearStop: () => {
        const state = get();
        return state.route?.stops?.find((s) => s.id === state.nearStopId) ?? null;
    },

    isNearActiveStop: () => {
        const state = get();
        return !!state.activeStopId && state.activeStopId === state.nearStopId;
    },

    canMarkActiveStopDelivered: () => {
        const state = get();
        const active = state.route?.stops?.find((s) => s.id === state.activeStopId);
        return (
            !!state.activeStopId &&
            state.activeStopId === state.nearStopId &&
            active?.order_status === "in_transit"
        );
    },
}));

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}