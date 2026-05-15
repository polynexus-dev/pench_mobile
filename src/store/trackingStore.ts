// src/store/trackingStore.ts
import * as Location from "expo-location";
import { Alert } from "react-native";
import { createStore } from "./devtools";
import { useAuthStore } from "./authStore";

type LocationState = { lat: number; lng: number };

interface TrackingStore {
    isTripStarted: boolean;
    location: LocationState | null;
    socket: WebSocket | null;
    watcher: Location.LocationSubscription | null;
    loading: boolean;
    error: string | null;
    startTrip: (token: string) => Promise<boolean>;
    stopTrip: () => void;
    connectSocket: (domain: string, token: string) => void;
    disconnectSocket: () => void;
    startTracking: () => Promise<void>;
    stopTracking: () => void;
}

export const useTrackingStore = createStore<TrackingStore>("tracking", (set, get) => ({
    isTripStarted: false,
    location: null,
    socket: null,
    watcher: null,
    loading: false,
    error: null,

    startTrip: async (token: string) => {
        set((s) => { s.loading = true; s.error = null; });
        try {
            const { domain_name } = useAuthStore.getState();

            if (!domain_name) throw new Error("domain_name not set in authStore");

            const url = `https://${domain_name}/api/erp/orders/driver/start-trip/`;
            if (__DEV__) console.log("🚀 Starting trip at:", url);

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (__DEV__) {
                const text = await res.text();
                console.log("📡 Start trip status:", res.status);
                console.log("📦 Start trip response:", text.slice(0, 200));
            }

            if (!res.ok) throw new Error(`Start trip failed: ${res.status}`);

            set((s) => { s.isTripStarted = true; s.loading = false; });
            return true;
        } catch (err: any) {
            if (__DEV__) console.error("❌ startTrip error:", err.message);
            set((s) => { s.error = err.message; s.loading = false; });
            return false;
        }
    },

    stopTrip: () => {
        get().stopTracking();
        get().disconnectSocket();
        set((s) => { s.isTripStarted = false; });
    },

    connectSocket: (domain: string, token: string) => {
        const ws = new WebSocket(`wss://${domain}/ws/tracking/?token=${token}`);
        ws.onopen = () => { if (__DEV__) console.log("✅ WebSocket connected"); };
        ws.onclose = () => {
            if (__DEV__) console.log("🔄 WebSocket closed, reconnecting...");
            setTimeout(() => get().connectSocket(domain, token), 3000);
        };
        ws.onerror = (e: any) => { if (__DEV__) console.log("❌ WebSocket error:", e.message); };
        set((s) => { s.socket = ws; });
    },

    disconnectSocket: () => {
        get().socket?.close();
        set((s) => { s.socket = null; });
    },

    startTracking: async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (__DEV__) console.log("📍 Permission status:", status);

        if (status !== "granted") {
            set((s) => { s.error = "Location permission denied"; });
            Alert.alert(
                "Permission Required",
                "Location access is needed to track your delivery route.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Open Settings", onPress: () => Location.enableNetworkProviderAsync() },
                ]
            );
            return;
        }

        const watcher = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 3 },
            (loc) => {
                const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
                set((s) => { s.location = coords; });
                const { socket } = get();
                if (socket?.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify(coords));
                }
            }
        );

        set((s) => { s.watcher = watcher; });
    },

    stopTracking: () => {
        get().watcher?.remove();
        set((s) => { s.watcher = null; });
    },
}));