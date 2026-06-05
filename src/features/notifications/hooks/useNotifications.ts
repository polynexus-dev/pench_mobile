import {
    setupPushNotifications,
    teardownPushNotifications,
} from "@/features/notifications/services/notificationService";
import {
    checkInitialNotification,
    listenForegroundNotifications,
    listenNotificationTaps,
} from "@/features/notifications/utils/notifications";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { useEffect } from "react";

function handleNotificationRoute(
    data: Record<string, any>,
    router: ReturnType<typeof useRouter>,
    userRole?: string | null
) {
    const screen = String(data?.screen ?? "");

    if (data?.url && typeof data.url === "string" && data.url.startsWith("/")) {
        router.push(data.url as any);
        return;
    }

    if (userRole === "driver") {
        if (screen === "deliveries" || screen === "route") {
            router.push("/(driver)/(tabs)/map" as any);
            return;
        }
        if (screen === "orders") {
            router.push("/(driver)/(tabs)/orders" as any);
            return;
        }
    }

    if (userRole === "customer") {
        if (screen === "bookings" || screen === "orders") {
            router.push("/(customer)/(tabs)/dashboard" as any);
            return;
        }
    }

    if (userRole === "admin") {
        if (screen === "dashboard") {
            router.push("/(admin)/(tabs)/dashboard" as any);
            return;
        }
    }
}

export function useNotifications() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        if (!user) {
            teardownPushNotifications();
            return;
        }

        setupPushNotifications();

        checkInitialNotification().then((data) => {
            if (data) {
                handleNotificationRoute(data, router, user.role);
            }
        });

        const removeForeground = listenForegroundNotifications((notification) => {
            console.log(
                "[useNotifications] Foreground:",
                notification.request.content.title
            );
        });

        const removeTap = listenNotificationTaps((data) => {
            handleNotificationRoute(data, router, user.role);
        });

        return () => {
            removeForeground();
            removeTap();
        };
    }, [router, user]);
}