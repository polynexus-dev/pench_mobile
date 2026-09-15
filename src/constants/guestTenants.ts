/**
 * Tenant hosts used while browsing as a guest.
 *
 * A logged-in session gets `domain_name` from the login / OTP response and
 * stores it in the auth store. A guest never logs in, so there is no response to
 * read it from — the city the guest picks on entry resolves to a host here.
 *
 * The city list is fetched from the backend rather than hardcoded. Cities are
 * rows in a database (`GET /api/erp/tenants/cities/`, which is public), so a
 * hardcoded list silently goes stale the moment one is added or renamed.
 *
 * Host derivation mirrors the backend's own `fix_missing_domains.py`:
 * the tenant subdomain is `schema_name` with underscores swapped for hyphens,
 * prefixed onto the API host — schema `pench_nagpur` on `pench.api.polynexus.in`
 * gives `pench-nagpur.pench.api.polynexus.in`.
 */

import { env } from "@/config/env";
import { httpClient } from "@/services/api/httpClient";

export interface GuestCity {
  /** Tenant schema — what the register endpoint expects as `tenant_schema`. */
  value: string;
  label: string;
  /** Host passed to buildUrl() for catalog requests. */
  domain: string;
}

/**
 * Host part of the API base URL, e.g. "pench.api.polynexus.in".
 * Parsed by regex rather than `new URL()` — Hermes ships only a partial URL
 * implementation and `.host` is not dependable across RN versions.
 */
function apiHost(): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(
    env.EXPO_PUBLIC_API_BASE_URL ?? ""
  );
  return match?.[1] ?? "";
}

/** Tenant host for a schema, e.g. "pench_nagpur" → "pench-nagpur.<api host>". */
export function tenantHost(schemaName: string): string {
  const host = apiHost();
  if (!host) return "";

  // A bare IP or localhost (the LAN dev base URL) has no subdomain to prefix —
  // point every city at the same host so dev builds still load a catalog.
  const isIpOrLocal =
    /^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/.test(host) || host.startsWith("localhost");
  if (isIpOrLocal) return host;

  return `${schemaName.replace(/_/g, "-")}.${host}`;
}

/**
 * Used only if the cities request fails (offline, or the API is down), so the
 * picker is never empty. Matches the single tenant that exists in production.
 */
export const FALLBACK_GUEST_CITIES: GuestCity[] = [
  {
    value: "pench_nagpur",
    label: "Nagpur",
    domain: tenantHost("pench_nagpur"),
  },
];

interface CityApiRow {
  schema_name?: string;
  name?: string;
  is_active?: boolean;
}

/**
 * Live city list. Unauthenticated — `CityViewSet` allows anonymous list/retrieve,
 * and it is served from the public API host, not a tenant host.
 */
export async function fetchGuestCities(): Promise<GuestCity[]> {
  const rows = (await httpClient.get(
    "erp/tenants/cities/"
  )) as unknown as CityApiRow[];

  if (!Array.isArray(rows)) return FALLBACK_GUEST_CITIES;

  const cities = rows
    .filter((r) => r?.schema_name && r.is_active !== false)
    .map((r) => ({
      value: r.schema_name as string,
      label: r.name || (r.schema_name as string),
      domain: tenantHost(r.schema_name as string),
    }));

  return cities.length > 0 ? cities : FALLBACK_GUEST_CITIES;
}

export function findGuestCity(
  value: string | null | undefined,
  cities: GuestCity[] = FALLBACK_GUEST_CITIES
): GuestCity | undefined {
  if (!value) return undefined;
  return (
    cities.find((c) => c.value === value) ??
    FALLBACK_GUEST_CITIES.find((c) => c.value === value)
  );
}

/**
 * Rebuilds a city entry from a stored schema name without a network round-trip,
 * for restoring a guest session on cold start.
 */
export function guestCityFromSchema(
  schemaName: string | null | undefined
): GuestCity | undefined {
  if (!schemaName) return undefined;
  const known = FALLBACK_GUEST_CITIES.find((c) => c.value === schemaName);
  if (known) return known;
  return {
    value: schemaName,
    label: schemaName,
    domain: tenantHost(schemaName),
  };
}
