import React, { useMemo, useRef, useState } from "react";
import {
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
  const [city, setCity] = useState(CITY_OPTIONS[0].value);
  const [showPassword, setShowPassword] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const { mutate: register, isPending, isError, error } = useRegister();

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

  const selectedCity = CITY_OPTIONS.find((c) => c.value === city);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 items-center px-6 pt-10 pb-8">
            {/* Back */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="self-start mb-4 flex-row items-center gap-x-1"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
              <Text className="text-sm font-medium text-text-primary">Back</Text>
            </TouchableOpacity>

            {/* Logo */}
            <Image
              source={require("@assets/images/pench-logo.png")}
              className="w-36 h-28"
              resizeMode="contain"
              accessibilityLabel="Pench Foods logo"
            />

            {/* Title */}
            <Text className="mt-4 mb-8 text-2xl font-bold text-text-primary">
              Create Account
            </Text>

            {/* Form */}
            <View className="w-full gap-y-4">
              <AuthInput
                label="Username"
                placeholder="Choose a username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <AuthInput
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <AuthInput
                label="Phone Number"
                placeholder="Enter your phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={13}
              />

              <AuthInput
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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

              {/* City Picker */}
              <View>
                <Text className="mb-2 ml-1 text-sm font-semibold text-text-primary">
                  City
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={toggleCityPicker}
                  className="h-16 flex-row items-center justify-between rounded-full border border-border-disable bg-border-disable px-6"
                >
                  <Text className="text-sm font-bold text-text-primary">
                    {selectedCity?.label ?? "Select your city"}
                  </Text>

                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: dropdownAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "180deg"],
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

                <Animated.View
                  style={{
                    maxHeight: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, CITY_OPTIONS.length * 58],
                    }),
                    opacity: dropdownAnim,
                    overflow: "hidden",
                  }}
                >
                  <View className="mt-2 overflow-hidden rounded-3xl bg-white border border-border-disable">
                    {CITY_OPTIONS.map((option) => {
                      const isSelected = city === option.value;

                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => {
                            setCity(option.value);
                            toggleCityPicker();
                          }}
                          className={`flex-row items-center justify-between px-5 py-4 ${isSelected ? "bg-brand-light" : "bg-white"
                            }`}
                        >
                          <Text
                            className={`text-base ${isSelected
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

              {isError && (
                <Text className="text-error text-xs text-center">
                  {(error as any)?.message ??
                    "Registration failed. Please try again."}
                </Text>
              )}

              {/* Register Button */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={!isFormValid || isPending}
                activeOpacity={0.85}
                className={`w-full h-14 rounded-full items-center justify-center mt-2 ${!isFormValid || isPending
                    ? "bg-brand-primary/50"
                    : "bg-brand-primary"
                  }`}
              >
                <Text className="text-white text-base font-semibold tracking-wide">
                  {isPending ? "Creating account..." : "Create account"}
                </Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View className="flex-row items-center justify-center gap-x-1 mt-2">
                <Text className="text-sm text-text-secondary">
                  Already have an account?
                </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text className="text-sm font-semibold text-brand-primary">
                    Log in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <Text className="text-xs text-text-muted text-center mt-auto pt-8">
              © 2026 Pench Foods. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}