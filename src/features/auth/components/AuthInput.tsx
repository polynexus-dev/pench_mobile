import React, { useState } from "react";
import {
    View,
    TextInput,
    TextInputProps,
} from "react-native";

interface AuthInputProps extends TextInputProps {
    rightIcon?: React.ReactNode;
}

export function AuthInput({ rightIcon, ...props }: AuthInputProps) {
    const [focused, setFocused] = useState(false);

    return (
        <View
            className={`flex-row items-center bg-border-disable rounded-full px-6  h-16 border ${focused ? "border-border-focus" : "border-border-disable"}`}
            style={{ borderWidth: focused ? 1.5 : 1 }}
        >
            <TextInput
                className={`flex-1 text-sm text-text-primary py-4 font-bold `}

                placeholderTextColor="#9E9E9E"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{ paddingVertical: 0 }} // fixes Android vertical misalignment
                {...props}
            />
            {rightIcon && (
                <View className="ml-2">{rightIcon}</View>
            )}
        </View>
    );
}