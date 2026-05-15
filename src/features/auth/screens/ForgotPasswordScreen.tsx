import React, { useState } from "react";
import { View, Text } from "react-native";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Input, Button } from "@/shared/ui";
import { useToast } from "@/hooks/useToast";
import { isValidEmail } from "@/utils/validators";
import { useRouter } from "expo-router";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { show } = useToast();
  const router = useRouter();

  const handleReset = () => {
    if (!isValidEmail(email)) {
      show({ message: "Please enter a valid email", type: "error" });
      return;
    }
    // Mock implementation for UI
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      show({ message: "Password reset link sent to your email", type: "success" });
      router.back();
    }, 1500);
  };

  return (
    <ScreenWrapper className="p-6 justify-center">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Reset Password</Text>
        <Text className="text-base text-secondary">
          Enter your email to receive a password reset link.
        </Text>
      </View>
      <View className="gap-4">
        <Input
          label="Email"
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Button label="Send Reset Link" onPress={handleReset} loading={isPending} />
        <Button label="Back to Login" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenWrapper>
  );
}
