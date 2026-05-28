import React from "react";
import {
  Alert,
  ScrollView,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAuthStore } from "@store/authStore";
import { useLogout } from "@features/auth/hooks/useLogout";
import { Input, Button } from "@/shared/ui";
import { Text } from "@/shared/ui/Text/Text";
import { httpClient } from "@/services/api/httpClient";
import { buildUrl } from "@/services/api/buildUrl";
import { useToast } from "@/hooks/useToast";

interface MenuItemProps {
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
}: MenuItemProps) {
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
            className={`text-[15px] font-semibold ${
              danger ? "text-red-600 font-bold" : "text-text-primary"
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

      <View className="flex-row items-center flex-shrink max-w-[50%]">
        {value ? (
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="text-[14px] text-text-secondary mr-2 font-medium flex-shrink"
          >
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

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <View className="overflow-hidden rounded-2xl bg-white border border-neutral-100 shadow-xs">
      {children}
    </View>
  );
}

function ProfileStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="items-center">
      <Text className="text-2xl font-bold text-white">
        {value}
      </Text>
      <Text className="mt-1 text-xs text-white/70">
        {label}
      </Text>
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

export function CustomerProfileScreen() {
  const { user } = useAuthStore();
  const setUser = useAuthStore((s) => s.setUser);
  const domain_name = useAuthStore((s) => s.domain_name) || "";
  const { logout } = useLogout();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { show } = useToast();

  const [activeView, setActiveView] = React.useState<'view' | 'edit_profile' | 'change_password'>('view');
  
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);

  const [scrollY, setScrollY] = React.useState(0);
  const headerOpacity = Math.min(1, Math.max(0, (scrollY - 40) / 80));

  const openEditProfile = () => {
    setFirstName(user?.first_name ?? "");
    setLastName(user?.last_name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setActiveView("edit_profile");
  };

  const openChangePassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setActiveView("change_password");
  };

  const handleSaveProfile = async () => {
    if (!domain_name) {
      show({ message: "No active session domain configured.", type: "error" });
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      show({ message: "First name and last name cannot be empty.", type: "error" });
      return;
    }
    setIsSavingProfile(true);
    try {
      const url = buildUrl(domain_name, "/api/accounts/me/");
      const response = await httpClient.patch(url, {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
      });
      setUser(response as any);
      show({ message: "Profile updated successfully.", type: "success" });
      setActiveView("view");
    } catch (error: any) {
      show({
        message: error?.message || "Failed to update profile.",
        type: "error",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (!domain_name) {
      show({ message: "No active session domain configured.", type: "error" });
      return;
    }
    if (user?.has_password && !currentPassword) {
      show({ message: "Current password is required.", type: "error" });
      return;
    }
    if (newPassword.length < 8) {
      show({ message: "New password must be at least 8 characters long.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      show({ message: "Passwords do not match.", type: "error" });
      return;
    }
    setIsSavingPassword(true);
    try {
      const url = buildUrl(domain_name, "/api/accounts/set-password/");
      const response: any = await httpClient.post(url, {
        current_password: currentPassword,
        password: newPassword,
      });
      if (response?.user) {
        setUser(response.user);
      }
      show({ message: "Password changed successfully.", type: "success" });
      setActiveView("view");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      show({
        message: error?.message || "Failed to change password.",
        type: "error",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  function handleLogout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout },
      ]
    );
  }

  const handleBackPress = () => {
    if (activeView !== "view") {
      setActiveView("view");
    } else {
      if (router.canGoBack()) {
        router.back();
      }
    }
  };

  const userFirstName = user?.first_name?.trim();
  const userLastName = user?.last_name?.trim();
  const fullName = userFirstName || userLastName 
    ? `${userFirstName || ""} ${userLastName || ""}`.trim() 
    : user?.username ?? "Customer";

  const initials = userFirstName && userLastName 
    ? `${userFirstName[0]}${userLastName[0]}`.toUpperCase() 
    : user?.username ? user.username.slice(0, 2).toUpperCase() : "CU";

  const dashboard = user?.customer_dashboard;

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} className="flex-1 bg-[#1B5E37]">
        {/* Sticky/Floating Header that fades in on scroll */}
        <View
          style={{
            position: "absolute",
            top: insets.top,
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
            onPress={handleBackPress}
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs border border-neutral-100"
          >
            <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
          </TouchableOpacity>

          {/* Title */}
          <View className="pb-2" style={{ position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: -1 }}>
            <Text className="text-lg font-bold text-white">
              {activeView === "view" ? "Profile" : activeView === "edit_profile" ? "Edit Profile" : "Change Password"}
            </Text>
          </View>

          {/* Balanced spacer */}
          <View className="w-10" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          className="bg-[#F4F6FB]"
          scrollEventThrottle={16}
          onScroll={(event) => {
            setScrollY(event.nativeEvent.contentOffset.y);
          }}
        >
          {/* Gradient Background */}
          {renderGradientBackground()}

          {/* Header Section */}
          <View className="px-4 pt-10 relative">
            {/* Back Button overlay */}
            {router.canGoBack() || activeView !== "view" ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleBackPress}
                className="absolute left-4 top-6 z-10 h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs border border-neutral-100"
              >
                <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
              </TouchableOpacity>
            ) : null}

            {activeView === "view" ? (
              <>
                {/* Profile Avatar & Name */}
                <View className="items-center mt-2">
                  <View className="h-20 w-20 items-center justify-center rounded-full bg-white border border-neutral-100 shadow-md">
                    <Text className="text-2xl font-bold text-brand-primary">
                      {initials}
                    </Text>
                  </View>
                  <Text className="mt-4 text-[22px] font-bold text-text-primary text-center">
                    {fullName}
                  </Text>
                  <Text className="mt-1 text-sm font-medium text-text-muted text-center">
                    Premium Customer
                  </Text>
                </View>

                {/* Subscriptions Stats Panel */}
                <View
                  className="mt-6 flex-row justify-between rounded-[28px] p-5"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.12)",
                  }}
                >
                  <ProfileStat
                    label="Subscriptions"
                    value={String(dashboard?.active_subscriptions ?? 0)}
                  />
                  <ProfileStat
                    label="Orders"
                    value={String(dashboard?.total_orders ?? 0)}
                  />
                  <ProfileStat
                    label="Balance"
                    value={`₹${dashboard?.pending_balance ?? 0}`}
                  />
                </View>
              </>
            ) : (
              <View className="items-center mt-2 pb-4">
                <Text className="mt-4 text-[22px] font-bold text-text-primary text-center">
                  {activeView === "edit_profile" ? "Edit Profile" : "Change Password"}
                </Text>
                <Text className="mt-1 text-sm font-medium text-text-muted text-center">
                  {activeView === "edit_profile" ? "Update your personal details" : "Update account security"}
                </Text>
              </View>
            )}
          </View>

          {/* Main Content Area */}
          <View className="px-4 mt-4">
            {activeView === "view" && (
              <>
                <SectionTitle title="Contact Information" />
                <CardShell>
                  <ProfileActionItem
                    icon="call-outline"
                    label="Phone"
                    value={user?.phone ?? "—"}
                  />
                  <View className="h-px bg-neutral-100/80 ml-14" />
                  <ProfileActionItem
                    icon="mail-outline"
                    label="Email"
                    value={user?.email ?? "—"}
                  />
                </CardShell>

                <SectionTitle title="Account Settings" />
                <CardShell>
                  <ProfileActionItem
                    icon="person-outline"
                    label="Edit Profile"
                    helper="Update your personal details"
                    onPress={openEditProfile}
                  />
                  <View className="h-px bg-neutral-100/80 ml-14" />
                  <ProfileActionItem
                    icon="lock-closed-outline"
                    label="Change Password"
                    helper="Update account security"
                    onPress={openChangePassword}
                  />
                  <View className="h-px bg-neutral-100/80 ml-14" />
                  <ProfileActionItem
                    icon="notifications-outline"
                    label="Notifications"
                    helper="Manage delivery and route alerts"
                    onPress={() => Alert.alert("Notifications", "Notification settings coming soon.")}
                  />
                </CardShell>

                <SectionTitle title="Subscriptions" />
                <CardShell>
                  <ProfileActionItem
                    icon="refresh-outline"
                    label="My Subscriptions"
                    helper="View active daily plans"
                    onPress={() => router.push("/(customer)/(tabs)/subscriptions")}
                  />
                  <View className="h-px bg-neutral-100/80 ml-14" />
                  <ProfileActionItem
                    icon="calendar-outline"
                    label="Delivery Calendar"
                    helper="Pause or skip deliveries"
                    onPress={() => router.push("/(customer)/(tabs)/subscriptions")}
                  />
                  <View className="h-px bg-neutral-100/80 ml-14" />
                  <ProfileActionItem
                    icon="add-circle-outline"
                    label="New Subscription"
                    helper="Subscribe to new fresh items"
                    onPress={() => Alert.alert("New Subscription", "Please contact support to start a new subscription.")}
                  />
                  <View className="h-px bg-neutral-100/80 ml-14" />
                  <ProfileActionItem
                    icon="receipt-outline"
                    label="Invoices & Billing"
                    helper="Check recent statement charges"
                    onPress={() => Alert.alert("Invoices", "Invoices billing details coming soon.")}
                  />
                </CardShell>

                <SectionTitle title="Orders" />
                <CardShell>
                  <ProfileActionItem
                    icon="cart-outline"
                    label="Order History"
                    helper="View past deliveries and status"
                    onPress={() => router.push("/(customer)/(tabs)/orders")}
                  />
                  <View className="h-px bg-neutral-100/80 ml-14" />
                  <ProfileActionItem
                    icon="cube-outline"
                    label="Special Orders"
                    helper="One-time bulk order requests"
                    onPress={() => Alert.alert("Special Orders", "Special order features coming soon.")}
                  />
                </CardShell>

                <SectionTitle title="Support & Info" />
                <CardShell>
                  <ProfileActionItem
                    icon="help-circle-outline"
                    label="Help & Support"
                    helper="Talk to customer support"
                    onPress={() => Alert.alert("Support", "Support helpline: support@penchfoods.in")}
                  />
                  <View className="h-px bg-neutral-100/80 ml-14" />
                  <ProfileActionItem
                    icon="information-circle-outline"
                    label="About Pench Foods"
                    helper="Learn more about our fresh farm model"
                    onPress={() => Alert.alert("About Us", "Pench Foods: Pure, fresh milk delivered straight to your doorstep.")}
                  />
                  <View className="h-px bg-neutral-100/80 ml-14" />
                  <ProfileActionItem
                    icon="shield-checkmark-outline"
                    label="Privacy Policy"
                    helper="View user data privacy terms"
                    onPress={() => Alert.alert("Privacy Policy", "For full terms, please visit penchfoods.in/privacy")}
                  />
                </CardShell>

                <SectionTitle title="Session" />
                <CardShell>
                  <ProfileActionItem
                    icon="log-out-outline"
                    label="Logout"
                    helper="Sign out from this device"
                    onPress={handleLogout}
                    danger
                  />
                </CardShell>
              </>
            )}

            {activeView === "edit_profile" && (
              <View className="mt-4 gap-y-4">
                <CardShell>
                  <View className="p-4 gap-y-4">
                    <Input
                      label="First Name"
                      placeholder="Enter first name"
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                    <Input
                      label="Last Name"
                      placeholder="Enter last name"
                      value={lastName}
                      onChangeText={setLastName}
                    />
                    <Input
                      label="Email"
                      placeholder="Enter email address"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <Input
                      label="Phone Number"
                      placeholder="Enter phone number"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </CardShell>

                <View className="flex-row gap-x-3 mt-4 pb-10">
                  <Button
                    intent="outline"
                    label="Cancel"
                    onPress={() => setActiveView("view")}
                    className="flex-1"
                    disabled={isSavingProfile}
                  />
                  <Button
                    intent="primary"
                    label="Save"
                    onPress={handleSaveProfile}
                    className="flex-1 bg-[#1B5E37]"
                    loading={isSavingProfile}
                  />
                </View>
              </View>
            )}

            {activeView === "change_password" && (
              <View className="mt-4 gap-y-4">
                <CardShell>
                  <View className="p-4 gap-y-4">
                    {user?.has_password && (
                      <Input
                        label="Current Password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        isPassword
                        autoCapitalize="none"
                      />
                    )}
                    <Input
                      label="New Password"
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      isPassword
                      autoCapitalize="none"
                    />
                    <Input
                      label="Confirm Password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      isPassword
                      autoCapitalize="none"
                    />
                  </View>
                </CardShell>

                <View className="flex-row gap-x-3 mt-4 pb-10">
                  <Button
                    intent="outline"
                    label="Cancel"
                    onPress={() => setActiveView("view")}
                    className="flex-1"
                    disabled={isSavingPassword}
                  />
                  <Button
                    intent="primary"
                    label="Save"
                    onPress={handleSavePassword}
                    className="flex-1 bg-[#1B5E37]"
                    loading={isSavingPassword}
                  />
                </View>
              </View>
            )}

            <Text className="pb-5 pt-6 text-center text-xs text-text-muted">
              © 2026 Pench Foods
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}