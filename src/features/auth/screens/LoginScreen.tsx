import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LoginTabBar } from "../components/LoginTabBar";
import { OTPLoginForm } from "../components/OTPLoginForm";
import { UsernameLoginForm } from "../components/UsernameLoginForm";
import type { LoginMethod } from "../types/auth.types";

export default function LoginScreen() {
  const [method, setMethod] = useState<LoginMethod>("password");

  return (
    // 🎨 Background color → change "#D6EDE4" or add bg-bg-auth token
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView
        className="flex-1 h-full bg-bg-input"
      // style={{ backgroundColor: "#D6EDE4" }}
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerClassName="flex-grow"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 items-center px-6 pt-16 pb-8">

              {/* 🖼️ Logo — replace require() path with your asset */}
              <Image
                source={require("@assets/images/pench-logo.png")}
                className="w-48 h-36"
                resizeMode="contain"
                accessibilityLabel="Pench Foods logo"
              />

              {/* Title */}
              <Text className="text-2xl font-bold text-text-primary mt-6 mb-8">
                Welcome to Purity
              </Text>

              {/* Tab Switcher */}
              <LoginTabBar active={method} onChange={setMethod} />

              {/* Form — swaps based on active tab */}
              {method === "password" ? (
                <UsernameLoginForm />
              ) : (
                <OTPLoginForm />
              )}

              {/* Copyright */}
              <Text className="text-xs text-text-muted text-center mt-auto pt-10">
                © 2024 Pench Foods. All rights reserved.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}