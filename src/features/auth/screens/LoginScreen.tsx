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
    // <ScreenWrapper>
      <View className="flex-1 h-full bg-white">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerClassName="flex-grow"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 items-center px-6 pt-12 pb-8">

              {/* 🖼️ Logo */}
              <Image
                source={require("@assets/images/pench-logo.png")}
                className="w-48 h-36"
                resizeMode="contain"
                accessibilityLabel="Pench Foods logo"
              />  

              {/* Title */}
              <View className="items-center mt-4 mb-8">
                <Text className="text-3xl font-bold text-text-primary tracking-tight">
                  Welcome back
                </Text>
                <Text className="text-sm font-medium text-text-muted mt-1">
                  sign in to access your account
                </Text>
              </View>

              {/* Tab Switcher */}
              <LoginTabBar active={method} onChange={setMethod} />

              {/* Form — swaps based on active tab with sliding animation */}
              <View onLayout={handleLayout} className="w-full overflow-hidden">
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

              {/* Register Link */}
              <View className="flex-row items-center justify-center gap-x-1 mt-8 pb-4">
                <Text className="text-sm text-text-secondary font-medium">New Member?</Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/register" as any)}>
                  <Text className="text-sm font-semibold text-brand-primary">
                    Register now
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    // {/* </ScreenWrapper> */}
  );
}