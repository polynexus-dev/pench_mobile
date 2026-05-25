import { httpClient } from "@services/api/httpClient";
import type { RouteResponse, TripCompleteResponse } from "../types/map.types";
import { buildUrl } from "@services/api/buildUrl";

export const mapApi = {
    fetchMyRoute: (domainName: string): Promise<RouteResponse> =>
        httpClient.get(
            // `https://${domainName}/api/erp/orders/driver/my-route/`
            buildUrl(domainName, `/api/erp/orders/driver/my-route/`)
        ),

    startTrip: (
        domainName: string,
        routeId: string
    ): Promise<void> =>
        httpClient.post(
            // `https://${domainName}/api/erp/orders/driver/${routeId}/start-trip/`
            buildUrl(domainName, `/api/erp/orders/driver/${routeId}/start-trip/`),
            {}
        ),

    completeTrip: (
        domainName: string,
        routeId: string
    ): Promise<TripCompleteResponse> =>
        httpClient.post(
            // `https://${domainName}/api/erp/orders/driver/${routeId}/complete-trip/`
            buildUrl(domainName, `/api/erp/orders/driver/${routeId}/complete-trip/`),
            {}
        ),
}; 