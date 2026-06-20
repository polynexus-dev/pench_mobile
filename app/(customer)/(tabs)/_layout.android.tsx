import React, { useEffect } from "react";
import { NativeTabs, Icon, Label, Badge } from "expo-router/unstable-native-tabs";
import * as NavigationBar from "expo-navigation-bar";
import { useCartStore } from "@/store/useCartStore";

export default function TabLayout() {
    const tabBarColor = "#f5f5f5ff";
    const activeTintColor = "#01492bff";
    // const inactiveTintColor = "#7d9789ff";
    const inactiveTintColor = "#07522fff";

    const cartItems = useCartStore((s) => s.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    useEffect(() => {
        NavigationBar.setButtonStyleAsync("dark");
    }, []);

    return (
        <NativeTabs
            iconColor={{
                default: inactiveTintColor,
                selected: activeTintColor,
            }}
            labelStyle={{
                default: { color: inactiveTintColor },
                selected: { color: activeTintColor },
            }}
            disableTransparentOnScrollEdge
            backgroundColor={tabBarColor}
            indicatorColor="#e2ebd9"
            // indicatorColor="#4b860fff"
            labelVisibilityMode="labeled"
        >
            <NativeTabs.Trigger name="dashboard">
                <Label>Home</Label>
                <Icon sf="house.fill" drawable="ic_menu_home" />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="orders">
                <Label>Orders</Label>
                <Icon sf="receipt.fill" drawable="ic_menu_agenda" />
                {cartCount > 0 && <Badge>{String(cartCount)}</Badge>}
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="subscriptions">
                <Label>Subscriptions</Label>
                <Icon sf="calendar" drawable="ic_menu_today" />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="profile">
                <Label>Profile</Label>
                <Icon sf="person.crop.circle.fill" drawable="ic_menu_manage" />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}