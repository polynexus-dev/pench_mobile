import React from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { OTPInput } from "../components/OTPInput";
import { useVerifyOTP, useRequestOTP } from "../hooks/useOTP";

export default function OTPScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const { mutate: verifyOTP, isPending: isVerifying, isError, error } = useVerifyOTP();
  const { mutate: requestOTP, isPending: isResending } = useRequestOTP();

  function handleVerify(otp: string) {
    if (!phone) return;
    verifyOTP({ phone, code:otp });
  }

  function handleResend() {
    if (!phone) return;
    requestOTP({ phone });
  }

  return (
    <ScreenWrapper className="flex-1 bg-white">

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <View className="px-5 pt-14 pb-4">
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-10 h-10 rounded-full bg-bg-surface items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </Pressable>
      </View>

      {/* ── Main Content ────────────────────────────────────────── */}
      <View className="flex-1 px-6 pt-6">

        {/* Icon Badge */}
        <View className="w-16 h-16 rounded-2xl bg-brand-primary/10 items-center justify-center mb-8">
          <Ionicons name="shield-checkmark-outline" size={32} color="#1B5E37" />
        </View>

        {/* Header */}
        <Text className="text-3xl font-bold text-text-primary tracking-tight mb-2">
          Enter OTP
        </Text>
        <Text className="text-base text-text-secondary leading-relaxed mb-1">
          We sent a 6-digit code to
        </Text>
        <View className="flex-row items-center gap-x-2 mb-10">
          <Text className="text-lg font-bold text-text-primary">
            +91 {phone}
          </Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text className="text-sm font-semibold text-brand-primary underline">
              Edit
            </Text>
          </TouchableOpacity>
        </View>

        {/* OTP Input */}
        <OTPInput
          onSubmit={handleVerify}
          isLoading={isVerifying}
        />

        {/* Error Message */}
        {isError && (
          <View className="flex-row items-center gap-x-2 mt-4 bg-error/10 px-4 py-3 rounded-xl">
            <Ionicons name="alert-circle-outline" size={16} color="#D32F2F" />
            <Text className="text-error text-sm flex-1">
              {(error as any)?.message ?? "Invalid OTP. Please try again."}
            </Text>
          </View>
        )}

        {/* Resend Section */}
        <View className="items-center mt-10">
          <Text className="text-sm text-text-secondary mb-3">
            Didn't receive the code?
          </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={isResending}
            className={`px-6 py-3 rounded-full border ${isResending
                ? "border-border bg-bg-surface"
                : "border-brand-primary"
              }`}
          >
            <Text
              className={`text-sm font-semibold ${isResending ? "text-text-muted" : "text-brand-primary"
                }`}
            >
              {isResending ? "Sending code..." : "Resend OTP"}
            </Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* ── Bottom Note ─────────────────────────────────────────── */}
      <View className="flex-row items-center justify-center gap-x-1.5 px-6 pb-10">
        <Ionicons name="lock-closed-outline" size={12} color="#9E9E9E" />
        <Text className="text-xs text-text-muted text-center">
          OTP is valid for 10 minutes. Do not share it with anyone.
        </Text>
      </View>

    </ScreenWrapper>
  );
}