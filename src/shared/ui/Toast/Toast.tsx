import React, { useEffect, useRef } from "react";
import { Animated, Text } from "react-native";
import { cn } from "@/utils/cn";
import type { ToastType } from "@/hooks/useToast";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

const typeClasses: Record<ToastType, string> = {
  success: "bg-success",
  error: "bg-danger",
  warning: "bg-warning",
  info: "bg-primary",
};

export function Toast({ message, type = "info", duration = 3000, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(duration - 500),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onHide?.());
  }, []);

  return (
    <Animated.View
      style={{ opacity }}
      className={cn(
        "absolute bottom-10 left-6 right-6 z-50 rounded-xl px-4 py-3 shadow-lg",
        typeClasses[type],
      )}
    >
      <Text className="text-white text-sm font-medium text-center">{message}</Text>
    </Animated.View>
  );
}
