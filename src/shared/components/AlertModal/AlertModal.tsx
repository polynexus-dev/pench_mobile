import React, { useEffect, useState } from "react";
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  type AlertButton,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { registerAlertListener, type AlertModalConfig } from "./alertManager";

function getAlertVisuals(title: string, message?: string, buttons?: AlertButton[]) {
  const t = (title || "").toLowerCase();
  const m = (message || "").toLowerCase();
  const combined = `${t} ${m}`;

  const hasDestructive = buttons?.some(
    (b) =>
      b.style === "destructive" ||
      (b.text && /delete|cancel|remove|logout/i.test(b.text))
  );

  // 1. Success / Confirmed / Saved
  if (/success|placed|resumed|saved|scheduled|confirmed|updated|completed/i.test(t)) {
    return {
      icon: "checkmark-circle" as const,
      iconColor: "#0C5A35",
      iconBg: "bg-emerald-50 border border-emerald-150",
    };
  }

  // 2. Destructive action / Cancel / Delete prompt
  if (hasDestructive || /delete|cancel|remove|logout/i.test(t)) {
    return {
      icon: "alert-circle" as const,
      iconColor: "#DC2626",
      iconBg: "bg-red-50 border border-red-150",
    };
  }

  // 3. Error / Failure
  if (/error|failed|failure|denied|wrong/i.test(t)) {
    return {
      icon: "close-circle" as const,
      iconColor: "#DC2626",
      iconBg: "bg-red-50 border border-red-150",
    };
  }

  // 4. Warning / Required / Invalid / Incomplete
  if (/warning|invalid|incomplete|required|empty|select/i.test(t)) {
    return {
      icon: "warning" as const,
      iconColor: "#D97706",
      iconBg: "bg-amber-50 border border-amber-150",
    };
  }

  // 5. Location / Permission / GPS
  if (/location|gps|permission|map/i.test(combined)) {
    return {
      icon: "location" as const,
      iconColor: "#0C5A35",
      iconBg: "bg-[#E8F5EE] border border-[#0C5A35]/20",
    };
  }

  // 6. Default Information / General notice
  return {
    icon: "information-circle" as const,
    iconColor: "#0C5A35",
    iconBg: "bg-[#E8F5EE] border border-[#0C5A35]/20",
  };
}

export function AlertModalProvider() {
  const [config, setConfig] = useState<AlertModalConfig | null>(null);

  useEffect(() => {
    const unregister = registerAlertListener((newConfig) => {
      setConfig(newConfig);
    });
    return unregister;
  }, []);

  if (!config) return null;

  const { title, message, buttons, options } = config;
  const isCancelable = options?.cancelable !== false;
  const effectiveButtons = buttons && buttons.length > 0 ? buttons : [{ text: "OK" }];
  const visuals = getAlertVisuals(title, message, buttons);

  const handleButtonPress = (btn: AlertButton) => {
    setConfig(null);
    if (btn.onPress) {
      setTimeout(() => {
        btn.onPress?.();
      }, 50);
    }
  };

  const handleDismiss = () => {
    if (!isCancelable) return;
    const cancelBtn = buttons?.find((b) => b.style === "cancel");
    setConfig(null);
    if (cancelBtn?.onPress) {
      cancelBtn.onPress();
    } else if (options?.onDismiss) {
      options.onDismiss();
    }
  };

  return (
    <RNModal
      visible={true}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <TouchableWithoutFeedback>
            <View
              className="w-full max-w-[340px] bg-white rounded-3xl p-6 items-center shadow-2xl border border-gray-100"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              {/* Icon Container */}
              <View
                className={`h-14 w-14 rounded-full items-center justify-center mb-4 ${visuals.iconBg}`}
              >
                <Ionicons name={visuals.icon} size={30} color={visuals.iconColor} />
              </View>

              {/* Title */}
              <Text className="text-[17px] font-black text-gray-900 text-center leading-snug">
                {title}
              </Text>

              {/* Message */}
              {message ? (
                <Text className="text-[13px] font-medium text-gray-600 text-center leading-relaxed mt-2 px-1">
                  {message}
                </Text>
              ) : null}

              {/* Action Buttons */}
              {effectiveButtons.length === 1 ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleButtonPress(effectiveButtons[0])}
                  className="w-full py-3.5 rounded-2xl bg-[#0C5A35] items-center justify-center shadow-xs active:opacity-90 mt-5"
                >
                  <Text className="text-[14px] font-black text-white">
                    {effectiveButtons[0].text || "OK"}
                  </Text>
                </TouchableOpacity>
              ) : effectiveButtons.length === 2 ? (
                <View className="flex-row gap-2.5 w-full mt-5">
                  {effectiveButtons.map((btn, idx) => {
                    const isCancel =
                      btn.style === "cancel" ||
                      /cancel|keep|dismiss|no|later/i.test(btn.text || "");
                    const isDestructive =
                      btn.style === "destructive" ||
                      /delete|remove/i.test(btn.text || "");

                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.8}
                        onPress={() => handleButtonPress(btn)}
                        className={`flex-1 py-3 px-3 rounded-xl items-center justify-center ${
                          isCancel
                            ? "bg-gray-100 border border-gray-200 active:bg-gray-200"
                            : isDestructive
                            ? "bg-red-600 active:bg-red-700 shadow-2xs"
                            : "bg-[#0C5A35] active:bg-[#0A3925] shadow-2xs"
                        }`}
                      >
                        <Text
                          className={`text-[13px] font-black text-center ${
                            isCancel ? "text-gray-700" : "text-white"
                          }`}
                          numberOfLines={1}
                        >
                          {btn.text || "OK"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View className="w-full gap-2 mt-5">
                  {effectiveButtons.map((btn, idx) => {
                    const isCancel =
                      btn.style === "cancel" ||
                      /cancel|dismiss|no|later/i.test(btn.text || "");
                    const isDestructive =
                      btn.style === "destructive" ||
                      /delete|remove/i.test(btn.text || "");

                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.8}
                        onPress={() => handleButtonPress(btn)}
                        className={`w-full py-3 px-4 rounded-xl items-center justify-center ${
                          isCancel
                            ? "bg-gray-100 border border-gray-200"
                            : isDestructive
                            ? "bg-red-600"
                            : "bg-[#0C5A35]"
                        }`}
                      >
                        <Text
                          className={`text-[13px] font-black ${
                            isCancel ? "text-gray-700" : "text-white"
                          }`}
                        >
                          {btn.text || "OK"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

