// feature/map/hooks/useStartupSync.ts
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useTrackingStore } from "@/store";
import { mapApi } from "../api/mapApi";
// import { useTrackingStore } from "@/feature/";

export function useStartupSync() {
    useEffect(() => {
        let cancelled = false;

        const sync = async () => {
            const { domain_name, route_id } = useAuthStore.getState();

            if (!domain_name) {
                if (__DEV__) console.warn("domain_name not set in authStore, skipping trip status sync");
                return;
            }

            try {
                const res = await mapApi.getTripStatus(domain_name);

                if (cancelled) return;

                useTrackingStore.setState((s) => {
                    s.isTripStarted = !!res.on_trip;
                    s.loading = false;
                    s.error = null;
                });

                if (res.active_route) {
                    useAuthStore.setState((s) => {
                        s.route_id = res.active_route;
                    });
                } else if (route_id) {
                    useAuthStore.setState((s) => {
                        s.route_id = route_id;
                    });
                }
            } catch (err: any) {
                if (cancelled) return;

                useTrackingStore.setState((s) => {
                    s.error = err?.message ?? "Failed to sync trip status";
                });
            }
        };

        sync();

        return () => {
            cancelled = true;
        };
    }, []);
}