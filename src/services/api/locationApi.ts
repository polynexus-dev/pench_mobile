import { httpClient } from "./httpClient";
import { buildUrl } from "./buildUrl";
import type {
  CustomerLocation,
  CreateLocationPayload,
  UpdateLocationPayload,
} from "@/types/domain/location.types";

export const locationApi = {
  /**
   * GET /api/accounts/locations/
   * Optional query param ?tag=home to filter by tags
   */
  getLocations: async (
    domainName?: string | null,
    tag?: string
  ): Promise<CustomerLocation[]> => {
    let endpoint = "/api/accounts/locations/";
    if (tag) {
      endpoint += `?tag=${encodeURIComponent(tag)}`;
    }
    const url = buildUrl(domainName, endpoint);
    const res: any = await httpClient.get(url);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.results)) return res.results;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  /**
   * POST /api/accounts/locations/
   * Creates a new customer location
   */
  createLocation: async (
    domainName: string | null | undefined,
    payload: CreateLocationPayload
  ): Promise<CustomerLocation> => {
    const url = buildUrl(domainName, "/api/accounts/locations/");
    return httpClient.post(url, payload);
  },

  /**
   * PATCH /api/accounts/locations/{{location_id}}/
   * Updates an existing location
   */
  updateLocation: async (
    domainName: string | null | undefined,
    locationId: number | string,
    payload: UpdateLocationPayload
  ): Promise<CustomerLocation> => {
    const url = buildUrl(domainName, `/api/accounts/locations/${locationId}/`);
    return httpClient.patch(url, payload);
  },

  /**
   * PUT /api/accounts/locations/{{location_id}}/
   * Replaces an existing location
   */
  putLocation: async (
    domainName: string | null | undefined,
    locationId: number | string,
    payload: CreateLocationPayload
  ): Promise<CustomerLocation> => {
    const url = buildUrl(domainName, `/api/accounts/locations/${locationId}/`);
    return httpClient.put(url, payload);
  },

  /**
   * POST /api/accounts/locations/{{location_id}}/set-default/
   * Marks a location as default
   */
  setDefaultLocation: async (
    domainName: string | null | undefined,
    locationId: number | string
  ): Promise<any> => {
    const url = buildUrl(
      domainName,
      `/api/accounts/locations/${locationId}/set-default/`
    );
    return httpClient.post(url, {});
  },

  /**
   * DELETE /api/accounts/locations/{{location_id}}/
   * Deletes a location
   */
  deleteLocation: async (
    domainName: string | null | undefined,
    locationId: number | string
  ): Promise<void> => {
    const url = buildUrl(domainName, `/api/accounts/locations/${locationId}/`);
    return httpClient.delete(url);
  },
};
