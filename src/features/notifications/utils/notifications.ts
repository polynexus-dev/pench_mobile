import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

try {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
} catch (error) {
    console.warn("[Notifications] Failed to initialize notification handler:", error);
}

export async function setupAndroidChannel(): Promise<void> {
    if (Platform.OS !== "android") return;

    try {
        await Notifications.setNotificationChannelAsync("delivery_updates", {
            name: "Delivery Updates",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#1B5E37",
            sound: "default",
            enableVibrate: true,
            showBadge: true,
            description: "Notifications about route, delivery, and order updates",
        });
    } catch (error) {
        console.warn("[Notifications] Failed to setup Android channel:", error);
    }
}

export async function requestNotificationPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
        console.warn("[Notifications] Push notifications require a physical device.");
        return false;
    }

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== "granted") {
            console.warn("[Notifications] Permission not granted:", finalStatus);
            return false;
        }

        return true;
    } catch (error) {
        console.warn("[Notifications] Exception requesting notification permissions:", error);
        return false;
    }
}

export async function getDevicePushToken(): Promise<string | null> {
    if (!Device.isDevice) {
        return null;
    }

    try {
        const tokenData = await Notifications.getDevicePushTokenAsync();
        if (tokenData?.data) {
            console.log("[Notifications] Push token retrieved:", tokenData.data);
            return tokenData.data;
        }
        return null;
    } catch (error) {
        console.warn("[Notifications] Failed to get device push token:", error);
        return null;
    }
}

export function listenForegroundNotifications(
    onReceived?: (notification: Notifications.Notification) => void
): () => void {
    try {
        const sub = Notifications.addNotificationReceivedListener((notification) => {
            console.log("[Notifications] Foreground notification:", notification);
            onReceived?.(notification);
        });

        return () => sub.remove();
    } catch (error) {
        console.warn("[Notifications] Failed to listen to foreground notifications:", error);
        return () => {};
    }
}

export function listenNotificationTaps(
    onTap: (data: Record<string, any>) => void
): () => void {
    try {
        const sub = Notifications.addNotificationResponseReceivedListener((response) => {
            console.log("[Notifications] Notification tapped:", response);
            const data = response.notification.request.content.data as Record<string, any>;

            const url = data?.url;
            if (url && typeof url === "string" && !url.startsWith("/")) {
                console.warn("[Notifications] Blocked malformed deep link:", url);
                return;
            }

            if (data) onTap(data);
        });

        return () => sub.remove();
    } catch (error) {
        console.warn("[Notifications] Failed to listen to notification taps:", error);
        return () => {};
    }
}

export async function checkInitialNotification(): Promise<Record<string, any> | null> {
    try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (!response) return null;

        console.log("[Notifications] App opened from killed state via notification.");
        const data = response.notification.request.content.data as Record<string, any>;

        const url = data?.url;
        if (url && typeof url === "string" && !url.startsWith("/")) {
            console.warn("[Notifications] Blocked malformed initial deep link:", url);
            return null;
        }

        return data ?? null;
    } catch (error) {
        console.warn("[Notifications] Failed to check initial notification:", error);
        return null;
    }
}