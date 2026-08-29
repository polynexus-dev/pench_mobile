import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";

const LOCATION_TASK_NAME = "driver-background-location";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.log("Background location task error:", error);
        return;
    }

    const locations = (data as any)?.locations;
    if (!locations?.length) return;

    const latest = locations[locations.length - 1];
    const coords = {
        lat: latest.coords.latitude,
        lng: latest.coords.longitude,
        timestamp: latest.timestamp,
    };

    console.log("Background location:", coords);

    // send to API or websocket-safe queue here
});

export { LOCATION_TASK_NAME };