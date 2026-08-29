export const buildUrl = (domainName: string, path: string): string => {
    
    if (domainName.startsWith("http://") || domainName.startsWith("https://")) {
        return `${domainName}${path}`;
    }
    return `https://${domainName}${path}`;
};