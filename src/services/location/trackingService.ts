import * as Location from "expo-location";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { LOCATION_TASK_NAME } from "./backgroundTracking";

export async function startBackgroundTracking() {
    const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== "granted") {
        throw new Error("Foreground location permission denied");
    }

    // Background location permission is not available inside Expo Go sandbox on iOS
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo) {
        if (__DEV__) {
            console.warn("⚠️ Background location tracking is not supported in Expo Go sandbox. Use a Development Build for background location.");
        }
        return;
    }

    try {
        const { status: backgroundStatus } =
            await Location.requestBackgroundPermissionsAsync();

        if (backgroundStatus !== "granted") {
            if (__DEV__) console.warn("Background location permission denied");
            return;
        }

        const started = await Location.hasStartedLocationUpdatesAsync(
            LOCATION_TASK_NAME
        );

        if (!started) {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 5000,
                distanceInterval: 5,
                pausesUpdatesAutomatically: false,
                showsBackgroundLocationIndicator: true,
                foregroundService: {
                    notificationTitle: "Pench Driver Tracking",
                    notificationBody: "Your trip is being tracked in the background",
                    notificationColor: "#1B5E37",
                },
            });
        }
    } catch (err: any) {
        if (__DEV__) console.warn("⚠️ Background location error:", err?.message || err);
    }
}

export async function stopBackgroundTracking() {
    const started = await Location.hasStartedLocationUpdatesAsync(
        LOCATION_TASK_NAME
    );

    if (started) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
}