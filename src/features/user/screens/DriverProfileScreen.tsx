import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToast } from "@/hooks/useToast";
import { buildUrl } from "@/services/api/buildUrl";
import { httpClient } from "@/services/api/httpClient";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Button, Input } from "@/shared/ui";
import { Text } from "@/shared/ui/Text/Text";
import { useLogout } from "@features/auth/hooks/useLogout";
import { useAuthStore } from "@store/authStore";

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function ProfileActionItem({
  icon,
  label,
  value,
  onPress,
  danger,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-4 bg-white"
    >
      <View className="flex-row items-center flex-1 mr-4">
        <Ionicons
          name={icon}
          size={20}
          color={danger ? "#E53E3E" : "#4A4A4A"}
        />
        <Text
          className={`ml-3.5 text-[15px] font-semibold ${danger ? "text-[#E53E3E]" : "text-[#1A1A1A]"
            }`}
        >
          {label}
        </Text>
      </View>

      <View className="flex-row items-center">
        {value ? (
          <Text className="text-[14px] text-[#757575] mr-2 font-medium">
            {value}
          </Text>
        ) : null}
        {!danger && onPress && (
          <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
        )}
      </View>
    </TouchableOpacity>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View className="mt-5 mb-2.5 px-1">
      <Text className="text-[14px] font-bold text-[#4A4A4A]">
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
    <View className="flex-1 bg-white rounded-[20px] py-4 items-center justify-center border border-[#F0F2F5] shadow-xs">
      <Ionicons name={icon} size={22} color="#0A3925" className="mb-1" />
      <Text className="text-[12px] font-semibold text-[#757575] text-center">
        {label}
      </Text>
      <Text className="text-[15px] font-bold text-[#1A1A1A] text-center mt-0.5">
        {value}
      </Text>
    </View>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <View className="overflow-hidden rounded-2xl bg-white border border-[#F0F2F5] shadow-xs">
      {children}
    </View>
  );
}

export function DriverProfileScreen() {
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

  const [showStickyHeader, setShowStickyHeader] = React.useState(false);
  const stickyOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(stickyOpacity, {
      toValue: showStickyHeader ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showStickyHeader]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowStickyHeader(offsetY > 80);
  };

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
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
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
    : user?.username ?? "Driver";

  const initials = userFirstName && userLastName
    ? `${userFirstName[0]}${userLastName[0]}`.toUpperCase()
    : user?.username ? user.username.slice(0, 2).toUpperCase() : "DR";

  const cityDisplay = user?.tenant_schema
    ? user.tenant_schema.charAt(0).toUpperCase() + user.tenant_schema.slice(1)
    : "Nagpur";

  return (
    <ScreenWrapper
      showHeader={false}
      disablePadding
      className="bg-[#F7F9FA]"
      screenBgColor="#F7F9FA"
    >
      <Animated.View
        pointerEvents={showStickyHeader ? "auto" : "none"}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          paddingTop: insets.top,
          opacity: stickyOpacity,
        }}
      >
        {/* Frosted translucent light green overlay */}
        {/* <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(227, 245, 233, 0.85)" }]} /> */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(187, 243, 206, 0.85)" }]} />
        <BlurView tint="light" intensity={60} style={StyleSheet.absoluteFillObject} />

        {/* Header row content */}
        <View className="flex-row justify-between items-center px-4 h-16">
          {(router.canGoBack() || activeView !== "view") ? (
            <TouchableOpacity
              onPress={handleBackPress}
              className="w-10 h-10 items-center justify-center"
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}

          <Text className="text-[16px] font-bold text-[#1A1A1A]">
            {activeView === "view" ? "Profile" : (activeView === "edit_profile" ? "Edit Profile" : "Change Password")}
          </Text>

          {activeView === "view" ? (
            <TouchableOpacity
              onPress={openEditProfile}
              className="h-10 justify-center items-end"
              hitSlop={10}
            >
              <Text className="text-[16px] font-semibold text-[#1B5E37]">
                Edit
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        className="bg-[#F7F9FA]"
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {/* Header Section with Linear Gradient */}
        <LinearGradient
          colors={["#E3F5E9", "#F7F9FA"]}
          style={{ paddingTop: insets.top }}
          className="pb-6"
        >
          {/* Custom Header Row */}
          <View className="flex-row justify-between items-center px-4 h-16">
            {(router.canGoBack() || activeView !== "view") ? (
              <TouchableOpacity
                onPress={handleBackPress}
                className="w-10 h-10 items-center justify-center"
                hitSlop={10}
              >
                <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            ) : (
              <View className="w-10" />
            )}

            {activeView !== "view" && (
              <Text className="text-[18px] font-bold text-[#1A1A1A]">
                {activeView === "edit_profile" ? "Edit Profile" : "Change Password"}
              </Text>
            )}

            {activeView === "view" ? (
              <TouchableOpacity
                onPress={openEditProfile}
                className="h-10 justify-center items-end"
                hitSlop={10}
              >
                <Text className="text-[16px] font-semibold text-[#1B5E37]">
                  Edit
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="w-10" />
            )}
          </View>

          {activeView === "view" && (
            <View className="items-center mt-3">
              <View className="w-20 h-20 rounded-full bg-[#0A3925] items-center justify-center shadow-xs">
                <Text className="text-white text-[24px] font-bold">
                  {initials}
                </Text>
              </View>
              <Text className="text-[26px] font-bold text-[#1A1A1A] mt-4">
                {fullName}
              </Text>
              <Text className="text-[14px] text-[#757575] mt-1">
                {user?.email ?? "—"}
              </Text>
            </View>
          )}
        </LinearGradient>

        <View className="px-4">
          {activeView === "view" && (
            <>
              {/* Metric Action Cards */}
              <View className="mt-2 mb-4 flex-row gap-3">
                <MetricCard label="Today" value="38" icon="checkmark-done-outline" />
                <MetricCard label="Stops Left" value="24" icon="location-outline" />
                <MetricCard label="Cash" value="₹1,240" icon="cash-outline" />
              </View>

              {/* Sections */}
              <SectionTitle title="Contact Information" />
              <CardShell>
                <ProfileActionItem
                  icon="call-outline"
                  label="Phone"
                  value={user?.phone ?? "—"}
                />
                <View className="h-px bg-neutral-100 ml-12" />
                <ProfileActionItem
                  icon="mail-outline"
                  label="Email"
                  value={user?.email ?? "—"}
                />
                <View className="h-px bg-neutral-100 ml-12" />
                <ProfileActionItem
                  icon="location-outline"
                  label="City"
                  value={cityDisplay}
                />
              </CardShell>

              <SectionTitle title="Shift Information" />
              <CardShell>
                <ProfileActionItem
                  icon="time-outline"
                  label="Shift Timing"
                  value="06:00 AM - 02:00 PM"
                />
                <View className="h-px bg-neutral-100 ml-12" />
                <ProfileActionItem
                  icon="map-outline"
                  label="Assigned Route"
                  value="Nagpur Express Delivery"
                />
                <View className="h-px bg-neutral-100 ml-12" />
                <ProfileActionItem
                  icon="car-outline"
                  label="Vehicle"
                  value="MH 31 AB 1234"
                />
              </CardShell>

              <SectionTitle title="App Settings" />
              <CardShell>
                <ProfileActionItem
                  icon="notifications-outline"
                  label="Notifications"
                  onPress={() => Alert.alert("Notifications", "Notification settings coming soon.")}
                />
                <View className="h-px bg-neutral-100 ml-12" />
                <ProfileActionItem
                  icon="shield-checkmark-outline"
                  label="Privacy Policy"
                  onPress={() => Alert.alert("Privacy Policy", "For terms, please visit penchfoods.in/privacy")}
                />
                <View className="h-px bg-neutral-100 ml-12" />
                <ProfileActionItem
                  icon="help-circle-outline"
                  label="Support"
                  onPress={() => Alert.alert("Support", "Please contact the operations manager at +91 9876543210")}
                />
              </CardShell>

              <SectionTitle title="Account" />
              <CardShell>
                <ProfileActionItem
                  icon="person-outline"
                  label="Edit Profile"
                  onPress={openEditProfile}
                />
                <View className="h-px bg-neutral-100 ml-12" />
                <ProfileActionItem
                  icon="lock-closed-outline"
                  label="Change Password"
                  onPress={openChangePassword}
                />
              </CardShell>

              <SectionTitle title="Logout" />
              <CardShell>
                <ProfileActionItem
                  icon="log-out-outline"
                  label="Logout"
                  danger
                  onPress={handleLogout}
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

          <Text className="pb-5 pt-10 text-center text-xs text-text-muted">
            © 2026 Pench Foods
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}