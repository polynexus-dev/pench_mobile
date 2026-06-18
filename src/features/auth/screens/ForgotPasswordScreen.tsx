import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useToast } from "@/hooks/useToast";
import { Input } from "@/shared/ui/Input";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { useResetPassword } from "../hooks/useResetPassword";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { show } = useToast();

  const {
    mutateAsync: sendOtp,
    isPending: isSendingOtp,
    isError: isForgotError,
    error: forgotError,
  } = useForgotPassword();

  const {
    mutateAsync: resetPassword,
    isPending: isResettingPassword,
    isError: isResetError,
    error: resetError,
  } = useResetPassword();

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const isPending = isSendingOtp || isResettingPassword;
  const currentError = step === 1 ? forgotError : resetError;
  const hasError = step === 1 ? isForgotError : isResetError;

  const validatePhone = (value: string) => /^\d{10}$/.test(value.trim());
  const validatePassword = (value: string) => value.trim().length >= 8;

  const handleSendOtp = async () => {
    if (!validatePhone(phone)) {
      show({
        message: "Enter a valid 10 digit phone number",
        type: "error",
      });
      return;
    }

    try {
      const res = await sendOtp({ phone: phone.trim() });

      if (res.otp && __DEV__) {
        setCode(res.otp);
      }

      setStep(2);
    } catch {
      // handled in hook
    }
  };

  const handleResetPassword = async () => {
    if (!validatePhone(phone)) {
      show({
        message: "Enter a valid 10 digit phone number",
        type: "error",
      });
      return;
    }

    if (!code.trim()) {
      show({
        message: "Enter the OTP code",
        type: "error",
      });
      return;
    }

    if (!validatePassword(newPassword)) {
      show({
        message: "Password must be at least 8 characters",
        type: "error",
      });
      return;
    }
    try {
      await resetPassword({
        phone: phone.trim(),
        code: code.trim(),
        new_password: newPassword,
      });
    } catch {
      // handled in hook
    }
  };

  return (
    <ScreenWrapper className="bg-white">
      <View className="flex-1 justify-center px-6">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-text-primary tracking-tight">
            Forgot Password
          </Text>

          <Text className="mt-2 text-sm font-medium text-text-muted">
            {step === 1
              ? "Enter your registered phone number to receive an OTP."
              : "Enter the OTP and your new password to reset your account."}
          </Text>
        </View>

        <View className="w-full gap-y-4">
          <Input
            label="Phone Number"
            placeholder="Phone number (e.g. 917000000010)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="number-pad"
            maxLength={10}
            showCount={false}
            editable={!isPending && step === 1}
            variant="outline"
            size="lg"
            containerClassName="rounded-2xl"
            rightIcon={<Ionicons name="call-outline" size={20} color="#9E9E9E" />}
          />

          {step === 2 && (
            <>
              <Input
                label="Enter OTP"
                placeholder="Enter OTP"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                editable={!isPending}
                variant="outline"
                size="lg"
                containerClassName="rounded-2xl"
                rightIcon={<Ionicons name="key-outline" size={20} color="#9E9E9E" />}
              />

              <Input
                label="Set New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                isPassword={true}
                editable={!isPending}
                variant="outline"
                size="lg"
                containerClassName="rounded-2xl"
              />
            </>
          )}

          {hasError && (
            <Text className="text-error text-xs text-center">
              {(currentError as any)?.message ??
                (step === 1
                  ? "Failed to send OTP."
                  : "Failed to reset password.")}
            </Text>
          )}

          <TouchableOpacity
            onPress={step === 1 ? handleSendOtp : handleResetPassword}
            disabled={
              isPending ||
              !phone ||
              (step === 2 && (!code || !newPassword))
            }
            activeOpacity={0.85}
            className={`w-full h-14 rounded-2xl items-center justify-center flex-row gap-x-1 mt-4 ${
              isPending ||
              !phone ||
              (step === 2 && (!code || !newPassword))
                ? "bg-brand-primary/50"
                : "bg-brand-primary"
            }`}
          >
            <Text className="text-white text-base font-bold tracking-wide">
              {step === 1
                ? isPending
                  ? "Sending OTP..."
                  : "Send OTP"
                : isPending
                  ? "Resetting Password..."
                  : "Reset Password"}
            </Text>
            {!isPending && (
              <Ionicons name="chevron-forward" size={18} color="#FFF" />
            )}
          </TouchableOpacity>

          {step === 2 && (
            <TouchableOpacity
              activeOpacity={0.85}
              className="items-center mt-2"
              onPress={() => {
                if (!isPending) {
                  setStep(1);
                  setCode("");
                  setNewPassword("");
                }
              }}
            >
              {/* <Text className="text-sm font-semibold text-brand-primary">
                Change phone number
              </Text> */}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            className="items-center mt-1"
            onPress={() => router.back()}
          >
            <Text className="text-sm font-bold text-brand-primary">
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}