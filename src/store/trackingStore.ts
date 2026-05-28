import * as Location from "expo-location";
import { Alert } from "react-native";
import { createStore } from "./devtools";
import { useAuthStore } from "./authStore";
import { mapApi } from "@/features/map/api/mapApi";
import { startBackgroundTracking, stopBackgroundTracking } from "@/services/location/trackingService";
import { useToast } from "@/hooks/useToast";
import { cleanupTripSession } from "@/features/map/hooks/stopTripCleanup";
import { env } from "@/config/env";

const { show } = useToast();

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

    startTrip: () => Promise<boolean>;
    stopTrip: () => Promise<boolean>;
    connectSocket: (domain: string) => void;
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

        startTrip: async () => {
            set((s) => {
                s.loading = true;
                s.error = null;
            });

            try {
                const { domain_name, route_id } = useAuthStore.getState();

                if (!domain_name) throw new Error("domain_name not set in authStore");
                if (!route_id) throw new Error("route_id not set in authStore");

                if (__DEV__) console.log("tracking STORE", route_id);
                if (__DEV__) console.log(route_id, domain_name);

                await mapApi.startTrip(domain_name, route_id);

                get().connectSocket(domain_name);
                await get().startTracking();

                try {
                    await startBackgroundTracking();
                } catch (backgroundErr: any) {
                    if (__DEV__) {
                        console.warn(
                            "⚠️ Background location tracking not started (expected in Expo Go):",
                            backgroundErr.message
                        );
                    }
                }

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

        stopTrip: async () => {
            set((s) => {
                s.loading = true;
                s.error = null;
            });

            try {
                const { domain_name, route_id } = useAuthStore.getState();

                if (!domain_name) throw new Error("domain_name not set in authStore");
                if (!route_id) throw new Error("route_id not set in authStore");

                if (__DEV__) console.log("🛑 Completing trip for:", route_id);

                await mapApi.completeTrip(domain_name, route_id);

                get().stopTracking();

                try {
                    await stopBackgroundTracking();
                } catch (backgroundErr: any) {
                    if (__DEV__) {
                        console.warn(
                            "⚠️ Background location tracking failed to stop:",
                            backgroundErr.message
                        );
                    }
                }

                get().disconnectSocket();

                set((s) => {
                    s.isTripStarted = false;
                    s.loading = false;
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

        connectSocket: (domain: string) => {
            const existing = get().socket;

            if (existing) {
                existing.onclose = null;
                existing.close();
            }

            // Extract tenant subdomain from potentially stale domain values
            let tenantSubdomain = domain
                .replace(/^https?:\/\//, "")
                .replace(/^www\./, "")
                .replace(/\/+$/, "")
                .split(".")[0]; // e.g. "pench-nagpur"

            // Build WebSocket host using current env base URL
            const apiBaseUrl = env.EXPO_PUBLIC_API_BASE_URL;
            const match = apiBaseUrl.match(/^https?:\/\/([^/]+)/);
            let wsHost = `${tenantSubdomain}.localhost`;
            let wsProtocol = "wss";

            if (match) {
                const hostWithPort = match[1];
                const hostParts = hostWithPort.split(":");
                const hostIp = hostParts[0];
                const port = hostParts[1] ? `:${hostParts[1]}` : "";

                if (hostIp === "localhost" || hostIp === "127.0.0.1") {
                    wsHost = `${tenantSubdomain}.localhost${port}`;
                    wsProtocol = "ws";
                } else if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostIp)) {
                    // For local IP, connect directly to the IP to bypass local DNS/rebinding issues on mobile,
                    // and pass the tenant subdomain as a query parameter for the backend middleware.
                    wsHost = `${hostIp}${port}`;
                    wsProtocol = "ws";
                } else {
                    // Remote/production domain
                    wsHost = `${tenantSubdomain}.${hostIp}${port}`;
                }
            }

            const token = useAuthStore.getState().accessToken;
            const wsUrl = `${wsProtocol}://${wsHost}/ws/tracking/?token=${token}&tenant=${tenantSubdomain}`;
            const ws = new WebSocket(wsUrl);

            console.log(
                "Connecting to WebSocket at",
                wsUrl
            );

            ws.onopen = () => {
                if (__DEV__) console.log("✅ WebSocket connected");
            };

            ws.onclose = () => {
                if (!get().isTripStarted) return;
                if (__DEV__) console.log("🔄 WebSocket closed, Reconnecting...");
                setTimeout(() => get().connectSocket(domain), 3000);
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