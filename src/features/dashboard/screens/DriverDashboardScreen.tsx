import React from "react";

import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { useRouter } from "expo-router";

import { useAuthStore } from "@store/authStore";

import { DashboardHeader } from "../components/DashboardHeader";
import { GreetingRow } from "../components/GreetingRow";
import { SectionHeading } from "../components/SectionHeading";

export function DriverDashboardScreen() {
    const router = useRouter();

    const { user } = useAuthStore();

    // TODO: Replace with API
    const stats = {
        newOrders: 6,
        dailyDeliveries: 62,
        completedDeliveries: 38,
        pendingStops: 24,
        specialOrders: 16,
        bottleReturns: 52,
    };

    const fullName =
        user?.username ?? "Driver";

    return (
        <SafeAreaView className="flex-1 bg-bg-screen">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: 120,
                    paddingHorizontal: 10,
                }}
            >
                {/* Header */}
                <DashboardHeader
                    cityName={
                        user?.city_name ?? "Nagpur"
                    }
                    hubName="Bilzen"
                />

                {/* Greeting */}
                <GreetingRow
                    name={fullName}
                />

                {/* Route Hero Card */}
                <View className="mx-5 mt-5 rounded-[32px] bg-brand-primary p-5">

                    <View className="flex-row items-start justify-between">

                        <View>
                            <Text className="text-sm text-white/70">
                                Today's Route
                            </Text>

                            <Text className="mt-2 text-3xl font-bold text-white">
                                Route 12A
                            </Text>

                            <Text className="mt-2 text-sm text-white/80">
                                {stats.completedDeliveries}
                                {" / "}
                                {stats.dailyDeliveries}
                                {" "}
                                deliveries completed
                            </Text>
                        </View>

                        <View className="rounded-full bg-white/20 px-3 py-1">
                            <Text className="text-xs font-semibold text-white">
                                LIVE
                            </Text>
                        </View>
                    </View>

                    {/* Progress */}
                    <View className="mt-5 h-3 overflow-hidden rounded-full bg-white/20">
                        <View
                            className="h-3 rounded-full bg-white"
                            style={{
                                width: `${(stats.completedDeliveries / stats.dailyDeliveries) * 100}%`,
                            }}
                        />
                    </View>

                    {/* CTA */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() =>
                            router.push("/(driver)/(tabs)/map")
                        }
                        className="mt-5 flex-row items-center justify-center rounded-2xl bg-white py-4"
                    >
                        <Ionicons
                            name="map-outline"
                            size={18}
                            color="#1B5E37"
                        />

                        <Text className="ml-2 font-semibold text-brand-primary">
                            Open Live Route
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Today's Load */}
                <View className="mx-5 mt-6 rounded-[32px] bg-white p-5">

                    <View className="flex-row items-center">
                        <Ionicons
                            name="cube-outline"
                            size={20}
                            color="#D4872A"
                        />

                        <Text className="ml-2 text-xl font-bold text-text-primary">
                            Today's Load
                        </Text>
                    </View>

                    <View className="mt-5 flex-row flex-wrap justify-between">

                        <LoadCard
                            label="Milk"
                            value="128"
                        />

                        <LoadCard
                            label="Paneer"
                            value="8"
                        />

                        <LoadCard
                            label="Curd"
                            value="5"
                        />

                        <LoadCard
                            label="Ghee"
                            value="3"
                        />
                    </View>
                </View>

                {/* Stats Grid */}
                <View className="mx-5 mt-6 flex-row flex-wrap justify-between">

                    <DashboardStatCard
                        icon="time-outline"
                        title="Pending"
                        value={`${stats.pendingStops}`}
                        subtitle="Stops"
                    />

                    <DashboardStatCard
                        icon="restaurant-outline"
                        title="Special"
                        value={`${stats.specialOrders}`}
                        subtitle="Orders"
                    />

                    <DashboardStatCard
                        icon="refresh-outline"
                        title="Returns"
                        value={`${stats.bottleReturns}`}
                        subtitle="Bottles"
                    />

                    <DashboardStatCard
                        icon="checkmark-done-outline"
                        title="Completed"
                        value={`${stats.completedDeliveries}`}
                        subtitle="Delivered"
                    />
                </View>

                {/* Next Stop */}
                <View className="mx-5 mt-6 rounded-[32px] bg-white p-5">

                    <Text className="text-xs tracking-widest text-brand-primary">
                        NEXT STOP
                    </Text>

                    <Text className="mt-2 text-2xl font-bold text-text-primary">
                        Mrs. Deshmukh
                    </Text>

                    <Text className="mt-2 text-base text-text-secondary">
                        2 Milk • 1 Paneer
                    </Text>

                    <Text className="mt-1 text-sm text-text-muted">
                        ETA • 4 mins
                    </Text>

                    <View className="mt-5 flex-row">

                        <TouchableOpacity
                            className="mr-3 flex-1 rounded-2xl bg-brand-primary py-4"
                        >
                            <Text className="text-center font-semibold text-white">
                                Navigate
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 rounded-2xl bg-brand-light py-4"
                        >
                            <Text className="text-center font-semibold text-brand-primary">
                                Delivered
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Special Orders */}
                <View className="mt-6">

                    <SectionHeading
                        title="Special Orders"
                        actionLabel="View All"
                    />

                    <View className="px-5">

                        {[1, 2, 3].map((item) => (
                            <View
                                key={item}
                                className="mb-4 rounded-[28px] border border-warning/20 bg-warning/10 p-5"
                            >
                                <View className="flex-row items-center justify-between">

                                    <View>
                                        <Text className="text-lg font-bold text-text-primary">
                                            Amit Sharma
                                        </Text>

                                        <Text className="mt-1 text-sm text-text-secondary">
                                            Stop #12 • 6:45 AM
                                        </Text>
                                    </View>

                                    <Ionicons
                                        name="alert-circle"
                                        size={24}
                                        color="#D4872A"
                                    />
                                </View>

                                <View className="mt-4 flex-row flex-wrap">

                                    <View className="mr-2 rounded-full bg-white px-4 py-2">
                                        <Text className="font-medium text-text-primary">
                                            2 Paneer
                                        </Text>
                                    </View>

                                    <View className="rounded-full bg-white px-4 py-2">
                                        <Text className="font-medium text-text-primary">
                                            1 Curd
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Quick Actions */}
                <View className="mx-5 mt-2 flex-row justify-between">

                    <QuickActionButton
                        icon="call-outline"
                        label="Call"
                    />

                    <QuickActionButton
                        icon="scan-outline"
                        label="Scan"
                    />

                    <QuickActionButton
                        icon="warning-outline"
                        label="Issue"
                    />

                    <QuickActionButton
                        icon="list-outline"
                        label="Orders"
                    />
                </View>

                {/* Orders */}
                <View className="mt-6">
                    <SectionHeading
                        title="Today's Orders"
                        actionLabel="View All"
                    />

                    {/* TODO: OrderList */}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

interface DashboardStatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value: string;
    subtitle: string;
}

function DashboardStatCard({
    icon,
    title,
    value,
    subtitle,
}: DashboardStatCardProps) {
    return (
        <View className="mb-4 w-[48%] rounded-[28px] bg-white p-5">

            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-light">
                <Ionicons
                    name={icon}
                    size={20}
                    color="#1B5E37"
                />
            </View>

            <Text className="mt-4 text-sm text-text-secondary">
                {title}
            </Text>

            <Text className="mt-1 text-3xl font-bold text-text-primary">
                {value}
            </Text>

            <Text className="mt-1 text-xs text-text-muted">
                {subtitle}
            </Text>
        </View>
    );
}

interface LoadCardProps {
    label: string;
    value: string;
}

function LoadCard({
    label,
    value,
}: LoadCardProps) {
    return (
        <View className="mb-3 w-[48%] rounded-2xl bg-bg-input p-4">

            <Text className="text-sm text-text-secondary">
                {label}
            </Text>

            <Text className="mt-2 text-2xl font-bold text-text-primary">
                {value}
            </Text>
        </View>
    );
}

interface QuickActionButtonProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
}

function QuickActionButton({
    icon,
    label,
}: QuickActionButtonProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            className="h-20 w-[23%] items-center justify-center rounded-[24px] bg-white"
        >
            <Ionicons
                name={icon}
                size={22}
                color="#1B5E37"
            />

            <Text className="mt-2 text-xs font-medium text-text-primary">
                {label}
            </Text>
        </TouchableOpacity>
    );
}