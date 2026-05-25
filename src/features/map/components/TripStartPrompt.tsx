import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
    loading: boolean;
    onStart: () => void;
}

export function TripStartPrompt({ loading, onStart }: Props) {
    return (
        <View className="mb-5 rounded-card border border-brand-primary/20 bg-brand-light p-5 items-center">
            <View className="w-14 h-14 rounded-full bg-brand-primary items-center justify-center mb-">
                <Ionicons name="rocket-outline" size={24} color="white" />
            </View>
            <Text className="text-body-lg font-bold text-text-primary text-center">
                Ready to Start?
            </Text>
            <TouchableOpacity
                onPress={onStart}
                disabled={loading}
                className="w-full bg-brand-primary rounded-btn py-3.5 items-center"
            >
                <Text className="text-label font-bold text-white">
                    {loading ? "Starting Trip..." : "Start Trip 🚀"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}