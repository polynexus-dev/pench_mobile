import { env } from "@/config/env";

export const buildUrl = (domainName: string, path: string): string => {
    let base = domainName || "";
    
    if (!base) {
        base = env.EXPO_PUBLIC_API_BASE_URL;
    }
    
    // Normalize protocol
    if (!base.startsWith("http://") && !base.startsWith("https://")) {
        base = `https://${base}`;
    }
    
    // Clean trailing slashes
    base = base.replace(/\/+$/, "");
    
    // Normalize path to start with /
    let cleanPath = path;
    if (!cleanPath.startsWith("/")) {
        cleanPath = `/${cleanPath}`;
    }
    
    // Deduplicate /api segment if base ends with /api and path starts with /api/
    if (base.endsWith("/api") && cleanPath.startsWith("/api/")) {
        cleanPath = cleanPath.substring(4);
    }
    
    return `${base}${cleanPath}`;
};