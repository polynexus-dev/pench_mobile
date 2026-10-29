import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Linking,
  BackHandler,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VersionCheckResult } from "../services/versionService";

interface Props {
  checkResult: VersionCheckResult | null;
  onDismissOptional?: () => void;
}

export function ForceUpdateModal({ checkResult, onDismissOptional }: Props) {
  const isVisible = !!(checkResult && checkResult.needsUpdate);
  const isMandatory = checkResult?.isMandatory ?? true;

  // Intercept and block Android hardware back button when mandatory update is active
  useEffect(() => {
    if (!isVisible || !isMandatory) return;

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Return true to prevent default back action
        return true;
      }
    );

    return () => backHandler.remove();
  }, [isVisible, isMandatory]);

  if (!isVisible || !checkResult) return null;

  const handleUpdatePress = async () => {
    try {
      const url = checkResult.storeUrl;
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web Play Store if market:// cannot be opened (e.g. emulator without store)
        const fallbackUrl =
          Platform.OS === "android"
            ? "https://play.google.com/store/apps/details?id=in.polynexus.penchfoods"
            : "https://apps.apple.com/";
        await Linking.openURL(fallbackUrl);
      }
    } catch (err: any) {
      Alert.alert(
        "Could Not Open Store",
        "Please visit the Google Play Store or App Store manually and search for 'Pench' to update."
      );
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Do nothing on Android back press if mandatory
        if (!isMandatory && onDismissOptional) {
          onDismissOptional();
        }
      }}
    >
      <View className="flex-1 bg-black/75 items-center justify-center px-6">
        <View className="w-full max-w-sm bg-white rounded-3xl p-6 items-center shadow-2xl border border-gray-100">
          {/* Top Badge Icon */}
          <View className="h-16 w-16 rounded-full bg-[#EBF5EE] items-center justify-center mb-4 border border-[#0C5A35]/15">
            <Ionicons name="rocket-outline" size={32} color="#0C5A35" />
          </View>

          {/* Title */}
          <Text className="text-[20px] font-black text-gray-900 text-center mb-2">
            {checkResult.title}
          </Text>

          {/* Version pill */}
          <View className="flex-row items-center bg-gray-50 border border-gray-200/80 px-3 py-1 rounded-full mb-3 gap-2">
            <Text className="text-[11px] font-bold text-gray-500">
              v{checkResult.currentVersion}
            </Text>
            <Ionicons name="arrow-forward" size={12} color="#9CA3AF" />
            <Text className="text-[11px] font-black text-[#0C5A35]">
              v{checkResult.targetVersion}
            </Text>
          </View>

          {/* Description */}
          <Text className="text-[13px] leading-5 text-gray-600 text-center mb-6">
            {checkResult.message}
          </Text>

          {/* Update Action Button */}
          <TouchableOpacity
            onPress={handleUpdatePress}
            activeOpacity={0.88}
            className="w-full bg-[#0C5A35] py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-md active:opacity-95"
            style={{
              shadowColor: "#0C5A35",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Ionicons
              name={Platform.OS === "android" ? "logo-google-playstore" : "logo-apple"}
              size={18}
              color="#FFFFFF"
            />
            <Text className="text-[14px] font-black text-white uppercase tracking-wider">
              Update Now
            </Text>
          </TouchableOpacity>

          {/* Optional skip if not mandatory */}
          {!isMandatory && onDismissOptional && (
            <TouchableOpacity
              onPress={onDismissOptional}
              activeOpacity={0.7}
              className="mt-3.5 py-2 px-4"
            >
              <Text className="text-[12px] font-bold text-gray-400">
                Remind Me Later
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
