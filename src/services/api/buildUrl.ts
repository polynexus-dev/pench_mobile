import { env } from "@/config/env";

export const buildUrl = (domainName: string, path: string): string => {
  if (__DEV__) console.log(`[buildUrl] domainName="${domainName}", baseURL="${env.EXPO_PUBLIC_API_BASE_URL}"`);

  // If domainName is a stale full URL (e.g. from AsyncStorage), extract the subdomain
  // and fall through to rebuild it with the current env base URL
  if (domainName.startsWith("http://") || domainName.startsWith("https://")) {
    const hostMatch = domainName.match(/^https?:\/\/([^/:]+)/);
    if (hostMatch) {
      const host = hostMatch[1]; // e.g. "pench-nagpur.localhost" or "pench-nagpur.192.168.1.7.nip.io"
      const subdomain = host.split(".")[0]; // e.g. "pench-nagpur"
      if (__DEV__) console.log(`[buildUrl] Extracted subdomain "${subdomain}" from stale full URL`);
      // Reconstruct a clean domain name so it gets rebuilt with the current env
      domainName = subdomain;
    }
  }

  // Parse the env API base URL
  const apiBaseUrl = env.EXPO_PUBLIC_API_BASE_URL; // e.g., "http://192.168.1.196:8888/api/"

  const match = apiBaseUrl.match(/^(https?):\/\/([^/]+)/);
  if (match) {
    const protocol = match[1];
    const hostWithPort = match[2];

    // Check if we are running in a local environment (IP address or localhost)
    const isLocal =
      hostWithPort.includes("localhost") ||
      hostWithPort.includes("127.0.0.1") ||
      /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}/.test(hostWithPort);

    if (isLocal) {
      // Get the subdomain of the tenant domainName (e.g., "nagpur" from "nagpur.pench.api.polynexus.in")
      const tenantSubdomain = domainName.split(".")[0];

      // Extract IP/host and port
      const hostParts = hostWithPort.split(":");
      const hostIpOrLocal = hostParts[0];
      const port = hostParts[1] ? `:${hostParts[1]}` : "";

      let localDomain = "";
      if (hostIpOrLocal === "localhost" || hostIpOrLocal === "127.0.0.1") {
        localDomain = `${tenantSubdomain}.localhost${port}`;
      } else {
        // For local IP, use nip.io wildcard DNS (e.g. nagpur.192.168.1.7.nip.io:8888)
        // so that django-tenants can automatically resolve the subdomain schema context.
        const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}/.test(hostIpOrLocal);
        if (isIp && tenantSubdomain && tenantSubdomain !== "public") {
          localDomain = `${tenantSubdomain}.${hostIpOrLocal}.nip.io${port}`;
        } else {
          localDomain = `${hostIpOrLocal}${port}`;
        }
      }

      return `${protocol}://${localDomain}${path}`;
    }

  }

  // Fallback to standard remote URL building
  return `https://${domainName}${path}`;
};
