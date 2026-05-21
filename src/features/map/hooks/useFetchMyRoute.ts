import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@store/authStore";
import { mapApi } from "../api/mapApi";

export function useFetchMyRoute() {
    const domainName = useAuthStore((s) => s.domain_name);

    return useQuery({
        queryKey: ["my-route", domainName],
        queryFn: async () => {
            if (!domainName) throw new Error("domain_name not set");
            return mapApi.fetchMyRoute(domainName);
        },
        enabled: !!domainName,
    });
}