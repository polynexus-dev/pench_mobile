import { Product, productApi } from "@/features/dashboard/api/productApi";
import { subscriptionApi } from "@/features/ecommerce/api/subscriptionApi";
import { CalendarSkeleton } from "@/features/ecommerce/components/CalendarSkeleton";
import { DailySummary, SubscriptionSummary } from "@/features/ecommerce/types/ecommerce.types";
import { useBottomTabPadding } from "@/hooks/useBottomTabPadding";
import { ScreenWrapper } from "@/shared/components/ScreenWrapper";
import { useProductStore } from "@/store";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/useCartStore";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

import { getStatusDetails } from "@/features/ecommerce/data/statusData";

const isValidUuid = (val?: any): boolean =>
    typeof val === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

function formatDateString(dateStr: string): string {
    if (!dateStr) return "";
    try {
        const parts = dateStr.split("-");
        if (parts.length !== 3) return dateStr;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return dateStr;
    }
}

const getProductThumbnail = (name: string) => {
    const text = name.toLowerCase();
    if (text.includes("milk")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-21.png";
    if (text.includes("paneer")) return "https://penchfoods.com/wp-content/uploads/2020/11/Paneer.png";
    if (text.includes("ghee")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-22.png";
    return "https://images.unsplash.com/photo-1628105652613-2d5fc2f3a6cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80";
};

const WEEKDAYS = [
    { id: "mon", label: "Mon", full: "Monday" },
    { id: "tue", label: "Tue", full: "Tuesday" },
    { id: "wed", label: "Wed", full: "Wednesday" },
    { id: "thu", label: "Thu", full: "Thursday" },
    { id: "fri", label: "Fri", full: "Friday" },
    { id: "sat", label: "Sat", full: "Saturday" },
    { id: "sun", label: "Sun", full: "Sunday" },
];

export default function SubscriptionsScreen() {
    const { user } = useAuthStore();
    const isFocused = useIsFocused();
    const domainName = useAuthStore((s) => s.domain_name) || "";
    const { products: storeProducts, setProducts: setGlobalProducts, getProductPrice } = useProductStore();
    const [subs, setSubs] = useState<SubscriptionSummary[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPlanTab, setSelectedPlanTab] = useState<"daily" | "alternate" | "custom">("daily");
    const isCustom = selectedPlanTab === "custom";

    const router = useRouter();
    const cartItems = useCartStore((s) => s.items);
    const addToCart = useCartStore((s) => s.addToCart);
    const bottomTabPadding = useBottomTabPadding(26);

    // Filter available products suitable for subscriptions (milk / dairy)
    const availableSubscriptionProducts = useMemo(() => {
        const prodList = products.length > 0 ? products : storeProducts;
        if (prodList.length > 0) {
            const milkOrDairy = prodList.filter((p) => {
                const name = (p.name || "").toLowerCase();
                const cat = (p.category || "").toLowerCase();
                return name.includes("milk") || cat.includes("milk") || cat.includes("dairy");
            });
            return milkOrDairy.length > 0 ? milkOrDairy : prodList;
        }
        return [];
    }, [products, storeProducts]);

    const defaultMilkProduct = useMemo(() => {
        const prodList = availableSubscriptionProducts.length > 0 ? availableSubscriptionProducts : (products.length > 0 ? products : storeProducts);
        return (prodList || []).find((p) => p.name?.toLowerCase().includes("milk") && Number(p.unit_price || p.price || 0) > 0) || (prodList || [])[0];
    }, [availableSubscriptionProducts, products, storeProducts]);

    const defaultLivePrice = useMemo(() => {
        if (!defaultMilkProduct) return 0;
        return getProductPrice(defaultMilkProduct.id) || Number(defaultMilkProduct.unit_price || defaultMilkProduct.price || 0);
    }, [defaultMilkProduct, getProductPrice]);

    // States for custom subscription configuration
    const [subscribingModel, setSubscribingModel] = useState<any>(null);
    const [selectedFrequency, setSelectedFrequency] = useState<string>("daily");
    const [selectedQty, setSelectedQty] = useState<number>(1.0);
    const [selectedModel, setSelectedModel] = useState<any>(null);
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [startDate, setStartDate] = useState<Date>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    });

    // States for Daily, Alternate & Custom configured subscription
    const [selectedDeliveryQty, setSelectedDeliveryQty] = useState<number>(1.0);
    const [selectedBottleSize, setSelectedBottleSize] = useState<"0.5" | "1" | "1.5">("1");
    const [selectedDurationMonths, setSelectedDurationMonths] = useState<number>(1);
    const [selectedPlanProduct, setSelectedPlanProduct] = useState<Product | null>(null);
    const [selectedCustomDays, setSelectedCustomDays] = useState<string[]>(["mon", "wed", "fri"]);

    const getCustomFrequencyLabel = useCallback((days: string[]) => {
        if (days.length === 7) return "Daily (7 Days/Wk)";
        if (days.length === 5 && !days.includes("sat") && !days.includes("sun")) return "Weekdays (Mon-Fri)";
        if (days.length === 2 && days.includes("sat") && days.includes("sun")) return "Weekends Only";
        if (days.length === 3 && days.includes("mon") && days.includes("wed") && days.includes("fri")) return "Mon, Wed, Fri";
        if (days.length === 3 && days.includes("tue") && days.includes("thu") && days.includes("sat")) return "Tue, Thu, Sat";
        return `Custom (${days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")})`;
    }, []);

    const getProductForBottleSize = useCallback((bottleSize: "0.5" | "1" | "1.5") => {
        const allProds = products.length > 0 ? products : storeProducts;
        if (allProds.length === 0) return defaultMilkProduct;

        const match = allProds.find((p) => {
            const name = (p.name || "").toLowerCase();
            if (bottleSize === "0.5") {
                return name.includes("1/2") || name.includes("0.5") || name.includes("500");
            }
            if (bottleSize === "1.5") {
                return name.includes("1.5");
            }
            if (bottleSize === "1") {
                return (name.includes("1 litre") || name.includes("1l") || name.includes("1 l")) && !name.includes("1.5");
            }
            return false;
        });

        return match || defaultMilkProduct || allProds[0];
    }, [products, storeProducts, defaultMilkProduct]);

    const activePlanProduct = useMemo(() => {
        const matched = getProductForBottleSize(selectedBottleSize);
        if (matched) return matched;
        if (selectedPlanProduct) return selectedPlanProduct;
        if (defaultMilkProduct) return defaultMilkProduct;
        if (availableSubscriptionProducts.length > 0) return availableSubscriptionProducts[0];
        if (products.length > 0) return products[0];
        return null;
    }, [getProductForBottleSize, selectedBottleSize, selectedPlanProduct, defaultMilkProduct, availableSubscriptionProducts, products]);

    const activeRate = useMemo(() => {
        if (!activePlanProduct) return defaultLivePrice || 0;
        return getProductPrice(activePlanProduct.id) || Number(activePlanProduct.unit_price || activePlanProduct.price || 0);
    }, [activePlanProduct, getProductPrice, defaultLivePrice]);

    const singleDayDeliveryCost = useMemo(() => {
        if (!activePlanProduct) return Number(((defaultLivePrice || 0) * selectedDeliveryQty).toFixed(2));
        const prodPrice = getProductPrice(activePlanProduct.id) || Number(activePlanProduct.unit_price || activePlanProduct.price || 0);
        if (!prodPrice || prodPrice === 0) return Number(((defaultLivePrice || 0) * selectedDeliveryQty).toFixed(2));

        const name = (activePlanProduct.name || "").toLowerCase();
        if ((name.includes("1/2") || name.includes("0.5")) && defaultLivePrice > 0 && prodPrice < defaultLivePrice * 0.75) {
            return Number(((selectedDeliveryQty / 0.5) * prodPrice).toFixed(2));
        }
        if (name.includes("1.5") && defaultLivePrice > 0 && prodPrice > defaultLivePrice * 1.2) {
            return Number(((selectedDeliveryQty / 1.5) * prodPrice).toFixed(2));
        }
        return Number((prodPrice * selectedDeliveryQty).toFixed(2));
    }, [activePlanProduct, getProductPrice, defaultLivePrice, selectedDeliveryQty]);

    const deliveriesPerMonth = useMemo(() => {
        if (selectedPlanTab === "daily") return 30;
        if (selectedPlanTab === "alternate") return 15;
        const daysPerWeek = selectedCustomDays.length || 1;
        return Math.round(daysPerWeek * 4.33);
    }, [selectedPlanTab, selectedCustomDays]);

    const totalDeliveries = useMemo(() => {
        return deliveriesPerMonth * selectedDurationMonths;
    }, [deliveriesPerMonth, selectedDurationMonths]);

    const estimatedMonthlyCost = useMemo(() => {
        return Number((singleDayDeliveryCost * deliveriesPerMonth).toFixed(2));
    }, [singleDayDeliveryCost, deliveriesPerMonth]);

    const totalSubscriptionCost = useMemo(() => {
        return Number((singleDayDeliveryCost * totalDeliveries).toFixed(2));
    }, [singleDayDeliveryCost, totalDeliveries]);

    const getBottleBreakdown = (qty: number, bottleSize: "0.5" | "1" | "1.5") => {
        if (bottleSize === "0.5") {
            const bottles = Math.round(qty / 0.5);
            return `${bottles} × 1/2L bottle${bottles > 1 ? "s" : ""}`;
        } else if (bottleSize === "1.5") {
            if (qty === 1.5) return "1 × 1.5L bottle";
            if (qty === 3.0) return "2 × 1.5L bottles";
            if (qty === 4.5) return "3 × 1.5L bottles";
            if (qty < 1.5) return `1 × 1.5L bottle`;
            const full = Math.floor(qty / 1.5);
            const rem = parseFloat((qty - full * 1.5).toFixed(1));
            if (rem === 0) {
                return `${full} × 1.5L bottle${full > 1 ? "s" : ""}`;
            } else if (rem === 0.5) {
                return `${full} × 1.5L + 1 × 1/2L bottle`;
            } else if (rem === 1.0) {
                return `${full} × 1.5L + 1 × 1L bottle`;
            }
            return `${(qty / 1.5).toFixed(1)} × 1.5L bottles`;
        } else {
            if (qty === 0.5) {
                return "1 × 1/2L bottle";
            }
            if (qty % 1 === 0) {
                return `${qty} × 1L bottle${qty > 1 ? "s" : ""}`;
            }
            const fullL = Math.floor(qty);
            return `${fullL} × 1L + 1 × 1/2L bottle`;
        }
    };

    const handleOpenPlanCategory = (tab: "daily" | "alternate" | "custom") => {
        setSelectedPlanTab(tab);
        if (!selectedPlanProduct && (defaultMilkProduct || availableSubscriptionProducts[0])) {
            setSelectedPlanProduct(defaultMilkProduct || availableSubscriptionProducts[0]);
        }
        predefinedSheetRef.current?.present();
    };

    const handleTabSwitch = (tab: "daily" | "alternate" | "custom") => {
        setSelectedPlanTab(tab);
        if (!selectedPlanProduct && (defaultMilkProduct || availableSubscriptionProducts[0])) {
            setSelectedPlanProduct(defaultMilkProduct || availableSubscriptionProducts[0]);
        }
    };

    const handlePredefinedPlansOpen = () => handleOpenPlanCategory("daily");
    const handleCustomPlanOpen = () => handleOpenPlanCategory("custom");

    // Bottom Sheet Refs & Snap Points
    const statusSheetRef = useRef<BottomSheetModal>(null);
    const predefinedSheetRef = useRef<BottomSheetModal>(null);
    const customSheetRef = useRef<BottomSheetModal>(null);

    const statusSnapPoints = useMemo(() => ["75%"], []);
    const configureSubSnapPoints = useMemo(() => ["95%"], []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={0.5}
            />
        ),
        []
    );

    // Calendar states
    const [isSelectingVacation, setIsSelectingVacation] = useState(false);
    const [vacationStart, setVacationStart] = useState<string | null>(null);
    const [vacationEnd, setVacationEnd] = useState<string | null>(null);
    const [selectedDayInfo, setSelectedDayInfo] = useState<DailySummary | null>(null);

    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

    // Manage / Update / Delete Subscription states
    const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
    const [isDeletingSub, setIsDeletingSub] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const [editQuantity, setEditQuantity] = useState<number>(1);
    const [editFrequency, setEditFrequency] = useState<string>("daily");
    const [editStartDate, setEditStartDate] = useState<string>("");
    const [editStatus, setEditStatus] = useState<"active" | "paused">("active");

    const handleOpenEditModal = () => {
        if (!selectedSub) return;
        const currentQty = selectedSub.items?.[0]?.quantity || 1;
        setEditQuantity(currentQty);
        setEditFrequency(selectedSub.frequency || "daily");
        setEditStartDate(selectedSub.subscription_start || new Date().toISOString().split("T")[0]);
        setEditStatus(selectedSub.is_paused ? "paused" : "active");
        setShowEditModal(true);
    };

    const handleSaveEditSubscription = async () => {
        if (!selectedSubId || !domainName) return;
        setIsSavingEdit(true);
        try {
            const customerId = user?.customer_uuid || user?.id || 1;
            const productId = selectedSub?.items?.[0]?.product_id || 1;

            const payload = {
                customer: customerId,
                product: productId,
                quantity: editQuantity,
                frequency: editFrequency,
                start_date: editStartDate,
                status: editStatus,
            };

            await subscriptionApi.updateSubscription(domainName, selectedSubId, payload);
            Alert.alert("Success", "Subscription updated successfully.");
            setShowEditModal(false);
            fetchSubs();
        } catch (err: any) {
            Alert.alert("Update Failed", err?.message || "Failed to update subscription.");
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleQuickUpdateQuantity = async (newQty: number) => {
        if (!selectedSubId || !domainName || newQty < 1) return;
        setIsUpdatingQuantity(true);
        try {
            const productId = selectedSub?.items?.[0]?.product_id;
            await subscriptionApi.updateSubscriptionQuantity(domainName, selectedSubId, {
                quantity: newQty,
                ...(productId ? { product: productId } : {}),
            });
            Alert.alert("Success", `Delivery quantity updated to ${newQty}.`);
            fetchSubs();
        } catch (err: any) {
            Alert.alert("Update Failed", err?.message || "Failed to update quantity.");
        } finally {
            setIsUpdatingQuantity(false);
        }
    };

    const handleConfirmDeleteSubscription = () => {
        if (!selectedSubId || !domainName) return;
        const planName = selectedSub?.items?.[0]?.product_name || "this subscription";

        Alert.alert(
            "Cancel Subscription",
            `Are you sure you want to cancel and delete ${planName}? This action cannot be undone.`,
            [
                { text: "Keep Subscription", style: "cancel" },
                {
                    text: "Yes, Delete",
                    style: "destructive",
                    onPress: async () => {
                        setIsDeletingSub(true);
                        try {
                            await subscriptionApi.deleteSubscription(domainName, selectedSubId);
                            Alert.alert("Deleted", "Your subscription has been cancelled and deleted.");
                            setSelectedSubId(null);
                            fetchSubs();
                        } catch (err: any) {
                            Alert.alert("Delete Failed", err?.message || "Failed to delete subscription.");
                        } finally {
                            setIsDeletingSub(false);
                        }
                    },
                },
            ]
        );
    };


    const fetchSubs = async () => {
        if (!domainName || !user?.id) return;
        if (!refreshing) {
            setLoading(true);
        }
        try {
            const targetId = user.customer_uuid || user.id.toString();

            let summaryData: any = { subscriptions: [] };
            let modelsData: any[] = [];
            let productsData: Product[] = [];

            try {
                summaryData = await subscriptionApi.getCustomerMonthlySummary(domainName, targetId, currentYear, currentMonth);
                if (summaryData?.customer_id && isValidUuid(summaryData.customer_id) && user && !user.customer_uuid) {
                    useAuthStore.getState().setUser({
                        ...user,
                        customer_uuid: summaryData.customer_id.trim(),
                    });
                }
            } catch (err) {
                console.warn("Failed to fetch monthly summary:", err);
            }

            try {
                modelsData = await subscriptionApi.getGroupedSummary(domainName);
            } catch (err) {
                console.warn("Failed to fetch subscription models:", err);
            }

            try {
                const rawProds: any = await productApi.getProducts(domainName);
                productsData = Array.isArray(rawProds) ? rawProds : (rawProds?.results || []);
                if (productsData && productsData.length > 0) {
                    setGlobalProducts(productsData);
                }
            } catch (err) {
                console.warn("Failed to fetch products:", err);
            }

            setProducts(productsData || []);

            // Helper to match a model with real product from inventory API
            const findMatchedProduct = (m: any) => {
                const mId = m.product_id ?? m.id;
                const mName = (m.product_name || m.name || "").trim().toLowerCase();
                const mSku = (m.sku || "").trim().toLowerCase();

                return (productsData || []).find((p) => {
                    if (mId != null && String(p.id) === String(mId)) return true;
                    if (mSku && p.sku && p.sku.toLowerCase() === mSku) return true;
                    const pName = (p.name || "").trim().toLowerCase();
                    if (mName && pName && (pName === mName || pName.includes(mName) || mName.includes(pName))) return true;
                    return false;
                });
            };

            const defaultMilkProd = (productsData || []).find((p) => p.name?.toLowerCase().includes("milk") && Number(p.unit_price || p.price || 0) > 0) || (productsData || [])[0];
            const defaultLive = defaultMilkProd ? Number(defaultMilkProd.unit_price || defaultMilkProd.price || 0) : 0;

            const milkProducts = (productsData || []).filter((p) => {
                const name = (p.name || "").toLowerCase();
                const cat = (p.category || "").toLowerCase();
                return name.includes("milk") || cat.includes("milk") || cat.includes("dairy");
            });
            const targetProds = milkProducts.length > 0 ? milkProducts : (productsData || []);

            let effectiveModels: any[] = [...(modelsData || [])];

            // Ensure every dairy/milk product has a Daily and an Alternate plan option
            targetProds.forEach((prod) => {
                const prodPrice = getProductPrice(prod.id) || Number(prod.unit_price || prod.price || 0);
                const hasDaily = effectiveModels.some(
                    (m) => String(m.product_id ?? m.id) === String(prod.id) && m.frequency?.toLowerCase() === "daily"
                );
                if (!hasDaily) {
                    effectiveModels.push({
                        id: `${prod.id}_daily`,
                        product_id: prod.id,
                        product_name: prod.name,
                        frequency: "daily",
                        frequency_display: "Daily",
                        quantity: 1,
                        unit: prod.unit || "Litre",
                        unit_price: prodPrice,
                        price: prodPrice,
                        count: 0,
                    });
                }

                const hasAlternate = effectiveModels.some(
                    (m) => String(m.product_id ?? m.id) === String(prod.id) && m.frequency?.toLowerCase() === "alternate"
                );
                if (!hasAlternate) {
                    effectiveModels.push({
                        id: `${prod.id}_alternate`,
                        product_id: prod.id,
                        product_name: prod.name,
                        frequency: "alternate",
                        frequency_display: "Alternate Days",
                        quantity: 1,
                        unit: prod.unit || "Litre",
                        unit_price: prodPrice,
                        price: prodPrice,
                        count: 0,
                    });
                }
            });

            // Enrich all models with actual live prices
            const enrichedModels = effectiveModels.map((m: any) => {
                const matched = findMatchedProduct(m);
                const storePrice = getProductPrice(m.product_id || matched?.id || m.product_name);
                const liveUnitPrice = storePrice > 0
                    ? storePrice
                    : (matched
                        ? Number(matched.unit_price || matched.price || 0)
                        : (Number(m.unit_price || m.price || 0) || defaultLive));

                return {
                    ...m,
                    product_id: m.product_id || matched?.id,
                    product_name: matched?.name || m.product_name,
                    unit_price: liveUnitPrice,
                    price: liveUnitPrice,
                    unit: m.unit || matched?.unit || "Litre",
                };
            });

            const subList: SubscriptionSummary[] = summaryData.subscriptions || [];
            setSubs(subList);
            setModels(enrichedModels);

            // Auto-select
            if (subList.length > 0) {
                if (!selectedSubId || !subList.some((s: SubscriptionSummary) => s.subscription_id === selectedSubId)) {
                    setSelectedSubId(subList[0].subscription_id);
                }
            } else {
                setSelectedSubId(null);
            }
        } catch (e) {
            console.warn("Failed to fetch subscriptions:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (domainName) {
            fetchSubs();
        }
    }, [domainName, currentYear, currentMonth]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSubs();
    };

    const handleSubscribe = (model: any) => {
        setSubscribingModel(model);
        setSelectedFrequency("daily");
        setSelectedQty(1.0);
        customSheetRef.current?.present();
    };

    const selectedSub = subs.find((s) => s.subscription_id === selectedSubId);

    const handleDayPress = (day: DateData) => {
        if (!isSelectingVacation) {
            const dayInfo = selectedSub?.daily?.find((d) => d.date === day.dateString);
            if (dayInfo) {
                setSelectedDayInfo(dayInfo);
            } else {
                setSelectedDayInfo({
                    date: day.dateString,
                    status: "not_active",
                });
            }
            statusSheetRef.current?.present();
            return;
        }

        const todayStr = new Date().toISOString().split("T")[0];
        if (day.dateString < todayStr) {
            Alert.alert("Invalid Date", "You cannot select a past date for a vacation gap.");
            return;
        }

        if (!vacationStart || (vacationStart && vacationEnd)) {
            setVacationStart(day.dateString);
            setVacationEnd(null);
        } else {
            const d1 = new Date(vacationStart);
            const d2 = new Date(day.dateString);
            if (d2 < d1) {
                setVacationStart(day.dateString);
                setVacationEnd(vacationStart);
            } else {
                setVacationEnd(day.dateString);
            }
        }
    };

    const submitVacation = async () => {
        if (!selectedSubId || !vacationStart) {
            Alert.alert("Incomplete", "Please select at least a start date.");
            return;
        }
        const end = vacationEnd || vacationStart;
        try {
            await subscriptionApi.addVacationGap(
                domainName,
                selectedSubId,
                vacationStart,
                end
            );
            Alert.alert("Success", "Vacation gap scheduled!");
            setIsSelectingVacation(false);
            setVacationStart(null);
            setVacationEnd(null);
            fetchSubs();
        } catch {
            Alert.alert("Error", "Could not set vacation gap.");
        }
    };

    const buildMarkedDates = () => {
        const marked: any = {};

        if (selectedSub?.daily) {
            selectedSub.daily.forEach((dayInfo: any) => {
                let color = "";
                let textColor = "#1A1A1A";
                if (dayInfo.status === "delivered") {
                    color = "rgba(34, 197, 94, 0.15)";
                    textColor = "#15803D";
                } else if (dayInfo.status === "scheduled") {
                    color = "rgba(59, 130, 246, 0.15)";
                    textColor = "#1D4ED8";
                } else if (dayInfo.status === "vacation") {
                    color = "rgba(245, 158, 11, 0.15)";
                    textColor = "#C2410C";
                } else if (dayInfo.status === "skipped" || dayInfo.status === "undelivered") {
                    color = "rgba(239, 68, 68, 0.15)";
                    textColor = "#B91C1C";
                }

                if (color) {
                    marked[dayInfo.date] = {
                        selected: true,
                        selectedColor: color,
                        selectedTextColor: textColor,
                        color: color,
                        textColor: textColor
                    };
                }
            });
        }

        if (isSelectingVacation && vacationStart) {
            let startStr = vacationStart;
            let endStr = vacationEnd || vacationStart;

            if (new Date(startStr) > new Date(endStr)) {
                startStr = vacationEnd!;
                endStr = vacationStart;
            }

            if (startStr === endStr) {
                marked[startStr] = {
                    selected: true,
                    startingDay: true,
                    endingDay: true,
                    color: "#6366F1",
                    textColor: "white",
                    selectedColor: "#6366F1",
                    selectedTextColor: "white",
                };
            } else {
                marked[startStr] = {
                    selected: true,
                    startingDay: true,
                    color: "#6366F1",
                    textColor: "white",
                    selectedColor: "#6366F1",
                    selectedTextColor: "white",
                };
                let current = new Date(startStr);
                const end = new Date(endStr);
                current.setDate(current.getDate() + 1);
                while (current < end) {
                    const dateStr = current.toISOString().split("T")[0];
                    marked[dateStr] = {
                        selected: true,
                        color: "#A5B4FC",
                        textColor: "white",
                        selectedColor: "#A5B4FC",
                        selectedTextColor: "white",
                    };
                    current.setDate(current.getDate() + 1);
                }
                marked[endStr] = {
                    selected: true,
                    endingDay: true,
                    color: "#6366F1",
                    textColor: "white",
                    selectedColor: "#6366F1",
                    selectedTextColor: "white",
                };
            }
        }

        return marked;
    };

    return (
        <ScreenWrapper
            showHeader={true}
            title="Subscriptions"
            headerBgColor="#1B5E37"
            screenBgColor="#F5F8F6"
        >
            {isFocused && <StatusBar style="light" translucent backgroundColor="transparent" />}

            {loading && subs.length === 0 && models.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#1B5E37" />
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {subs.length === 0 ? (
                        <View className="mt-4">
                            {/* Empty state visual */}
                            <View className="mb-6 items-center justify-center px-4 py-8 bg-white border border-gray-100 rounded-3xl">
                                <View className="h-16 w-16 bg-[#E8F5EE] rounded-full items-center justify-center mb-4">
                                    <Ionicons name="calendar-outline" size={32} color="#1B5E37" />
                                </View>
                                <Text className="text-center text-[16px] font-black text-gray-900">
                                    No Active Subscriptions
                                </Text>
                                <Text className="mt-1.5 text-center text-[12px] text-gray-500 leading-normal max-w-[240px]">
                                    You don't have any active subscriptions yet. Select from our plans below to set up daily deliveries.
                                </Text>
                            </View>

                            {/* Three Trigger Components: Daily, Alternate, Custom */}
                            <Text className="mb-3 text-[12px] font-black text-gray-400 uppercase tracking-widest">
                                Subscribe to Pench Fresh
                            </Text>

                            <View className="flex-row gap-2.5 mb-6">
                                {/* Button 1: Daily */}
                                <TouchableOpacity
                                    onPress={() => handleOpenPlanCategory("daily")}
                                    activeOpacity={0.88}
                                    className="flex-1 bg-white border border-gray-150 p-3 rounded-2xl items-center text-center shadow-xs"
                                >
                                    <View className="h-10 w-10 rounded-full bg-[#1B5E37]/10 items-center justify-center mb-2">
                                        <Ionicons name="sunny-outline" size={18} color="#1B5E37" />
                                    </View>
                                    <Text className="text-[12px] font-black text-gray-900 text-center">Daily</Text>
                                    <Text className="text-[10px] font-black text-[#1B5E37] mt-1 text-center">
                                        {defaultLivePrice > 0 ? `₹${defaultLivePrice}/${defaultMilkProduct?.unit || 'L'}` : "Live Rate"}
                                    </Text>
                                    <Text className="text-[8.5px] font-semibold text-gray-400 text-center mt-0.5 leading-tight">
                                        Everyday
                                    </Text>
                                </TouchableOpacity>

                                {/* Button 2: Alternate */}
                                <TouchableOpacity
                                    onPress={() => handleOpenPlanCategory("alternate")}
                                    activeOpacity={0.88}
                                    className="flex-1 bg-white border border-gray-150 p-3 rounded-2xl items-center text-center shadow-xs"
                                >
                                    <View className="h-10 w-10 rounded-full bg-[#1B5E37]/10 items-center justify-center mb-2">
                                        <Ionicons name="swap-horizontal-outline" size={18} color="#1B5E37" />
                                    </View>
                                    <Text className="text-[12px] font-black text-gray-900 text-center">Alternate</Text>
                                    <Text className="text-[10px] font-black text-[#1B5E37] mt-1 text-center">
                                        {defaultLivePrice > 0 ? `₹${defaultLivePrice}/${defaultMilkProduct?.unit || 'L'}` : "Live Rate"}
                                    </Text>
                                    <Text className="text-[8.5px] font-semibold text-gray-400 text-center mt-0.5 leading-tight">
                                        Every 2nd day
                                    </Text>
                                </TouchableOpacity>

                                {/* Button 3: Custom */}
                                <TouchableOpacity
                                    onPress={() => handleOpenPlanCategory("custom")}
                                    activeOpacity={0.88}
                                    className="flex-1 bg-white border border-gray-150 p-3 rounded-2xl items-center text-center shadow-xs"
                                >
                                    <View className="h-10 w-10 rounded-full bg-[#1B5E37]/10 items-center justify-center mb-2">
                                        <Ionicons name="options-outline" size={18} color="#1B5E37" />
                                    </View>
                                    <Text className="text-[12px] font-black text-gray-900 text-center">Custom</Text>
                                    <Text className="text-[10px] font-black text-[#1B5E37] mt-1 text-center">
                                        {defaultLivePrice > 0 ? `From ₹${defaultLivePrice}/${defaultMilkProduct?.unit || 'L'}` : "Flexible"}
                                    </Text>
                                    <Text className="text-[8.5px] font-semibold text-gray-400 text-center mt-0.5 leading-tight">
                                        Your schedule
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            {/* Compact List of Subscriptions */}
                            <View className="mb-4">
                                <Text className="mb-2.5 text-[12px] font-black text-gray-400 uppercase tracking-widest">
                                    Your Active Plans
                                </Text>
                                {subs.map((item, index) => {
                                    const isSelected = item.subscription_id === selectedSubId;
                                    const title = item.items?.[0]?.product_name || `Plan ${index + 1}`;
                                    const isPaused = item.is_paused;
                                    const quantity = item.items?.[0]?.quantity || 1;

                                    return (
                                        <TouchableOpacity
                                            key={item.subscription_id}
                                            onPress={() => {
                                                setSelectedSubId(item.subscription_id);
                                                setIsSelectingVacation(false);
                                                setVacationStart(null);
                                                setVacationEnd(null);
                                            }}
                                            activeOpacity={0.88}
                                            className="p-3.5 mb-2.5 rounded-2xl border flex-row items-center justify-between"
                                            style={{
                                                backgroundColor: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.8)",
                                                borderColor: isSelected ? "#1B5E37" : "#F3F4F6",
                                                ...(isSelected ? {
                                                    shadowColor: "#000",
                                                    shadowOffset: { width: 0, height: 1 },
                                                    shadowOpacity: 0.05,
                                                    shadowRadius: 2,
                                                    elevation: 2,
                                                } : {})
                                            }}
                                        >
                                            <View className="flex-row items-center gap-3 flex-1 pr-2">
                                                <View className={`h-10 w-10 rounded-xl items-center justify-center ${isSelected ? "bg-[#1B5E37]/10" : "bg-gray-100"}`}>
                                                    <Ionicons name="repeat" size={18} color={isSelected ? "#1B5E37" : "#4B5563"} />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-[13px] font-black text-gray-900 leading-tight" numberOfLines={1}>
                                                        {title}
                                                    </Text>
                                                    <Text className="text-[10px] font-bold text-gray-500 mt-1 leading-none">
                                                        {item.frequency_display} • Qty: {quantity} {item.items?.[0]?.product_id ? "Litre(s)" : ""}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="flex-row items-center gap-2">
                                                <View className={`px-2.5 py-0.5 rounded-full ${isPaused ? "bg-amber-100" : "bg-[#EAF5EF]"}`}>
                                                    <Text className={`text-[8px] font-black ${isPaused ? "text-amber-700" : "text-[#15803D]"} uppercase`}>
                                                        {isPaused ? "Paused" : "Active"}
                                                    </Text>
                                                </View>
                                                {isSelected && <Ionicons name="checkmark-circle" size={16} color="#1B5E37" />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Manage Selected Plan Card */}
                            {selectedSub && (
                                <View
                                    className="mb-5 rounded-2xl bg-white p-4 border border-gray-150"
                                    style={{
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.05,
                                        shadowRadius: 3,
                                        elevation: 2,
                                    }}
                                >
                                    <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
                                        <View className="flex-row items-center gap-2">
                                            <View className="h-7 w-7 rounded-lg bg-[#1B5E37]/10 items-center justify-center">
                                                <Ionicons name="options" size={15} color="#1B5E37" />
                                            </View>
                                            <View>
                                                <Text className="text-[12px] font-black text-gray-900 uppercase tracking-wider">
                                                    Manage Selected Plan
                                                </Text>
                                                <Text className="text-[10px] font-medium text-gray-400">
                                                    {selectedSub.items?.[0]?.product_name || "Milk Plan"}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className={`px-2.5 py-0.5 rounded-full ${selectedSub.is_paused ? "bg-amber-100" : "bg-[#EAF5EF]"}`}>
                                            <Text className={`text-[9px] font-black ${selectedSub.is_paused ? "text-amber-800" : "text-[#15803D]"} uppercase`}>
                                                {selectedSub.status || (selectedSub.is_paused ? "Paused" : "Active")}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Quick Quantity Stepper */}
                                    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                                        <View>
                                            <Text className="text-[11px] font-bold text-gray-500 uppercase">Daily Quantity</Text>
                                            <Text className="text-[13px] font-black text-gray-900 mt-0.5">
                                                {selectedSub.items?.[0]?.quantity || 1} {selectedSub.items?.[0]?.product_id ? "Litre(s)" : "Bottle(s)"}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center gap-2">
                                            <TouchableOpacity
                                                onPress={() => handleQuickUpdateQuantity((selectedSub.items?.[0]?.quantity || 1) - 1)}
                                                disabled={isUpdatingQuantity || (selectedSub.items?.[0]?.quantity || 1) <= 1}
                                                activeOpacity={0.7}
                                                className={`h-8 w-8 rounded-lg items-center justify-center border ${(selectedSub.items?.[0]?.quantity || 1) <= 1
                                                        ? "bg-gray-50 border-gray-200"
                                                        : "bg-white border-gray-300"
                                                    }`}
                                            >
                                                <Ionicons
                                                    name="remove"
                                                    size={16}
                                                    color={(selectedSub.items?.[0]?.quantity || 1) <= 1 ? "#9CA3AF" : "#1B5E37"}
                                                />
                                            </TouchableOpacity>

                                            <View className="min-w-8 items-center">
                                                {isUpdatingQuantity ? (
                                                    <ActivityIndicator size="small" color="#1B5E37" />
                                                ) : (
                                                    <Text className="text-[14px] font-black text-gray-900">
                                                        {selectedSub.items?.[0]?.quantity || 1}
                                                    </Text>
                                                )}
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => handleQuickUpdateQuantity((selectedSub.items?.[0]?.quantity || 1) + 1)}
                                                disabled={isUpdatingQuantity}
                                                activeOpacity={0.7}
                                                className="h-8 w-8 rounded-lg bg-[#1B5E37] items-center justify-center shadow-2xs"
                                            >
                                                <Ionicons name="add" size={16} color="#FFFFFF" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Action Buttons: Edit Details & Cancel Plan */}
                                    <View className="flex-row items-center gap-2.5 pt-3">
                                        <TouchableOpacity
                                            onPress={handleOpenEditModal}
                                            activeOpacity={0.8}
                                            className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gray-50 border border-gray-200 active:bg-gray-100"
                                        >
                                            <Ionicons name="create-outline" size={15} color="#1F2937" />
                                            <Text className="text-[12px] font-black text-gray-800">Edit Details</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleConfirmDeleteSubscription}
                                            disabled={isDeletingSub}
                                            activeOpacity={0.8}
                                            className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-50 border border-red-200 active:bg-red-100"
                                        >
                                            {isDeletingSub ? (
                                                <ActivityIndicator size="small" color="#DC2626" />
                                            ) : (
                                                <>
                                                    <Ionicons name="trash-outline" size={15} color="#DC2626" />
                                                    <Text className="text-[12px] font-black text-red-600">Cancel Plan</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Get Subscription Section */}
                            <View className="mb-6">
                                <Text className="mb-3 text-[12px] font-black text-gray-400 uppercase tracking-widest">
                                    Get Subscription
                                </Text>

                                <View className="flex-row gap-2.5">
                                    {/* Button 1: Daily */}
                                    <TouchableOpacity
                                        onPress={() => handleOpenPlanCategory("daily")}
                                        activeOpacity={0.88}
                                        className="flex-1 bg-white border border-gray-150 p-3 rounded-2xl items-center text-center shadow-xs"
                                    >
                                        <View className="h-10 w-10 rounded-full bg-[#1B5E37]/10 items-center justify-center mb-2">
                                            <Ionicons name="sunny-outline" size={18} color="#1B5E37" />
                                        </View>
                                        <Text className="text-[12px] font-black text-gray-900 text-center">Daily</Text>
                                        <Text className="text-[10px] font-black text-[#1B5E37] mt-1 text-center">
                                            {defaultLivePrice > 0 ? `₹${defaultLivePrice}/${defaultMilkProduct?.unit || 'L'}` : "Live Rate"}
                                        </Text>
                                        <Text className="text-[8.5px] font-semibold text-gray-400 text-center mt-0.5 leading-tight">
                                            Everyday
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Button 2: Alternate */}
                                    <TouchableOpacity
                                        onPress={() => handleOpenPlanCategory("alternate")}
                                        activeOpacity={0.88}
                                        className="flex-1 bg-white border border-gray-150 p-3 rounded-2xl items-center text-center shadow-xs"
                                    >
                                        <View className="h-10 w-10 rounded-full bg-[#1B5E37]/10 items-center justify-center mb-2">
                                            <Ionicons name="swap-horizontal-outline" size={18} color="#1B5E37" />
                                        </View>
                                        <Text className="text-[12px] font-black text-gray-900 text-center">Alternate</Text>
                                        <Text className="text-[10px] font-black text-[#1B5E37] mt-1 text-center">
                                            {defaultLivePrice > 0 ? `₹${defaultLivePrice}/${defaultMilkProduct?.unit || 'L'}` : "Live Rate"}
                                        </Text>
                                        <Text className="text-[8.5px] font-semibold text-gray-400 text-center mt-0.5 leading-tight">
                                            Every 2nd day
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Button 3: Custom */}
                                    <TouchableOpacity
                                        onPress={() => handleOpenPlanCategory("custom")}
                                        activeOpacity={0.88}
                                        className="flex-1 bg-white border border-gray-150 p-3 rounded-2xl items-center text-center shadow-xs"
                                    >
                                        <View className="h-10 w-10 rounded-full bg-[#1B5E37]/10 items-center justify-center mb-2">
                                            <Ionicons name="options-outline" size={18} color="#1B5E37" />
                                        </View>
                                        <Text className="text-[12px] font-black text-gray-900 text-center">Custom</Text>
                                        <Text className="text-[10px] font-black text-[#1B5E37] mt-1 text-center">
                                            {defaultLivePrice > 0 ? `From ₹${defaultLivePrice}/${defaultMilkProduct?.unit || 'L'}` : "Flexible"}
                                        </Text>
                                        <Text className="text-[8.5px] font-semibold text-gray-400 text-center mt-0.5 leading-tight">
                                            Your schedule
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>


                            {/* Delivery Calendar for selected subscription */}
                            {selectedSub && (
                                <View className="mt-4">
                                    <Text className="mb-3 text-[14px] font-bold text-gray-500 uppercase tracking-wider">
                                        Delivery Calendar
                                    </Text>

                                    {/* Calendar Card */}
                                    {loading ? (
                                        <CalendarSkeleton />
                                    ) : (
                                        <View
                                            className="mb-4 rounded-2xl bg-white p-4 border border-gray-100"
                                            style={{
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.05,
                                                shadowRadius: 2,
                                                elevation: 2,
                                            }}
                                        >
                                            <Calendar
                                                current={`${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`}
                                                key={`${currentYear}-${currentMonth}`}
                                                onMonthChange={(date) => {
                                                    setLoading(true);
                                                    setCurrentYear(date.year);
                                                    setCurrentMonth(date.month);
                                                }}
                                                minDate={isSelectingVacation ? new Date().toISOString().split("T")[0] : undefined}
                                                markingType={isSelectingVacation ? "period" : "dot"}
                                                markedDates={buildMarkedDates()}
                                                onDayPress={handleDayPress}
                                                theme={{
                                                    todayTextColor: "#1B5E37",
                                                    arrowColor: "#1B5E37",
                                                    textDayFontWeight: "500",
                                                    textMonthFontWeight: "bold",
                                                }}
                                            />
                                        </View>
                                    )}

                                    {isSelectingVacation && (
                                        <View className="mb-4 px-1">
                                            <Text className="text-[12px] text-gray-900 font-bold leading-normal">
                                                Instructions: Tap a start date and then an end date to pause your delivery. Tap the same day twice for a 1-day pause.
                                            </Text>
                                        </View>
                                    )}

                                    {/* Action Pause / Schedule Button */}
                                    {!isSelectingVacation ? (
                                        <TouchableOpacity
                                            onPress={() => setIsSelectingVacation(true)}
                                            className="rounded-xl bg-[#1B5E37] py-3.5 items-center"
                                            style={{
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.05,
                                                shadowRadius: 1,
                                                elevation: 1,
                                            }}
                                        >
                                            <Text className="text-[15px] font-bold text-white">
                                                Pause Delivery (Vacation Gap)
                                            </Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View className="rounded-xl bg-gray-100 p-4 border border-gray-200">
                                            <View className="flex-row gap-3">
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setIsSelectingVacation(false);
                                                        setVacationStart(null);
                                                        setVacationEnd(null);
                                                    }}
                                                    className="flex-1 rounded-lg bg-white py-2.5 items-center border border-gray-300"
                                                >
                                                    <Text className="text-[14px] font-bold text-gray-700">Cancel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={submitVacation}
                                                    disabled={!vacationStart}
                                                    className={`flex-1 rounded-lg py-2.5 items-center ${vacationStart ? "bg-[#1B5E37]" : "bg-gray-400"
                                                        }`}
                                                >
                                                    <Text className="text-[14px] font-bold text-white">Confirm</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            )}



            {/* Modal for Delivery Status Details */}
            <BottomSheetModal
                ref={statusSheetRef}
                index={0}
                snapPoints={statusSnapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: selectedDayInfo ? getStatusDetails(selectedDayInfo.status).sheetBg : "#F5F8F6" }}
                handleIndicatorStyle={{ backgroundColor: "#D1D5DB" }}
            >
                <BottomSheetView style={{ flex: 1 }}>
                    <View className="flex-1 p-6">
                        {selectedDayInfo && (() => {
                            const details = getStatusDetails(selectedDayInfo.status);
                            const items = selectedSub?.items || [];
                            return (
                                <>
                                    {/* Modal Header */}
                                    <View className="flex-row justify-between items-center mb-5 pb-3 border-b border-neutral-100">
                                        <View>
                                            <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                                Delivery Details
                                            </Text>
                                            <Text className="text-[16px] font-bold text-gray-900 mt-0.5">
                                                {formatDateString(selectedDayInfo.date)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => statusSheetRef.current?.dismiss()}
                                            activeOpacity={0.7}
                                            style={{ backgroundColor: "rgba(229, 229, 229, 0.6)", height: 32, width: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Ionicons name="close" size={18} color="#4A4A4A" />
                                        </TouchableOpacity>
                                    </View>

                                    <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                                        {/* Status Card */}
                                        <View className={`rounded-2xl p-4 border flex-row items-center gap-4 mb-5 ${details.bgClass}`}>
                                            <View
                                                style={{
                                                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                                                    shadowColor: "#000",
                                                    shadowOffset: { width: 0, height: 1 },
                                                    shadowOpacity: 0.05,
                                                    shadowRadius: 1,
                                                    elevation: 1,
                                                }}
                                                className="h-12 w-12 rounded-full items-center justify-center"
                                            >
                                                <Ionicons name={details.icon} size={26} color={details.iconColor} />
                                            </View>
                                            <View className="flex-1">
                                                <Text className={`text-[15px] font-extrabold ${details.textColor}`}>
                                                    {details.title}
                                                </Text>
                                                <Text className="text-xs text-gray-600 font-medium mt-1 leading-normal">
                                                    {details.description}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Order / Status details */}
                                        {(selectedDayInfo.order_id || selectedDayInfo.order_status) && (
                                            <View className="bg-white rounded-2xl p-4 border border-neutral-100 gap-y-3 mb-5">
                                                {selectedDayInfo.order_id && (
                                                    <View className="flex-row justify-between items-center">
                                                        <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                            Order Reference
                                                        </Text>
                                                        <Text className="text-xs font-bold text-gray-800">
                                                            #{selectedDayInfo.order_id}
                                                        </Text>
                                                    </View>
                                                )}
                                                {selectedDayInfo.order_status && (
                                                    <View className="flex-row justify-between items-center">
                                                        <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                            Order Status
                                                        </Text>
                                                        <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                                                            <Text className="text-[10px] font-bold text-blue-700 uppercase">
                                                                {selectedDayInfo.order_status}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        {/* Subscription Items */}
                                        <View className="mb-6">
                                            <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                                                Items in Delivery
                                            </Text>
                                            {items.length > 0 ? (
                                                <View className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                                                    {items.map((item: any, idx: number) => (
                                                        <View
                                                            key={idx}
                                                            className={`flex-row justify-between items-center px-4 py-3.5 ${idx > 0 ? "border-t border-neutral-50" : ""
                                                                }`}
                                                        >
                                                            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                                                                <View className="h-7 w-7 rounded-full bg-[#E8F5EE] items-center justify-center">
                                                                    <Ionicons name="cube-outline" size={14} color="#1B5E37" />
                                                                </View>
                                                                <Text className="text-xs font-bold text-gray-800 leading-tight" numberOfLines={1}>
                                                                    {item.product_name}
                                                                </Text>
                                                            </View>
                                                            <Text className="text-xs font-extrabold text-gray-700 bg-neutral-100 px-2.5 py-1 rounded-lg">
                                                                Qty: {item.quantity}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            ) : (
                                                <Text className="text-xs text-gray-500 italic">No items listed in subscription</Text>
                                            )}
                                        </View>

                                        {/* Close Button */}
                                        <TouchableOpacity
                                            onPress={() => statusSheetRef.current?.dismiss()}
                                            activeOpacity={0.85}
                                            className="bg-[#1B5E37] py-3.5 rounded-2xl items-center justify-center shadow-md mb-2"
                                            style={{
                                                shadowColor: "#1B5E37",
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.15,
                                                shadowRadius: 6,
                                                elevation: 3,
                                            }}
                                        >
                                            <Text className="text-white text-sm font-bold">
                                                Got It
                                            </Text>
                                        </TouchableOpacity>
                                    </BottomSheetScrollView>
                                </>
                            );
                        })()}
                    </View>
                </BottomSheetView>
            </BottomSheetModal>

            {/* Bottom Sheet for Predefined Subscriptions */}
            <BottomSheetModal
                ref={predefinedSheetRef}
                index={0}
                snapPoints={configureSubSnapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: "#F5F8F6", borderRadius: 32 }}
                handleIndicatorStyle={{ backgroundColor: "#D1D5DB" }}
            >
                <BottomSheetScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 24, paddingBottom: 50 }}
                >
                    {/* Header */}
                    <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-1 pr-3">
                            <View className="flex-row items-center gap-2 mb-1">
                                <View className="h-6 px-2.5 rounded-full bg-[#1B5E37]/10 items-center justify-center">
                                    <Text className="text-[11px] font-black text-[#1B5E37] uppercase tracking-wider">
                                        {selectedPlanTab === "daily"
                                            ? "Daily Plan"
                                            : selectedPlanTab === "alternate"
                                                ? "Alternate Day Plan"
                                                : "Custom Plan"}
                                    </Text>
                                </View>
                            </View>
                            <Text className="text-[20px] font-black text-gray-900 tracking-tight">
                                {selectedPlanTab === "daily"
                                    ? "Daily Milk Delivery"
                                    : selectedPlanTab === "alternate"
                                        ? "Alternate Day Delivery"
                                        : "Create Custom Plan"}
                            </Text>
                            <Text className="text-[12px] text-gray-500 font-medium mt-0.5">
                                {selectedPlanTab === "daily"
                                    ? "Delivered fresh to your doorstep every morning"
                                    : selectedPlanTab === "alternate"
                                        ? "Delivered fresh to your doorstep every second day"
                                        : "Delivered fresh on your selected delivery weekdays"}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => predefinedSheetRef.current?.dismiss()}
                            style={{
                                backgroundColor: "rgba(0, 0, 0, 0.05)",
                                height: 34,
                                width: 34,
                                borderRadius: 17,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Ionicons name="close" size={18} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <View>
                        {/* Section: Select Delivery Days (Custom Only) */}
                        {isCustom && (
                            <View className="bg-white rounded-3xl p-4 border border-gray-200/70 mb-4 shadow-2xs">
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-row items-center gap-2">
                                        <View className="h-5 w-5 rounded-full bg-[#1B5E37] items-center justify-center">
                                            <Text className="text-white text-[10px] font-black">1</Text>
                                        </View>
                                        <Text className="text-[13px] font-black text-gray-900 uppercase tracking-wide">
                                            Select Delivery Days
                                        </Text>
                                    </View>
                                    <View className="px-2 py-0.5 rounded-full bg-[#E8F5EE]">
                                        <Text className="text-[10px] font-black text-[#1B5E37]">
                                            {selectedCustomDays.length} {selectedCustomDays.length === 1 ? "day" : "days"} / week
                                        </Text>
                                    </View>
                                </View>

                                <Text className="text-[11.5px] text-gray-500 font-medium mb-3">
                                    Select the days of the week on which you would like fresh milk delivered to your home:
                                </Text>

                                {/* 7 Weekday Pills */}
                                <View className="flex-row justify-between mb-3.5">
                                    {WEEKDAYS.map((day) => {
                                        const isSelected = selectedCustomDays.includes(day.id);
                                        return (
                                            <TouchableOpacity
                                                key={day.id}
                                                onPress={() => {
                                                    if (isSelected) {
                                                        if (selectedCustomDays.length > 1) {
                                                            setSelectedCustomDays(selectedCustomDays.filter((d) => d !== day.id));
                                                        } else {
                                                            Alert.alert("Select at least 1 day", "Please select at least one delivery day for your custom plan.");
                                                        }
                                                    } else {
                                                        setSelectedCustomDays([...selectedCustomDays, day.id]);
                                                    }
                                                }}
                                                activeOpacity={0.7}
                                                style={{
                                                    width: 40,
                                                    height: 48,
                                                    borderRadius: 14,
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderWidth: 1,
                                                    borderColor: isSelected ? "#1B5E37" : "#E5E7EB",
                                                    backgroundColor: isSelected ? "#1B5E37" : "#F9FAFB",
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: "900",
                                                        color: isSelected ? "#ffffff" : "#1F2937",
                                                    }}
                                                >
                                                    {day.label}
                                                </Text>
                                                <View
                                                    style={{
                                                        width: 5,
                                                        height: 5,
                                                        borderRadius: 2.5,
                                                        marginTop: 3,
                                                        backgroundColor: isSelected ? "#6EE7B7" : "transparent",
                                                    }}
                                                />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Quick Presets */}
                                <View className="flex-row flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                                    {[
                                        { label: "Mon, Wed, Fri", days: ["mon", "wed", "fri"] },
                                        { label: "Tue, Thu, Sat", days: ["tue", "thu", "sat"] },
                                        { label: "Weekdays (Mon-Fri)", days: ["mon", "tue", "wed", "thu", "fri"] },
                                        { label: "Weekends (Sat-Sun)", days: ["sat", "sun"] },
                                        { label: "All 7 Days", days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] },
                                    ].map((preset) => {
                                        const isMatch = preset.days.length === selectedCustomDays.length &&
                                            preset.days.every((d) => selectedCustomDays.includes(d));
                                        return (
                                            <TouchableOpacity
                                                key={preset.label}
                                                onPress={() => setSelectedCustomDays(preset.days)}
                                                activeOpacity={0.7}
                                                style={{
                                                    paddingHorizontal: 10,
                                                    paddingVertical: 6,
                                                    borderRadius: 12,
                                                    borderWidth: 1,
                                                    borderColor: isMatch ? "#1B5E37" : "#E5E7EB",
                                                    backgroundColor: isMatch ? "#E8F5EE" : "#F9FAFB",
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 10,
                                                        fontWeight: "700",
                                                        color: isMatch ? "#1B5E37" : "#4B5563",
                                                    }}
                                                >
                                                    {preset.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {/* Section: Choose Quantity for Delivery */}
                        <View className="bg-white rounded-3xl p-4 border border-gray-200/70 mb-4 shadow-2xs">
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center gap-2">
                                    <View className="h-5 w-5 rounded-full bg-[#1B5E37] items-center justify-center">
                                        <Text className="text-white text-[10px] font-black">{isCustom ? "2" : "1"}</Text>
                                    </View>
                                    <Text className="text-[13px] font-black text-gray-900 uppercase tracking-wide">
                                        Delivery Quantity
                                    </Text>
                                </View>
                                <Text className="text-[11px] font-bold text-[#1B5E37]">
                                    {selectedDeliveryQty} Litre{selectedDeliveryQty > 1 ? "s" : ""} / morning
                                </Text>
                            </View>

                            {/* Stepper Controller */}
                            <View className="flex-row items-center justify-between bg-gray-50/80 border border-gray-100 rounded-2xl p-2.5 mb-3">
                                <TouchableOpacity
                                    onPress={() => setSelectedDeliveryQty((prev) => prev > 0.5 ? parseFloat((prev - 0.5).toFixed(1)) : 0.5)}
                                    className="h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs border border-gray-200/60"
                                    disabled={selectedDeliveryQty <= 0.5}
                                >
                                    <Ionicons name="remove" size={18} color={selectedDeliveryQty <= 0.5 ? "#D1D5DB" : "#1B5E37"} />
                                </TouchableOpacity>

                                <View className="items-center">
                                    <Text className="text-[20px] font-black text-gray-900">
                                        {selectedDeliveryQty} <Text className="text-[14px] font-bold text-gray-500">Litre{selectedDeliveryQty > 1 ? "s" : ""}</Text>
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => setSelectedDeliveryQty((prev) => parseFloat((prev + 0.5).toFixed(1)))}
                                    className="h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs border border-gray-200/60"
                                >
                                    <Ionicons name="add" size={18} color="#1B5E37" />
                                </TouchableOpacity>
                            </View>

                            {/* Quick Presets */}
                            <View className="flex-row gap-1.5">
                                {[0.5, 1.0, 1.5, 2.0, 3.0].map((qtyVal) => {
                                    const isSelected = selectedDeliveryQty === qtyVal;
                                    return (
                                        <TouchableOpacity
                                            key={qtyVal}
                                            onPress={() => setSelectedDeliveryQty(qtyVal)}
                                            activeOpacity={0.8}
                                            className={`flex-1 py-2 rounded-xl items-center justify-center border ${isSelected
                                                    ? "bg-[#1B5E37] border-[#1B5E37]"
                                                    : "bg-white border-gray-200"
                                                }`}
                                        >
                                            <Text className={`text-[12px] font-extrabold ${isSelected ? "text-white" : "text-gray-700"}`}>
                                                {qtyVal}L
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Section 2: Choose Bottle Size */}
                        <View className="bg-white rounded-3xl p-4 border border-gray-200/70 mb-4 shadow-2xs">
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center gap-2">
                                    <View className="h-5 w-5 rounded-full bg-[#1B5E37] items-center justify-center">
                                        <Text className="text-white text-[10px] font-black">{isCustom ? "3" : "2"}</Text>
                                    </View>
                                    <Text className="text-[13px] font-black text-gray-900 uppercase tracking-wide">
                                        Bottle Packaging
                                    </Text>
                                </View>
                                <Text className="text-[11px] font-semibold text-gray-500">
                                    {selectedBottleSize === "0.5" ? "1/2 Litre" : selectedBottleSize === "1.5" ? "1.5 Litres" : "1 Litre"}
                                </Text>
                            </View>

                            <View className="flex-row gap-2 mb-3">
                                {/* 1/2 Litre Option */}
                                <TouchableOpacity
                                    onPress={() => setSelectedBottleSize("0.5")}
                                    activeOpacity={0.85}
                                    className={`flex-1 p-3 rounded-2xl border items-center text-center ${selectedBottleSize === "0.5"
                                            ? "bg-[#E8F5EE] border-[#1B5E37]"
                                            : "bg-gray-50/70 border-gray-200/80"
                                        }`}
                                >
                                    <View className={`h-8 w-8 rounded-full items-center justify-center mb-1.5 ${selectedBottleSize === "0.5" ? "bg-[#1B5E37]" : "bg-white border border-gray-200/60"
                                        }`}>
                                        <Ionicons
                                            name="flask-outline"
                                            size={16}
                                            color={selectedBottleSize === "0.5" ? "#ffffff" : "#4B5563"}
                                        />
                                    </View>
                                    <Text className={`text-[12px] font-black ${selectedBottleSize === "0.5" ? "text-[#1B5E37]" : "text-gray-800"
                                        }`}>
                                        1/2 Litre
                                    </Text>
                                    <Text className="text-[9.5px] font-medium text-gray-400 mt-0.5">
                                        500 ml
                                    </Text>
                                </TouchableOpacity>

                                {/* 1 Litre Option */}
                                <TouchableOpacity
                                    onPress={() => setSelectedBottleSize("1")}
                                    activeOpacity={0.85}
                                    className={`flex-1 p-3 rounded-2xl border items-center text-center ${selectedBottleSize === "1"
                                            ? "bg-[#E8F5EE] border-[#1B5E37]"
                                            : "bg-gray-50/70 border-gray-200/80"
                                        }`}
                                >
                                    <View className={`h-8 w-8 rounded-full items-center justify-center mb-1.5 ${selectedBottleSize === "1" ? "bg-[#1B5E37]" : "bg-white border border-gray-200/60"
                                        }`}>
                                        <Ionicons
                                            name="wine-outline"
                                            size={16}
                                            color={selectedBottleSize === "1" ? "#ffffff" : "#4B5563"}
                                        />
                                    </View>
                                    <Text className={`text-[12px] font-black ${selectedBottleSize === "1" ? "text-[#1B5E37]" : "text-gray-800"
                                        }`}>
                                        1 Litre
                                    </Text>
                                    <Text className="text-[9.5px] font-medium text-gray-400 mt-0.5">
                                        1000 ml
                                    </Text>
                                </TouchableOpacity>

                                {/* 1.5 Litres Option */}
                                <TouchableOpacity
                                    onPress={() => setSelectedBottleSize("1.5")}
                                    activeOpacity={0.85}
                                    className={`flex-1 p-3 rounded-2xl border items-center text-center ${selectedBottleSize === "1.5"
                                            ? "bg-[#E8F5EE] border-[#1B5E37]"
                                            : "bg-gray-50/70 border-gray-200/80"
                                        }`}
                                >
                                    <View className={`h-8 w-8 rounded-full items-center justify-center mb-1.5 ${selectedBottleSize === "1.5" ? "bg-[#1B5E37]" : "bg-white border border-gray-200/60"
                                        }`}>
                                        <Ionicons
                                            name="beaker-outline"
                                            size={16}
                                            color={selectedBottleSize === "1.5" ? "#ffffff" : "#4B5563"}
                                        />
                                    </View>
                                    <Text className={`text-[12px] font-black ${selectedBottleSize === "1.5" ? "text-[#1B5E37]" : "text-gray-800"
                                        }`}>
                                        1.5 Litres
                                    </Text>
                                    <Text className="text-[9.5px] font-medium text-gray-400 mt-0.5">
                                        1500 ml
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Packaging breakdown banner */}
                            <View className="p-2.5 bg-gray-50 border border-gray-150 rounded-xl flex-row items-center gap-2">
                                <Ionicons name="cube-outline" size={14} color="#1B5E37" />
                                <Text className="text-[11px] font-bold text-gray-700">
                                    Per Delivery: <Text className="text-[#1B5E37]">{getBottleBreakdown(selectedDeliveryQty, selectedBottleSize)}</Text>
                                </Text>
                            </View>
                        </View>

                        {/* Section 3: Subscription Time Period (in Months) */}
                        <View className="bg-white rounded-3xl p-4 border border-gray-200/70 mb-4 shadow-2xs">
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center gap-2">
                                    <View className="h-5 w-5 rounded-full bg-[#1B5E37] items-center justify-center">
                                        <Text className="text-white text-[10px] font-black">{isCustom ? "4" : "3"}</Text>
                                    </View>
                                    <Text className="text-[13px] font-black text-gray-900 uppercase tracking-wide">
                                        Subscription Period
                                    </Text>
                                </View>
                                <Text className="text-[11px] font-bold text-[#1B5E37]">
                                    {selectedDurationMonths} Month{selectedDurationMonths > 1 ? "s" : ""}
                                </Text>
                            </View>

                            {/* Duration Pills */}
                            <View className="flex-row gap-1.5 mb-3">
                                {[1, 2, 3, 6, 12].map((monthVal) => {
                                    const isSelected = selectedDurationMonths === monthVal;
                                    return (
                                        <TouchableOpacity
                                            key={monthVal}
                                            onPress={() => setSelectedDurationMonths(monthVal)}
                                            activeOpacity={0.8}
                                            className={`flex-1 py-2 rounded-xl items-center justify-center border ${isSelected
                                                    ? "bg-[#1B5E37] border-[#1B5E37]"
                                                    : "bg-white border-gray-200"
                                                }`}
                                        >
                                            <Text className={`text-[12px] font-extrabold ${isSelected ? "text-white" : "text-gray-700"}`}>
                                                {monthVal} {monthVal === 1 ? "Mo" : "Mos"}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Stepper for custom months */}
                            <View className="flex-row items-center justify-between bg-gray-50/80 border border-gray-100 rounded-2xl p-2.5 mb-3">
                                <Text className="text-[12px] font-bold text-gray-700 pl-1">
                                    Custom Duration
                                </Text>
                                <View className="flex-row items-center gap-2.5">
                                    <TouchableOpacity
                                        onPress={() => setSelectedDurationMonths((prev) => prev > 1 ? prev - 1 : 1)}
                                        className="h-8 w-8 items-center justify-center rounded-xl bg-white shadow-xs border border-gray-200/60"
                                        disabled={selectedDurationMonths <= 1}
                                    >
                                        <Ionicons name="remove" size={14} color={selectedDurationMonths <= 1 ? "#D1D5DB" : "#1B5E37"} />
                                    </TouchableOpacity>
                                    <Text className="w-14 text-center text-[13px] font-black text-gray-900">
                                        {selectedDurationMonths} {selectedDurationMonths === 1 ? "Mo" : "Mos"}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setSelectedDurationMonths((prev) => prev < 12 ? prev + 1 : 12)}
                                        className="h-8 w-8 items-center justify-center rounded-xl bg-white shadow-xs border border-gray-200/60"
                                        disabled={selectedDurationMonths >= 12}
                                    >
                                        <Ionicons name="add" size={14} color="#1B5E37" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Reassurance Callout Box */}
                            <View className="p-3 bg-[#E8F5EE]/60 border border-[#1B5E37]/15 rounded-2xl flex-row items-start gap-2.5">
                                <Ionicons name="shield-checkmark-outline" size={16} color="#1B5E37" style={{ marginTop: 1 }} />
                                <View className="flex-1">
                                    <Text className="text-[11px] font-bold text-[#1B5E37] leading-tight mb-0.5">
                                        Zero Commitment & Easy Renewal
                                    </Text>
                                    <Text className="text-[10px] text-gray-600 leading-normal">
                                        • Pause or cancel anytime directly from calendar.{"\n"}
                                        • Seamlessly renew after duration finishes.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Section 4: Start Date */}
                        <View className="bg-white rounded-3xl p-4 border border-gray-200/70 mb-4 shadow-2xs">
                            <View className="flex-row items-center justify-between mb-2.5">
                                <View className="flex-row items-center gap-2">
                                    <View className="h-5 w-5 rounded-full bg-[#1B5E37] items-center justify-center">
                                        <Text className="text-white text-[10px] font-black">{isCustom ? "5" : "4"}</Text>
                                    </View>
                                    <Text className="text-[13px] font-black text-gray-900 uppercase tracking-wide">
                                        Start Date
                                    </Text>
                                </View>
                                <Text className="text-[11px] font-semibold text-gray-500">
                                    First Delivery
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => setShowDatePicker(!showDatePicker)}
                                className="flex-row items-center justify-between bg-gray-50/80 border border-gray-200/80 rounded-2xl p-3.5"
                            >
                                <View className="flex-row items-center gap-2.5">
                                    <Ionicons name="calendar-outline" size={18} color="#1B5E37" />
                                    <Text className="text-[13.5px] font-bold text-gray-800">
                                        {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </Text>
                                </View>
                                <Ionicons name={showDatePicker ? "chevron-up" : "chevron-down"} size={18} color="#1B5E37" />
                            </TouchableOpacity>

                            {showDatePicker && (
                                <View className="bg-white rounded-2xl p-2 border border-gray-100 mt-2.5 animate-fade-in">
                                    <Calendar
                                        minDate={new Date().toISOString().split('T')[0]}
                                        current={startDate.toISOString().split('T')[0]}
                                        onDayPress={(day) => {
                                            setStartDate(new Date(day.dateString));
                                            setShowDatePicker(false);
                                        }}
                                        theme={{
                                            todayTextColor: "#1B5E37",
                                            arrowColor: "#1B5E37",
                                            selectedDayBackgroundColor: "#1B5E37",
                                            selectedDayTextColor: "#ffffff",
                                        }}
                                        markedDates={{
                                            [startDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#1B5E37' }
                                        }}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Section 5: Plan, Price & Period Summary */}
                        <View className="bg-white rounded-3xl p-5 border-2 border-[#1B5E37]/20 mb-5 shadow-xs">
                            <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-gray-100">
                                <View className="flex-row items-center gap-2">
                                    <View className="h-5 w-5 rounded-full bg-[#1B5E37] items-center justify-center">
                                        <Ionicons name="receipt-outline" size={11} color="white" />
                                    </View>
                                    <Text className="text-[13px] font-black text-gray-900 uppercase tracking-wide">
                                        Price & Period Summary
                                    </Text>
                                </View>
                                <View className="px-2.5 py-0.5 rounded-full bg-[#E8F5EE]">
                                    <Text className="text-[10px] font-black text-[#1B5E37] uppercase">
                                        {selectedPlanTab === "daily" ? "Daily" : selectedPlanTab === "alternate" ? "Alternate" : "Custom"}
                                    </Text>
                                </View>
                            </View>

                            {/* Breakdown items */}
                            <View className="gap-y-2 mb-4">
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-[12px] font-semibold text-gray-500">Rate</Text>
                                    <Text className="text-[12.5px] font-bold text-gray-800">
                                        ₹{activeRate} / {activePlanProduct?.unit || "L"}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-[12px] font-semibold text-gray-500">Schedule</Text>
                                    <Text className="text-[12.5px] font-bold text-gray-800">
                                        {selectedPlanTab === "daily"
                                            ? "Daily Delivery"
                                            : selectedPlanTab === "alternate"
                                                ? "Alternate Days"
                                                : getCustomFrequencyLabel(selectedCustomDays)}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-[12px] font-semibold text-gray-500">Quantity & Bottle</Text>
                                    <Text className="text-[12.5px] font-bold text-gray-800">
                                        {selectedDeliveryQty}L ({selectedBottleSize === "0.5" ? "1/2L" : selectedBottleSize === "1.5" ? "1.5L" : "1L"} Bottle)
                                    </Text>
                                </View>
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-[12px] font-semibold text-gray-500">Duration</Text>
                                    <Text className="text-[12.5px] font-bold text-gray-800">
                                        {selectedDurationMonths} Month{selectedDurationMonths > 1 ? "s" : ""} (~{totalDeliveries} Deliveries)
                                    </Text>
                                </View>
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-[12px] font-semibold text-gray-500">Est. Monthly Cost (~{deliveriesPerMonth} days)</Text>
                                    <Text className="text-[12.5px] font-bold text-gray-800">
                                        ₹{estimatedMonthlyCost.toFixed(2)}
                                    </Text>
                                </View>
                            </View>

                            {/* Highlight Total Blocks */}
                            <View className="p-3.5 bg-[#F3F9F5] border border-[#1B5E37]/15 rounded-2xl">
                                <View className="flex-row justify-between items-baseline mb-2">
                                    <View>
                                        <Text className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                                            Single Day Delivery
                                        </Text>
                                        <Text className="text-[9.5px] text-gray-400">
                                            Billed per delivery morning
                                        </Text>
                                    </View>
                                    <Text className="text-[20px] font-black text-[#1B5E37]">
                                        ₹{singleDayDeliveryCost.toFixed(2)}
                                    </Text>
                                </View>

                                <View className="border-t border-[#1B5E37]/10 pt-2 flex-row justify-between items-baseline">
                                    <View>
                                        <Text className="text-[11px] font-extrabold text-gray-600 uppercase tracking-wider">
                                            Total for {selectedDurationMonths} Month{selectedDurationMonths > 1 ? "s" : ""}
                                        </Text>
                                        <Text className="text-[9.5px] text-gray-400">
                                            Based on ~{totalDeliveries} deliveries
                                        </Text>
                                    </View>
                                    <Text className="text-[17px] font-black text-gray-900">
                                        ₹{totalSubscriptionCost.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Add to Cart Button */}
                        <TouchableOpacity
                            onPress={() => {
                                const freqLabel = selectedPlanTab === "daily"
                                    ? "Daily"
                                    : selectedPlanTab === "alternate"
                                        ? "Alternate Days"
                                        : getCustomFrequencyLabel(selectedCustomDays);
                                const bottleLabels: Record<string, string> = {
                                    "0.5": "1/2 Litre Bottle",
                                    "1": "1 Litre Bottle",
                                    "1.5": "1.5 Litres Bottle",
                                };
                                const bottleLabel = bottleLabels[selectedBottleSize] || `${selectedBottleSize}L Bottle`;
                                const formattedDate = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                                const prodName = activePlanProduct?.name || (selectedBottleSize === "0.5" ? "A2 Gir Cow Milk 1/2 Litre" : selectedBottleSize === "1.5" ? "A2 Gir Cow Milk 1.5 Litres" : "A2 Gir Cow Milk 1 Litre");
                                const allAvailableProds = products.length > 0 ? products : storeProducts;
                                const matchedUuidProd = allAvailableProds.find((p) => {
                                    if (!isValidUuid(p.id)) return false;
                                    const n = (p.name || "").toLowerCase();
                                    if (selectedBottleSize === "0.5") return n.includes("1/2") || n.includes("0.5") || n.includes("500");
                                    if (selectedBottleSize === "1.5") return n.includes("1.5");
                                    return (n.includes("1 litre") || n.includes("1l") || n.includes("1 l")) && !n.includes("1.5");
                                });
                                const prodId = (activePlanProduct?.id && isValidUuid(activePlanProduct.id))
                                    ? String(activePlanProduct.id)
                                    : (matchedUuidProd ? String(matchedUuidProd.id) : (allAvailableProds.find(p => isValidUuid(p.id))?.id ? String(allAvailableProds.find(p => isValidUuid(p.id))!.id) : "a5af50e9-2451-40d5-9633-215569770c10"));
                                const qtyDisplay = `${selectedDeliveryQty} Litre${selectedDeliveryQty > 1 ? "s" : ""}`;
                                const planKey = selectedPlanTab === "custom" ? `custom_${selectedCustomDays.join("-")}` : selectedPlanTab;

                                // Bottle quantity: number of bottles required based on selected milk quantity and bottle size
                                const bottleSizeNum = parseFloat(selectedBottleSize) || 1;
                                const noOfBottles = Math.max(1, Math.round(selectedDeliveryQty / bottleSizeNum));

                                // Dates
                                const startIso = startDate.toISOString().split('T')[0];
                                const endDateObj = new Date(startDate);
                                endDateObj.setMonth(endDateObj.getMonth() + selectedDurationMonths);
                                const endIso = endDateObj.toISOString().split('T')[0];

                                const freqPayload = selectedPlanTab === "daily"
                                    ? "daily"
                                    : selectedPlanTab === "alternate"
                                        ? "alternate"
                                        : "custom";

                                addToCart({
                                    id: `sub_${prodId}_${planKey}_${selectedDeliveryQty}L_${selectedBottleSize}_${selectedDurationMonths}mo_start_${startIso}`,
                                    name: `${freqLabel} • ${qtyDisplay} (Sub: ${prodName} - ${bottleLabel}, ${selectedDurationMonths} Mo • ₹${singleDayDeliveryCost}/day, Total ₹${totalSubscriptionCost}, Start: ${formattedDate})`,
                                    price: singleDayDeliveryCost,
                                    quantity: 1,
                                    metadata: {
                                        isSubscription: true,
                                        frequency: freqPayload,
                                        product: String(prodId),
                                        product_name: prodName,
                                        quantity: noOfBottles, // no of bottles required based on selected milk quantity and bottle size
                                        start_date: startIso,
                                        end_date: endIso,
                                        bottle_size: selectedBottleSize,
                                        delivery_qty: selectedDeliveryQty,
                                        duration_months: selectedDurationMonths,
                                        custom_days: selectedPlanTab === "custom" ? selectedCustomDays : undefined,
                                    }
                                });

                                predefinedSheetRef.current?.dismiss();

                                Alert.alert(
                                    "Added to Cart",
                                    `${freqLabel} subscription added to cart!\n\nSingle Day: ₹${singleDayDeliveryCost.toFixed(2)}\nPeriod: ${selectedDurationMonths} Month(s) (Est. Total: ₹${totalSubscriptionCost.toFixed(2)})`,
                                    [
                                        { text: "Continue", style: "cancel" },
                                        {
                                            text: "View Cart",
                                            onPress: () => {
                                                router.push("/(customer)/cart");
                                            }
                                        }
                                    ]
                                );
                            }}
                            activeOpacity={0.88}
                            className="bg-[#1B5E37] py-4 rounded-2xl items-center justify-center shadow-md mb-4"
                            style={{
                                shadowColor: "#1B5E37",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.18,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            <Text className="text-white text-[14px] font-black uppercase tracking-wider">
                                Add {selectedPlanTab === "daily" ? "Daily" : selectedPlanTab === "alternate" ? "Alternate" : "Custom"} Plan • ₹{singleDayDeliveryCost.toFixed(2)} / Day
                            </Text>
                            <Text className="text-emerald-100 text-[10.5px] font-medium mt-0.5">
                                Est. Total: ₹{totalSubscriptionCost.toFixed(2)} for {selectedDurationMonths} Month{selectedDurationMonths > 1 ? "s" : ""}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetScrollView>
            </BottomSheetModal>




            {/* Modal for Editing Subscription Details */}
            <Modal
                visible={showEditModal}
                animationType="fade"
                transparent
                onRequestClose={() => setShowEditModal(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50 p-4">
                    <View
                        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl border border-gray-100"
                        style={{ elevation: 10 }}
                    >
                        {/* Header */}
                        <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-4">
                            <View>
                                <Text className="text-[16px] font-black text-gray-900">
                                    Edit Subscription
                                </Text>
                                <Text className="text-[11px] font-medium text-gray-500 mt-0.5">
                                    {selectedSub?.items?.[0]?.product_name || "Milk Subscription"}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowEditModal(false)}
                                className="h-8 w-8 rounded-full bg-gray-100 items-center justify-center"
                            >
                                <Ionicons name="close" size={18} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Quantity Stepper */}
                        <View className="mb-4">
                            <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Daily Delivery Quantity
                            </Text>
                            <View className="flex-row items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                                <TouchableOpacity
                                    onPress={() => setEditQuantity((q) => Math.max(1, q - 1))}
                                    disabled={editQuantity <= 1}
                                    className="h-8 w-8 rounded-lg bg-white border border-gray-200 items-center justify-center"
                                >
                                    <Ionicons name="remove" size={16} color={editQuantity <= 1 ? "#D1D5DB" : "#1F2937"} />
                                </TouchableOpacity>
                                <Text className="text-[15px] font-black text-gray-900">
                                    {editQuantity} Litre(s)
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setEditQuantity((q) => q + 1)}
                                    className="h-8 w-8 rounded-lg bg-[#1B5E37] items-center justify-center"
                                >
                                    <Ionicons name="add" size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Frequency Selector */}
                        <View className="mb-4">
                            <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Delivery Frequency
                            </Text>
                            <View className="flex-row gap-2">
                                {(["daily", "alternate", "custom"] as const).map((freq) => (
                                    <TouchableOpacity
                                        key={freq}
                                        onPress={() => setEditFrequency(freq)}
                                        className={`flex-1 py-2 rounded-xl border items-center capitalize ${editFrequency === freq
                                                ? "bg-[#1B5E37] border-[#1B5E37]"
                                                : "bg-gray-50 border-gray-200"
                                            }`}
                                    >
                                        <Text
                                            className={`text-[12px] font-black capitalize ${editFrequency === freq ? "text-white" : "text-gray-700"
                                                }`}
                                        >
                                            {freq}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Start Date */}
                        <View className="mb-4">
                            <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Start Date (YYYY-MM-DD)
                            </Text>
                            <TextInput
                                value={editStartDate}
                                onChangeText={setEditStartDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#9CA3AF"
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-900 font-semibold"
                            />
                        </View>

                        {/* Status Toggle */}
                        <View className="mb-5">
                            <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Status
                            </Text>
                            <View className="flex-row gap-2">
                                {(["active", "paused"] as const).map((st) => (
                                    <TouchableOpacity
                                        key={st}
                                        onPress={() => setEditStatus(st)}
                                        className={`flex-1 py-2 rounded-xl border items-center capitalize ${editStatus === st
                                                ? st === "active"
                                                    ? "bg-[#1B5E37] border-[#1B5E37]"
                                                    : "bg-amber-600 border-amber-600"
                                                : "bg-gray-50 border-gray-200"
                                            }`}
                                    >
                                        <Text
                                            className={`text-[12px] font-black capitalize ${editStatus === st ? "text-white" : "text-gray-700"
                                                }`}
                                        >
                                            {st}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            onPress={handleSaveEditSubscription}
                            disabled={isSavingEdit}
                            className="w-full rounded-2xl bg-[#1B5E37] py-3.5 items-center justify-center shadow-md active:opacity-90"
                        >
                            {isSavingEdit ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text className="text-[14px] font-black text-white uppercase tracking-wider">
                                    Save Changes
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </ScreenWrapper>
    );
}
