import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  Pressable,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Input } from "@/shared/ui/Input";
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
  const [showCityPicker, setShowCityPicker] = useState(false);

  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const { mutate: register, isPending, isError, error } = useRegister();

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (error && typeof error === "object" && "data" in error) {
      const apiErr = error as any;
      if (apiErr.data && typeof apiErr.data === "object") {
        const errors: Record<string, string> = {};
        for (const key of Object.keys(apiErr.data)) {
          const val = apiErr.data[key];
          if (Array.isArray(val) && val.length > 0) {
            errors[key] = val[0];
          } else if (typeof val === "string") {
            errors[key] = val;
          }
        }
        setFieldErrors(errors);
      }
    } else {
      setFieldErrors({});
    }
  }, [error]);

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (fieldErrors.username) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated.username;
        return updated;
      });
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (fieldErrors.email) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated.email;
        return updated;
      });
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (fieldErrors.phone) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated.phone;
        return updated;
      });
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (fieldErrors.password) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated.password;
        return updated;
      });
    }
  };

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
    <SafeAreaView className="flex-1 bg-[#F0EBE1]">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* ── Top Bar ─────────────────────────────────────────────── */}
          <View className="px-5 pt-6 pb-4">
            <Pressable
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-10 h-10 rounded-full bg-white shadow-sm items-center justify-center self-start"
            >
              <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
            </Pressable>
          </View>

          {/* ── Main Content ────────────────────────────────────────── */}
          <View className="flex-1 px-5 pb-12 justify-between items-center">
            
            {/* Title / Header */}
            <View className="items-center w-full mb-6">
              <Text className="text-3xl font-bold text-[#1A1A1A] tracking-tight text-center">
                Create Account
              </Text>
              <Text className="text-sm font-semibold text-[#4A4A4A] mt-1 text-center">
                Sign up to create your new account
              </Text>
            </View>

            {/* Form Container */}
            <View className="w-full rounded-[24px] px-2 py-2 mb-6">
              <View className="w-full gap-y-4">
                <Input
                  label="Username"
                  placeholder="Choose a username"
                  value={username}
                  onChangeText={handleUsernameChange}
                  error={fieldErrors.username}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isPending}
                  variant="outline"
                  size="lg"
                  containerClassName="rounded-2xl"
                  rightIcon={<Ionicons name="person-outline" size={20} color="#9E9E9E" />}
                />

                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={handleEmailChange}
                  error={fieldErrors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isPending}
                  variant="outline"
                  size="lg"
                  containerClassName="rounded-2xl"
                  rightIcon={<Ionicons name="mail-outline" size={20} color="#9E9E9E" />}
                />

                <Input
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  error={fieldErrors.phone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  showCount={false}
                  editable={!isPending}
                  variant="outline"
                  size="lg"
                  containerClassName="rounded-2xl"
                  rightIcon={<Ionicons name="call-outline" size={20} color="#9E9E9E" />}
                />

                <Input
                  label="Password"
                  placeholder="Create a password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  error={fieldErrors.password}
                  isPassword={true}
                  editable={!isPending}
                  variant="outline"
                  size="lg"
                  containerClassName="rounded-2xl"
                />

                {/* City Picker */}
                <View>
                  <Text className="mb-1.5 ml-1 text-sm font-semibold text-text-secondary">
                    City
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={toggleCityPicker}
                    className="h-14 flex-row items-center justify-between rounded-2xl border border-neutral-500 bg-transparent px-6"
                  >
                    <Text className="text-sm font-semibold text-text-primary">
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
                        outputRange: [0, CITY_OPTIONS.length * 75],
                      }),
                      opacity: dropdownAnim,
                      overflow: "hidden",
                    }}
                  >
                    <View className="mt-2 overflow-hidden rounded-2xl bg-white border border-neutral-500 shadow-md">
                      {CITY_OPTIONS.map((option) => {
                        const isSelected = city === option.value;

                        return (
                          <TouchableOpacity
                            key={option.value}
                            onPress={() => {
                              setCity(option.value);
                              toggleCityPicker();
                            }}
                            className={`flex-row items-center justify-between px-5 py-4 ${
                              isSelected ? "bg-brand-light" : "bg-white"
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

                {isError && (
                  <Text className="text-error text-xs text-center">
                    {Object.keys(fieldErrors).length > 0
                      ? "Please fix the errors above and try again."
                      : (error as any)?.message ?? "Registration failed. Please try again."}
                  </Text>
                )}

                {/* Register Button */}
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={!isFormValid || isPending}
                  activeOpacity={0.85}
                  className={`w-full h-14 rounded-2xl items-center justify-center flex-row gap-x-1 mt-4 ${
                    !isFormValid || isPending
                      ? "bg-brand-primary/50"
                      : "bg-brand-primary"
                  }`}
                >
                  <Text className="text-white text-base font-bold tracking-wide">
                    {isPending ? "Creating account..." : "Create account"}
                  </Text>
                  {!isPending && (
                    <Ionicons name="chevron-forward" size={18} color="#FFF" />
                  )}
                </TouchableOpacity>

                {/* Login Link */}
                <View className="flex-row items-center justify-center gap-x-1 mt-4">
                  <Text className="text-sm text-[#4A4A4A] font-semibold">
                    Already have an account?
                  </Text>
                  <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-sm font-bold text-[#1B5E37]">
                      Log in
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}