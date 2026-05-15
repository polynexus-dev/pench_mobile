import React from "react";
import { TouchableOpacity, ActivityIndicator, Text } from "react-native";
import { cn } from "@/utils/cn";
import type { ButtonProps } from "./Button.types";

const variantClasses: Record<string, string> = {
  primary: "bg-primary active:opacity-80",
  secondary: "bg-secondary active:opacity-80",
  danger: "bg-danger active:opacity-80",
  ghost: "bg-transparent active:bg-gray-100",
  outline: "bg-transparent border border-primary active:bg-blue-50",
};

const textClasses: Record<string, string> = {
  primary: "text-white",
  secondary: "text-white",
  danger: "text-white",
  ghost: "text-primary",
  outline: "text-primary",
};

const sizeClasses: Record<string, string> = {
  sm: "px-3 py-2 rounded-lg",
  md: "px-5 py-3 rounded-xl",
  lg: "px-6 py-4 rounded-2xl",
};

const textSizeClasses: Record<string, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={cn(
        "flex-row items-center justify-center",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        (disabled || loading) && "opacity-50",
        className,
      )}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "ghost" || variant === "outline" ? "#1D4ED8" : "#FFFFFF"} />
      ) : (
        <Text className={cn("font-medium", textClasses[variant], textSizeClasses[size])}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
