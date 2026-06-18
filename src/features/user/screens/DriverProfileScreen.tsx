import { Text } from "@/shared/ui/Text/Text";
import { Ionicons } from "@expo/vector-icons";
import { useLogout } from "@features/auth/hooks/useLogout";
import { useAuthStore } from "@store/authStore";
import { useRouter } from "expo-router";

import React from "react";
import {
  Alert,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Input, Button } from "@/shared/ui";
import { httpClient } from "@/services/api/httpClient";
import { buildUrl } from "@/services/api/buildUrl";
import { useToast } from "@/hooks/useToast";

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

interface ProfileCardProps {
  initials: string;
  fullName: string;
  email: string;
  phone: string;
  activeView: 'view' | 'edit_profile' | 'change_password';
  openEditProfile: () => void;
  cityDisplay: string;
}

function ProfileCard({
  initials,
  fullName,
  email,
  phone,
  activeView,
  openEditProfile,
  cityDisplay,
}: ProfileCardProps) {
  return (
    <View className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-xs mt-2">
      {/* Top Row: Avatar + Details + LIVE Badge */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {/* Avatar Box */}
          <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 border border-brand-primary/20">
            <Text variant="heading" weight="bold" className="text-brand-primary text-xl">
              {initials}
            </Text>
          </View>

          {/* User Details */}
          <View className="ml-4 flex-1">
            <Text variant="heading" weight="bold" className="text-text-primary">
              {fullName}
            </Text>
            <Text variant="body-sm" color="muted" className="mt-0.5" numberOfLines={1}>
              {email}
            </Text>
            <View className="flex-row items-center border border-success/20 bg-successLight/40 px-2.5 py-1 rounded-full mt-2 self-start">
              <View className="h-2 w-2 rounded-full bg-success mr-1.5" />
              <Text variant="caption-sm" color="success" weight="bold">
                LIVE
              </Text>
            </View>
          </View>
        </View>

        {activeView === "view" && (
          <TouchableOpacity
            onPress={openEditProfile}
            className="flex-row items-center bg-brand-primary/10 border border-brand-primary/20 px-3 py-1.5 rounded-full"
          >
            <Ionicons name="pencil-outline" size={14} color="#1B5E37" className="mr-1" />
            <Text variant="caption-sm" color="brand" weight="bold">
              Edit
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {activeView === "view" && (
        <>
          {/* Divider */}
          <View className="h-px bg-neutral-100 my-4" />

          {/* Phone Info Chip */}
          <TouchableOpacity
            activeOpacity={phone ? 1 : 0.7}
            onPress={!phone ? openEditProfile : undefined}
            className="flex-row items-center justify-between bg-neutral-50 rounded-2xl p-3.5 border border-neutral-100"
          >
            <View className="flex-row items-center flex-1">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
                <Ionicons name="call-outline" size={20} color="#1B5E37" />
              </View>
              <View className="ml-3 flex-1">
                <Text variant="caption" color="muted">
                  Phone
                </Text>
                <Text
                  variant="body"
                  weight="semibold"
                  className={phone ? "text-text-primary" : "text-brand-primary"}
                >
                  {phone ? phone : "Add phone number"}
                </Text>
              </View>
            </View>
            {!phone && (
              <Ionicons name="add-circle-outline" size={18} color="#1B5E37" />
            )}
          </TouchableOpacity>

          {/* Shift/Hub Status Card */}
          <View className="h-px bg-neutral-100 my-4" />
          <TouchableOpacity
            activeOpacity={0.8}
            className="flex-row items-center justify-between bg-brand-primary/5 rounded-2xl p-3.5 border border-brand-primary/10"
          >
            <View className="flex-row items-center flex-1">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
                <Ionicons name="bicycle-outline" size={22} color="#1B5E37" />
              </View>
              <View className="ml-3 flex-1">
                <Text variant="body" weight="semibold" className="text-brand-primary">
                  Active Delivery Driver
                </Text>
                <Text variant="caption" color="muted" className="mt-0.5">
                  {cityDisplay} Hub
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#1B5E37" />
          </TouchableOpacity>
        </>
      )}
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

  const headerTitle = activeView === "view"
    ? "Profile"
    : activeView === "edit_profile"
      ? "Edit Profile"
      : "Change Password";

  return (
    <ScreenWrapper
      title={headerTitle}
      showHeader
      showBack={router.canGoBack() || activeView !== "view"}
      onBack={handleBackPress}
      headerBgColor="#1B5E37"
      disablePadding
      className="bg-[#1B5E37]"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
        className="bg-[#EAEEE4]"
      >
        {/* Header Section */}
        <View className="px-4 pt-6 relative">
          {activeView === "view" ? (
            <>
              {/* Fused Profile & Active Status Card */}
              <ProfileCard
                initials={initials}
                fullName={fullName}
                email={user?.email ?? "—"}
                phone={user?.phone ?? ""}
                activeView={activeView}
                openEditProfile={openEditProfile}
                cityDisplay={cityDisplay}
              />

              {/* Metric Action Cards */}
              <View className="mt-4 flex-row gap-3">
                <MetricCard label="Today" value="38" icon="checkmark-done-outline" />
                <MetricCard label="Stops Left" value="24" icon="location-outline" />
                <MetricCard label="Cash" value="₹1,240" icon="cash-outline" />
              </View>
            </>
          ) : (
            <View className="items-center mt-2 pb-4">
              <Text variant="heading" weight="bold" color="primary" align="center">
                {activeView === "edit_profile" ? "Edit Profile" : "Change Password"}
              </Text>
              <Text variant="body-sm" color="muted" align="center" className="mt-1">
                {activeView === "edit_profile" ? "Update your personal details" : "Update account security"}
              </Text>
            </View>
          )}
        </View>

        {/* Main Content Area */}
        <View className="px-4 mt-1">
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
                <View className="h-px bg-neutral-100/80 ml-14" />
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
                  onPress={openEditProfile}
                />
                <View className="h-px bg-neutral-100/80 ml-14" />
                <ProfileActionItem
                  icon="lock-closed-outline"
                  label="Change Password"
                  helper="Update account security"
                  onPress={openChangePassword}
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
    </ScreenWrapper>
  );
}