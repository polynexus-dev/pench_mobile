import React from "react";

import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "@store/authStore";

import { useLogout } from "@features/auth/hooks/useLogout";

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function MenuItem({
  icon,
  label,
  value,
  onPress,
  danger,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className={`mb-4 flex-row items-center rounded-[24px] px-5 py-5 ${danger
          ? "bg-red-50"
          : "bg-white"
        }`}
      style={{
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {
          width: 0,
          height: 4,
        },
      }}
    >
      {/* Icon */}
      <View
        className={`h-14 w-14 items-center justify-center rounded-2xl ${danger
            ? "bg-red-100"
            : "bg-green-100"
          }`}
      >
        <Ionicons
          name={icon}
          size={24}
          color={
            danger
              ? "#DC2626"
              : "#166534"
          }
        />
      </View>

      {/* Content */}
      <View className="ml-4 flex-1">

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          maxFontSizeMultiplier={1.3}
          className={`text-base font-bold ${danger
              ? "text-red-600"
              : "text-gray-900"
            }`}
        >
          {label}
        </Text>

        {!!value && (
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
            className="mt-1 text-sm text-gray-500"
          >
            {value}
          </Text>
        )}
      </View>

      {!danger && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#9CA3AF"
        />
      )}
    </TouchableOpacity>
  );
}

export function CustomerProfileScreen() {
  const { user } = useAuthStore();

  const { logout } = useLogout();

  function handleLogout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: logout,
        },
      ],
    );
  }

  const initials = user?.username
    ? user.username
      .slice(0, 2)
      .toUpperCase()
    : "CU";

  const dashboard =
    user?.customer_dashboard;

  return (
    <SafeAreaView className="flex-1 bg-[#F4F7F5]">

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
        }}
      >
        {/* Hero Section */}
        <View
          className="px-5 pb-12 pt-8"
          style={{
            backgroundColor: "#1B5E37",
          }}
        >
          {/* Top Row */}
          <View className="flex-row items-center">

            {/* Avatar */}
            <View
              className="h-24 w-24 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  "rgba(255,255,255,0.18)",
              }}
            >
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                numberOfLines={1}
                className="text-3xl font-bold text-white"
              >
                {initials}
              </Text>
            </View>

            {/* User Info */}
            <View className="ml-5 flex-1">

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                maxFontSizeMultiplier={1.3}
                className="text-3xl font-bold text-white"
              >
                {user?.username ?? "Customer"}
              </Text>

              <Text className="mt-2 text-base text-white/80">
                Premium Customer
              </Text>

              <View className="mt-3 flex-row items-center">

                <Ionicons
                  name="water-outline"
                  size={16}
                  color="rgba(255,255,255,0.85)"
                />

                <Text className="ml-2 text-sm text-white/80">
                  Daily Fresh Dairy Delivery
                </Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View
            className="mt-8 flex-row justify-between rounded-[28px] p-5"
            style={{
              backgroundColor:
                "rgba(255,255,255,0.12)",
            }}
          >
            <ProfileStat
              label="Subscriptions"
              value={String(
                dashboard?.active_subscriptions ?? 0,
              )}
            />

            <ProfileStat
              label="Orders"
              value={String(
                dashboard?.total_orders ?? 0,
              )}
            />

            <ProfileStat
              label="Balance"
              value={`₹${dashboard?.pending_balance ?? 0
                }`}
            />
          </View>
        </View>

        {/* Floating Content */}
        <View className="-mt-7 rounded-t-[36px] bg-[#F4F7F5] px-5 pt-6">

          {/* Contact Info */}
          <SectionTitle
            title="Contact Information"
          />

          <MenuItem
            icon="call-outline"
            label="Phone"
            value={
              user?.phone ?? "—"
            }
          />

          <MenuItem
            icon="mail-outline"
            label="Email"
            value={
              user?.email ?? "—"
            }
          />

          {/* Account */}
          <SectionTitle
            title="Account"
          />

          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => { }}
          />

          <MenuItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => { }}
          />

          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => { }}
          />

          {/* Subscription */}
          <SectionTitle
            title="Subscriptions"
          />

          <MenuItem
            icon="refresh-outline"
            label="My Subscriptions"
            onPress={() => { }}
          />

          <MenuItem
            icon="add-circle-outline"
            label="New Subscription"
            onPress={() => { }}
          />

          <MenuItem
            icon="calendar-outline"
            label="Delivery Schedule"
            onPress={() => { }}
          />

          <MenuItem
            icon="receipt-outline"
            label="Invoices & Billing"
            onPress={() => { }}
          />

          {/* Orders */}
          <SectionTitle
            title="Orders"
          />

          <MenuItem
            icon="cart-outline"
            label="Order History"
            onPress={() => { }}
          />

          <MenuItem
            icon="cube-outline"
            label="Special Orders"
            onPress={() => { }}
          />

          {/* App */}
          <SectionTitle title="App" />

          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => { }}
          />

          <MenuItem
            icon="information-circle-outline"
            label="About Pench Foods"
            onPress={() => { }}
          />

          <MenuItem
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => { }}
          />

          {/* Logout */}
          <View className="mt-3">
            <MenuItem
              icon="log-out-outline"
              label="Logout"
              onPress={handleLogout}
              danger
            />
          </View>

          {/* Footer */}
          <Text className="pb-10 pt-4 text-center text-xs text-gray-400">
            © 2026 Pench Foods
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SectionTitleProps {
  title: string;
}

function SectionTitle({
  title,
}: SectionTitleProps) {
  return (
    <Text className="mb-4 mt-7 ml-1 text-xs font-bold uppercase tracking-[2px] text-gray-400">
      {title}
    </Text>
  );
}

interface ProfileStatProps {
  label: string;
  value: string;
}

function ProfileStat({
  label,
  value,
}: ProfileStatProps) {
  return (
    <View className="items-center">

      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        numberOfLines={1}
        className="text-3xl font-bold text-white"
      >
        {value}
      </Text>

      <Text className="mt-1 text-xs text-white/70">
        {label}
      </Text>
    </View>
  );
}