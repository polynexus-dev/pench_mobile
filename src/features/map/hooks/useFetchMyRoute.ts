import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@store/authStore";
import { useTrackingStore } from "@store/trackingStore";
import { mapApi } from "../api/mapApi";
import { asyncStorage } from "@services/storage/asyncStorage";
import { useToast } from "@/hooks/useToast";

export function useFetchMyRoute() {
    const domainName = useAuthStore((s) => s.domain_name);
    const { show } = useToast();
    const lastMessageRef = useRef<string | null>(null);

    const query = useQuery({
        queryKey: ["my-route", domainName],
        enabled: !!domainName,
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false,
        queryFn: async () => {
            if (!domainName) {
                return null;
            }

            try {
                const data = await mapApi.fetchMyRoute(domainName);

                if (!data?.id) {
                    useTrackingStore.setState((s) => {
                        s.error = null;
                    });
                    useAuthStore.getState().setDomainAndRoute(domainName, null as any);
                    return null;
                }

                await asyncStorage.setItem("route_id", String(data.id));
                useAuthStore.getState().setDomainAndRoute(domainName, String(data.id));
                useTrackingStore.setState((s) => {
                    s.error = null;
                });

                return data;
            } catch (err: any) {
                const msg = err?.message ?? "";

                if (
                    msg.includes("No route found") ||
                    msg.includes("No active route found for today")
                ) {
                    await asyncStorage.removeItem("route_id");
                    useAuthStore.getState().setDomainAndRoute(domainName, null as any);
                    useTrackingStore.setState((s) => {
                        s.error = null;
                        s.isTripStarted = false;
                        s.loading = false;
                    });
                    return null;
                }

                // throw err;
            }
        },
        select: (data) => data ?? null,
    });

    const message = useMemo(() => {
        const msg = query.error instanceof Error ? query.error.message : null;

        if (msg === "route_id not assigned") return "Route not assigned yet.";
        if (msg === "domain_name not set") return "Domain is not available.";
        return msg;
    }, [query.error]);

    useEffect(() => {
        if (!message || lastMessageRef.current === message) return;

        lastMessageRef.current = message;
        show({
            message,
            type: message === "Route not assigned yet." ? "warning" : "error",
        });
    }, [message, show]);

    return query;
}

// import { useEffect, useMemo, useRef } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { useAuthStore } from "@store/authStore";
// import { useTrackingStore } from "@store/trackingStore";
// import { mapApi } from "../api/mapApi";
// import { asyncStorage } from "@services/storage/asyncStorage";
// import { useToast } from "@/hooks/useToast";

// export function useFetchMyRoute() {
//   const domainName = useAuthStore((s) => s.domain_name);
//   const { show } = useToast();
//   const lastMessageRef = useRef<string | null>(null);

//   const query = useQuery({
//     queryKey: ["my-route", domainName],
//     enabled: !!domainName,
//     staleTime: 5 * 60 * 1000,
//     refetchOnMount: false,
//     refetchOnWindowFocus: false,
//     refetchOnReconnect: false,
//     retry: false,
//     queryFn: async () => {
//       if (!domainName) return null;

//       try {
//         const data = await mapApi.fetchMyRoute(domainName);

//         if (!data?.id) {
//           await asyncStorage.removeItem("route_id");
//           useAuthStore.getState().clearRoute?.();
//           useTrackingStore.setState((s) => {
//             s.error = null;
//             s.isTripStarted = false;
//             s.loading = false;
//           });
//           return null;
//         }

//         await asyncStorage.setItem("route_id", String(data.id));
//         useAuthStore.getState().setDomainAndRoute(domainName, String(data.id));
//         useTrackingStore.setState((s) => {
//           s.error = null;
//         });

//         return data;
//       } catch {
//         await asyncStorage.removeItem("route_id");
//         useAuthStore.getState().clearRoute?.();
//         useTrackingStore.setState((s) => {
//           s.error = null;
//           s.isTripStarted = false;
//           s.loading = false;
//         });
//         return null;
//       }
//     },
//     select: (data) => data ?? null,
//   });

//   const message = useMemo(() => {
//     const msg = query.error instanceof Error ? query.error.message : null;
//     if (msg === "route_id not assigned") return "Route not assigned yet.";
//     if (msg === "domain_name not set") return "Domain is not available.";
//     return msg;
//   }, [query.error]);

//   useEffect(() => {
//     if (!message || lastMessageRef.current === message) return;

//     lastMessageRef.current = message;
//     show({
//       message,
//       type: message === "Route not assigned yet." ? "warning" : "error",
//     });
//   }, [message, show]);

//   return query;
// }