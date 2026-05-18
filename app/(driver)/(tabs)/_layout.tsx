import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DriverTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1e3b2f",
        // tabBarInactiveTintColor: "#f8f8f8",
        tabBarInactiveTintColor: "#7d9789",
        tabBarStyle: {
          backgroundColor: "#f8f8f8",
          // backgroundColor: "#1B5E37",
          // borderTopColor: "#1e3b2f",

          // borderRadius: 50,

          position: "absolute",
          left: 10,
          right: 10,
          bottom: insets.bottom,
          height: 65,
          paddingTop: 5,
          paddingBottom: 10,

          // marginBottom: 10, 
          // marginHorizontal:10,

          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,

          overflow: "hidden", // 👈 IMPORTANT

          // elevation: 10, // Android shadow
          // shadowColor: "#000",
          // shadowOpacity: 0.2,
          // shadowRadius: 10,
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
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Live Map",
          tabBarIcon: ({ color }) => (
            <Ionicons name="map-outline" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}