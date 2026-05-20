import { createStore } from "./devtools";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "location_setup_done";

interface LocationSetupStore {
    showSheet: boolean;
    checkShouldShow: () => Promise<void>;
    markDone: () => Promise<void>;
    skip: () => Promise<void>;
}

export const useLocationSetupStore = createStore<LocationSetupStore>(
    "locationSetup",
    (set) => ({
        showSheet: false,

        checkShouldShow: async () => {
            const done = await AsyncStorage.getItem(KEY);
            set((s) => { s.showSheet = done !== "true"; });
        },

        markDone: async () => {
            await AsyncStorage.setItem(KEY, "true");
            set((s) => { s.showSheet = false; });
        },

        skip: async () => {
            await AsyncStorage.setItem(KEY, "true");
            set((s) => { s.showSheet = false; });
        },
    })
);