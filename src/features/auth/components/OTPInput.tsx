import React, { useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { isValidOTP } from "@/utils/validators";

interface Props {
  onSubmit: (otp: string) => void;
  isLoading: boolean;
}

const OTP_LENGTH = 6;

export function OTPInput({ onSubmit, isLoading }: Props) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const inputs = useRef<(TextInput | null)[]>([]);

  function handleChange(text: string, index: number) {
    // Allow paste of full OTP
    if (text.length === OTP_LENGTH) {
      const digits = text.slice(0, OTP_LENGTH).split("");
      setOtp(digits);
      inputs.current[OTP_LENGTH - 1]?.focus();
      return;
    }

    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");

    // Auto advance
    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === "Backspace") {
      const newOtp = [...otp];
      if (otp[index]) {
        // Clear current
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        // Move back and clear previous
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputs.current[index - 1]?.focus();
      }
    }
  }

  function handleSubmit() {
    const otpString = otp.join("");
    setError("");
    if (!isValidOTP(otpString)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    onSubmit(otpString);
  }

  const isFilled = otp.every((d) => d !== "");

  return (
    <View className="w-full">

      {/* ── OTP Boxes ─────────────────────────────────────────── */}
      <View className="flex-row justify-between gap-x-2 mb-3">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {inputs.current[index] = ref; }}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            textAlign="center"
            selectTextOnFocus
            style={{
              flex: 1,
              height: 56,
              borderRadius: 12,
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

      {/* ── Error ─────────────────────────────────────────────── */}
      {error ? (
        <Text className="text-error text-xs text-center mb-4">{error}</Text>
      ) : (
        <View className="mb-4" />
      )}

      {/* ── Verify Button ─────────────────────────────────────── */}
      <Pressable
        onPress={handleSubmit}
        disabled={!isFilled || isLoading}
        className={`w-full h-14 rounded-2xl items-center justify-center ${isFilled ? "bg-brand-primary" : "bg-bg-surface"
          }`}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text
            className={`text-base font-bold ${isFilled ? "text-white" : "text-text-muted"
              }`}
          >
            Verify OTP
          </Text>
        )}
      </Pressable>

    </View>
  );
}