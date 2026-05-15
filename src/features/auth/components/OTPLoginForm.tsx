import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { AuthInput } from "./AuthInput";
import { useRequestOTP, useVerifyOTP } from "../hooks/useOTP";

export function OTPLoginForm() {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    const {
        mutate: requestOTP,
        isPending: isSending,
        isError: sendError,
    } = useRequestOTP();

    const {
        mutate: verifyOTP,
        isPending: isVerifying,
        isError: verifyError,
        error,
    } = useVerifyOTP();

    function handleSendOTP() {
        if (!phone) return;
        requestOTP(
            { phone },
            { onSuccess: () => setOtpSent(true) }
        );
    }

    function handleVerifyOTP() {
        if (!otp) return;
        verifyOTP({ phone, code : otp });
    }

    return (
        <View className="w-full gap-y-4">
            {/* Phone Input + Send OTP */}
            <View className="flex-row items-center gap-x-2">
                <View className="flex-1">
                    <AuthInput
                        placeholder="Enter phone number"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        editable={!otpSent}
                    />
                </View>
                <TouchableOpacity
                    onPress={otpSent ? () => { setOtpSent(false); setOtp(""); } : handleSendOTP}
                    disabled={isSending || !phone}
                    activeOpacity={0.8}
                    className={`h-14 px-4 rounded-full items-center justify-center ${isSending || !phone ? "bg-brand-primary/50" : "bg-brand-primary"
                        }`}
                >
                    <Text className="text-white text-xs font-semibold">
                        {isSending ? "Sending..." : otpSent ? "Resend" : "Send OTP"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* OTP sent confirmation */}
            {otpSent && (
                <Text className="text-success text-xs text-center">
                    OTP sent to {phone}
                </Text>
            )}

            {/* OTP Input — shown after OTP is sent */}
            {otpSent && (
                <AuthInput
                    placeholder="Enter OTP"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                />
            )}

            {(sendError || verifyError) && (
                <Text className="text-error text-xs text-center">
                    {(error as any)?.message ?? "Something went wrong. Please try again."}
                </Text>
            )}

            {/* Verify Button */}
            {otpSent && (
                <TouchableOpacity
                    onPress={handleVerifyOTP}
                    disabled={isVerifying || otp.length < 4}
                    activeOpacity={0.85}
                    className={`w-full h-14 rounded-full items-center justify-center mt-2 ${isVerifying || otp.length < 4
                            ? "bg-brand-primary/50"
                            : "bg-brand-primary"
                        }`}
                >
                    <Text className="text-white text-base font-semibold tracking-wide">
                        {isVerifying ? "Verifying..." : "Verify OTP"}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}