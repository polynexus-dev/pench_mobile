import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Dimensions,
    TouchableOpacity,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ActivityIndicator,
    Image,
    Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { onboardingSlides, OnboardingSlide } from "../data/onboardingData";
import { onboardingUtils } from "../utils/onboardingUtils";
import { ROUTES } from "@/constants/route";

const { width, height } = Dimensions.get("window");

function AnimatedDot({ isActive }: { isActive: boolean }) {
    const widthAnim = useRef(new Animated.Value(isActive ? 24 : 8)).current;
    const opacity = useRef(new Animated.Value(isActive ? 1 : 0.4)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(widthAnim, {
                toValue: isActive ? 24 : 8,
                useNativeDriver: false,
                damping: 18,
                stiffness: 200,
                mass: 0.8,
            }),
            Animated.timing(opacity, {
                toValue: isActive ? 1 : 0.4,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
    }, [isActive]);

    return (
        <Animated.View
            className="rounded-full mx-1.5 h-2"
            style={{
                width: widthAnim,
                opacity,
                borderRadius: 4,
                backgroundColor: isActive ? "#1B5E37" : "#9c9c9c",
            }}
        />
    );
}

function OnboardingSlideItem({ item }: { item: OnboardingSlide }) {
    const computedImageHeight = Math.min(height * 0.42, 360);

    return (
        <View style={{ width }} className="flex-1 items-center justify-between p-6">
            
            {/* Illustration container */}
            <View className="flex-1 w-full items-center justify-center">
                <Image
                    source={item.image}
                    style={{
                        width: "100%",
                        height: computedImageHeight,
                        maxHeight: 360,
                    }}
                    resizeMode="contain"
                    fadeDuration={0}
                />
            </View>

            {/* Typography */}
            <View className="items-center px-4 w-full mt-4 mb-2">
                <Text className="text-3xl font-bold text-text-primary text-center tracking-tight leading-snug">
                    {item.title}
                </Text>
                <Text className="text-base text-text-secondary text-center leading-relaxed mt-3 px-2">
                    {item.description}
                </Text>
            </View>

        </View>
    );
}

export default function OnboardingScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    const isLastSlide = currentIndex === onboardingSlides.length - 1;

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const handleNext = () => {
        if (isLastSlide) {
            handleGetStarted();
        } else {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        }
    };

    const handleGetStarted = async () => {
        setLoading(true);
        try {
            await onboardingUtils.markComplete();
        } catch (e) {
            if (__DEV__) console.error("[Onboarding] markComplete failed:", e);
        } finally {
            setLoading(false);
            router.replace(ROUTES.AUTH.LOGIN as any);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#E8F5EE]">
            <StatusBar style="dark" />

            {/* ── Top Header ────────────────────────────────────────── */}
            <View className="flex-row justify-end items-center px-6 py-2 h-12">
                {!isLastSlide && (
                    <TouchableOpacity
                        onPress={handleGetStarted}
                        disabled={loading}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Text className="text-[#1B5E37] font-bold text-base tracking-wide">
                            Skip
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Slides ────────────────────────────────────────────── */}
            <View className="flex-1">
                <FlatList
                    ref={flatListRef}
                    data={onboardingSlides}
                    renderItem={({ item }) => (
                        <OnboardingSlideItem item={item} />
                    )}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    bounces={false}
                />
            </View>

            {/* ── Bottom Controls ───────────────────────────────────── */}
            <View className="pb-8 px-6 items-center gap-y-6">

                {/* Animated Dots */}
                <View className="flex-row items-center justify-center">
                    {onboardingSlides.map((_, i) => (
                        <AnimatedDot key={i} isActive={i === currentIndex} />
                    ))}
                </View>

                {/* Next / Get Started button */}
                <TouchableOpacity
                    onPress={handleNext}
                    disabled={loading}
                    activeOpacity={0.85}
                    className="w-full bg-[#1B5E37] py-4 rounded-full items-center shadow-lg shadow-[#1B5E37]/20"
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-bold text-base uppercase tracking-wider">
                            {isLastSlide ? "Get Started" : "Next"}
                        </Text>
                    )}
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}