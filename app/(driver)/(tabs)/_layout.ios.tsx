import * as NavigationBar from "expo-navigation-bar";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React, { useEffect } from "react";

// import { Colors } from "@/constants/theme";
// import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
    // const colorScheme = useColorScheme();
    // const colors = Colors[colorScheme ?? "light"];
    const tabBarColor = "#f5f5f5ff";
    const activeTintColor = "#01492bff";

    useEffect(() => {
        NavigationBar.setButtonStyleAsync("dark");
    }, []);

    return (
        <NativeTabs
            tintColor={activeTintColor}
            disableTransparentOnScrollEdge
            backgroundColor={tabBarColor}
            indicatorColor="#e2ebd9"
            labelVisibilityMode="labeled"
        >
            <NativeTabs.Trigger name="dashboard">
                <Label>Dashboard</Label>
                <Icon sf="house.fill" drawable="ic_menu_home" />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="map">
                <Label>Map</Label>
                <Icon sf="map.fill" drawable="ic_menu_compass" />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="profile">
                <Label>Profile</Label>
                <Icon sf="person.crop.circle.fill" drawable="ic_menu_manage" />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}