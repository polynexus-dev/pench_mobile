import { httpClient } from "@services/api/httpClient";
import type {
    RouteResponse,
    TripCompleteResponse,
    TripStatusResponse,
} from "../types/map.types";
import { buildUrl } from "@services/api/buildUrl";

export const mapApi = {
    fetchMyRoute: (domainName: string): Promise<RouteResponse> =>
        httpClient.get(
            buildUrl(domainName, `/api/erp/orders/driver/my-route/`)
        ),

    getTripStatus: (
        domainName: string
    ): Promise<TripStatusResponse> =>
        httpClient.get(
            buildUrl(domainName, `/api/erp/orders/driver/trip-status/`)
        ),

    startTrip: (
        domainName: string,
        routeId: string
    ): Promise<void> =>
        httpClient.post(
            buildUrl(domainName, `/api/erp/orders/driver/${routeId}/start-trip/`),
            {}
        ),

    completeTrip: (
        domainName: string,
        routeId: string
    ): Promise<TripCompleteResponse> =>
        httpClient.post(
            buildUrl(domainName, `/api/erp/orders/driver/${routeId}/complete-trip/`),
            {}
        ),
};