import { ImageSourcePropType } from "react-native";

// src/features/onboarding/data/onboardingData.ts
export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
  bgColor: string;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "1",
    image: require("@assets/images/onboarding_1.png"),
    title: "Fresh Pure & Trusted",
    description:
      "Farm-fresh milk packed in clean glass bottles, delivered by verified delivery partners. Quality you can taste, every single morning.",
    bgColor: "#E8F5EE",
  },
  {
    id: "2",
    image: require("@assets/images/onboarding_2.png"),
    title: "At your Door step",
    description:
      "No more trips to the store. Subscribe once and get your milk delivered on time, every day — track your delivery live as it arrives.",
    bgColor: "#E8F5EE",
  },
  {
    id: "3",
    image: require("@assets/images/onboarding_2.png"),
    title: "You're in Control",
    description:
      "Pause deliveries, request extra bottles, or plan a vacation — all from your phone. Your milk schedule, your way.",
    bgColor: "#E8F5EE",
  },
];