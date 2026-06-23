import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/shared/ui/Text/Text";
import { Button } from "@/shared/ui/Button/Button";

interface Props {
    loading: boolean;
    onStart: () => void;
    disabled?: boolean;
}

export default function TripStartPrompt({ loading, onStart, disabled = false }: Props) {
    const isDisabled = loading || disabled;

    return (
        <View className="mb-5 items-center rounded-[24px] border border-brand-primary/20 bg-brand-light p-6 shadow-sm">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-brand-primary shadow-xs">
                <Ionicons name="rocket-outline" size={24} color="white" />
            </View>

            <Text variant="subhead" weight="bold" color="brand" align="center">
                Ready to Start Your Shift?
            </Text>

            <Text variant="body-sm" color="secondary" align="center" className="mt-1 px-4 leading-relaxed">
                Make sure your vehicle is prepared and GPS tracking is enabled before starting.
            </Text>

            <Button
                label={loading ? "Starting Trip..." : disabled ? "No Route Assigned" : "Start Trip 🚀"}
                intent="primary"
                size="lg"
                fullWidth
                disabled={isDisabled}
                loading={loading}
                onPress={onStart}
                className="mt-5"
            />
        </View>
    );
}