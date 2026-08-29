import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@shared/theme";

interface DashboardHeaderProps {
  cityName: string;
  hubName?: string;
  onLocationPress?: () => void;
  onAvatarPress?: () => void;
}

export function DashboardHeader({
  cityName,
  hubName,
  onLocationPress,
  onAvatarPress,
}: DashboardHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mt-4 ">
      {/* Location Pill */}
      <TouchableOpacity
        onPress={onLocationPress}
        activeOpacity={0.7}
        className="flex-row items-center gap-x-1"
      >
        <Ionicons name="location-sharp" size={16} color={Colors.brand.primary} />
        <View>
          <Text className="text-xs text-text-muted font-normal leading-3">
            Location
          </Text>
          <View className="flex-row items-center gap-x-1">
            <Text className="text-sm font-semibold text-text-primary">
              {hubName ? `${hubName}, ${cityName}` : cityName}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={Colors.text.primary}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Avatar Button */}
      <TouchableOpacity
        onPress={onAvatarPress}
        activeOpacity={0.7}
        className="w-10 h-10 rounded-full border border-border items-center justify-center bg-bg-card"
      >
        <Ionicons name="person-outline" size={20} color={Colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
}