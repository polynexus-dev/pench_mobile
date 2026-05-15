import React from "react";
import { View, Text, TextInput } from "react-native";
import { cn } from "@/utils/cn";
import type { InputProps } from "./Input.types";

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  editable = true,
  ...rest
}: InputProps) {
  return (
    <View className="gap-1">
      {label && (
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
      )}
      <View
        className={cn(
          "flex-row items-center border rounded-xl px-3 bg-white",
          error ? "border-danger" : "border-gray-300",
          !editable && "bg-gray-100",
        )}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          className={cn("flex-1 py-3 text-base text-gray-900", className)}
          placeholderTextColor="#9CA3AF"
          editable={editable}
          {...rest}
        />
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      {error && <Text className="text-xs text-danger">{error}</Text>}
      {!error && hint && <Text className="text-xs text-secondary">{hint}</Text>}
    </View>
  );
}
