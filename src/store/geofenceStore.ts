// import { createStore } from "./devtools";
// import * as Location from "expo-location";
// import { RouteStop } from "@/features/map/types/map.types";

// type RouteResponse = {
//     id: string;
//     name?: string;
//     driver?: number;
//     driver_name?: string;
//     delivery_date?: string;
//     is_completed?: boolean;
//     route_geometry?: any;
//     stops: RouteStop[];
//     expires_in_seconds?: number;
// };

// type LocationState = { lat: number; lng: number };

// type GeofenceStore = {
//     route: RouteResponse | null;
//     routeLoading: boolean;
//     routeError: string | null;
//     location: LocationState | null;
//     nearStopId: string | null;
//     activeStopId: string | null;
//     selectedStopId: string | null;
//     geofenceMeters: number;
//     loading: boolean;
//     error: string | null;
//     setRoute: (route: RouteResponse | null) => void;
//     startGeofenceTracking: () => Promise<void>;
//     stopGeofenceTracking: () => void;
//     setActiveStopId: (id: string | null) => void;
//     setSelectedStopId: (id: string | null) => void;
//     markStopDelivered: (orderId: string) => void;
//     markStopUndelivered: (orderId: string) => void;
//     getActiveStop: () => RouteStop | null;
//     getNearStop: () => RouteStop | null;
//     isNearActiveStop: () => boolean;
//     canMarkActiveStopDelivered: () => boolean;
// };

// let geofenceWatcher: Location.LocationSubscription | null = null;

// export const useGeofenceStore = createStore<GeofenceStore>("geofence", (set, get) => ({
//     route: null,
//     routeLoading: false,
//     routeError: null,
//     location: null,
//     nearStopId: null,
//     activeStopId: null,
//     selectedStopId: null,
//     geofenceMeters: 75,  // production value
//     // geofenceMeters: 1000, // testing value
//     loading: false,
//     error: null,

//     setRoute: (route) => {
//         set((s) => {
//             s.route = route;
//             s.routeLoading = false;
//             s.routeError = null;
//             if (!s.activeStopId && route?.stops?.length) {
//                 const first = route.stops.find((stop) => stop.order_status === "in_transit");
//                 s.activeStopId = first?.id ?? route.stops[0].id;
//             }
//         });
//     },

//     startGeofenceTracking: async () => {
//         const { status } = await Location.requestForegroundPermissionsAsync();
//         if (status !== "granted") {
//             set((s) => {
//                 s.error = "Location permission denied";
//             });
//             return;
//         }

//         if (geofenceWatcher) {
//             geofenceWatcher.remove();
//             geofenceWatcher = null;
//         }

//         geofenceWatcher = await Location.watchPositionAsync(
//             {
//                 accuracy: Location.Accuracy.High,
//                 timeInterval: 1000,
//                 distanceInterval: 3,
//             },
//             (loc) => {
//                 const location = { lat: loc.coords.latitude, lng: loc.coords.longitude };
//                 const { route, geofenceMeters } = get();

//                 let nearStopId: string | null = null;
//                 if (route?.stops?.length) {
//                     let closestStop: { id: string; distance: number } | null = null;

//                     for (const stop of route.stops) {
//                         if (stop.order_status !== "in_transit") continue;

//                         const distance = getDistanceMeters(
//                             location.lat,
//                             location.lng,
//                             stop.latitude,
//                             stop.longitude
//                         );

//                         if (!closestStop || distance < closestStop.distance) {
//                             closestStop = { id: stop.id, distance };
//                         }
//                     }

//                     if (closestStop && closestStop.distance <= geofenceMeters + 5) {
//                         nearStopId = closestStop.id;
//                     }
//                 }

//                 set((s) => {
//                     s.location = location;
//                     s.nearStopId = nearStopId;
//                     s.activeStopId = nearStopId;
//                 });
//             }
//         );
//     },

//     stopGeofenceTracking: () => {
//         if (geofenceWatcher) {
//             geofenceWatcher.remove();
//             geofenceWatcher = null;
//         }
//     },

//     setActiveStopId: (id) => {
//         set((s) => {
//             s.activeStopId = id;
//         });
//     },

//     setSelectedStopId: (id) => {
//         set((s) => {
//             s.selectedStopId = id;
//         });
//     },

//     markStopDelivered: (orderId) => {
//         set((s) => {
//             if (!s.route) return;

//             const deliveredStop = s.route.stops.find((stop) => stop.order === orderId);

//             s.route = {
//                 ...s.route,
//                 stops: s.route.stops.map((stop) =>
//                     stop.order === orderId ? { ...stop, order_status: "delivered" } : stop
//                 ),
//             };

//             if (deliveredStop && s.activeStopId === deliveredStop.id) {
//                 s.activeStopId = null;
//                 s.nearStopId = null;
//                 s.selectedStopId = null;
//             }
//         });
//     },

//     markStopUndelivered: (orderId) => {
//         set((s) => {
//             if (!s.route) return;

//             const undeliveredStop = s.route.stops.find((stop) => stop.order === orderId);

//             s.route = {
//                 ...s.route,
//                 stops: s.route.stops.map((stop) =>
//                     stop.order === orderId ? { ...stop, order_status: "undelivered" } : stop
//                 ),
//             };

//             if (undeliveredStop && s.activeStopId === undeliveredStop.id) {
//                 s.activeStopId = null;
//                 s.nearStopId = null;
//                 s.selectedStopId = null;
//             }
//         });
//     },

//     getActiveStop: () => {
//         const state = get();
//         return state.route?.stops?.find((s) => s.id === state.activeStopId) ?? null;
//     },

//     getNearStop: () => {
//         const state = get();
//         return state.route?.stops?.find((s) => s.id === state.nearStopId) ?? null;
//     },

//     isNearActiveStop: () => {
//         const state = get();
//         return !!state.activeStopId && state.activeStopId === state.nearStopId;
//     },

//     canMarkActiveStopDelivered: () => {
//         const state = get();
//         const active = state.route?.stops?.find((s) => s.id === state.activeStopId);
//         return (
//             !!state.activeStopId &&
//             state.activeStopId === state.nearStopId &&
//             active?.order_status === "in_transit"
//         );
//     },
// }));

// function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
//     const R = 6371000;
//     const toRad = (v: number) => (v * Math.PI) / 180;
//     const dLat = toRad(lat2 - lat1);
//     const dLon = toRad(lon2 - lon1);
//     const a =
//         Math.sin(dLat / 2) ** 2 +
//         Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
//     return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
// }


// June 1 
// import { createStore } from "./devtools";
// import * as Location from "expo-location";
// import { RouteStop } from "@/features/map/types/map.types";

// type RouteResponse = {
//     id: string;
//     name?: string;
//     driver?: number;
//     driver_name?: string;
//     delivery_date?: string;
//     is_completed?: boolean;
//     route_geometry?: any;
//     stops: RouteStop[];
//     expires_in_seconds?: number;
// };

// type LocationState = { lat: number; lng: number };

// type Coordinate = { lat: number; lng: number };

// type GeofenceStore = {
//     route: RouteResponse | null;
//     routeLoading: boolean;
//     routeError: string | null;
//     location: LocationState | null;
//     nearStopId: string | null;
//     activeStopId: string | null;
//     selectedStopId: string | null;
//     navigationStopId: string | null;        // ← NEW: current nav target stop id
//     navigationPolyline: Coordinate[];       // ← NEW: decoded polyline coords
//     navigationLoading: boolean;             // ← NEW
//     geofenceMeters: number;
//     loading: boolean;
//     error: string | null;
//     setRoute: (route: RouteResponse | null) => void;
//     startGeofenceTracking: () => Promise<void>;
//     stopGeofenceTracking: () => void;
//     setActiveStopId: (id: string | null) => void;
//     setSelectedStopId: (id: string | null) => void;
//     markStopDelivered: (orderId: string) => void;
//     markStopUndelivered: (orderId: string) => void;
//     getActiveStop: () => RouteStop | null;
//     getNearStop: () => RouteStop | null;
//     isNearActiveStop: () => boolean;
//     canMarkActiveStopDelivered: () => boolean;
//     fetchNavigationPolyline: () => Promise<void>; // ← NEW
//     advanceNavigation: () => void;                // ← NEW
// };

// let geofenceWatcher: Location.LocationSubscription | null = null;

// export const useGeofenceStore = createStore<GeofenceStore>("geofence", (set, get) => ({
//     route: null,
//     routeLoading: false,
//     routeError: null,
//     location: null,
//     nearStopId: null,
//     activeStopId: null,
//     selectedStopId: null,
//     navigationStopId: null,
//     navigationPolyline: [],
//     navigationLoading: false,
//     geofenceMeters: 75,
//     loading: false,
//     error: null,

//     setRoute: (route) => {
//         set((s) => {
//             s.route = route;
//             s.routeLoading = false;
//             s.routeError = null;
//             if (!s.activeStopId && route?.stops?.length) {
//                 const first = route.stops.find((stop) => stop.order_status === "in_transit");
//                 s.activeStopId = first?.id ?? route.stops[0].id;
//             }
//             // Set navigationStopId to first in_transit stop by sequence
//             if (route?.stops?.length) {
//                 const sorted = [...route.stops]
//                     .filter((s) => s.order_status === "in_transit")
//                     .sort((a, b) => a.sequence_number - b.sequence_number);
//                 s.navigationStopId = sorted[0]?.id ?? null;
//             }
//         });
//     },

//     startGeofenceTracking: async () => {
//         const { status } = await Location.requestForegroundPermissionsAsync();
//         if (status !== "granted") {
//             set((s) => { s.error = "Location permission denied"; });
//             return;
//         }

//         if (geofenceWatcher) {
//             geofenceWatcher.remove();
//             geofenceWatcher = null;
//         }

//         geofenceWatcher = await Location.watchPositionAsync(
//             {
//                 accuracy: Location.Accuracy.High,
//                 timeInterval: 1000,
//                 distanceInterval: 3,
//             },
//             (loc) => {
//                 const location = { lat: loc.coords.latitude, lng: loc.coords.longitude };
//                 const { route, geofenceMeters } = get();

//                 let nearStopId: string | null = null;
//                 if (route?.stops?.length) {
//                     let closestStop: { id: string; distance: number } | null = null;

//                     for (const stop of route.stops) {
//                         if (stop.order_status !== "in_transit") continue;
//                         const distance = getDistanceMeters(
//                             location.lat, location.lng,
//                             stop.latitude, stop.longitude
//                         );
//                         if (!closestStop || distance < closestStop.distance) {
//                             closestStop = { id: stop.id, distance };
//                         }
//                     }

//                     if (closestStop && closestStop.distance <= geofenceMeters + 5) {
//                         nearStopId = closestStop.id;
//                     }
//                 }

//                 set((s) => {
//                     s.location = location;
//                     s.nearStopId = nearStopId;
//                     s.activeStopId = nearStopId;
//                 });
//             }
//         );
//     },

//     stopGeofenceTracking: () => {
//         if (geofenceWatcher) {
//             geofenceWatcher.remove();
//             geofenceWatcher = null;
//         }
//     },

//     setActiveStopId: (id) => set((s) => { s.activeStopId = id; }),
//     setSelectedStopId: (id) => set((s) => { s.selectedStopId = id; }),

//     markStopDelivered: (orderId) => {
//         set((s) => {
//             if (!s.route) return;

//             const deliveredStop = s.route.stops.find((stop) => stop.order === orderId);

//             s.route = {
//                 ...s.route,
//                 stops: s.route.stops.map((stop) =>
//                     stop.order === orderId
//                         ? { ...stop, order_status: "delivered", delivered_at: new Date().toISOString() }
//                         : stop
//                 ),
//             };

//             if (deliveredStop && s.activeStopId === deliveredStop.id) {
//                 s.activeStopId = null;
//                 s.nearStopId = null;
//                 s.selectedStopId = null;
//             }
//         });

//         // Auto-advance navigation to next stop
//         get().advanceNavigation();
//     },

//     markStopUndelivered: (orderId) => {
//         set((s) => {
//             if (!s.route) return;
//             const undeliveredStop = s.route.stops.find((stop) => stop.order === orderId);
//             s.route = {
//                 ...s.route,
//                 stops: s.route.stops.map((stop) =>
//                     stop.order === orderId
//                         ? { ...stop, order_status: "undelivered" }
//                         : stop
//                 ),
//             };
//             if (undeliveredStop && s.activeStopId === undeliveredStop.id) {
//                 s.activeStopId = null;
//                 s.nearStopId = null;
//                 s.selectedStopId = null;
//             }
//         });

//         // Auto-advance navigation to next stop
//         get().advanceNavigation();
//     },

//     // ─── NEW: Advance navigationStopId to next in_transit stop by sequence ───
//     advanceNavigation: () => {
//         const { route, navigationStopId } = get();
//         if (!route?.stops?.length) return;

//         const remaining = route.stops
//             .filter((s) => s.order_status === "in_transit")
//             .sort((a, b) => a.sequence_number - b.sequence_number);

//         if (!remaining.length) {
//             set((s) => {
//                 s.navigationStopId = null;
//                 s.navigationPolyline = [];
//             });
//             return;
//         }

//         // Pick next stop after current navigationStopId
//         const currentIdx = remaining.findIndex((s) => s.id === navigationStopId);
//         const nextStop = currentIdx >= 0 ? remaining[currentIdx + 1] : remaining[0];
//         const finalStop = nextStop ?? remaining[0];

//         set((s) => {
//             s.navigationStopId = finalStop.id;
//             s.navigationPolyline = []; // clear old polyline, will re-fetch
//         });

//         // Fetch new polyline for the next stop
//         get().fetchNavigationPolyline();
//     },

//     // ─── NEW: Fetch OSRM polyline from current location → navigationStopId ───
//     fetchNavigationPolyline: async () => {
//         const { location, route, navigationStopId } = get();
//         if (!location || !route?.stops?.length || !navigationStopId) return;

//         const targetStop = route.stops.find((s) => s.id === navigationStopId);
//         if (!targetStop) return;

//         set((s) => { s.navigationLoading = true; });

//         try {
//             const url =
//                 `https://router.project-osrm.org/route/v1/driving/` +
//                 `${location.lng},${location.lat};${targetStop.longitude},${targetStop.latitude}` +
//                 `?overview=full&geometries=geojson&steps=false`;

//             const res = await fetch(url);
//             const data = await res.json();

//             if (data?.routes?.[0]?.geometry?.coordinates) {
//                 const coords: Coordinate[] = data.routes[0].geometry.coordinates.map(
//                     ([lng, lat]: [number, number]) => ({ lat, lng })
//                 );
//                 set((s) => {
//                     s.navigationPolyline = coords;
//                     s.navigationLoading = false;
//                 });
//             } else {
//                 // Fallback: straight line if OSRM fails
//                 set((s) => {
//                     s.navigationPolyline = [
//                         { lat: location.lat, lng: location.lng },
//                         { lat: targetStop.latitude, lng: targetStop.longitude },
//                     ];
//                     s.navigationLoading = false;
//                 });
//             }
//         } catch {
//             // Fallback straight line on network error
//             set((s) => {
//                 s.navigationPolyline = [
//                     { lat: location.lat, lng: location.lng },
//                     { lat: targetStop.latitude, lng: targetStop.longitude },
//                 ];
//                 s.navigationLoading = false;
//             });
//         }
//     },

//     getActiveStop: () => {
//         const state = get();
//         return state.route?.stops?.find((s) => s.id === state.activeStopId) ?? null;
//     },

//     getNearStop: () => {
//         const state = get();
//         return state.route?.stops?.find((s) => s.id === state.nearStopId) ?? null;
//     },

//     isNearActiveStop: () => {
//         const state = get();
//         return !!state.activeStopId && state.activeStopId === state.nearStopId;
//     },

//     canMarkActiveStopDelivered: () => {
//         const state = get();
//         const active = state.route?.stops?.find((s) => s.id === state.activeStopId);
//         return (
//             !!state.activeStopId &&
//             state.activeStopId === state.nearStopId &&
//             active?.order_status === "in_transit"
//         );
//     },
// }));

// function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
//     const R = 6371000;
//     const toRad = (v: number) => (v * Math.PI) / 180;
//     const dLat = toRad(lat2 - lat1);
//     const dLon = toRad(lon2 - lon1);
//     const a =
//         Math.sin(dLat / 2) ** 2 +
//         Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
//     return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
// }



/// June 1 (2)
import { createStore } from "./devtools";
import * as Location from "expo-location";
import { RouteStop } from "@/features/map/types/map.types";

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
    navigationStopId: string | null;
    navigationPolyline: { lat: number; lng: number }[];
    navigationLoading: boolean;
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
    fetchNavigationPolyline: () => Promise<void>;
    advanceNavigation: () => void;
    resetStore: () => void;
};

let geofenceWatcher: Location.LocationSubscription | null = null;

// ── Helper: straight-line distance in meters (Haversine) ──────────────────
function getDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ── Helper: find closest in_transit stop to driver's current location ─────
function getClosestInTransitStop(
    stops: RouteStop[],
    location: LocationState | null
): RouteStop | null {
    const inTransit = stops.filter((s) => s.order_status === "in_transit");
    if (!inTransit.length) return null;

    // No GPS yet — fall back to lowest sequence_number
    if (!location) {
        return [...inTransit].sort(
            (a, b) => a.sequence_number - b.sequence_number
        )[0];
    }

    let closest: RouteStop | null = null;
    let minDist = Infinity;

    for (const stop of inTransit) {
        const dist = getDistanceMeters(
            location.lat,
            location.lng,
            stop.latitude,
            stop.longitude
        );
        if (dist < minDist) {
            minDist = dist;
            closest = stop;
        }
    }

    return closest;
}

export const useGeofenceStore = createStore<GeofenceStore>(
    "geofence",
    (set, get) => ({
        route: null,
        routeLoading: false,
        routeError: null,
        location: null,
        nearStopId: null,
        activeStopId: null,
        selectedStopId: null,
        navigationStopId: null,
        navigationPolyline: [],
        navigationLoading: false,
        geofenceMeters: 75, // production value
        // geofenceMeters: 1000, // testing value
        loading: false,
        error: null,

        // ── setRoute ────────────────────────────────────────────────────────────
        setRoute: (route) => {
            set((s) => {
                s.route = route;
                s.routeLoading = false;
                s.routeError = null;

                if (!s.activeStopId && route?.stops?.length) {
                    const first = route.stops.find(
                        (stop) => stop.order_status === "in_transit"
                    );
                    s.activeStopId = first?.id ?? route.stops[0].id;
                }

                // Set navigationStopId to closest in_transit stop from current GPS
                if (route?.stops?.length) {
                    const closest = getClosestInTransitStop(route.stops, s.location);
                    s.navigationStopId = closest?.id ?? null;
                }
            });

            if (get().navigationStopId) {
                get().fetchNavigationPolyline();
            }
        },

        // ── startGeofenceTracking ───────────────────────────────────────────────
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

            // AFTER
            geofenceWatcher = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 1000,
                    distanceInterval: 3,   // GPS fires every 3m movement
                },
                (loc) => {
                    const location = {
                        lat: loc.coords.latitude,
                        lng: loc.coords.longitude,
                    };
                    const { route, geofenceMeters, location: prevLocation, navigationStopId } = get();

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
                            const closestStopData = route.stops.find((s) => s.id === closestStop.id);
                            const selectedStop = route.stops.find((s) => s.id === get().selectedStopId);

                            if (
                                selectedStop &&
                                selectedStop.order_status === "in_transit" &&
                                closestStopData &&
                                selectedStop.latitude.toFixed(5) === closestStopData.latitude.toFixed(5) &&
                                selectedStop.longitude.toFixed(5) === closestStopData.longitude.toFixed(5)
                            ) {
                                nearStopId = selectedStop.id;
                            } else {
                                nearStopId = closestStop.id;
                            }
                        }
                    }

                    set((s) => {
                        s.location = location;
                        s.nearStopId = nearStopId;
                        s.activeStopId = nearStopId;
                    });

                    // ── Auto-refresh polyline every 10m of movement ──────────────────────
                    if (navigationStopId && route?.stops?.length) {
                        const movedMeters = prevLocation
                            ? getDistanceMeters(
                                prevLocation.lat,
                                prevLocation.lng,
                                location.lat,
                                location.lng
                            )
                            : Infinity; // first fix → always fetch

                        if (movedMeters >= 10) {
                            get().fetchNavigationPolyline();
                        }
                    }
                }
            );
        },

        // ── stopGeofenceTracking ────────────────────────────────────────────────
        stopGeofenceTracking: () => {
            if (geofenceWatcher) {
                geofenceWatcher.remove();
                geofenceWatcher = null;
            }
        },

        // ── setters ─────────────────────────────────────────────────────────────
        setActiveStopId: (id) =>
            set((s) => {
                s.activeStopId = id;
                if (id && s.route?.stops && s.nearStopId) {
                    const targetStop = s.route.stops.find((stop) => stop.id === id);
                    const currentNearStop = s.route.stops.find((stop) => stop.id === s.nearStopId);
                    if (
                        targetStop &&
                        currentNearStop &&
                        targetStop.latitude.toFixed(5) === currentNearStop.latitude.toFixed(5) &&
                        targetStop.longitude.toFixed(5) === currentNearStop.longitude.toFixed(5)
                    ) {
                        s.nearStopId = id;
                    }
                }
            }),

        setSelectedStopId: (id) =>
            set((s) => {
                s.selectedStopId = id;
            }),

        // ── markStopDelivered ───────────────────────────────────────────────────
        markStopDelivered: (orderId) => {
            set((s) => {
                if (!s.route) return;

                const deliveredStop = s.route.stops.find(
                    (stop) => stop.order === orderId
                );

                s.route = {
                    ...s.route,
                    stops: s.route.stops.map((stop) =>
                        stop.order === orderId
                            ? {
                                ...stop,
                                order_status: "delivered",
                                delivered_at: new Date().toISOString(),
                            }
                            : stop
                    ),
                };

                if (deliveredStop && s.activeStopId === deliveredStop.id) {
                    s.activeStopId = null;
                    s.nearStopId = null;
                    s.selectedStopId = null;
                }
            });

            // Auto-advance to next closest in_transit stop
            get().advanceNavigation();
        },

        // ── markStopUndelivered ─────────────────────────────────────────────────
        markStopUndelivered: (orderId) => {
            set((s) => {
                if (!s.route) return;

                const undeliveredStop = s.route.stops.find(
                    (stop) => stop.order === orderId
                );

                s.route = {
                    ...s.route,
                    stops: s.route.stops.map((stop) =>
                        stop.order === orderId
                            ? { ...stop, order_status: "undelivered" }
                            : stop
                    ),
                };

                if (undeliveredStop && s.activeStopId === undeliveredStop.id) {
                    s.activeStopId = null;
                    s.nearStopId = null;
                    s.selectedStopId = null;
                }
            });

            // Auto-advance to next closest in_transit stop
            get().advanceNavigation();
        },

        // ── advanceNavigation ───────────────────────────────────────────────────
        // Finds the closest remaining in_transit stop and fetches a new polyline
        advanceNavigation: () => {
            const { route, location } = get();
            if (!route?.stops?.length) return;

            const closest = getClosestInTransitStop(route.stops, location);

            if (!closest) {
                // All stops done — clear nav
                set((s) => {
                    s.navigationStopId = null;
                    s.navigationPolyline = [];
                });
                return;
            }

            set((s) => {
                s.navigationStopId = closest.id;
                s.navigationPolyline = []; // clear stale polyline before fetching new
            });

            get().fetchNavigationPolyline();
        },

        // ── fetchNavigationPolyline ─────────────────────────────────────────────
        // Fetches OSRM road route from driver's GPS → closest in_transit stop
        fetchNavigationPolyline: async () => {
            const { route, location } = get();
            if (!route?.stops?.length) return;

            // Always resolve to closest in_transit stop at fetch time
            const targetStop = getClosestInTransitStop(route.stops, location);
            if (!targetStop) return;

            // Sync navigationStopId if it drifted
            if (get().navigationStopId !== targetStop.id) {
                set((s) => {
                    s.navigationStopId = targetStop.id;
                });
            }

            // No GPS yet — retry after 1.5s
            if (!location) {
                setTimeout(() => get().fetchNavigationPolyline(), 1500);
                return;
            }

            set((s) => {
                s.navigationLoading = true;
            });

            try {
                const url =
                    `https://osrm.polynexus.in/route/v1/driving/` +
                    `${location.lng},${location.lat};` +
                    `${targetStop.longitude},${targetStop.latitude}` +
                    `?overview=full&geometries=geojson&steps=false`;

                const res = await fetch(url);
                const data = await res.json();

                if (data?.routes?.[0]?.geometry?.coordinates) {
                    const coords = data.routes[0].geometry.coordinates.map(
                        ([lng, lat]: [number, number]) => ({ lat, lng })
                    );
                    set((s) => {
                        s.navigationPolyline = coords;
                        s.navigationLoading = false;
                    });
                } else {
                    // OSRM returned no route — fall back to straight line
                    set((s) => {
                        s.navigationPolyline = [
                            { lat: location.lat, lng: location.lng },
                            { lat: targetStop.latitude, lng: targetStop.longitude },
                        ];
                        s.navigationLoading = false;
                    });
                }
            } catch {
                // Network error — fall back to straight line
                set((s) => {
                    s.navigationPolyline = [
                        { lat: location.lat, lng: location.lng },
                        { lat: targetStop.latitude, lng: targetStop.longitude },
                    ];
                    s.navigationLoading = false;
                });
            }
        },

        // ── selectors ────────────────────────────────────────────────────────────
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
            const active = state.route?.stops?.find(
                (s) => s.id === state.activeStopId
            );
            return (
                !!state.activeStopId &&
                state.activeStopId === state.nearStopId &&
                active?.order_status === "in_transit"
            );
        },

        resetStore: () => {
            set((s) => {
                s.route = null;
                s.routeLoading = false;
                s.routeError = null;
                s.location = null;
                s.nearStopId = null;
                s.activeStopId = null;
                s.selectedStopId = null;
                s.navigationStopId = null;
                s.navigationPolyline = [];
                s.navigationLoading = false;
                s.loading = false;
                s.error = null;
            });
        },
    })
);