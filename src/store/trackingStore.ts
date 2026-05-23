import * as Location from "expo-location";
import { Alert } from "react-native";
import { createStore } from "./devtools";
import { useAuthStore } from "./authStore";
import {
    startBackgroundTracking,
    stopBackgroundTracking,
} from "@/services/location/trackingService";
import { deliveryApi } from "@/features/delivery/api/deliveryApi";

type LocationState = {
    lat: number;
    lng: number;
    accuracy?: number | null;
};

interface TrackingStore {
    isTripStarted: boolean;
    location: LocationState | null;
    socket: WebSocket | null;
    watcher: Location.LocationSubscription | null;
    loading: boolean;
    error: string | null;

    activeStopId: string | null;
    selectedStopId: string | null;

    setActiveStopId: (id: string | null) => void;
    setSelectedStopId: (id: string | null) => void;

    startTrip: (token: string | null) => Promise<boolean>;
    stopTrip: (token: string | null) => Promise<boolean>;
    connectSocket: (domain: string, token: string | null) => void;
    disconnectSocket: () => void;
    startTracking: () => Promise<void>;
    stopTracking: () => void;
}

export const useTrackingStore = createStore<TrackingStore>(
    "tracking",
    (set, get) => ({
        isTripStarted: false,
        location: null,
        socket: null,
        watcher: null,
        loading: false,
        error: null,

        activeStopId: null,
        selectedStopId: null,

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

        startTrip: async (token: string | null) => {
            set((s) => { s.loading = true; s.error = null; });

            try {
                const { domain_name, route_id } = useAuthStore.getState();
                console.log("tracking STORE", route_id);

                if (!domain_name) throw new Error("domain_name not set in authStore");
                if (!route_id) throw new Error("route_id not set in authStore");
                if (!token) throw new Error("token is null");

                if (__DEV__) console.log("tracking STORE", route_id);
                if (__DEV__) console.log(route_id, domain_name);

                // const url = `https://${domain_name}/api/erp/orders/driver/${route_id}/start-trip/`;
                // if (__DEV__) console.log("🚀 Starting trip at:", url);

                // const res = await fetch(url, {
                //     method: "POST",
                //     headers: {
                //         Authorization: `Bearer ${token}`,
                //         "Content-Type": "application/json",
                //     },
                // });

                // if (__DEV__) {
                //     const text = await res.text();
                //     console.log("📡 Start trip status:", res.status);
                //     console.log("📦 Start trip response:", text.slice(0, 200));
                // }

                // if (!res.ok) throw new Error(`Start trip failed: ${res.status}`);
                await deliveryApi.startTrip(domain_name, route_id);

                get().connectSocket(domain_name, token);
                await get().startTracking();
                await startBackgroundTracking();

                set((s) => {
                    s.isTripStarted = true;
                    s.loading = false;
                });

                return true;
            } catch (err: any) {
                if (__DEV__) console.error("❌ startTrip error:", err.message);

                set((s) => {
                    s.error = err.message;
                    s.loading = false;
                });

                return false;
            }
        },

        stopTrip: async (token: string | null) => {
            set((s) => {
                s.loading = true;
                s.error = null;
            });

            try {
                const { domain_name, route_id } = useAuthStore.getState();

                if (!domain_name) throw new Error("domain_name not set in authStore");
                if (!route_id) throw new Error("route_id not set in authStore");

                if (__DEV__) console.log("🛑 Completing trip for:", route_id);

                await deliveryApi.completeTrip(domain_name, route_id);

                // const url = `https://${domain_name}/api/erp/orders/driver/${route_id}/complete-trip/`;
                // if (__DEV__) console.log("🛑 Completing trip at:", url);

                // const res = await fetch(url, {
                //     method: "POST",
                //     headers: {
                //         Authorization: `Bearer ${token}`,
                //         "Content-Type": "application/json",
                //     },
                //     body: JSON.stringify({}),
                // });

                // const rawText = await res.text();

                // if (__DEV__) {
                //     console.log("📡 Complete trip status:", res.status);
                //     console.log("📦 Complete trip response:", rawText.slice(0, 300));
                // }

                // if (!res.ok) {
                //     throw new Error(`Complete trip failed: ${res.status}`);
                // }

                // const data = JSON.parse(rawText) as {
                //     detail: string;
                //     completed_at: string;
                //     expires_in_seconds: number;
                // };

                // if (__DEV__) {
                //     console.log("✅", data.detail);
                //     console.log("🕒 completed_at:", data.completed_at);
                //     console.log("⏳ expires_in_seconds:", data.expires_in_seconds);
                // }

                get().stopTracking();
                await stopBackgroundTracking();
                get().disconnectSocket();

                set((s) => {
                    s.isTripStarted = false;
                    s.loading = false;
                    s.activeStopId = null;
                    s.selectedStopId = null;
                });

                return true;
            } catch (err: any) {
                if (__DEV__) console.error("❌ stopTrip error:", err.message);

                set((s) => {
                    s.error = err.message;
                    s.loading = false;
                });

                return false;
            }
        },

        connectSocket: (domain: string, token: string | null) => {
            const existing = get().socket;

            if (existing) {
                existing.onclose = null;
                existing.close();
            }

            const ws = new WebSocket(`wss://${domain}/ws/tracking/?token=${token}`);

            ws.onopen = () => {
                if (__DEV__) console.log("✅ WebSocket connected");
            };

            ws.onclose = () => {
                if (!get().isTripStarted) return;
                if (__DEV__) console.log("🔄 WebSocket closed, Reconnecting...");
                setTimeout(() => get().connectSocket(domain, token), 3000);
            };

            ws.onerror = (e: any) => {
                if (__DEV__) console.log("❌ WebSocket error:", e.message);
            };

            set((s) => {
                s.socket = ws;
            });
        },

        disconnectSocket: () => {
            const ws = get().socket;
            if (ws) {
                ws.onclose = null;
                ws.close();
            }

            set((s) => {
                s.socket = null;
            });
        },

        startTracking: async () => {
            const existingWatcher = get().watcher;
            if (existingWatcher) {
                existingWatcher.remove();
                set((s) => {
                    s.watcher = null;
                });
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (__DEV__) console.log("📍 Permission status:", status);

            if (status !== "granted") {
                set((s) => {
                    s.error = "Location permission denied";
                });

                Alert.alert(
                    "Permission Required",
                    "Location access is needed to track your delivery route.",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Open Settings",
                            onPress: () => Location.enableNetworkProviderAsync(),
                        },
                    ]
                );
                return;
            }

            const watcher = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 1000,
                    distanceInterval: 3,
                },
                (loc) => {
                    const coords: LocationState = {
                        lat: loc.coords.latitude,
                        lng: loc.coords.longitude,
                        accuracy: loc.coords.accuracy,
                    };

                    set((s) => {
                        s.location = coords;
                    });

                    const { socket } = get();
                    if (socket?.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify(coords));
                    }
                }
            );

            set((s) => {
                s.watcher = watcher;
            });
        },

        stopTracking: () => {
            get().watcher?.remove();
            set((s) => {
                s.watcher = null;
            });
        },
    })
);