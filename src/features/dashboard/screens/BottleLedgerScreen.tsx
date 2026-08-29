import React, { useState } from "react";
import {
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { Text } from "@/shared/ui/Text/Text";
import { useAuthStore } from "@/store/authStore";
import { buildUrl } from "@/services/api/buildUrl";
import { httpClient } from "@/services/api/httpClient";

type PeriodType = "today" | "monthly" | "all";
type TxType = "all" | "returned" | "issued" | "broken" | "lost";

interface SummaryData {
    issued?: number;
    total_issued?: number;
    returned?: number;
    total_returned?: number;
    broken?: number;
    total_broken?: number;
    lost?: number;
    total_lost?: number;
}

interface TransactionLogItem {
    id: string | number;
    customer_name?: string;
    customer?: { name?: string } | string;
    bottle_type_name?: string;
    bottle_type?: { name?: string } | string;
    transaction_type: "returned" | "issued" | "broken" | "lost" | string;
    quantity: number;
    created_at?: string;
    timestamp?: string;
}

export function BottleLedgerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const domainName = useAuthStore((s) => s.domain_name) || "";

    const [period, setPeriod] = useState<PeriodType>("today");
    const [txFilter, setTxFilter] = useState<TxType>("all");

    // Helper: format API date query params
    const getSummaryDateParam = (p: PeriodType) => {
        const now = new Date();
        if (p === "today") {
            return now.toISOString().split("T")[0];
        }
        if (p === "monthly") {
            return now.toISOString().slice(0, 7); // YYYY-MM
        }
        return "all";
    };

    // 1. Fetch Bottle Transactions Summary
    const summaryDate = getSummaryDateParam(period);
    const {
        data: summaryData,
        isLoading: isSummaryLoading,
        refetch: refetchSummary,
        isRefetching: isSummaryRefetching,
    } = useQuery<SummaryData>({
        queryKey: ["bottle-summary", domainName, summaryDate],
        queryFn: async () => {
            if (!domainName) return {};
            const url = buildUrl(
                domainName,
                `/api/erp/inventory/bottle-transactions/summary/?date=${summaryDate}`
            );
            return (await httpClient.get(url)) as any;
        },
        enabled: !!domainName,
    });

    // 2. Fetch Individual Bottle Transactions Logs
    const {
        data: logsData,
        isLoading: isLogsLoading,
        refetch: refetchLogs,
        isRefetching: isLogsRefetching,
    } = useQuery<any>({
        queryKey: ["bottle-logs", domainName, txFilter],
        queryFn: async () => {
            if (!domainName) return [];
            let endpoint = `/api/erp/inventory/bottle-transactions/`;
            if (txFilter !== "all") {
                endpoint += `?transaction_type=${txFilter}`;
            }
            const url = buildUrl(domainName, endpoint);
            return (await httpClient.get(url)) as any;
        },
        enabled: !!domainName,
    });

    const isRefreshing = isSummaryRefetching || isLogsRefetching;

    const handleRefresh = async () => {
        await Promise.all([refetchSummary(), refetchLogs()]);
    };

    // Parse values safely
    const issued = summaryData?.issued ?? summaryData?.total_issued ?? 0;
    const returned = summaryData?.returned ?? summaryData?.total_returned ?? 0;
    const broken = summaryData?.broken ?? summaryData?.total_broken ?? 0;
    const lost = summaryData?.lost ?? summaryData?.total_lost ?? 0;

    const rawLogs: TransactionLogItem[] = Array.isArray(logsData)
        ? logsData
        : logsData?.results || logsData?.logs || [];

    const formatTxTypeLabel = (type: string) => {
        if (type === "returned") return "Returned";
        if (type === "issued") return "Issued";
        if (type === "broken") return "Broken";
        if (type === "lost") return "Lost";
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const getTxBadgeClasses = (type: string) => {
        if (type === "returned") return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: "checkmark-circle-outline" };
        if (type === "issued") return { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: "cube-outline" };
        if (type === "broken") return { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: "warning-outline" };
        return { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", icon: "close-circle-outline" };
    };

    const formatTimestamp = (dateStr?: string) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    const renderLogItem = ({ item }: { item: TransactionLogItem }) => {
        const customerName =
            typeof item.customer === "object"
                ? item.customer?.name
                : item.customer_name ?? item.customer ?? "Unknown Customer";

        const bottleName =
            typeof item.bottle_type === "object"
                ? item.bottle_type?.name
                : item.bottle_type_name ?? item.bottle_type ?? "Bottle";

        const badge = getTxBadgeClasses(item.transaction_type);

        return (
            <View className="mb-3 rounded-[20px] border border-border-default bg-white p-4 flex-row items-center justify-between shadow-xs">
                <View className="flex-1 pr-3">
                    <View className="flex-row items-center gap-x-2 mb-1.5 flex-wrap">
                        <View className={`rounded-full px-2 py-0.5 border flex-row items-center gap-x-1 ${badge.bg}`}>
                            <Ionicons name={badge.icon as any} size={12} className={badge.text} />
                            <Text variant="caption-sm" weight="bold" className={`text-[10px] ${badge.text}`}>
                                {formatTxTypeLabel(item.transaction_type)}
                            </Text>
                        </View>
                        <Text variant="caption-sm" color="muted">
                            {formatTimestamp(item.created_at ?? item.timestamp)}
                        </Text>
                    </View>
                    <Text variant="body" weight="bold" color="primary" lines={1}>
                        {customerName}
                    </Text>
                    <Text variant="caption" color="secondary" className="mt-0.5">
                        Bottle Type: {bottleName}
                    </Text>
                </View>
                <View className="items-end">
                    <Text variant="heading" weight="bold" color={item.transaction_type === "returned" ? "success" : "primary"}>
                        {item.transaction_type === "returned" ? "+" : ""}{item.quantity}
                    </Text>
                    <Text variant="caption-sm" color="muted">
                        Units
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper title="Bottle Ledger" screenBgColor="#0f172a" disablePadding>
            <View className="flex-1 bg-bg-screen">
                {/* Header Profile Section */}
                <View
                    className="bg-[#1B5E37] px-4 pb-6 rounded-b-[35px] shadow-sm"
                    style={{ paddingTop: insets.top + 16 }}
                >
                    <View className="flex-row items-center gap-x-3 pt-2">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
                        >
                            <Ionicons name="arrow-back" size={22} color="white" />
                        </TouchableOpacity>
                        <View className="flex-1">
                            <Text className="text-[20px] font-bold text-white">
                                Bottle Ledger
                            </Text>
                            <Text className="text-[13px] font-medium text-white/70 mt-0.5">
                                Real-time inventory transaction history
                            </Text>
                        </View>
                    </View>

                    {/* Period Selector Tabs */}
                    <View className="flex-row bg-white/10 rounded-full p-1 mt-5 gap-x-1">
                        {(["today", "monthly", "all"] as PeriodType[]).map((p) => (
                            <TouchableOpacity
                                key={p}
                                onPress={() => setPeriod(p)}
                                className={`flex-1 items-center py-2 rounded-full ${
                                    period === p ? "bg-white" : ""
                                }`}
                            >
                                <Text
                                    variant="caption-sm"
                                    weight="bold"
                                    color={period === p ? "brand" : "inverse"}
                                    transform="capitalize"
                                >
                                    {p === "all" ? "All-Time" : p === "monthly" ? "This Month" : "Today"}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Main Content Area */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#1B5E37"]} />
                    }
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}
                >
                    {/* Summary Aggregation Grid */}
                    <Text variant="label" color="primary" weight="bold" transform="uppercase" className="mb-3 tracking-widest">
                        Transaction Summary
                    </Text>

                    {isSummaryLoading ? (
                        <View className="py-8 items-center justify-center">
                            <ActivityIndicator size="small" color="#1B5E37" />
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap gap-3 mb-6">
                            {/* Card: Issued */}
                            <View className="w-[48%] rounded-[20px] bg-white border border-border-default p-4 shadow-xs relative overflow-hidden">
                                <View className="absolute -right-3 -top-3 w-10 h-10 rounded-full bg-blue-500/5" />
                                <View className="mb-2 h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                                    <Ionicons name="cube-outline" size={16} color="#1D4ED8" />
                                </View>
                                <Text className="text-[22px] font-extrabold text-blue-700">{issued}</Text>
                                <Text variant="caption-sm" weight="bold" color="primary" className="mt-0.5">
                                    Issued
                                </Text>
                            </View>

                            {/* Card: Returned */}
                            <View className="w-[48%] rounded-[20px] bg-white border border-border-default p-4 shadow-xs relative overflow-hidden">
                                <View className="absolute -right-3 -top-3 w-10 h-10 rounded-full bg-emerald-500/5" />
                                <View className="mb-2 h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                                    <Ionicons name="return-down-back" size={16} color="#047857" />
                                </View>
                                <Text className="text-[22px] font-extrabold text-emerald-700">{returned}</Text>
                                <Text variant="caption-sm" weight="bold" color="primary" className="mt-0.5">
                                    Returned
                                </Text>
                            </View>

                            {/* Card: Broken */}
                            <View className="w-[48%] rounded-[20px] bg-white border border-border-default p-4 shadow-xs relative overflow-hidden">
                                <View className="absolute -right-3 -top-3 w-10 h-10 rounded-full bg-amber-500/5" />
                                <View className="mb-2 h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                                    <Ionicons name="warning-outline" size={16} color="#B45309" />
                                </View>
                                <Text className="text-[22px] font-extrabold text-amber-700">{broken}</Text>
                                <Text variant="caption-sm" weight="bold" color="primary" className="mt-0.5">
                                    Broken
                                </Text>
                            </View>

                            {/* Card: Lost */}
                            <View className="w-[48%] rounded-[20px] bg-white border border-border-default p-4 shadow-xs relative overflow-hidden">
                                <View className="absolute -right-3 -top-3 w-10 h-10 rounded-full bg-rose-500/5" />
                                <View className="mb-2 h-8 w-8 items-center justify-center rounded-full bg-rose-50">
                                    <Ionicons name="close-circle-outline" size={16} color="#BE123C" />
                                </View>
                                <Text className="text-[22px] font-extrabold text-rose-700">{lost}</Text>
                                <Text variant="caption-sm" weight="bold" color="primary" className="mt-0.5">
                                    Lost
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Filter Scroll List */}
                    <Text variant="label" color="primary" weight="bold" transform="uppercase" className="mb-3 tracking-widest">
                        Transaction Logs
                    </Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
                    >
                        {(["all", "returned", "issued", "broken", "lost"] as TxType[]).map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setTxFilter(type)}
                                className={`px-4 py-1.5 rounded-full border ${
                                    txFilter === type
                                        ? "bg-[#1B5E37] border-[#1B5E37]"
                                        : "bg-white border-border-default"
                                }`}
                            >
                                <Text
                                    variant="caption-sm"
                                    weight="bold"
                                    color={txFilter === type ? "inverse" : "primary"}
                                    transform="capitalize"
                                >
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* List Items */}
                    {isLogsLoading ? (
                        <View className="py-12 items-center justify-center">
                            <ActivityIndicator size="large" color="#1B5E37" />
                        </View>
                    ) : rawLogs.length === 0 ? (
                        <View className="rounded-[24px] border border-border-default bg-white p-8 items-center justify-center mt-2">
                            <Ionicons name="document-text-outline" size={40} color="#757575" />
                            <Text variant="subhead" weight="bold" color="primary" className="mt-3">
                                No Transactions Found
                            </Text>
                            <Text variant="body-sm" color="secondary" align="center" className="mt-1">
                                No bottle movements found matching the selected filter.
                            </Text>
                        </View>
                    ) : (
                        <View>
                            {rawLogs.map((item, idx) => (
                                <View key={String(item.id ?? idx)}>{renderLogItem({ item })}</View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
}
