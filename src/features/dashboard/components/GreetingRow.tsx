// import React from "react";
// import { View, Text } from "react-native";

// interface GreetingRowProps {
//     name: string;
//     date?: Date;
// }

// function getGreeting(): string {
//     const hour = new Date().getHours();
//     if (hour < 12) return "Good Morning";
//     if (hour < 17) return "Good Afternoon";
//     return "Good Evening";
// }

// function formatDate(date: Date): { display: string; day: string } {
//     const day = String(date.getDate()).padStart(2, "0");
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const year = String(date.getFullYear()).slice(2);
//     const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
//     return { display: `${day}/${month}/${year}`, day: dayName };
// }

// export function GreetingRow({ name, date = new Date() }: GreetingRowProps) {
//     const greeting = getGreeting();
//     const { display, day } = formatDate(date);

//     return (
//         <View className="flex-row items-start justify-between px-4 pt-2 pb-4">
//             {/* Left: Greeting + Name */}
//             <View className="flex-1">
//                 <Text className="text-base text-text-secondary font-normal">
//                     {greeting},
//                 </Text>
//                 <Text className="text-xl font-bold text-text-primary leading-7">
//                     {name}
//                 </Text>
//             </View>

//             {/* Right: Date Badge */}
//             <View className="flex-row items-center border border-border rounded-lg px-3 py-1.5 bg-bg-card gap-x-2">
//                 <Text className="text-sm font-medium text-text-primary">{display}</Text>
//                 <View className="w-px h-4 bg-border" />
//                 <Text className="text-sm font-medium text-text-primary">{day}</Text>
//             </View>
//         </View>
//     );
// }

import React from "react";
import { View, Text } from "react-native";
import { formatDateTime } from "@/utils/dateFormatter";

interface GreetingRowProps {
    name: string;
    date?: Date;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
}

function formatDateParts(date: Date): { display: string; day: string } {
    const [display] = formatDateTime(date.toISOString()).split(",");
    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    return { display: display.trim(), day };
}

export function GreetingRow({ name, date = new Date() }: GreetingRowProps) {
    const greeting = getGreeting();
    const { display, day } = formatDateParts(date);

    return (
        <View className="flex-row items-center justify-between bg-green-100 p-2 rounded-md">
            <View>
                <Text className="text-base text-text-secondary">{greeting},</Text>
                <Text className="text-2xl font-bold text-text-primary">{name}</Text>
            </View>

            <View className="items-end">
                <Text className="text-sm text-text-secondary">{display}</Text>
                <Text className="text-xs text-text-muted">{day}</Text>
            </View>
        </View>
    );
}