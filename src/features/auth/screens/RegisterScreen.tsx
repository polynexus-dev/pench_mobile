import React, { useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { useRouter } from "expo-router";

import { AuthInput } from "../components/AuthInput";
import { useRegister } from "../hooks/useRegister";

const CITY_OPTIONS = [
  { label: "Nagpur", value: "nagpur" },
  { label: "Pune", value: "pune" },
  { label: "Mumbai", value: "mumbai" },
];

export default function RegisterScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [city, setCity] = useState(
    CITY_OPTIONS[0].value,
  );

  const [showPassword, setShowPassword] =
    useState(false);

  const [showCityPicker, setShowCityPicker] =
    useState(false);

  const dropdownAnim = useRef(
    new Animated.Value(0),
  ).current;

  const { mutate: register, isPending } =
    useRegister();

  const isFormValid = useMemo(() => {
    return (
      username.trim() &&
      email.trim() &&
      phone.trim() &&
      password.trim() &&
      city
    );
  }, [username, email, phone, password, city]);

  function handleRegister() {
    register({
      username: username.trim(),
      password,
      email: email.trim(),
      phone: phone.trim(),
      role: "Customers",
      is_customer: true,
      tenant_schema: city,
    });
  }

  function toggleCityPicker() {
    const next = !showCityPicker;

    setShowCityPicker(next);

    Animated.spring(dropdownAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: false,
      damping: 18,
      stiffness: 180,
    }).start();
  }

  const selectedCity = CITY_OPTIONS.find(
    (c) => c.value === city,
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-screen">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 40,
          }}
        >
          {/* Header */}
          <View className="px-6 pt-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-full bg-white"
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color="#1A1A1A"
              />
            </TouchableOpacity>
          </View>

          {/* Hero */}
          <View className="items-center px-6 pt-4">
            <Image
              source={require("@assets/images/pench-logo.png")}
              className="h-28 w-28"
              resizeMode="contain"
            />

            {/* <Text className="mt-2 text-center text-xl font-bold text-text-primary">
              Fresh Dairy,
              {"\n"}
              Delivered Daily 🥛
            </Text> */}
          </View>

          {/* Form Card */}
          <View className="mx-5 mt-8 rounded-[32px] bg-white px-5 py-6 shadow-sm">
            <Text className="mb-6 text-2xl font-bold text-text-primary">
              Create Account
            </Text>

            <View className="gap-y-4">

              {/* Username */}
              <AuthInput
                placeholder="Choose a username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Email */}
              <AuthInput
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Phone */}
              <AuthInput
                placeholder="Phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={13}
              />

              {/* Password */}
              <AuthInput
                placeholder="Create password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightIcon={
                  <TouchableOpacity
                    onPress={() =>
                      setShowPassword((v) => !v)
                    }
                  >
                    <Ionicons
                      name={
                        showPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={20}
                      color="#9E9E9E"
                    />
                  </TouchableOpacity>
                }
              />

              {/* City Picker */}
              <View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={toggleCityPicker}
                  className="h-14 flex-row items-center justify-between rounded-full bg-bg-input px-5"
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#9E9E9E"
                    />

                    <Text className="ml-2 text-sm text-text-primary">
                      {selectedCity?.label ??
                        "Select city"}
                    </Text>
                  </View>

                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate:
                            dropdownAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [
                                "0deg",
                                "180deg",
                              ],
                            }),
                        },
                      ],
                    }}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color="#9E9E9E"
                    />
                  </Animated.View>
                </TouchableOpacity>

                {/* Dropdown */}
                <Animated.View
                  style={{
                    maxHeight:
                      dropdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          0,
                          CITY_OPTIONS.length * 58,
                        ],
                      }),
                    opacity: dropdownAnim,
                    overflow: "hidden",
                  }}
                >
                  <View className="mt-2 overflow-hidden rounded-3xl bg-bg-card">

                    {CITY_OPTIONS.map((option) => {
                      const isSelected =
                        city === option.value;

                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => {
                            setCity(option.value);
                            toggleCityPicker();
                          }}
                          className={`flex-row items-center justify-between px-5 py-4 ${
                            isSelected
                              ? "bg-brand-light"
                              : "bg-white"
                          }`}
                        >
                          <Text
                            className={`text-base ${
                              isSelected
                                ? "font-semibold text-brand-primary"
                                : "text-text-primary"
                            }`}
                          >
                            {option.label}
                          </Text>

                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color="#1B5E37"
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Animated.View>
              </View>

              {/* CTA */}
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={
                  !isFormValid || isPending
                }
                onPress={handleRegister}
                className={`mt-3 h-14 items-center justify-center rounded-full ${
                  isFormValid
                    ? "bg-brand-primary"
                    : "bg-brand-primary/40"
                }`}
              >
                {isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-semibold text-white">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>

              {/* Login */}
              <View className="mt-4 flex-row items-center justify-center">
                <Text className="text-sm text-text-secondary">
                  Already have an account?
                </Text>

                <TouchableOpacity
                  onPress={() => router.back()}
                >
                  <Text className="ml-1 text-sm font-semibold text-brand-primary">
                    Log in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer */}
          <Text className="mt-8 text-center text-xs text-text-muted">
            © 2026 Pench Foods. Freshness delivered daily.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}