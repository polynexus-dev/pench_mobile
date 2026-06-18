import { useBottomTabPadding } from "@/hooks/useBottomTabPadding";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/utils/cn";
import { StatusBar } from "expo-status-bar";

type Props = {
    title?: string;
    children: React.ReactNode;
    right?: React.ReactNode;
    showBack?: boolean;
    onBack?: () => void;
    showHeader?: boolean;
    screenBgColor?: string;
    headerBgColor?: string;
    scrollable?: boolean;
    contentContainerStyle?: StyleProp<ViewStyle>;
    className?: string;
    disablePadding?: boolean;
};

export function ScreenWrapper({
    title = "",
    children,
    right,
    showBack = false,
    onBack,
    showHeader = false, // Defaults to false to avoid breaking existing screens in pench_new that don't need headers
    screenBgColor,
    headerBgColor,
    scrollable = false,
    contentContainerStyle,
    className,
    disablePadding = false,
}: Props) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const bottomPadding = useBottomTabPadding();

    return (
        <View 
            style={[
                styles.container,
                screenBgColor ? { backgroundColor: screenBgColor } : null
            ]}
            className={cn("flex-1 bg-surface", className)}
        >
            {/* <StatusBar style="dark" translucent backgroundColor="transparent" />  */}
            
            {showHeader && (
                <View
                    style={[
                        styles.header,
                        headerBgColor ? { backgroundColor: headerBgColor } : null,
                        {
                            paddingTop: Platform.OS === "ios"
                                ? insets.top + 12
                                : insets.top + 8,
                        },
                    ]}
                >
                    <View style={styles.side}>
                        {showBack && (
                            <Pressable onPress={() => onBack ? onBack() : router.back()} hitSlop={10}>
                                <Ionicons
                                    name="chevron-back"
                                    size={26}
                                    color="white"
                                />
                            </Pressable>
                        )}
                    </View>

                    <Text numberOfLines={1} style={styles.title}>
                        {title}
                    </Text>

                    <View style={[styles.side, styles.rightSide]}>
                        {right}
                    </View>
                </View>
            )}

            {scrollable ? (
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={[
                        contentContainerStyle, 
                        !disablePadding && { 
                            paddingBottom: bottomPadding,
                            paddingTop: showHeader ? 0 : insets.top + 16,
                        }
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {children}
                </ScrollView>
            ) : (
                <View 
                    style={[
                        { flex: 1 },
                        !disablePadding && { 
                            paddingTop: showHeader ? 0 : insets.top + 16,
                            paddingBottom: bottomPadding,
                        }
                    ]}
                >
                    {children}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: "#121212",
    },

    title: {
        flex: 1,
        textAlign: "center",
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },

    side: {
        width: 60,
        justifyContent: "center",
    },

    rightSide: {
        alignItems: "flex-end",
    },

    content: {
        flex: 1,
    }
});
