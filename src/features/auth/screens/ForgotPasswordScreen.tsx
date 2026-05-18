import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useToast } from "@/hooks/useToast";
import { AuthInput } from "../components/AuthInput";
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
  const [showPassword, setShowPassword] = useState(false);

  const isPending = isSendingOtp || isResettingPassword;
  const currentError = step === 1 ? forgotError : resetError;
  const hasError = step === 1 ? isForgotError : isResetError;

  const validatePhone = (value: string) => /^\d{12}$/.test(value.trim());
  const validatePassword = (value: string) => value.trim().length >= 8;

  const handleSendOtp = async () => {
    if (!validatePhone(phone)) {
      show({
        message: "Enter a valid 12 digit phone number",
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
        message: "Enter a valid 12 digit phone number",
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
    <ScreenWrapper>
      <View className="flex-1 justify-center">
        <View className="mb-8">
          <Text className="text-2xl font-bold text-text-primary">
            Forgot Password
          </Text>

          <Text className="mt-2 text-sm text-text-secondary">
            {step === 1
              ? "Enter your registered phone number to receive an OTP."
              : "Enter the OTP and your new password to reset your account."}
          </Text>
        </View>

        <View className="w-full gap-y-4">
          <AuthInput
            label="Phone Number"
            placeholder="Phone number (e.g. 917000000010)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="number-pad"
            maxLength={12}
            editable={!isPending && step === 1}
            />

          {step === 2 && (
            <>
              <AuthInput
            label="Enter OTP"
            placeholder="Enter OTP"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            editable={!isPending}
            />

              <AuthInput
            label="Set New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                editable={!isPending}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#9E9E9E"
                    />
                  </TouchableOpacity>
                }
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
            className={`w-full h-14 rounded-full items-center justify-center mt-2 ${isPending ||
              !phone ||
              (step === 2 && (!code || !newPassword))
              ? "bg-brand-primary/50"
              : "bg-brand-primary"
              }`}
          >
            <Text className="text-white text-base font-semibold tracking-wide">
              {step === 1
                ? isPending
                  ? "Sending OTP..."
                  : "Send OTP"
                : isPending
                  ? "Resetting Password..."
                  : "Reset Password"}
            </Text>
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
                  setShowPassword(false);
                }
              }}
            >
              <Text className="text-sm font-semibold text-brand-primary">
                Change phone number
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            className="items-center mt-2"
            onPress={() => router.back()}
          >
            <Text className="text-sm font-semibold text-text-link">
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}