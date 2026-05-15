import { View, Text } from "react-native";
import { Link } from "expo-router";

export default function NotFound() {
  return (
    <View className="flex-1 items-center justify-center bg-surface p-6">
      <Text className="text-2xl font-bold text-primary mb-2">404</Text>
      <Text className="text-base text-secondary mb-6">This screen doesn't exist.</Text>
      {/* <Link href="/(auth)/login" className="text-primary underline text-base">
        Go to Login
      </Link> */}
    </View>
  );
}
