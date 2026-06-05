import React from "react";
import {
  Modal as RNModal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { cn } from "@/utils/cn";
import { Text } from "@/shared/ui/Text/Text";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ visible, onClose, title, children, className }: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View className={cn("bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl", className)}>
                {title && (
                  <View className="flex-row items-center justify-between mb-4">
                    <Text variant="subhead" weight="bold" color="primary">{title}</Text>
                    <TouchableOpacity onPress={onClose} className="p-1">
                      <Text variant="body" color="secondary">✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {children}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}
