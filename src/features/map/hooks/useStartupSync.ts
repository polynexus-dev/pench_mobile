import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useTrackingStore } from "@/store/trackingStore";
import { mapApi } from "../api/mapApi";
import { useFetchMyRoute } from "./useFetchMyRoute";
import { useSyncRouteToGeofence } from "./useSyncRouteToGeofence";

export function useStartupSync() {
  const { data: routeData } = useFetchMyRoute();
  useSyncRouteToGeofence(routeData);

  const startupDoneRef = useRef(false);

  useEffect(() => { 
    let cancelled = false;

    const sync = async () => {
      const { domain_name, route_id, accessToken } = useAuthStore.getState();

      if (!domain_name) {
        if (__DEV__) {
          console.warn(
            "domain_name not set in authStore, skipping trip status sync"
          );
        }
        return;
      }

      try {
        const res = await mapApi.getTripStatus(domain_name);

        if (cancelled) return;

        useTrackingStore.setState({
          isTripStarted: !!res.on_trip,
          loading: false,
          error: null,
        });

        if (res.active_route) {
          const resolvedRouteId = typeof res.active_route === "object"
            ? ((res.active_route as any).id || (res.active_route as any).route_id)
            : res.active_route;
          useAuthStore.setState({ route_id: resolvedRouteId });
        } else if (route_id) {
          useAuthStore.setState({ route_id });
        }

        if (res.on_trip && accessToken && !startupDoneRef.current) {
          startupDoneRef.current = true;

          const { connectSocket, startTracking } = useTrackingStore.getState();

          connectSocket(domain_name);
          await startTracking();
        }
      } catch (err: any) {
        if (cancelled) return;

        useTrackingStore.setState({
          loading: false,
          error: err?.message ?? "Failed to sync trip status",
        });
      }
    };

    sync();

    return () => {
      cancelled = true;
    };
  }, []);
}