// // feature/map/hooks/stopTripCleanup.ts
// import { queryClient } from "@/lib/queryClient";
// import { asyncStorage } from "@services/storage/asyncStorage";
// import { useAuthStore } from "@/store/authStore";
// import { useTrackingStore } from "@/store/trackingStore";
// import { useGeofenceStore } from "@/store/geofenceStore";

// function normalizeDomain(domain: string) {
//     return domain
//         .replace(/^https?:\/\//, "")
//         .replace(/^www\./, "")
//         .replace(/\/+$/, "");
// }

// export async function cleanupTripSession() {
//     const { socket, watcher, stopGeofenceTracking } = useTrackingStore.getState();

//     if (socket) {
//         try {
//             socket.onclose = null;
//             socket.close();
//         } catch { }
//     }

//     if (watcher) {
//         try {
//             watcher.remove?.();
//         } catch { }
//     }

//     stopGeofenceTracking();

//     const domain_name = useAuthStore.getState().domain_name;
//     const cleanDomain = domain_name ? normalizeDomain(domain_name) : null;

//     if (cleanDomain) {
//         queryClient.removeQueries({
//             queryKey: ["my-route", cleanDomain],
//             exact: true,
//         });
//     }

//     await asyncStorage.removeItem("route_id");

//     useAuthStore.setState({ route_id: null });

//     useTrackingStore.setState({
//         isTripStarted: false,
//         socket: null,
//         watcher: null,
//         loading: false,
//         error: null,
//         canStopTrip: false,
//     });

//     useGeofenceStore.setState({
//         route: null,
//         routeLoading: false,
//         routeError: null,
//         location: null,
//         nearStopId: null,
//         activeStopId: null,
//         selectedStopId: null,
//         loading: false,
//         error: null,
//     });
// }

import { queryClient } from "@/services/api/queryClient";
import { asyncStorage } from "@services/storage/asyncStorage";
import { useAuthStore } from "@/store/authStore";
import { useTrackingStore } from "@/store/trackingStore";
import { useGeofenceStore } from "@/store/geofenceStore";

function normalizeDomain(domain: string) {
    return domain
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/+$/, "");
}

export async function cleanupTripSession() {
    const { socket, watcher } = useTrackingStore.getState();
    const { stopGeofenceTracking } = useGeofenceStore.getState();

    if (socket) {
        try {
            socket.onclose = null;
            socket.close();
        } catch { }
    }

    if (watcher) {
        try {
            watcher.remove?.();
        } catch { }
    }

    stopGeofenceTracking();

    const domain_name = useAuthStore.getState().domain_name;
    const cleanDomain = domain_name ? normalizeDomain(domain_name) : null;

    if (cleanDomain) {
        queryClient.removeQueries({
            queryKey: ["my-route", cleanDomain],
            exact: true,
        });
    }

    await asyncStorage.removeItem("route_id");

    useAuthStore.setState({ route_id: null });

    useTrackingStore.setState({
        isTripStarted: false,
        socket: null,
        watcher: null,
        loading: false,
        error: null,
        canStopTrip: false,
    });

    useGeofenceStore.setState({
        route: null,
        routeLoading: false,
        routeError: null,
        location: null,
        nearStopId: null,
        activeStopId: null,
        selectedStopId: null,
        loading: false,
        error: null,
    });
}