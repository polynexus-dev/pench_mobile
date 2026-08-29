import { useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LoginTabBar } from "../components/LoginTabBar";
import { OTPLoginForm } from "../components/OTPLoginForm";
import { UsernameLoginForm } from "../components/UsernameLoginForm";
import type { LoginMethod } from "../types/auth.types";

export default function LoginScreen() {
  const [method, setMethod] = useState<LoginMethod>("password");
  const router = useRouter();
  const [containerWidth, setContainerWidth] = useState(0);
  const tabSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(tabSlideAnim, {
      toValue: method === "otp" ? -1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [method]);

  function handleLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidth) {
      setContainerWidth(w);
    }
  }

  const translateX = tabSlideAnim.interpolate({
    inputRange: [-1, 0],
    outputRange: [-containerWidth, 0],
  });

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
          <View className="flex-1 px-5 pt-6 pb-12 justify-between items-center">

            {/* Header / Logo section */}
            <View className="items-center w-full">
              <Image
                source={require("@assets/images/pench-logo.png")}
                className="w-44 h-32"
                resizeMode="contain"
                accessibilityLabel="Pench Foods logo"
              />
              {/* <View>
                <Text className="text-3xl font-bold text-[#1A1A1A] tracking-tight mt-2 text-center">
                  Welcome Back
                </Text>
                <Text className="text-sm font-semibold text-[#4A4A4A] mt-1 text-center">
                  Sign in to access your dashboard
                </Text>
              </View> */}
            </View>

            {/* Login Form Container Card */}
            <View className="w-full rounded-[24px] px-2 py-2 mb-6">
              <View className="mb-6 items-center">
                <Text className="text-3xl font-bold text-[#1A1A1A] tracking-tight">
                  Welcome Back
                </Text>
                {/* <Text className="text-sm font-semibold text-[#4A4A4A]">
                  Sign in to access your dashboard
                </Text> */}
              </View>
              {/* Tab Switcher */}
              <LoginTabBar active={method} onChange={setMethod} />

              {/* Form container with sliding animation */}
              <View onLayout={handleLayout} className="w-full overflow-hidden mt-4">
                <Animated.View
                  style={{
                    flexDirection: "row",
                    width: containerWidth ? containerWidth * 2 : "200%",
                    transform: [{ translateX }],
                  }}
                >
                  {/* Tab 1: Username / Password */}
                  <View style={{ width: containerWidth || "100%" }} className="pr-1 flex-grow-0 flex-shrink-0">
                    <UsernameLoginForm />
                  </View>

                  {/* Tab 2: OTP / Phone */}
                  <View style={{ width: containerWidth || "100%" }} className="pl-1 flex-grow-0 flex-shrink-0">
                    <OTPLoginForm />
                  </View>
                </Animated.View>
              </View>
            </View>

            {/* Bottom Register Link */}
            <View className="flex-row items-center justify-center gap-x-1 py-2">
              <Text className="text-sm text-[#4A4A4A] font-semibold">
                New Member?
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register" as any)}>
                <Text className="text-sm font-bold text-[#1B5E37]">
                  Register now
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}