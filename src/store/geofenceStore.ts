import { createStore } from "./devtools";
import * as Location from "expo-location";
import { httpClient } from "@services/api/httpClient";
import { useAuthStore } from "./authStore";

type RouteStop = {
    id: string;
    latitude: number;
    longitude: number;
    customer_name: string;
    address: string;
    sequence_number: number;
    order?: string;
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
    geofenceMeters: number;
    loading: boolean;
    error: string | null;
    fetchMyRoute: () => Promise<void>;
    startGeofenceTracking: () => Promise<void>;
    stopGeofenceTracking: () => void;
    setActiveStopId: (id: string | null) => void;
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
    geofenceMeters: 50,
    loading: false,
    error: null,

    fetchMyRoute: async () => {
        const { accessToken, domain_name } = useAuthStore.getState();
        if (!accessToken || !domain_name) return;

        set((s) => {
            s.routeLoading = true;
            s.routeError = null;
        });

        try {
            const data = (await httpClient.get(
                `https://${domain_name}/api/erp/orders/driver/my-route`
            )) as RouteResponse;

            set((s) => {
                s.route = data;
                s.routeLoading = false;
                if (!s.activeStopId && data?.stops?.length) {
                    s.activeStopId = data.stops[0].id;
                }
            });
        } catch (err: any) {
            set((s) => {
                s.routeError = err?.message ?? "Failed to fetch route";
                s.routeLoading = false;
            });
        }
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

                    if (closestStop && closestStop.distance <= geofenceMeters) {
                        nearStopId = closestStop.id;
                    }
                }

                set((s) => {
                    s.location = location;
                    s.nearStopId = nearStopId;
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
        return !!state.activeStopId && state.activeStopId === state.nearStopId;
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