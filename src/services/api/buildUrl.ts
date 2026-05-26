import { env } from "@/config/env";

export const buildUrl = (domainName: string, path: string): string => {
  // If the domainName is already a full URL, use it
  if (domainName.startsWith("http://") || domainName.startsWith("https://")) {
    return `${domainName}${path}`;
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
        // For local IP, use nip.io to route subdomains properly to the local IP
        localDomain = `${tenantSubdomain}.${hostIpOrLocal}.nip.io${port}`;
      }

      return `${protocol}://${localDomain}${path}`;
    }
  }

  // Fallback to standard remote URL building
  return `https://${domainName}${path}`;
};
