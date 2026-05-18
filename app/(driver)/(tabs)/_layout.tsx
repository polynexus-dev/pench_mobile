import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DriverTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#94a3b8",
        // tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#1e293b",
          borderRadius: 50,

          position: "absolute",
          marginHorizontal: 10,
          marginBottom: 10,

          height: 65,
          paddingTop: 5,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 10 },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Live Map",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" color={color} size={22} />
          ),
        }}
      />
      {/* ── New Profile Tab ───────────────────────────────────── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}