import { Alert, type AlertButton, type AlertOptions } from "react-native";

export interface AlertModalConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
}

type AlertListener = (config: AlertModalConfig | null) => void;

let currentListener: AlertListener | null = null;
let originalAlert: typeof Alert.alert | null = null;

/**
 * Register the active AlertModalProvider listener.
 * Automatically overrides Alert.alert so all alert calls throughout the app
 * display the custom modal.
 */
export function registerAlertListener(listener: AlertListener) {
  currentListener = listener;

  if (!originalAlert) {
    originalAlert = Alert.alert;
    // Globally replace Alert.alert with custom modal presentation
    Alert.alert = (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: AlertOptions
    ) => {
      if (currentListener) {
        currentListener({ title, message, buttons, options });
      } else if (originalAlert) {
        originalAlert(title, message, buttons, options);
      }
    };
  }

  return () => {
    currentListener = null;
  };
}

/**
 * Explicit helper to show custom modal alert
 */
export function showModalAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
) {
  Alert.alert(title, message, buttons, options);
}

