// import React, { useState } from "react";
// import { View, Text, TouchableOpacity } from "react-native";
// import { useRouter } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { AuthInput } from "./AuthInput";
// import { useLogin } from "../hooks/useLogin";
// import {Input} from "@/shared/ui/Input"

// export function UsernameLoginForm() {
//     const router = useRouter();
//     const [username, setUsername] = useState("");
//     const [password, setPassword] = useState("");
//     const [showPassword, setShowPassword] = useState(false);
//     const { mutate: login, isPending, isError, error } = useLogin();

//     return (
//         <View className="w-full gap-y-4">
//             <AuthInput
//                 label="Username"
//                 placeholder="Enter your Username"
//                 value={username}
//                 onChangeText={setUsername}
//                 autoCapitalize="none"
//                 autoCorrect={false}
//             />

//             <AuthInput
//                 label="Enter Password"
//                 placeholder="Enter your Password"
//                 value={password}
//                 onChangeText={setPassword}
//                 secureTextEntry={!showPassword}
//                 rightIcon={
//                     <TouchableOpacity
//                         onPress={() => setShowPassword((v) => !v)}
//                         hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//                     >
//                         <Ionicons
//                             name={showPassword ? "eye-off-outline" : "eye-outline"}
//                             size={20}
//                             color="#9E9E9E"
//                         />
//                     </TouchableOpacity>
//                 }
//             />
//             <TouchableOpacity
//                 activeOpacity={0.8}
//                 className="self-end"
//                 onPress={() => router.push("/forgot-password" as any)}
//             >
//                 <Text className="text-sm font-semibold text-text-link">
//                     Forgot Password?
//                 </Text>
//             </TouchableOpacity>

//             {isError && (
//                 <Text className="text-error text-xs text-center">
//                     {(error as any)?.message ?? "Invalid username or password."}
//                 </Text>
//             )}

//             {/* Login Button */}
//             <TouchableOpacity
//                 onPress={() => login({ username, password })}
//                 disabled={isPending || !username || !password}
//                 activeOpacity={0.85}
//                 className={`w-full h-14 rounded-full items-center justify-center mt-2 ${isPending || !username || !password
//                     ? "bg-brand-primary/50"
//                     : "bg-brand-primary"
//                     }`}
//             >
//                 <Text className="text-white text-base font-semibold tracking-wide">
//                     {isPending ? "Logging in..." : "Log in"}
//                 </Text>
//             </TouchableOpacity>

//             {/* Register link */}
//             <View className="flex-row items-center justify-center gap-x-1 mt-2">
//                 <Text className="text-sm text-text-secondary">New customer?</Text>
//                 <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
//                     <Text className="text-sm font-semibold text-brand-primary">
//                         Create account
//                     </Text>
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );
// }

import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Input } from "@/shared/ui/Input";

import { useLogin } from "../hooks/useLogin";
import { getErrorMessage } from "@/errors/errorHandler";

export function UsernameLoginForm() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const { mutate: login, isPending, isError, error } = useLogin();

  return (
    <View className="w-full gap-y-4">
      {/* Username / Email */}
      <Input
        label="Username"
        placeholder="Enter your email"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isPending}
        variant="outline"
        size="lg"
        containerClassName="rounded-2xl"
        rightIcon={<Ionicons name="mail-outline" size={20} color="#9E9E9E" />}
      />

      {/* Password */}
      <Input
        label="Password"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        isPassword={true}
        editable={!isPending}
        variant="outline"
        size="lg"
        containerClassName="rounded-2xl"
      />

      {/* Remember me & Forgot Password */}
      <View className="flex-row items-center justify-between w-full mt-2 px-1">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setRememberMe(!rememberMe)}
          className="flex-row items-center gap-x-2"
        >
          <View className={`w-5 h-5 rounded-md border border-neutral-300 items-center justify-center ${rememberMe ? "bg-brand-primary border-brand-primary" : "bg-transparent"}`}>
            {rememberMe && (
              <Ionicons name="checkmark" size={14} color="#FFF" />
            )}
          </View>
          <Text className="text-xs font-semibold text-text-secondary">
            Remember me
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/forgot-password" as any)}
        >
          <Text className="text-xs font-bold text-brand-primary">
            Forget password ?
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {isError && (
        <Text className="text-error text-xs text-center">
          {getErrorMessage(error)}
        </Text>
      )}

      {/* Login Button */}
      <TouchableOpacity
        onPress={() => login({ username, password })}
        disabled={isPending || !username || !password}
        activeOpacity={0.85}
        className={`w-full h-14 rounded-2xl items-center justify-center flex-row gap-x-1 mt-6 ${
          isPending || !username || !password
            ? "bg-brand-primary/50"
            : "bg-brand-primary"
        }`}
      >
        <Text className="text-white text-base font-bold tracking-wide">
          {isPending ? "Logging in..." : "Next"}
        </Text>
        {!isPending && (
          <Ionicons name="chevron-forward" size={18} color="#FFF" />
        )}
      </TouchableOpacity>
    </View>
  );
}
