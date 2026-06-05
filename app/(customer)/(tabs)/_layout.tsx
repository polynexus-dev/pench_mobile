import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useCartStore } from "@/store/useCartStore";

export default function CustomerTabsLayout() {
    const cartItems = useCartStore((s) => s.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#1B5E37" }}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: "Orders",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="receipt-outline" size={size} color={color} />
                    ),
                    tabBarBadge: cartCount > 0 ? cartCount : undefined,
                    tabBarBadgeStyle: { backgroundColor: "#1B5E37", color: "white" },
                }}
            />
            <Tabs.Screen
                name="subscriptions"
                options={{
                    title: "Subscriptions",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}