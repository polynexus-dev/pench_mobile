import { asyncStorage } from "@/services/storage/asyncStorage";

const ONBOARDING_KEY = "onboarding_complete";

export const onboardingUtils = {
  isComplete: async (): Promise<boolean> => {
    const val = await asyncStorage.getItem(ONBOARDING_KEY);
    return val === "true";
  },

  markComplete: async (): Promise<void> => {
    await asyncStorage.setItem(ONBOARDING_KEY, "true");
  },

  reset: async (): Promise<void> => {
    await asyncStorage.removeItem(ONBOARDING_KEY);
  },
};