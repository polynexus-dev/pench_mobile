import { httpClient } from "@services/api/httpClient";
import type { RouteResponse } from "../types/map.types";

export const mapApi = {
    fetchMyRoute: (domainName: string): Promise<RouteResponse> =>
        httpClient.get(`https://${domainName}/api/erp/orders/driver/my-route/`),
};