import { useEffect } from "react";
import Toast from "react-native-toast-message";
import { registerToastHandler, type ToastOptions } from "@/hooks/useToast";

export function ToastProvider() {
    useEffect(() => {
        registerToastHandler((options: ToastOptions) => {
            Toast.show({
                type: options.type === "warning" ? "info" : (options.type ?? "info"),
                text1: options.message,
                visibilityTime: options.duration ?? 3000,
                position: "top",
            });
        });
    }, []);

    return <Toast />;
}