export const buildUrl = (domainName?: string | null, path: string = ""): string => {
    if (!domainName) {
        return path.startsWith("/api/") ? path.replace(/^\/api\//, "") : path;
    }
    const cleanDomain = domainName.replace(/\/+$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    if (cleanDomain.startsWith("http://") || cleanDomain.startsWith("https://")) {
        return `${cleanDomain}${cleanPath}`;
    }
    return `https://${cleanDomain}${cleanPath}`;
};