import { Text } from "@/shared/ui/Text/Text";
import { Ionicons } from "@expo/vector-icons";
import { useLogout } from "@features/auth/hooks/useLogout";
import { useAuthStore } from "@store/authStore";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Alert,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface ActionItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  helper?: string;
  onPress?: () => void;
  danger?: boolean;
}

function ProfileActionItem({
  icon,
  label,
  value,
  helper,
  onPress,
  danger,
}: ActionItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-4 bg-white"
    >
      <View className="flex-row flex-1 items-center mr-4">
        <Ionicons
          name={icon}
          size={22}
          color={danger ? "#DC2626" : "#4A4A4A"}
        />
        <View className="ml-4 flex-1">
          <Text
            className={`text-[15px] font-semibold ${danger ? "text-red-600 font-bold" : "text-text-primary"
              }`}
          >
            {label}
          </Text>
          {helper ? (
            <Text className="mt-0.5 text-xs text-text-muted">
              {helper}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center">
        {value ? (
          <Text className="text-[14px] text-text-secondary mr-2 font-medium">
            {value}
          </Text>
        ) : null}
        {!danger && (
          <Ionicons name="chevron-forward" size={16} color="#BDBDBD" />
        )}
      </View>
    </TouchableOpacity>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View className="mb-2 mt-6 px-1">
      <Text className="text-[17px] font-bold text-text-primary">
        {title}
      </Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="flex-1 items-center justify-center rounded-2xl bg-white py-4 border border-neutral-100/60 shadow-xs">
      <View className="mb-2 h-12 w-12 items-center justify-center rounded-xl bg-neutral-50 border border-neutral-100">
        <Ionicons name={icon} size={24} color="#1B5E37" />
      </View>
      <Text className="text-[13px] font-medium text-text-secondary text-center">
        {label}
      </Text>
      <Text className="mt-0.5 text-[15px] font-bold text-text-primary text-center">
        {value}
      </Text>
    </View>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <View className="overflow-hidden rounded-2xl bg-white border border-neutral-100 shadow-xs">
      {children}
    </View>
  );
}

const renderGradientBackground = () => {
  const steps = 80;
  const startColor = [27, 94, 55]; // #1B5E37 (Pench Brand Green)
  const endColor = [244, 246, 251];   // #F4F6FB (Screen background color)
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 380 }}>
      {Array.from({ length: steps }).map((_, i) => {
        const ratio = i / (steps - 1);
        const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio);
        const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio);
        const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio);
        return (
          <View
            key={i}
            style={{
              height: 380 / steps,
              backgroundColor: `rgb(${r}, ${g}, ${b})`,
              width: "100%",
            }}
          />
        );
      })}
    </View>
  );
};

export function DriverProfileScreen() {
  const { user } = useAuthStore();
  const { logout } = useLogout();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  }

  const cityDisplay = user?.tenant_schema
    ? user.tenant_schema.charAt(0).toUpperCase() + user.tenant_schema.slice(1)
    : "Nagpur";

  const [scrollY, setScrollY] = React.useState(0);
  const headerOpacity = Math.min(1, Math.max(0, (scrollY - 40) / 80));

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} className="flex-1 bg-[#1B5E37]">
        {/* Sticky/Floating Header that fades in on scroll */}
        <View
          style={{
            position: "absolute",
            top: 30,
            left: 0,
            right: 0,
            height: 70,
            backgroundColor: "#1B5E37",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            zIndex: 20,
            opacity: headerOpacity,
          }}
          pointerEvents={headerOpacity > 0.1 ? "auto" : "none"}
        >
          {/* Back button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => (router.canGoBack() ? router.back() : null)}
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs border border-neutral-100"
          >
            <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
          </TouchableOpacity>

          {/* Title */}
          <View className="pb-2" style={{ position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: -1 }}>
            <Text className="text-lg font-bold text-white">
              Profile
            </Text>
          </View>

          {/* Balanced spacer */}
          <View className="w-10" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 70 }}
          className="bg-[#F4F6FB]"
          scrollEventThrottle={16}
          onScroll={(event) => {
            setScrollY(event.nativeEvent.contentOffset.y);
          }}
        >
          {/* Yellow-to-Grey Gradient Background */}
          {renderGradientBackground()}

          {/* Header Section */}
          <View className="px-4 pt-10 relative">
            {/* Back Button overlay */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => (router.canGoBack() ? router.back() : null)}
              className="absolute left-4 top-6 z-10 h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs border border-neutral-100"
            >
              <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
            </TouchableOpacity>

            {/* Profile Avatar & Name */}
            <View className="items-center mt-2">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-white border border-neutral-100 shadow-md">
                <Ionicons name="person" size={48} color="#4A4A4A" />
              </View>
              <Text className="mt-4 text-[22px] font-bold text-text-primary text-center">
                {user?.username ?? "Your account"}
              </Text>
              <Text className="mt-1 text-sm font-medium text-text-muted text-center">
                {user?.phone ?? "8010276379"}
              </Text>
            </View>

            {/* Active Shift/Hub Info Banner */}
            <TouchableOpacity
              activeOpacity={0.9}
              className="mt-4 p-4 rounded-2xl bg-[#FFF9E6] border border-[#FBE8C5] flex-row items-center justify-between shadow-xs overflow-hidden"
            >
              <View className="flex-1 pr-4">
                <Text className="text-[15px] font-bold text-text-primary">
                  Active Delivery Driver
                </Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-[13px] font-bold text-brand-primary">
                    LIVE · {cityDisplay} Hub
                  </Text>
                  <Ionicons name="chevron-forward" size={12} color="#1B5E37" className="ml-1" />
                </View>
              </View>

              {/* Bike Icon container */}
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/60">
                <Ionicons name="bicycle-outline" size={28} color="#1B5E37" />
              </View>
            </TouchableOpacity>

            {/* Metric Action Cards */}
            <View className="mt-4 flex-row gap-3">
              <MetricCard label="Today" value="38" icon="checkmark-done-outline" />
              <MetricCard label="Stops Left" value="24" icon="location-outline" />
              <MetricCard label="Cash" value="₹1,240" icon="cash-outline" />
            </View>
          </View>

          {/* Main Content Area */}
          <View className="px-4 mt-1">
            <SectionTitle title="Contact Information" />
            <CardShell>
              <ProfileActionItem
                icon="call-outline"
                label="Phone"
                value={user?.phone ?? "—"}
              // helper="Primary contact number"
              />
              <View className="h-px bg-neutral-100/80 ml-14" />
              <ProfileActionItem
                icon="mail-outline"
                label="Email"
                value={user?.email ?? "—"}
              // helper="Login and notifications"
              />
              <View className="h-px bg-neutral-100/80 ml-14" />
              <ProfileActionItem
                icon="location-outline"
                label="City"
                value={cityDisplay}
              // helper="Current operational hub"
              />
            </CardShell>

            <SectionTitle title="Shift Information" />
            <CardShell>
              <ProfileActionItem
                icon="time-outline"
                label="Shift Timing"
                value="06:00 AM - 02:00 PM"
                helper="Today’s active schedule"
              />
              <View className="h-px bg-neutral-100/80 ml-14" />
              <ProfileActionItem
                icon="map-outline"
                label="Assigned Route"
                value="Nagpur Express Delivery"
                helper="Current route allocation"
              />
              <View className="h-px bg-neutral-100/80 ml-14" />
              <ProfileActionItem
                icon="car-outline"
                label="Vehicle"
                value="MH 31 AB 1234"
                helper="Assigned delivery vehicle"
              />
            </CardShell>

            <SectionTitle title="App Settings" />
            <CardShell>
              <ProfileActionItem
                icon="notifications-outline"
                label="Notifications"
                helper="Manage route and delivery alerts"
              />
              <View className="h-px bg-neutral-100/80 ml-14" />
              <ProfileActionItem
                icon="shield-checkmark-outline"
                label="Privacy Policy"
                helper="View app privacy details"
              />
              <View className="h-px bg-neutral-100/80 ml-14" />
              <ProfileActionItem
                icon="help-circle-outline"
                label="Support"
                helper="Get help from operations team"
              />
            </CardShell>

            <SectionTitle title="Account" />
            <CardShell>
              <ProfileActionItem
                icon="person-outline"
                label="Edit Profile"
                helper="Update your personal details"
              />
              <View className="h-px bg-neutral-100/80 ml-14" />
              <ProfileActionItem
                icon="lock-closed-outline"
                label="Change Password"
                helper="Update account security"
              />
            </CardShell>

            <SectionTitle title="Logout" />
            <CardShell>
              <ProfileActionItem
                icon="log-out-outline"
                label="Logout"
                helper="Sign out from this device"
                onPress={handleLogout}
                danger
              />
            </CardShell>

            <Text className="pb-5 pt-6 text-center text-xs text-text-muted">
              © 2026 Pench Foods
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}