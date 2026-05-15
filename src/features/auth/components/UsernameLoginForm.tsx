import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthInput } from "./AuthInput";
import { useLogin } from "../hooks/useLogin";

export function UsernameLoginForm() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { mutate: login, isPending, isError, error } = useLogin();

    return (
        <View className="w-full gap-y-4">
            <AuthInput
                placeholder="Enter your Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
            />

            <AuthInput
                placeholder="Enter your Password"
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

            {isError && (
                <Text className="text-error text-xs text-center">
                    {(error as any)?.message ?? "Invalid username or password."}
                </Text>
            )}

            {/* Login Button */}
            <TouchableOpacity
                onPress={() => login({ username, password })}
                disabled={isPending || !username || !password}
                activeOpacity={0.85}
                className={`w-full h-14 rounded-full items-center justify-center mt-2 ${isPending || !username || !password
                        ? "bg-brand-primary/50"
                        : "bg-brand-primary"
                    }`}
            >
                <Text className="text-white text-base font-semibold tracking-wide">
                    {isPending ? "Logging in..." : "Log in"}
                </Text>
            </TouchableOpacity>

            {/* Register link */}
            <View className="flex-row items-center justify-center gap-x-1 mt-2">
                <Text className="text-sm text-text-secondary">New customer?</Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                    <Text className="text-sm font-semibold text-brand-primary">
                        Create account
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
} 