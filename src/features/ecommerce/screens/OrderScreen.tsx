import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";
import { orderApi, Order } from "@/features/dashboard/api/orderApi";
import { productApi, Product } from "@/features/dashboard/api/productApi";

import { OrderCard } from "../components/OrderCard";
import { OrdersTabs } from "../components/OrdersTabs";
import { EmptyOrdersState } from "../components/EmptyOrdersState";
import { OrderExtraBottomSheet } from "../components/OrderExtraBottomSheet";

export function OrdersScreen() {
    const domainName = useAuthStore((s) => s.domain_name) || "";
    const params = useLocalSearchParams<{ openModal?: string }>();

    const cartItems = useCartStore((s) => s.items);
    const clearCart = useCartStore((s) => s.clearCart);

    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState<"history" | "upcoming">("upcoming");

    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const openOrderSheet = useCallback(() => {
        bottomSheetRef.current?.present();
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            const data = await orderApi.getOrders(domainName);
            setOrders(data);
        } catch (e) {
            console.warn("Failed to fetch orders:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [domainName]);

    const fetchProducts = useCallback(async () => {
        try {
            const data = await productApi.getProducts(domainName);
            setProducts(data.filter((p) => p.is_active));
        } catch (e) {
            console.warn("Failed to fetch products:", e);
        }
    }, [domainName]);

    useEffect(() => {
        if (params.openModal === "true") openOrderSheet();
    }, [params.openModal, openOrderSheet]);

    useEffect(() => {
        if (!domainName) {
            setLoading(false);
            return;
        }
        fetchOrders();
        fetchProducts();
    }, [domainName, fetchOrders, fetchProducts]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrders();
        fetchProducts();
    }, [fetchOrders, fetchProducts]);

    const handleCancelOrder = useCallback(
        async (orderId: string, isSpecial: boolean) => {
            try {
                setLoading(true);
                await orderApi.deleteOrder(domainName, orderId);
                const orderTypeLabel = isSpecial ? "special order" : "subscription delivery order";
                Alert.alert("Cancelled", `Your ${orderTypeLabel} has been successfully cancelled.`);
                fetchOrders();
            } catch (e: any) {
                Alert.alert("Failed", e?.message || "Could not cancel order.");
                setLoading(false);
            }
        },
        [domainName, fetchOrders]
    );

    const filteredOrders = useMemo(() => {
        return orders.filter((o) => {
            if (tab === "upcoming") {
                return ["pending", "confirmed", "dispatched", "in_transit"].includes(o.status);
            }
            return o.status === "delivered";
        });
    }, [orders, tab]);

    return (
        <SafeAreaView className="flex-1 bg-[#F5F8F6]">
            <StatusBar style="dark" />

            <View className="px-4 py-4 border-b border-gray-100 bg-white">
                <Text className="text-2xl font-black text-gray-900">Your Orders</Text>
                <Text className="text-[13px] text-gray-500">Track and manage your upcoming deliveries</Text>
            </View>

            <View className="px-4 py-3">
                <OrdersTabs tab={tab} onChange={setTab} />
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#1B5E37" />
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }) => (
                        <OrderCard order={item} onCancel={(isSpecial) => handleCancelOrder(item.id, isSpecial)} />
                    )}
                    ListEmptyComponent={<EmptyOrdersState tab={tab} />}
                />
            )}

            <TouchableOpacity
                activeOpacity={0.85}
                onPress={openOrderSheet}
                className="absolute bottom-6 right-6 flex-row items-center gap-2 bg-[#1B5E37] px-5 py-4 rounded-full shadow-lg"
                style={{
                    shadowColor: "#1B5E37",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 6,
                    zIndex: 999,
                }}
            >
                <Ionicons name="cart-outline" size={20} color="white" />
                <Text className="text-[14px] font-bold text-white">Order Extra</Text>
            </TouchableOpacity>

            <OrderExtraBottomSheet
                ref={bottomSheetRef}
                products={products}
                cartItems={cartItems}
                onClose={() => bottomSheetRef.current?.dismiss()}
                onOrderCreated={() => {
                    clearCart();
                    fetchOrders();
                }}
                domainName={domainName}
            />
        </SafeAreaView>
    );
}