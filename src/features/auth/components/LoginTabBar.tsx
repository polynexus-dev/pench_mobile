import React, { useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    LayoutChangeEvent,
} from "react-native";
import type { LoginMethod } from "../types/auth.types";

interface LoginTabBarProps {
    active: LoginMethod;
    onChange: (method: LoginMethod) => void;
}

const TABS: { label: string; method: LoginMethod }[] = [
    { label: "Username", method: "password" },
    { label: "Phone / OTP", method: "otp" },
];

export function LoginTabBar({ active, onChange }: LoginTabBarProps) {
    const translateX = useRef(new Animated.Value(0)).current;
    const tabWidth = useRef(0);

    function handleLayout(e: LayoutChangeEvent) {
        // Each tab is half the total container width
        tabWidth.current = e.nativeEvent.layout.width / 2;
    }

    useEffect(() => {
        const toValue = active === "password" ? 0 : tabWidth.current;

        Animated.spring(translateX, {
            toValue,
            useNativeDriver: true,
            damping: 18,       // ← controls bounciness (higher = less bounce)
            stiffness: 200,    // ← controls speed
            mass: 0.8,
        }).start();
    }, [active]);

    return (
        <View
            onLayout={handleLayout}
            className="flex-row w-full rounded-full bg-brand-light border border-[#ABBAAE] p-2 mb-6 relative"
        >
            {/* ── Animated sliding pill ─────────────────────────────── */}
            <Animated.View
                style={{
                    transform: [{ translateX }],
                    width: `${100 / TABS.length}%`,
                }}
                className="absolute top-1 bottom-1 left-1 bg-brand-primary rounded-full"
            />

            {/* ── Tab buttons ───────────────────────────────────────── */}
            {TABS.map((tab) => (
                <TouchableOpacity
                    key={tab.method}
                    onPress={() => onChange(tab.method)}
                    activeOpacity={0.8}
                    className="flex-1 py-2.5 rounded-full items-center justify-center z-10"
                >
                    <Text
                        className={`text-sm font-semibold ${active === tab.method ? "text-white" : "text-text-secondary"
                            }`}
                    >
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}