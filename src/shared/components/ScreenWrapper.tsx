import React from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn } from "@/utils/cn";

interface Props {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

export function ScreenWrapper({ children, className, scrollable = false }: Props) {
  const content = scrollable ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName="flex-grow"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={cn("flex-1", className)}>{children}</View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface p-4" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
