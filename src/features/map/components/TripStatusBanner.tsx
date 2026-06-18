// import React from "react";
// import { Text, TouchableOpacity, View } from "react-native";
// import { Ionicons } from "@expo/vector-icons";

// interface Props {
//     routeName: string;
//     completed: number;
//     total: number;
//     eta: string;
//     isTripStarted: boolean;
//     loading: boolean;
//     onToggle: () => void;
//     disabled?: boolean;
// }

// export default function TripStatusBanner({
//     routeName,
//     completed,
//     total,
//     eta,
//     isTripStarted,
//     loading,
//     onToggle,
//     disabled = false,
// }: Props) {
//     const progress = total > 0 ? (completed / total) * 100 : 0;
//     const isDisabled = loading || disabled;

//     return (
//         <View className="absolute left-4 right-4 top-12 z-20 rounded-card bg-bg-card p-4 shadow-xl">
//             <View className="flex-row items-center justify-between">
//                 <View className="flex-1 pr-3">
//                     <Text className="text-caption tracking-widest text-text-muted uppercase">
//                         Active Route
//                     </Text>
//                     <Text
//                         className="mt-0.5 text-body-lg font-bold text-text-primary"
//                         numberOfLines={1}
//                     >
//                         {routeName}
//                     </Text>
//                     <Text className="mt-0.5 text-caption text-text-secondary">
//                         {completed} / {total} Deliveries · ETA {eta}
//                     </Text>

//                     <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-disable">
//                         <View
//                             className="h-1.5 rounded-full bg-brand-primary"
//                             style={{ width: `${progress}%` }}
//                         />
//                     </View>
//                 </View>

//                 <TouchableOpacity
//                     onPress={isDisabled ? undefined : onToggle}
//                     disabled={isDisabled}
//                     activeOpacity={0.85}
//                     className={`w-12 h-12 rounded-full items-center justify-center shadow-md ${isDisabled
//                             ? "bg-gray-400 opacity-50"
//                             : isTripStarted
//                                 ? "bg-error"
//                                 : "bg-brand-primary"
//                         }`}
//                 >
//                     <Ionicons
//                         name={isDisabled ? "remove-circle-outline" : loading ? "hourglass-outline" : isTripStarted ? "stop" : "play"}
//                         size={20}
//                         color="white"
//                     />
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );
// }

import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
    routeName: string;
    completed: number;
    total: number;
    eta: string;
    isTripStarted: boolean;
    loading: boolean;
    onToggle: () => void;
    disabled?: boolean;
    // ── NEW nav props ──
    navigationStopName?: string | null;
    navigationStopAddress?: string | null;
    onRefreshRoute?: () => void;
}

export default function TripStatusBanner({
    routeName,
    completed,
    total,
    eta,
    isTripStarted,
    loading,
    onToggle,
    disabled = false,
    navigationStopName,
    navigationStopAddress,
    onRefreshRoute,
}: Props) {
    const insets = useSafeAreaInsets();
    const progress = total > 0 ? (completed / total) * 100 : 0;
    const isDisabled = loading || disabled;
    const showNav = isTripStarted && !!navigationStopName;

    const topPosition = Platform.OS === "ios" ? insets.top + 20 : insets.top + 12;

    return (
        <View 
            className="absolute left-4 right-4 z-20 rounded-card bg-bg-card shadow-2xl overflow-hidden"
            style={{ top: topPosition }}
        >
            {/* ── Main row: route name + play/stop button ── */}
            <View className="flex-row items-center justify-between p-4">
                <View className="flex-1 pr-3">
                    {/* <Text className="text-caption tracking-widest text-text-muted uppercase">
                        Active Route
                    </Text> */}
                    <Text
                        className="mt-0.5 text-body-lg font-bold text-text-primary"
                        numberOfLines={1}
                    >
                        {routeName}
                    </Text>
                    <Text className="mt-0.5 text-caption text-text-secondary">
                        {completed} / {total} Deliveries · ETA {eta}
                    </Text>

                    <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-disable">
                        <View
                            className="h-1.5 rounded-full bg-brand-primary"
                            style={{ width: `${progress}%` }}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={isDisabled ? undefined : onToggle}
                    disabled={isDisabled}
                    activeOpacity={0.85}
                    className={`w-12 h-12 rounded-full items-center justify-center shadow-md ${isDisabled
                            ? "bg-gray-400 opacity-50"
                            : isTripStarted
                                ? "bg-error"
                                : "bg-brand-primary"
                        }`}
                >
                    <Ionicons
                        name={
                            isDisabled
                                ? "remove-circle-outline"
                                : loading
                                    ? "hourglass-outline"
                                    : isTripStarted
                                        ? "stop"
                                        : "play"
                        }
                        size={20}
                        color="white"
                    />
                </TouchableOpacity>
            </View>

            {/* ── Navigation row: only visible when trip is active ── */}
            {showNav && (
                <View className="flex-row items-center gap-x-3 border-t border-border-default bg-brand-primary/5 px-4 py-2.5">
                    {/* Nav icon */}
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-brand-primary">
                        <Ionicons name="navigate" size={14} color="white" />
                    </View>

                    {/* Stop info */}
                    <View className="flex-1">
                        <Text className="text-caption tracking-wide text-text-muted uppercase">
                            Navigating to
                        </Text>
                        <Text
                            className="text-body font-semibold text-text-primary"
                            numberOfLines={1}
                        >
                            {navigationStopName}
                        </Text>
                        {/* {!!navigationStopAddress && (
                            <Text
                                className="text-caption text-text-secondary"
                                numberOfLines={1}
                            >
                                {navigationStopAddress}
                            </Text>
                        )} */}
                    </View>

                    {/* Refresh button */}
                    {!!onRefreshRoute && (
                        <TouchableOpacity
                            onPress={onRefreshRoute}
                            activeOpacity={0.7}
                            className="h-8 w-8 items-center justify-center rounded-full bg-bg-screen"
                        >
                            <Ionicons name="refresh" size={15} color="#1B5E37" />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}