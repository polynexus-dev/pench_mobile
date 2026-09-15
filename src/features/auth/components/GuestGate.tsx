import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ROUTES } from "@/constants/route";

interface GuestGateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}

/**
 * Full-screen placeholder for tabs that have nothing to show a guest (orders,
 * wallet, account). Browsing stays open elsewhere — this is only the sign-in
 * invitation for the screens that are inherently account-bound.
 */
export function GuestGate({
  icon = "lock-closed-outline",
  title,
  message,
}: GuestGateProps) {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-[#E8F5EE] mb-4">
        <Ionicons name={icon} size={30} color="#1B5E37" />
      </View>

      <Text className="text-center text-[17px] font-black text-gray-900">
        {title}
      </Text>
      <Text className="mt-2 max-w-[280px] text-center text-[13px] font-medium leading-5 text-gray-500">
        {message}
      </Text>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(ROUTES.AUTH.LOGIN as any)}
        className="mt-6 w-full max-w-[280px] items-center rounded-2xl bg-[#1B5E37] py-3.5"
      >
        <Text className="text-[13px] font-black uppercase tracking-wider text-white">
          Sign In
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/(auth)/register" as any)}
        className="mt-3 w-full max-w-[280px] items-center rounded-2xl border border-[#1B5E37]/30 py-3.5"
      >
        <Text className="text-[13px] font-black uppercase tracking-wider text-[#1B5E37]">
          Create Account
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default GuestGate;
