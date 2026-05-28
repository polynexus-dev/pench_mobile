import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { tokenUtils } from "@/features/auth/utils/tokenUtils";
import { httpClient } from "@/services/api/httpClient";
import type { User } from "@/types/domain/user.types";
import { getErrorMessage, logError } from "@/errors/errorHandler";
import { errorMessages } from "@/errors/errorMessages";
import { asyncStorage } from "@services/storage/asyncStorage";

export function useAuthInit() {
    const { setTokens, setUser, setDomainAndRoute, clearAuth } = useAuthStore();
    const [isReady, setIsReady] = useState(false);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        async function bootstrap() {
            try {
                const [access, refresh, storedDomain] = await Promise.all([
                    tokenUtils.getAccessToken(),
                    tokenUtils.getRefreshToken(),
                    asyncStorage.getItem("domain_name"),
                ]);

                // if (__DEV__) console.log("authinit storedDomain:", storedDomain);5

                if (!access || !refresh) {
                    setIsReady(true);
                    return;
                }

                setTokens(access, refresh);

                if (storedDomain) {
                    setDomainAndRoute(storedDomain, null);
                }

                try {
                    const me = await httpClient.get("accounts/me/") as unknown as User;
                    setUser(me);

                    let domain = storedDomain ?? me.tenant_schema ?? "";

                    // Sanitize stale full-URL domain values from previous sessions
                    if (domain.startsWith("http://") || domain.startsWith("https://")) {
                        const hostMatch = domain.match(/^https?:\/\/([^/:]+)/);
                        if (hostMatch) {
                            domain = hostMatch[1].split(".")[0]; // extract just the subdomain
                        }
                        // Update AsyncStorage with the clean value
                        await asyncStorage.setItem("domain_name", domain);
                    }

                    if (domain) {
                        setDomainAndRoute(domain, null);
                    }
                } catch (err) {
                    logError(err, "useAuthInit:/api/accounts/me/");
                    if (__DEV__) console.warn(`[Bootstrap] ${getErrorMessage(err)}`);

                    await tokenUtils.clearTokens();
                    clearAuth();
                }
            } catch (err) {
                logError(err, "useAuthInit:Storage");
                if (__DEV__) {
                    console.error(`[Bootstrap] ${errorMessages.UNKNOWN}`, err);
                }
            } finally {
                setIsReady(true);
            }
        }

        bootstrap();
    }, []);

    return { isReady };
}