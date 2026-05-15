// import React from "react";
// import { View, Text } from "react-native";
// import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
// import { Colors } from "@shared/theme";
// import { StatCard } from "./StatCard";

// interface ShipmentOverviewProps {
//     newOrdersCount: number;
//     dailyDeliveriesCount: number;
//     hasDeliveryAlert?: boolean;
//     onOrdersPress?: () => void;
//     onDeliveriesPress?: () => void;
// }

// export function ShipmentOverview({
//     newOrdersCount,
//     dailyDeliveriesCount,
//     hasDeliveryAlert = false,
//     onOrdersPress,
//     onDeliveriesPress,
// }: ShipmentOverviewProps) {
//     return (
//         <View className="px-4 mb-6">
//             <Text className="text-base font-semibold text-text-primary mb-3">
//                 Today's Shipment Overview
//             </Text>

//             <View className="flex-row gap-x-3">
//                 <StatCard
//                     icon={
//                         <MaterialCommunityIcons
//                             name="package-variant-closed"
//                             size={24}
//                             color={Colors.brand.primary}
//                         />
//                     }
//                     label="Orders"
//                     count={newOrdersCount}
//                     subLabel="New Orders"
//                     ctaLabel="See all Orders"
//                     onPress={onOrdersPress}
//                 />

//                 <StatCard
//                     icon={
//                         <Ionicons
//                             name="bicycle-outline"
//                             size={24}
//                             color={Colors.brand.primary}
//                         />
//                     }
//                     label="Deliveries"
//                     count={dailyDeliveriesCount}
//                     subLabel="Daily Deliveries"
//                     ctaLabel="All Deliveries"
//                     hasAlert={hasDeliveryAlert}
//                     onPress={onDeliveriesPress}
//                 />
//             </View>
//         </View>
//     );
// }
import React from "react";
import { View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SectionHeading } from "./SectionHeading";
import { StatCard } from "./StatCard";

interface ShipmentOverviewProps {
    newOrdersCount: number;
    dailyDeliveriesCount: number;
    hasDeliveryAlert?: boolean;
    onOrdersPress?: () => void;
    onDeliveriesPress?: () => void;
}

export function ShipmentOverview({
    newOrdersCount,
    dailyDeliveriesCount,
    hasDeliveryAlert = false,
    onOrdersPress,
    onDeliveriesPress,
}: ShipmentOverviewProps) {
    return (
        <View className="mb-6">
            <SectionHeading title="Today's Shipment Overview" />

            <View className="mt-4 gap-y-4">
                <StatCard
                    icon={<MaterialCommunityIcons name="package-variant" size={22} color="#1B5E37" />}
                    label="Orders"
                    count={newOrdersCount}
                    subLabel="New Orders"
                    ctaLabel="See all Orders"
                    onPress={onOrdersPress}
                />

                <StatCard
                    icon={<Ionicons name="bicycle-outline" size={22} color="#1B5E37" />}
                    label="Deliveries"
                    count={dailyDeliveriesCount}
                    subLabel="Daily Deliveries"
                    ctaLabel="All Deliveries"
                    hasAlert={hasDeliveryAlert}
                    onPress={onDeliveriesPress}
                />
            </View>
        </View>
    );
}