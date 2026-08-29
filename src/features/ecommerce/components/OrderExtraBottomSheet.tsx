import React, { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

import { orderApi } from "@/features/dashboard/api/orderApi";
import { Product } from "@/features/dashboard/api/productApi";
import { QuickDateChips } from "./QuickDateChips";
import { ProductQuantityRow } from "./ProductQuantityRow";
import { DeliveryDatePicker } from "./DeliveryDatePicker";

type CartItem = {
    id: string | number;
    quantity: number;
};

type Props = {
    products: Product[];
    cartItems: CartItem[];
    domainName: string;
    onClose: () => void;
    onOrderCreated: () => void;
};

export const OrderExtraBottomSheet = forwardRef<BottomSheetModal, Props>(
    ({ products, cartItems, domainName, onClose, onOrderCreated }, ref) => {
        const snapPoints = useMemo(() => ["82%"], []);
        const [orderDate, setOrderDate] = useState("");
        const [showCalendar, setShowCalendar] = useState(false);
        const [quantities, setQuantities] = useState<Record<string | number, number>>({});
        const [isPlacingOrder, setIsPlacingOrder] = useState(false);

        const getLocalDateString = useCallback((date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }, []);

        const resetSheetState = useCallback(() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setOrderDate(getLocalDateString(tomorrow));

            const initialQuantities: Record<string | number, number> = {};
            cartItems.forEach((item) => {
                if (item.quantity > 0) initialQuantities[item.id] = item.quantity;
            });
            setQuantities(initialQuantities);
            setShowCalendar(false);
        }, [cartItems, getLocalDateString]);

        useEffect(() => {
            if (products.length > 0) {
                resetSheetState();
            }
        }, [products.length, resetSheetState]);

        const updateQuantity = useCallback((productId: string | number, amount: number) => {
            setQuantities((prev) => {
                const current = prev[productId] || 0;
                const updated = Math.max(0, current + amount);
                return { ...prev, [productId]: updated };
            });
        }, []);

        const handlePlaceOrder = useCallback(async () => {
            const items = Object.entries(quantities)
                .filter(([_, qty]) => qty > 0)
                .map(([prodId, qty]) => ({
                    product: prodId,
                    quantity: qty,
                }));

            if (items.length === 0) {
                Alert.alert("Empty Selection", "Please add at least 1 product to place an order.");
                return;
            }

            if (!orderDate.trim()) {
                Alert.alert("Required Date", "Please select a valid delivery date.");
                return;
            }

            setIsPlacingOrder(true);
            try {
                await orderApi.createOrder(domainName, {
                    scheduled_delivery_date: orderDate,
                    items,
                });
                Alert.alert("Order Placed!", "Your one-time extra order has been successfully placed!");
                onOrderCreated();
                onClose();
            } catch (e: any) {
                Alert.alert("Order Failed", e?.message || "Failed to create order.");
            } finally {
                setIsPlacingOrder(false);
            }
        }, [domainName, onClose, onOrderCreated, orderDate, quantities]);

        const today = getLocalDateString(new Date());

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose
                onDismiss={() => {
                    setShowCalendar(false);
                }}
                backgroundStyle={{ backgroundColor: "#fff" }}
                handleIndicatorStyle={{ backgroundColor: "#D1D5DB" }}
            >
                <BottomSheetView style={{ flex: 1 }}>
                    <View className="px-5 pt-2 pb-4">
                        <View className="mb-4 flex-row items-center justify-between">
                            <Text className="text-[20px] font-extrabold text-gray-900">Order Extra Items</Text>
                            <TouchableOpacity
                                onPress={onClose}
                                className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                            >
                                <Ionicons name="close" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <DeliveryDatePicker
                                orderDate={orderDate}
                                setOrderDate={setOrderDate}
                                showCalendar={showCalendar}
                                setShowCalendar={setShowCalendar}
                                getLocalDateString={getLocalDateString}
                            />

                            <QuickDateChips
                                orderDate={orderDate}
                                setOrderDate={setOrderDate}
                                getLocalDateString={getLocalDateString}
                            />

                            <Text className="mb-3 text-[14px] font-black text-gray-900">Select Products</Text>

                            {products.length === 0 ? (
                                <View className="py-8 items-center justify-center">
                                    <ActivityIndicator size="small" color="#1B5E37" />
                                    <Text className="mt-2 text-xs text-gray-500">Loading products...</Text>
                                </View>
                            ) : (
                                products.map((product) => (
                                    <ProductQuantityRow
                                        key={product.id}
                                        product={product}
                                        quantity={quantities[product.id] || 0}
                                        onMinus={() => updateQuantity(product.id, -1)}
                                        onPlus={() => updateQuantity(product.id, 1)}
                                    />
                                ))
                            )}

                            <View className="h-6" />
                        </ScrollView>

                        <View className="flex-row gap-3 pt-4 border-t border-gray-100">
                            <TouchableOpacity
                                onPress={onClose}
                                disabled={isPlacingOrder}
                                className="flex-1 rounded-xl bg-white py-3.5 border border-gray-300 items-center"
                            >
                                <Text className="text-[15px] font-bold text-gray-700">Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handlePlaceOrder}
                                disabled={isPlacingOrder}
                                className="flex-1 rounded-xl bg-[#1B5E37] py-3.5 items-center"
                            >
                                {isPlacingOrder ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text className="text-[15px] font-bold text-white">Place Order</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);

OrderExtraBottomSheet.displayName = "OrderExtraBottomSheet";