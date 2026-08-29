import { useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

type ToastHandler = (options: ToastOptions) => void;

let _handler: ToastHandler | null = null;

/** Call this once in the root layout to register the toast handler. */
export function registerToastHandler(handler: ToastHandler) {
  _handler = handler;
}

/** Hook to show toasts from any component. */
export function useToast() {
  const show = useCallback((options: ToastOptions) => {
    if (_handler) {
      _handler(options);
    } else if (__DEV__) {
      console.warn("[useToast] No toast handler registered.");
    }
  }, []);

  return { show };
}
