import React from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@store/authStore";
import { useLogout } from "@features/auth/hooks/useLogout";
// import { StatusBar } from "expo-status-bar";

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
      activeOpacity={0.85}
      onPress={onPress}
      className="flex-row items-center px-4 py-4"
    >
      <View
        className={`h-11 w-11 items-center justify-center rounded-2xl ${danger ? "bg-red-100" : "bg-brand-light"
          }`}
      >
        <Ionicons
          name={icon}
          size={22}
          color={danger ? "#DC2626" : "#1B5E37"}
        />
      </View>

      <View className="ml-4 flex-1">
        <Text
          numberOfLines={1}
          className={`text-[15px] font-semibold ${danger ? "text-red-600" : "text-text-primary"
            }`}
        >
          {label}
        </Text>

        {helper ? (
          <Text numberOfLines={2} className="mt-0.5 text-sm text-text-secondary">
            {helper}
          </Text>
        ) : null}

        {value ? (
          <Text numberOfLines={1} className="mt-1 text-sm text-text-muted">
            {value}
          </Text>
        ) : null}
      </View>

      {!danger && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View className="mb-3 mt-6">
      <Text className="ml-1 text-xs font-bold uppercase tracking-[2px] text-text-muted">
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
    <View className="flex-1 rounded-card bg-white p-4 border border-border-disable">
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-brand-light">
        <Ionicons name={icon} size={20} color="#1B5E37" />
      </View>
      <Text className="text-2xl font-bold text-text-primary">{value}</Text>
      <Text className="mt-1 text-caption text-text-muted">{label}</Text>
    </View>
  );
}

function StatChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="rounded-badge bg-white/15 px-3 py-2">
      <Text className="text-[11px] uppercase tracking-[1.4px] text-white/75">
        {label}
      </Text>
      <Text className="mt-0.5 text-[15px] font-bold text-white">{value}</Text>
    </View>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <View className="overflow-hidden rounded-card bg-white border border-gray-300 shadow-card">
      {children}
    </View>
  );
}

export function DriverProfileScreen() {
  const { user } = useAuthStore();
  const { logout } = useLogout();

  function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  }

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "DR";

  const cityDisplay = user?.tenant_schema
    ? user.tenant_schema.charAt(0).toUpperCase() + user.tenant_schema.slice(1)
    : "Nagpur";

  return (
    <SafeAreaView className="flex-1 bg-bg-screen">
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
      >
        {/* Header */}
        <View className="bg-brand-primary px-4 pt-5 pb-6">
          <View className="flex-row items-start justify-between">
            <View className="flex-row flex-1 items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-white/15 border border-white/15">
                <Text className="text-2xl font-bold text-white">{initials}</Text>
              </View>

              <View className="ml-4 flex-1 pr-3">
                <Text numberOfLines={1} className="text-xl font-bold text-white">
                  {user?.username ?? "Driver"}
                </Text>
                <Text className="mt-1 text-sm text-white/80">
                  Delivery Driver · {cityDisplay} Hub
                </Text>

                <View className="mt-3 flex-row flex-wrap gap-2">
                  <StatChip label="Status" value="Active Shift" />
                  <StatChip label="Role" value="Driver" />
                </View>
              </View>
            </View>

            <View className="items-end">
              <View className="rounded-badge bg-white px-3 py-1.5">
                <Text className="text-caption font-bold text-brand-primary">
                  LIVE
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-5 flex-row gap-3">
            <MetricCard label="Today" value="38" icon="checkmark-done-outline" />
            <MetricCard label="Stops Left" value="24" icon="location-outline" />
            <MetricCard label="Cash" value="₹1,240" icon="cash-outline" />
          </View>
        </View>

        {/* Main Content */}
        <View className="px-4">
          <SectionTitle title="Contact Information" />
          <CardShell>
            <ProfileActionItem
              icon="call-outline"
              label="Phone"
              value={user?.phone ?? "—"}
              helper="Primary contact number"
            />
            <View className="h-px bg-border-disable ml-16" />
            <ProfileActionItem
              icon="mail-outline"
              label="Email"
              value={user?.email ?? "—"}
              helper="Login and notifications"
            />
            <View className="h-px bg-border-disable ml-16" />
            <ProfileActionItem
              icon="location-outline"
              label="City"
              value={cityDisplay}
              helper="Current operational hub"
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
            <View className="h-px bg-border-r ml-16" />
            <ProfileActionItem
              icon="map-outline"
              label="Assigned Route"
              value="Nagpur Express Delivery"
              helper="Current route allocation"
            />
            <View className="h-px bg-border-disable ml-16" />
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
            <View className="h-px bg-border-disable ml-16" />
            <ProfileActionItem
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              helper="View app privacy details"
            />
            <View className="h-px bg-border-disable ml-16" />
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
            <View className="h-px bg-border-disable ml-16" />
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

          <Text className="pb-5 pt-4 text-center text-xs text-text-muted">
            © 2026 Pench Foods
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}