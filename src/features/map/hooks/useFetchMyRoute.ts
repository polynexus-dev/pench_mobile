import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@store/authStore";
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
        queryFn: async () => {
            if (!domainName) {
                throw new Error("domain_name not set");
            }

            const data = await mapApi.fetchMyRoute(domainName);

            if (!data?.id) {
                throw new Error("route_id not assigned");
            }

            await asyncStorage.setItem("route_id", String(data.id));
            useAuthStore.getState().setDomainAndRoute(domainName, String(data.id));

            return data;
        },
        select: (data) => data,
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