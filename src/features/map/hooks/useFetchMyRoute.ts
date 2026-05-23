import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@store/authStore";
import { mapApi } from "../api/mapApi";
import { asyncStorage } from "@services/storage/asyncStorage";
import { useToast } from "@/hooks/useToast";

export function useFetchMyRoute() {
    const domainName = useAuthStore((s) => s.domain_name);
    const { show } = useToast();

    return useQuery({
        queryKey: ["my-route", domainName],
        queryFn: async () => {
            if (!domainName) {
                show({
                    message: "Domain is not available.",
                    type: "error",
                });
                throw new Error("domain_name not set");
            }
            console.log("fetching route for domain:", domainName);

            const data = await mapApi.fetchMyRoute(domainName);

            if (!data?.id) {
                show({
                    message: "Route not assigned yet.",
                    type: "warning",
                });
                throw new Error("route_id not assigned");
            }

            await asyncStorage.setItem("route_id", String(data.id));
            useAuthStore.getState().setDomainAndRoute(domainName, String(data.id));

            return data;
        },
        enabled: !!domainName,
    });
}