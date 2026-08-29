import AsyncStorage from "@react-native-async-storage/async-storage";

export const asyncStorage = {
  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },
  getItem: async (key: string) => {
    return AsyncStorage.getItem(key);
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
  clear: async () => {
    await AsyncStorage.clear();
  },
};
