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

                if (!access || !refresh) {
                    // No tokens — fresh install or logged out
                    return;
                }

                // ── Rehydrate tokens + domain BEFORE calling /me/ ────────
                setTokens(access, refresh);

                if (storedDomain) {
                    setDomainAndRoute(storedDomain, null);
                }

                try {
                    const me = await httpClient.get("accounts/me/") as unknown as User;
                    setUser(me);

                    // ── Keep domain from asyncStorage as source of truth ─
                    // me.tenant_schema is only the schema key e.g. "nagpur"
                    // storedDomain is the full domain e.g. "nagpur.api.polynexus.in"
                    const domain = storedDomain ?? me.tenant_schema ?? "";
                    setDomainAndRoute(domain, null);

                } catch (err) {
                    // Token expired or revoked — clear everything
                    logError(err, "useAuthInit:/api/accounts/me/");
                    if (__DEV__) console.warn(`[Bootstrap] ${getErrorMessage(err)}`);

                    await tokenUtils.clearTokens();
                    await asyncStorage.removeItem("domain_name");
                    clearAuth();
                }

            } catch (err) {
                // SecureStore or AsyncStorage read failure — device issue
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