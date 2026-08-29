import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/shared/ui/Input";
import { useRequestOTP, useVerifyOTP } from "../hooks/useOTP";
import { getErrorMessage } from "@/errors/errorHandler";

export function OTPLoginForm() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const otpInputs = useRef<(TextInput | null)[]>([]);
  const containerWidth = useRef(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: otpSent ? -1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [otpSent]);

  const {
    mutate: requestOTP,
    isPending: isSending,
    isError: sendError,
    error: requestError,
  } = useRequestOTP();

  const {
    mutate: verifyOTP,
    isPending: isVerifying,
    isError: verifyError,
    error: verifyErrorObj,
  } = useVerifyOTP();

  function handleSendOTP() {
    if (!phone) return;
    requestOTP(
      { phone },
      {
        onSuccess: (data) => {
          setOtpSent(true);
          setTimer(60);

          if (data?.otp) {
            const digits = data.otp.slice(0, 6).split("");
            setOtp(digits);
          }
        },
      },
    );
  }

  function handleVerifyOTP() {
    const otpString = otp.join("");
    if (otpString.length < 6) return;
    verifyOTP({ phone, code: otpString });
  }

  function handleOtpChange(text: string, index: number) {
    if (text.length === 6) {
      const digits = text.slice(0, 6).split("");
      setOtp(digits);
      otpInputs.current[5]?.focus();
      return;
    }

    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyPress(key: string, index: number) {
    if (key === "Backspace") {
      const newOtp = [...otp];
      if (otp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpInputs.current[index - 1]?.focus();
      }
    }
  }

  function handleLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== measuredWidth) {
      setMeasuredWidth(w);
      containerWidth.current = w;
    }
  }

  const translateX = slideAnim.interpolate({
    inputRange: [-1, 0],
    outputRange: [-measuredWidth, 0],
  });

  const isOtpFilled = otp.every((d) => d !== "");

  return (
    <View onLayout={handleLayout} className="w-full overflow-hidden">
      <Animated.View
        style={{
          flexDirection: "row",
          width: measuredWidth ? measuredWidth * 2 : "200%",
          transform: [{ translateX }],
        }}
      >
        {/* Step 1: Phone number entry */}
        <View style={{ width: measuredWidth || "100%" }} className="gap-y-4 pr-1">
          <Input
            label="Phone number"
            placeholder="Enter phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!otpSent && !isSending}
            variant="outline"
            size="lg"
            containerClassName="rounded-2xl"
            rightIcon={<Ionicons name="call-outline" size={20} color="#9E9E9E" />}
          />

          <TouchableOpacity
            onPress={handleSendOTP}
            disabled={isSending || !phone}
            activeOpacity={0.8}
            className={`w-full h-14 rounded-2xl items-center justify-center flex-row gap-x-1 mt-2 ${
              isSending || !phone
                ? "bg-brand-primary/50"
                : "bg-brand-primary"
            }`}
          >
            <Text className="text-white text-base font-bold">
              {isSending ? "Sending OTP..." : "Send OTP"}
            </Text>
            {!isSending && (
              <Ionicons name="chevron-forward" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Step 2: OTP verification */}
        <View style={{ width: measuredWidth || "100%" }} className="gap-y-4 pl-1">
          {/* Back Chevron */}
          <View className="flex-row items-center mb-1">
            <TouchableOpacity
              onPress={() => {
                setOtpSent(false);
                setOtp(Array(6).fill(""));
                setTimer(0);
              }}
              className="flex-row items-center gap-x-1"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={20} color="#1B5E37" />
              <Text className="text-sm font-semibold text-brand-primary">Edit Phone</Text>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View className="mb-2">
            <Text className="text-2xl font-bold text-text-primary">
              Enter code
            </Text>
            <Text className="text-sm font-medium text-text-muted mt-1">
              We've sent an SMS with an activation code to your phone {phone}
            </Text>
          </View>

          {/* 6 OTP boxes */}
          <View className="flex-row justify-between gap-x-2 my-2">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  otpInputs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                selectTextOnFocus
                className="flex-1 h-14 rounded-md text-xl font-bold text-text-primary text-center border"
                style={{
                  backgroundColor: digit ? "#E8F5EE" : "#F5F5F5",
                  borderColor: digit ? "#1B5E37" : "#E0E0E0",
                }}
              />
            ))}
          </View>

          {timer > 0 ? (
            <Text className="text-text-muted text-sm font-semibold text-center mb-2">
              Send code again {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleSendOTP} disabled={isSending} className="items-center mb-2">
              <Text className="text-sm font-bold text-brand-primary">
                Send code again
              </Text>
            </TouchableOpacity>
          )}

          {(sendError || verifyError) && (
            <Text className="text-error text-xs text-center my-1">
              {getErrorMessage(sendError ? requestError : verifyErrorObj)}
            </Text>
          )}

          {/* Verify Button */}
          <TouchableOpacity
            onPress={handleVerifyOTP}
            disabled={isVerifying || !isOtpFilled}
            activeOpacity={0.85}
            className={`w-full h-14 rounded-2xl items-center justify-center flex-row gap-x-1 mt-2 ${
              isVerifying || !isOtpFilled
                ? "bg-brand-primary/50"
                : "bg-brand-primary"
            }`}
          >
            <Text className="text-white text-base font-bold">
              {isVerifying ? "Verifying..." : "Verify Phone Number"}
            </Text>
            {!isVerifying && (
              <Ionicons name="chevron-forward" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
