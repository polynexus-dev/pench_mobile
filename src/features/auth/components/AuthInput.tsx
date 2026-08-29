import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TextInputProps,
} from "react-native";

interface AuthInputProps extends TextInputProps {
    label?: string;
    rightIcon?: React.ReactNode;
}

export function AuthInput({
    label,
    rightIcon,
    ...props
}: AuthInputProps) {
    const [focused, setFocused] = useState(false); 

    return (
        <View>
            {label ? (
                <Text className="mb-1 ml-1 text-sm text-text-primary">
                    {label}
                </Text>
            ) : null}

            <View
                className={`flex-row items-center bg-border-disable rounded-full px-6 h-15 border ${focused ? "border-border-focus" : "border-border-disable"
                    }`}
                style={{ borderWidth: focused ? 1.5 : 1 }}
            >
                <TextInput
                    className="flex-1 text-sm text-text-primary py-4 font-bold"
                    placeholderTextColor="#9E9E9E"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{ paddingVertical: 0 }}
                    {...props}
                />
                {rightIcon && <View className="ml-2">{rightIcon}</View>}
            </View>
        </View>
    );
}