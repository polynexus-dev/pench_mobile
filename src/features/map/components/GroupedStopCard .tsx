// // import React, { useMemo, useState } from "react";
// // import { View, TouchableOpacity } from "react-native";
// // import { Ionicons } from "@expo/vector-icons";
// // import { StopListItem } from "@/features/map/components/StopListItem";

// // type RouteStop = {
// //     id: string;
// //     sequence_number: number;
// //     order: string | null;
// //     customer_name: string;
// //     address: string;
// //     latitude: number;
// //     longitude: number;
// //     order_status?: string;
// // };

// // type GroupedStop = {
// //     groupKey: string;
// //     address: string;
// //     stops: RouteStop[];
// // };

// // type Props = {
// //     group: GroupedStop;
// //     activeStopId: string | null;
// //     nearStopId: string | null;
// //     onSelectStop: (stopId: string) => void;
// // };

// // export function GroupedStopCard({
// //     group,
// //     activeStopId,
// //     nearStopId,
// //     onSelectStop,
// // }: Props) {
// //     const [expanded, setExpanded] = useState(false);

// //     const firstStop = group.stops[0];
// //     const isCurrentGroup = group.stops.some((s) => s.id === activeStopId);
// //     const isNearGroup = group.stops.some((s) => s.id === nearStopId);

// //     const customerCount = useMemo(() => group.stops.length, [group.stops.length]);

// //     return (
// //         <View className="mb-3 overflow-hidden rounded-3xl bg-white">
// //             <TouchableOpacity
// //                 onPress={() => setExpanded((v) => !v)}
// //                 className="flex-row items-center justify-between px-4 py-4"
// //             >
// //                 <View className="flex-1 pr-3">
// //                     <View className="flex-row items-center gap-2">
// //                         <Ionicons
// //                             name={isCurrentGroup ? "radio-button-on" : isNearGroup ? "location" : "business-outline"}
// //                             size={20}
// //                             color={isCurrentGroup ? "#1B5E37" : isNearGroup ? "#D4872A" : "#4A4A4A"}
// //                         />
// //                         {/* <View className="flex-1">
// //                             <View className="flex-row items-center justify-between">
// //                                 <View className="flex-1">
// //                                     <View className="mb-1">
// //                                         <View />
// //                                     </View>
// //                                 </View>
// //                             </View>
// //                         </View> */}
// //                     </View>
// //                 </View>

// //                 <View className="items-end">
// //                     <Ionicons
// //                         name={expanded ? "chevron-up" : "chevron-down"}
// //                         size={20}
// //                         color="#1B5E37"
// //                     />
// //                 </View>
// //             </TouchableOpacity>

// //             <View className="px-4 pb-4">
// //                 <View className="mb-2">
// //                     {/* <View className="rounded-2xl bg-[#F7F3EA] px-3 py-3">
// //                         <View className="flex-row items-center justify-between">
// //                             <View className="flex-1">
// //                                 <View>
// //                                     <View />
// //                                 </View>
// //                             </View>
// //                         </View>
// //                     </View> */}
// //                 </View>

// //                 <View className="mb-3">
// //                     <View />
// //                 </View>

// //                 {expanded ? (
// //                     <View className="gap-y-2">
// //                         {group.stops.map((stop) => (
// //                             <TouchableOpacity
// //                                 key={stop.id}
// //                                 onPress={() => onSelectStop(stop.id)}
// //                             >
// //                                 <StopListItem
// //                                     sequenceNumber={stop.sequence_number}
// //                                     customerName={stop.customer_name}
// //                                     address={stop.address}
// //                                     items={[]}
// //                                     status={stop.id === activeStopId ? "current" : "pending"}
// //                                     isNear={stop.id === nearStopId}
// //                                     isActive={stop.id === activeStopId}
// //                                     onPress={() => onSelectStop(stop.id)}
// //                                 />
// //                             </TouchableOpacity>
// //                         ))}
// //                     </View>
// //                 ) : (
// //                     <TouchableOpacity onPress={() => onSelectStop(firstStop.id)}>
// //                         <StopListItem
// //                             sequenceNumber={firstStop.sequence_number}
// //                             customerName={firstStop.customer_name}
// //                             address={firstStop.address}
// //                             items={[]}
// //                             status={firstStop.id === activeStopId ? "current" : "pending"}
// //                             isNear={firstStop.id === nearStopId}
// //                             isActive={firstStop.id === activeStopId}
// //                             onPress={() => onSelectStop(firstStop.id)}
// //                         />
// //                     </TouchableOpacity>
// //                 )}
// //             </View>
// //         </View>
// //     );
// // }

// import React, { useEffect, useRef, useState } from "react";
// import { Animated, View, TouchableOpacity } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { StopListItem } from "@/features/map/components/StopListItem";

// type RouteStop = {
//     id: string;
//     sequence_number: number;
//     order: string | null;
//     customer_name: string;
//     address: string;
//     latitude: number;
//     longitude: number;
//     order_status?: string;
// };

// type GroupedStop = {
//     groupKey: string;
//     address: string;
//     stops: RouteStop[];
// };

// type Props = {
//     group: GroupedStop;
//     activeStopId: string | null;
//     nearStopId: string | null;
//     onSelectStop: (stopId: string, groupKey: string) => void;
// };

// export function GroupedStopCard({
//     group,
//     activeStopId,
//     nearStopId,
//     onSelectStop,
// }: Props) {
//     const [expanded, setExpanded] = useState(false);
//     const contentAnim = useRef(new Animated.Value(0)).current;
//     const rotateAnim = useRef(new Animated.Value(0)).current;

//     const firstStop = group.stops[0];
//     const isCurrentGroup = group.stops.some((s) => s.id === activeStopId);
//     const isNearGroup = group.stops.some((s) => s.id === nearStopId);

//     useEffect(() => {
//         Animated.timing(contentAnim, {
//             toValue: expanded ? 1 : 0,
//             duration: 220,
//             useNativeDriver: false,
//         }).start();

//         Animated.timing(rotateAnim, {
//             toValue: expanded ? 1 : 0,
//             duration: 220,
//             useNativeDriver: true,
//         }).start();
//     }, [expanded, contentAnim, rotateAnim]);

//     const chevronRotate = rotateAnim.interpolate({
//         inputRange: [0, 1],
//         outputRange: ["0deg", "180deg"],
//     });

//     const bodyHeight = contentAnim.interpolate({
//         inputRange: [0, 1],
//         outputRange: [0, 320],
//     });

//     const bodyOpacity = contentAnim.interpolate({
//         inputRange: [0, 1],
//         outputRange: [0, 1],
//     });

//     return (
//         <View className="mb-3 overflow-hidden rounded-3xl bg-white">
//             <TouchableOpacity
//                 onPress={() => setExpanded((v) => !v)}
//                 className="flex-row items-center justify-between px-4 py-4"
//                 activeOpacity={0.85}
//             >
//                 <View className="flex-1 pr-3">
//                     <View className="flex-row items-center gap-2">
//                         <Ionicons
//                             name={isCurrentGroup ? "radio-button-on" : isNearGroup ? "location" : "business-outline"}
//                             size={18}
//                             color={isCurrentGroup ? "#1B5E37" : isNearGroup ? "#D4872A" : "#4A4A4A"}
//                         />
//                         <View className="flex-1">
//                             <View className="flex-row items-center justify-between">
//                                 <View className="flex-1">
//                                     <View className="mb-1">
//                                         <View />
//                                     </View>
//                                 </View>
//                             </View>
//                         </View>
//                     </View>

//                     <View className="mt-2">
//                         <View />
//                     </View>
//                 </View>

//                 <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
//                     <Ionicons name="chevron-down" size={20} color="#1B5E37" />
//                 </Animated.View>
//             </TouchableOpacity>

//             <Animated.View
//                 style={{
//                     height: bodyHeight,
//                     opacity: bodyOpacity,
//                     overflow: "hidden",
//                 }}
//             >
//                 <View className="px-4 pb-4">
//                     <View className="gap-y-2">
//                         {group.stops.map((stop) => (
//                             <TouchableOpacity
//                                 key={stop.id}
//                                 onPress={() => onSelectStop(stop.id, group.groupKey)}
//                                 activeOpacity={0.9}
//                             >
//                                 <StopListItem
//                                     sequenceNumber={stop.sequence_number}
//                                     customerName={stop.customer_name}
//                                     address={stop.address}
//                                     items={[]}
//                                     status={stop.id === activeStopId ? "current" : "pending"}
//                                     isNear={stop.id === nearStopId}
//                                     isActive={stop.id === activeStopId}
//                                     onPress={() => onSelectStop(firstStop.id, group.groupKey)}
//                                 />
//                             </TouchableOpacity>
//                         ))}
//                     </View>
//                 </View>
//             </Animated.View>
//         </View>
//     );
// }
import React, { useEffect, useRef, useState } from "react";
import { Animated, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StopListItem } from "@/features/map/components/StopListItem";

type RouteStop = {
  id: string;
  sequence_number: number;
  order: string | null;
  customer_name: string;
  address: string;
  latitude: number;
  longitude: number;
  order_status?: string;
};

type GroupedStop = {
  groupKey: string;
  address: string;
  stops: RouteStop[];
};

type Props = {
  group: GroupedStop;
  activeStopId: string | null;
  nearStopId: string | null;
  onSelectStop: (stopId: string, groupKey: string) => void;
};

export function GroupedStopCard({
  group,
  activeStopId,
  nearStopId,
  onSelectStop,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const firstStop = group.stops[0];
  const isCurrentGroup = group.stops.some((s) => s.id === activeStopId);
  const isNearGroup = group.stops.some((s) => s.id === nearStopId);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [expanded, anim]);

  const contentScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });

  const contentOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const maxHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, group.stops.length * 140 + 24],
  });

  return (
    <View className="mb-3 overflow-hidden rounded-3xl bg-white">
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between px-4 py-4"
        activeOpacity={0.85}
      >
        <View className="flex-1 pr-3">
          <View className="flex-row items-start gap-3">
            <Ionicons
              name={isCurrentGroup ? "radio-button-on" : isNearGroup ? "location" : "business-outline"}
              size={18}
              color={isCurrentGroup ? "#1B5E37" : isNearGroup ? "#D4872A" : "#4A4A4A"}
              style={{ marginTop: 2 }}
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <View />
                </View>
              </View>
            </View>
          </View>

          <View className="mt-2">
            <View />
          </View>
        </View>

        <Animated.View
          style={{
            transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }],
          }}
        >
          <Ionicons name="chevron-down" size={20} color="#1B5E37" />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={{
          maxHeight,
          opacity: contentOpacity,
          transform: [{ scaleY: contentScale }],
          overflow: "hidden",
        }}
      >
        <View className="px-4 pb-4">
          <View className="gap-y-2">
            {group.stops.map((stop) => (
              <View key={stop.id}>
                <StopListItem
                  sequenceNumber={stop.sequence_number}
                  customerName={stop.customer_name}
                  address={stop.address}
                  items={[]}
                  status={stop.id === activeStopId ? "current" : "pending"}
                  isNear={stop.id === nearStopId}
                  isActive={stop.id === activeStopId}
                  onPress={() => onSelectStop(stop.id, group.groupKey)}
                />
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}