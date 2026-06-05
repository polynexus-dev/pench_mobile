import * as Notifications from "expo-notifications";
import { useAuthStore } from "@/store/authStore";
import { notificationApi } from "@/features/notifications/api/notificationApi";
import {
    getDevicePushToken,
    requestNotificationPermissions,
    setupAndroidChannel,
} from "@/features/notifications/utils/notifications";

let tokenRefreshSub: Notifications.EventSubscription | null = null;

async function saveTokenToBackend(token: string): Promise<void> {
    const domainName = useAuthStore.getState().domain_name;

    if (!domainName) {
        console.warn("[Notifications] domain_name missing. Skipping token sync.");
        return;
    }

    try {
        await notificationApi.savePushToken(domainName, {
            token,
        });
        console.log("[Notifications] Token saved to backend.");
    } catch (error: any) {
        console.warn("[Notifications] Failed to save token:", error);
    }
}

export async function setupPushNotifications(): Promise<string | null> {
    const permitted = await requestNotificationPermissions();
    if (!permitted) return null;

    await setupAndroidChannel();

    const token = await getDevicePushToken();
    if (!token) return null;

    console.log("[Notifications] FCM token:", token);
    await saveTokenToBackend(token);

    tokenRefreshSub?.remove();
    tokenRefreshSub = Notifications.addPushTokenListener(async (newToken) => {
        console.log("[Notifications] Token refreshed:", newToken.data);
        await saveTokenToBackend(newToken.data);
    });

    return token;
}

export function teardownPushNotifications(): void {
    tokenRefreshSub?.remove();
    tokenRefreshSub = null;
    console.log("[Notifications] Teardown complete.");
}