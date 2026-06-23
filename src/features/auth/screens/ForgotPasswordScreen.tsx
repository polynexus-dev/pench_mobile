import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Pressable, KeyboardAvoidingView, Platform, ScrollView, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
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
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const otpInputs = useRef<(TextInput | null)[]>([]);

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
        const digits = res.otp.slice(0, 6).split("");
        const paddedDigits = [...digits, ...Array(6 - digits.length).fill("")];
        setOtpArray(paddedDigits);
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

    if (code.trim().length !== 6) {
      show({
        message: "Enter a valid 6-digit OTP code",
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

  const resetStep = () => {
    setStep(1);
    setCode("");
    setOtpArray(Array(6).fill(""));
    setNewPassword("");
  };

  const handleBackPress = () => {
    if (step === 2) {
      resetStep();
    } else {
      router.back();
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    if (text.length === 6) {
      const digits = text.slice(0, 6).split("");
      setOtpArray(digits);
      setCode(digits.join(""));
      otpInputs.current[5]?.focus();
      return;
    }

    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otpArray];
    newOtp[index] = digit;
    setOtpArray(newOtp);
    setCode(newOtp.join(""));

    // Auto advance
    if (digit && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === "Backspace") {
      const newOtp = [...otpArray];
      if (otpArray[index]) {
        newOtp[index] = "";
        setOtpArray(newOtp);
        setCode(newOtp.join(""));
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtpArray(newOtp);
        setCode(newOtp.join(""));
        otpInputs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F0EBE1]">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Bar ─────────────────────────────────────────────── */}
          <View className="px-5 pt-6 pb-4">
            <Pressable
              onPress={handleBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-10 h-10 rounded-full bg-white shadow-sm items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
            </Pressable>
          </View>

          {/* ── Main Content ────────────────────────────────────────── */}
          <View className="flex-1 px-5 pb-12 justify-between items-center">
            
            {/* Header / Info section */}
            <View className="items-center w-full">
              {/* Icon Badge */}
              <View className="w-16 h-16 rounded-2xl bg-brand-primary/10 items-center justify-center mb-6">
                <Ionicons
                  name={step === 1 ? "lock-closed-outline" : "key-outline"}
                  size={32}
                  color="#1B5E37"
                />
              </View>

              <Text className="text-3xl font-bold text-[#1A1A1A] tracking-tight mb-2 text-center">
                {step === 1 ? "Forgot Password" : "Reset Password"}
              </Text>
              
              {step === 1 ? (
                <Text className="text-sm font-semibold text-text-secondary text-center leading-relaxed">
                  Enter your registered phone number to receive an OTP code to reset your password.
                </Text>
              ) : (
                <View className="items-center w-full">
                  <Text className="text-sm font-semibold text-text-secondary text-center leading-relaxed mb-1">
                    Enter the OTP code and your new password for account recovery.
                  </Text>
                  <View className="flex-row items-center gap-x-2">
                    <Text className="text-lg font-bold text-text-primary">
                      +91 {phone}
                    </Text>
                    <TouchableOpacity
                      onPress={resetStep}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text className="text-sm font-bold text-brand-primary underline">
                        Edit
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Input Form Fields */}
            <View className="w-full rounded-[24px] px-2 py-2 mb-6">
              <View className="w-full gap-y-4">
                {step === 1 ? (
                  <Input
                    label="Phone Number"
                    placeholder="Phone number (e.g. 917000000010)"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="number-pad"
                    maxLength={10}
                    showCount={false}
                    editable={!isPending}
                    variant="outline"
                    size="lg"
                    containerClassName="rounded-2xl"
                    rightIcon={<Ionicons name="call-outline" size={20} color="#9E9E9E" />}
                  />
                ) : (
                  <>
                    <View className="w-full">
                      <Text className="text-xs font-semibold text-text-secondary mb-2">Enter OTP</Text>
                      <View className="flex-row justify-between gap-x-2">
                        {otpArray.map((digit, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => { otpInputs.current[index] = ref; }}
                            value={digit}
                            onChangeText={(text) => handleOtpChange(text, index)}
                            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                            keyboardType="number-pad"
                            maxLength={6}
                            textAlign="center"
                            selectTextOnFocus
                            editable={!isPending}
                            style={{
                              flex: 1,
                              height: 56,
                              borderRadius: 16,
                              fontSize: 22,
                              fontWeight: "700",
                              color: "#1A1A1A",
                              backgroundColor: digit ? "#E8F5EE" : "#F5F5F5",
                              borderWidth: 1.5,
                              borderColor: digit ? "#1B5E37" : "#E0E0E0",
                            }}
                          />
                        ))}
                      </View>
                    </View>

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

                {/* Error Banner */}
                {hasError && (
                  <View className="flex-row items-center gap-x-2 mt-4 bg-error/10 px-4 py-3 rounded-xl">
                    <Ionicons name="alert-circle-outline" size={16} color="#D32F2F" />
                    <Text className="text-error text-sm flex-1">
                      {(currentError as any)?.message ?? (step === 1 ? "Failed to send OTP." : "Failed to reset password.")}
                    </Text>
                  </View>
                )}

                {/* Main Action Button */}
                <TouchableOpacity
                  onPress={step === 1 ? handleSendOtp : handleResetPassword}
                  disabled={
                    isPending ||
                    !phone ||
                    (step === 2 && (code.length !== 6 || !newPassword))
                  }
                  activeOpacity={0.85}
                  className={`w-full h-14 rounded-2xl items-center justify-center flex-row gap-x-1 mt-6 ${
                    isPending ||
                    !phone ||
                    (step === 2 && (code.length !== 6 || !newPassword))
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

                {/* Back to Login Link */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="items-center mt-4"
                  onPress={() => router.back()}
                >
                  <Text className="text-sm font-bold text-brand-primary">
                    Back to Login
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}