// src/components/ui/Input/Input.tsx
// ─────────────────────────────────────────────────────────────────
// Reusable Input — built on TextInput + NativeWind + tokens
// Driven entirely by tokens.js — no hardcoded values.
//
// Features:
//   · 3 variants   — filled | outline | ghost
//   · 3 sizes      — sm | md | lg
//   · Label slot   (above field)
//   · Helper text  (below field — neutral info)
//   · Error state  + error message
//   · Success state
//   · Left / right icon slots (auto-coloured per state)
//   · Right action slot (e.g. clear button)
//   · Password show/hide toggle built-in
//   · Character counter (warns near limit)
//   · Loading spinner in right slot
//   · Disabled state
//   · Focus ring via border-border-focus from tokens
//   · Full a11y — accessibilityLabel, accessibilityHint, accessibilityState
// ─────────────────────────────────────────────────────────────────

import React, { useState, useCallback, useRef, useImperativeHandle } from "react";
import {
  TextInput,
  View,
  Pressable,
  ActivityIndicator,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// import { Eye, EyeOff } from "lucide-react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { Text } from "../Text/Text";
import { cn } from "@/utils/cn";
import tokens from "@/shared/theme/tokens";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. VARIANT DEFINITIONS (CVA)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Field container (the visible bordered/filled box) ─────────
const containerVariants = cva(
  [
    "flex-row items-center",
    // "rounded-input",          // tokens → borderRadius.lg (12px) → rounded-input
    "rounded-full",          // tokens → borderRadius.lg (12px) → rounded-input
    "border",
    "overflow-hidden",
  ],
  {
    variants: {
      variant: {
        filled: "bg-bg-input  border-transparent",
        outline: "bg-transparent border-border-default",
        ghost: "bg-transparent border-transparent border-b-border-default rounded-none",
      },
      size: {
        sm: "h-input-sm px-input-x",   // 40px — compact lists
        md: "h-input-md px-input-x",   // 48px — standard  ← default
        lg: "h-input-lg px-input-x",   // 56px — prominent fields
      },
      isDisabled: {
        true: "opacity-disabled",      // 0.38 from tokens
        false: "",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
      isDisabled: false,
    },
  }
);

// ── TextInput inner text styles ───────────────────────────────
const inputVariants = cva(
  [
    "flex-1",
    "font-sans",
    "text-text-primary",
    "p-0",              // reset native TextInput default padding — container handles it
  ],
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-body",   // 15px — semantic body scale
        lg: "text-md",     // 16px
      },
    },
    defaultVariants: { size: "md" },
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. CONSTANTS FROM TOKENS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ICON_SIZE = {
  sm: tokens.sizes.iconSm,   // 16
  md: tokens.sizes.iconMd,   // 20
  lg: tokens.sizes.iconLg,   // 24
} as const;

const COLOR = {
  default: tokens.Colors.neutral[500],
  focus: tokens.Colors.brand.primary,
  error: tokens.Colors.error,
  success: tokens.Colors.success,
  muted: tokens.Colors.neutral[400],  // placeholder
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface InputProps extends Omit<TextInputProps, "style"> {
  // Variant
  variant?: "filled" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";

  // Labels
  label?: string;
  helperText?: string;

  // States
  error?: string;    // non-empty triggers error state + message below
  success?: boolean;
  disabled?: boolean;
  loading?: boolean;   // spinner in right slot, blocks input

  // Icon slots
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;   // overridden by loading / password toggle
  rightAction?: React.ReactNode;  // pressable (e.g. clear button) — overridden by loading

  // Built-in password toggle
  isPassword?: boolean;

  // Character counter
  maxLength?: number;    // shows "n/max" counter
  showCount?: boolean;   // show counter even without maxLength

  // Escape hatches
  containerClassName?: string;
  inputClassName?: string;
  wrapperStyle?: StyleProp<ViewStyle>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      variant = "filled",
      size = "md",

      label,
      helperText,

      error,
      success = false,
      disabled = false,
      loading = false,

      leftIcon,
      rightIcon,
      rightAction,

      isPassword = false,
      secureTextEntry,

      maxLength,
      showCount = false,

      containerClassName,
      inputClassName,
      wrapperStyle,

      onFocus,
      onBlur,
      onChangeText,
      value,
      placeholder,
      accessibilityLabel,
      accessibilityHint,

      ...rest
    },
    ref
  ) => {
    const localRef = useRef<TextInput>(null);
    useImperativeHandle(ref, () => localRef.current!);

    // ── Local state ───────────────────────────────────────────
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const [internalValue, setInternalValue] = useState(value ?? "");

    // ── Derived flags ─────────────────────────────────────────
    const isError = Boolean(error);
    const isSuccess = success && !isError;
    const isInteractive = !disabled && !loading;

    // ── Icon / decoration colour — follows state priority ────
    // error > success > focused > default
    const decoColor = isError
      ? COLOR.error
      : isSuccess
        ? COLOR.success
        : isFocused
          ? COLOR.focus
          : COLOR.default;

    const iconSize = ICON_SIZE[size];

    // ── Handlers ──────────────────────────────────────────────
    const handleFocus: NonNullable<TextInputProps["onFocus"]> =
      useCallback(
        (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        [onFocus]
      );

    const handleBlur: NonNullable<TextInputProps["onBlur"]> =
      useCallback(
        (e) => {
          setIsFocused(false);
          onBlur?.(e);
        },
        [onBlur]
      );

    const handleChangeText = useCallback(
      (text: string) => {
        setInternalValue(text);
        onChangeText?.(text);
      },
      [onChangeText]
    );

    // ── Border colour — driven by focus/error/success state ──
    // Cannot be done purely in CVA because focus is runtime state.
    const borderClassName = isError
      ? "border-error"
      : isSuccess
        ? "border-success"
        : isFocused
          ? "border-border-focus"
          : "";    // CVA default handles the rest

    // ── Right slot priority:
    // loading → password toggle → rightAction → rightIcon
    const RightSlot = () => {
      if (loading) {
        return (
          <ActivityIndicator
            size="small"
            color={tokens.Colors.brand.primary}
            className="ml-icon-gap"
          />
        );
      }

      if (isPassword) {
        return (
          <Pressable
            onPress={() => setPasswordVisible((v) => !v)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
            className="ml-icon-gap items-center justify-center active:opacity-60"
          >
            {/* {isPasswordVisible
              ? <EyeOff size={iconSize} color={decoColor} />
              : <Eye size={iconSize} color={decoColor} />
            } */}
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#9E9E9E"
            />
          </Pressable>
        );
      }

      if (rightAction) {
        return (
          <View className="ml-icon-gap items-center justify-center">
            {rightAction}
          </View>
        );
      }

      if (rightIcon) {
        return (
          <View className="ml-icon-gap items-center justify-center">
            {React.isValidElement(rightIcon)
              ? React.cloneElement(rightIcon as React.ReactElement<any>, {
                size: iconSize,
                color: decoColor,
              })
              : rightIcon
            }
          </View>
        );
      }

      return null;
    };

    // ── Character counter ─────────────────────────────────────
    const currentLength = (value ?? internalValue).length;
    const showCounter = showCount !== undefined ? showCount : Boolean(maxLength);
    const nearLimit = maxLength ? currentLength >= maxLength * 0.85 : false;
    const atLimit = maxLength ? currentLength >= maxLength : false;

    // ─────────────────────────────────────────────────────────
    return (
      <View style={wrapperStyle} className="w-full gap-1.5">

        {/* ── Label ─────────────────────────────────────────── */}
        {label && (
          <Text
            className={cn(
              "text-label font-semibold",
              isError ? "text-error" :
                isSuccess ? "text-success" :
                  disabled ? "text-text-disabled" :
                    "text-text-secondary",
            )}
          >
            {label}
          </Text>
        )}

        {/* ── Field row ─────────────────────────────────────── */}
        <Pressable
          onPress={() => localRef.current?.focus()}
          className={cn(
            containerVariants({ variant, size, isDisabled: disabled }),
            borderClassName,
            containerClassName,
          )}
        >
          {/* Left icon — auto-coloured, auto-sized */}
          {leftIcon && (
            <View className="mr-icon-gap items-center justify-center">
              {React.isValidElement(leftIcon)
                ? React.cloneElement(leftIcon as React.ReactElement<any>, {
                  size: iconSize,
                  color: decoColor,
                })
                : leftIcon
              }
            </View>
          )}

          {/* TextInput */}
          <TextInput
            ref={localRef}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={COLOR.muted}
            editable={isInteractive}
            secureTextEntry={secureTextEntry !== undefined ? secureTextEntry : (isPassword && !isPasswordVisible)}
            maxLength={maxLength}
            maxFontSizeMultiplier={1.2}           // prevent system font breaking layout
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityHint={accessibilityHint ?? helperText}
            accessibilityState={{ disabled }}
            className={cn(inputVariants({ size }), inputClassName)}
            {...rest}
          />

          {/* Right slot */}
          <RightSlot />
        </Pressable>

        {/* ── Bottom row — message + counter ────────────────── */}
        {(isError || helperText || showCounter) && (
          <View className="flex-row items-center justify-between">

            {/* Error overrides helperText */}
            {(isError || helperText) && (
              <Text
                className={cn(
                  "flex-1 text-caption",
                  isError ? "text-error" : "text-text-muted",
                )}
              >
                {error ?? helperText}
              </Text>
            )}

            {/* Character counter */}
            {showCounter && (
              <Text
                className={cn(
                  "text-caption ml-2 tabular-nums",
                  atLimit ? "text-error" :
                    nearLimit ? "text-warning" :
                      "text-text-muted",
                )}
              >
                {currentLength}{maxLength ? `/${maxLength}` : ""}
              </Text>
            )}
          </View>
        )}

      </View>
    );
  }
);

Input.displayName = "Input";


/////////////// ICON Variants ///////
// const iconVariants = cva("", {
//   variants: {
//     size: {
//       sm: `text-[${tokens.sizes.icon.sm}px]`,
//       md: `text-[${tokens.sizes.icon.md}px]`,
//       lg: `text-[${tokens.sizes.icon.lg}px]`,
//     },
//     tone: {
//       default: tokens.Colors.neutral[500],
//       focus: tokens.Colors.brand.primary,
//       error: tokens.Colors.error,
//       success: tokens.Colors.success,
//     },
//   },
//   defaultVariants: {
//     size: "md",
//     tone: "default",
//   },
// });

// Icon wrapper component
// function InputIcon({
//   icon,
//   size,
//   tone,
// }: {
//   icon: React.ReactNode;
//   size: "sm" | "md" | "lg";
//   tone: "default" | "focus" | "error" | "success";
// }) {
//   if (!React.isValidElement(icon)) return null;

//   return React.cloneElement(icon as React.ReactElement<any>, {
//     className: iconVariants({ size, tone }),
//   });
// }

    //           tokens.ts
    //                ↓
    //      ┌──────────────────┐
    //      │    CVA system    │
    //      └──────────────────┘
    //       ↓        ↓       ↓
    //  container   text   icons
    //       ↓        ↓       ↓
    //     Input (single API)