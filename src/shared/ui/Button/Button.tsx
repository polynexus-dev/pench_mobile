// src/components/ui/Button/Button.tsx
// ─────────────────────────────────────────────────────────────────
// Reusable Button — built on Pressable + NativeWind + CVA
// Driven entirely by tokens.js — no hardcoded values.
//
// Features:
//   · 5 intents  — primary | secondary | outline | ghost | danger
//   · 4 sizes    — sm | md | lg | xl
//   · Left / right icon slots
//   · Full-width mode
//   · Loading state (ActivityIndicator, disables press)
//   · Disabled state (opacity-disabled from tokens)
//   · Android native ripple + iOS opacity feedback
//   · Auto touch-target compliance via minHeight from tokens
// ─────────────────────────────────────────────────────────────────

import React from "react";
import {
    Pressable,
    ActivityIndicator,
    View,
    // Text,
    type PressableProps,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { Text } from "@/shared/ui/Text";     // your custom Text (no font scaling)
import { cn } from "@/utils/cn";
import tokens  from "@/shared/theme/tokens"; 

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. VARIANT DEFINITIONS (CVA)
// All class names must exist in tailwind.config.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const buttonVariants = cva(
    // ── Base — applied to every button ──────────────────────────
    [
        "flex-row items-center justify-center",
        "rounded-btn",              // 12px from tokens → rounded-btn
        "overflow-hidden",          // clips Android ripple to border radius
    ],
    {
        variants: {

            // ── Intent ──────────────────────────────────────────────
            intent: {
                primary: "bg-brand-primary",
                secondary: "bg-brand-light",
                outline: "bg-transparent border border-brand-primary",
                ghost: "bg-transparent",
                danger: "bg-error",
            },

            // ── Size — height matches token sizes ───────────────────
            // h-btn-sm/md/lg/xl come from tokens.sizes in tailwind config
            size: {
                sm: "h-btn-sm px-4    gap-1.5",   // 36px tall
                md: "h-btn-md px-6    gap-2",     // 44px tall  ← iOS touch min
                lg: "h-btn-lg px-8    gap-2",     // 52px tall
                xl: "h-btn-xl px-10   gap-2.5",   // 56px tall
            },

            // ── Full width ───────────────────────────────────────────
            fullWidth: {
                true: "w-full",
                false: "self-start",    // shrink-wrap to content
            },
        },

        defaultVariants: {
            intent: "primary",
            size: "md",
            fullWidth: false,
        },
    }
);

// Label inherits intent so colour is always correct
const labelVariants = cva(
    "font-semibold tracking-wide",
    {
        variants: {
            intent: {
                primary: "text-text-onBrand",
                secondary: "text-brand-primary",
                outline: "text-brand-primary",
                ghost: "text-brand-primary",
                danger: "text-text-onBrand",
            },
            size: {
                sm: "text-sm",
                md: "text-label",     // 13px semibold from semantic scale
                lg: "text-md",        // 16px
                xl: "text-lg",        // 17px
            },
        },
        defaultVariants: { intent: "primary", size: "md" },
    }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. RIPPLE CONFIG
// Android-only; colour follows intent
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const rippleConfig: Record<string, { color: string }> = {
    primary: { color: "rgba(255, 255, 255, 0.22)" },
    secondary: { color: "rgba(27,  94,  55,  0.14)" },
    outline: { color: "rgba(27,  94,  55,  0.10)" },
    ghost: { color: "rgba(27,  94,  55,  0.10)" },
    danger: { color: "rgba(255, 255, 255, 0.22)" },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type ButtonVariants = VariantProps<typeof buttonVariants>;

export interface ButtonProps
    extends Omit<PressableProps, "style" | "children"> {
    // Content
    label: string;
    leftIcon?: React.ReactNode;   // rendered before label
    rightIcon?: React.ReactNode;   // rendered after label

    // Variants
    intent?: ButtonVariants["intent"];
    size?: ButtonVariants["size"];
    fullWidth?: boolean;

    // States
    loading?: boolean;   // shows spinner, disables press
    disabled?: boolean;

    // Escape hatches (use sparingly)
    className?: string;    // extra Tailwind classes on the Pressable
    style?: StyleProp<ViewStyle>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Button = ({
    // Content
    label,
    leftIcon,
    rightIcon,

    // Variants
    intent = "primary",
    size = "md",
    fullWidth = false,

    // States
    loading = false,
    disabled = false,

    // Extras
    className,
    style,
    onPress,
    ...rest
}: ButtonProps) => {

    const isDisabled = disabled || loading;

    // Spinner colour matches label colour
    const spinnerColor =
        intent === "primary" || intent === "danger"
            ? tokens.Colors.text.inverse
            : tokens.Colors.brand.primary;

    return (
        <Pressable
            onPress={isDisabled ? undefined : onPress}
            android_ripple={rippleConfig[intent ?? "primary"]}
            style={style}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            className={cn(
                buttonVariants({ intent, size, fullWidth }),
                isDisabled && "opacity-disabled",   // 0.38 from tokens
                className,
            )}
            // iOS press feedback — dims to 0.7 on press
            // No-op on Android (ripple handles it natively)
            {...rest}
        >
            {({ pressed }) => (
                <View
                    className={cn(
                        "flex-row items-center justify-center",
                        // ── Gap matches size variant ──
                        size === "sm" && "gap-1.5",
                        size === "md" && "gap-2",
                        size === "lg" && "gap-2",
                        size === "xl" && "gap-2.5",
                        // ── iOS press dimming (Android uses ripple instead) ──
                        pressed && "ios:opacity-70",
                    )}
                >
                    {/* Left icon — hidden during loading */}
                    {leftIcon && !loading && (
                        <View className="items-center justify-center">
                            {leftIcon}
                        </View>
                    )}

                    {/* Spinner — replaces left icon slot during loading */}
                    {loading && (
                        <ActivityIndicator
                            size="small"
                            color={spinnerColor}
                        />
                    )}

                    {/* Label */}
                    <Text
                        className={cn(labelVariants({ intent, size }))}
                        numberOfLines={1}
                    >
                        {loading ? "Please wait…" : label}
                    </Text>

                    {/* Right icon — hidden during loading */}
                    {rightIcon && !loading && (
                        <View className="items-center justify-center">
                            {rightIcon}
                        </View>
                    )}
                </View>
            )}
        </Pressable>
    );
};