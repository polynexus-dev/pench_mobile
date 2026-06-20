import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useCartStore } from "@/store/useCartStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CustomerTabsLayout() {
    const insets = useSafeAreaInsets();
    const cartItems = useCartStore((s) => s.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: "#1B5E37",
                    tabBarInactiveTintColor: "#7d9789",
                    tabBarStyle: {
                        backgroundColor: "#f8f8f8",
                        position: "absolute",
                        left: 10,
                        right: 10,
                        bottom: insets.bottom,
                        height: 65,
                        paddingTop: 5,
                        paddingBottom: 10,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        overflow: "hidden",
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
                        title: "Home",
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="home-outline" size={22} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="orders"
                    options={{
                        title: "Orders",
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="receipt-outline" size={22} color={color} />
                        ),
                        tabBarBadge: cartCount > 0 ? cartCount : undefined,
                        tabBarBadgeStyle: { backgroundColor: "#1B5E37", color: "white" },
                    }}
                />
                <Tabs.Screen
                    name="subscriptions"
                    options={{
                        title: "Subscriptions",
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="calendar-outline" size={22} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: "Profile",
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="person-outline" size={22} color={color} />
                        ),
                    }}
                />
            </Tabs>
        </>
    );
}