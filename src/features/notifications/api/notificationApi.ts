import { httpClient } from "@services/api/httpClient";
import { buildUrl } from "@services/api/buildUrl";

export type SavePushTokenPayload = {
    token: string;
};

export const notificationApi = {
    savePushToken: (domainName: string, payload: SavePushTokenPayload): Promise<void> =>
        httpClient.post(
            buildUrl(domainName, `/api/notifications/save-token/`),
            payload
        ),
};