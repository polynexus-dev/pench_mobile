import * as Location from "expo-location";
import { LOCATION_TASK_NAME } from "./backgroundTracking";

export async function startBackgroundTracking() {
    const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== "granted") {
        throw new Error("Foreground location permission denied");
    }

    const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();

    if (backgroundStatus !== "granted") {
        throw new Error("Background location permission denied");
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
}

export async function stopBackgroundTracking() {
    const started = await Location.hasStartedLocationUpdatesAsync(
        LOCATION_TASK_NAME
    );

    if (started) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
}