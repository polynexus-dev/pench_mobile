import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
    loading: boolean;
    onStart: () => void;
    disabled?: boolean;
}

export default function TripStartPrompt({ loading, onStart, disabled = false }: Props) {
    const isDisabled = loading || disabled;

    return (
        <View className="mb-5 items-center rounded-card border border-brand-primary/20 bg-brand-light p-5">
            <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-brand-primary">
                <Ionicons name="rocket-outline" size={24} color="white" />
            </View>

            <Text className="text-body-lg text-center font-bold text-text-primary">
                Ready to Start?
            </Text>

            <TouchableOpacity
                onPress={isDisabled ? undefined : onStart}
                disabled={isDisabled}
                activeOpacity={0.85}
                className={`mt-4 w-full rounded-btn py-3.5 items-center ${isDisabled ? "bg-gray-400" : "bg-brand-primary"
                    }`}
            >
                <Text className="text-label font-bold text-white">
                    {loading ? "Starting Trip..." : disabled ? "No Route Assigned" : "Start Trip 🚀"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}