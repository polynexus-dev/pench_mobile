import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Custom hook that calculates the correct bottom padding for scrollable screen content
 * to ensure that items can scroll past the bottom tab bar and remain fully visible.
 * On iOS/Android (NativeTabs), it accounts for the native tab bar height and safe area insets.
 * On Web/standard navigation, it defaults to the standard padding since standard layouts handle screen height dynamically.
 * 
 * @param extraPadding Additional spacing to apply at the bottom of the content container (defaults to 16)
 * @returns The computed paddingBottom value
 */
export function useBottomTabPadding(extraPadding = 16) {
  const insets = useSafeAreaInsets();
  const isNativeTabs = Platform.OS === 'ios' || Platform.OS === 'android';
  const tabHeight = Platform.OS === 'ios' ? 49 : 60;
  
  return isNativeTabs ? insets.bottom + tabHeight + extraPadding : extraPadding;
}
