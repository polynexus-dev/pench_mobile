import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const PRODUCT_CARD_WIDTH = (width - 40) / 2; // 2 columns with gaps

export function HeaderSection({ locationName = "Bilzen, Tanjungbalai" }: { locationName?: string }) {
  return (
    <LinearGradient
      colors={["#FFEDC2", "#FFFFFF"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="px-4 pb-4 pt-3"
    >
      {/* Top row: Location & Profile */}
      <View className="mb-5 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-[#E5EFEA]">
             <Ionicons name="location" size={20} color="#0C5A35" />
          </View>
          <View>
            <Text className="mb-0.5 text-xs font-medium text-gray-600">Location</Text>
            <View className="flex-row items-center">
              <Text className="text-sm font-bold text-gray-900">{locationName}</Text>
              <Ionicons name="chevron-down" size={14} color="#333" style={{ marginLeft: 2, marginTop: 2 }} />
            </View>
          </View>
        </View>
        <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full border border-gray-400 bg-transparent">
          <Ionicons name="person-outline" size={18} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center rounded-2xl border border-[#0C5A35] bg-white px-4 py-2.5 shadow-sm">
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          placeholder="Search Milk, Ghee, Paneer..."
          placeholderTextColor="#6B7280"
          className="ml-2 flex-1 text-sm text-gray-800"
        />
      </View>
    </LinearGradient>
  );
}

export function CategoryBar({ categories, selected, onSelect }: any) {
  // Return correct icon node (mix of Ionicons and Emojis) based on category
  const getIconNode = (id: string, active: boolean) => {
    switch (id.toLowerCase()) {
      case "all":
        return <Ionicons name="water-outline" size={16} color={active ? "#111" : "#666"} />;
      case "milk":
        return <Text className="text-sm">🥛</Text>;
      case "paneer":
        return <Text className="text-sm">🧀</Text>;
      case "ghee":
        return <Text className="text-sm">🧈</Text>;
      default:
        return <Ionicons name="water-outline" size={16} color={active ? "#111" : "#666"} />;
    }
  };

  return (
    <View className="border-b-[3px] border-[#F4C553] bg-white pb-3 pt-1">
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const active = item.id === selected;
          return (
            <TouchableOpacity
              onPress={() => onSelect(item.id)}
              activeOpacity={0.85}
              className={`flex-row items-center gap-1.5 rounded-xl px-4 py-2 ${
                active ? "bg-[#FBE9C8]" : "bg-transparent"
              }`}
            >
              {getIconNode(item.id, active)}
              <Text
                className={`text-[14px] font-medium ${
                  active ? "text-gray-900" : "text-gray-600"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

export function BannerCarousel({ items }: { items: any[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<FlatList>(null);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % items.length;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      scrollRef.current?.scrollToOffset({
        offset: nextIndex * (width - 32 + 12),
        animated: true,
      });
    }, 2500); // Shorter interval for testing
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <View className="mx-4 mb-4 mt-6">
      <FlatList
        ref={scrollRef}
        data={items}
        horizontal
        snapToInterval={width - 32 + 12}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(
            event.nativeEvent.contentOffset.x / (width - 32 + 12)
          );
          activeIndexRef.current = nextIndex;
          setActiveIndex(nextIndex);
        }}
        renderItem={({ item }) => (
          <View className="flex-row overflow-hidden rounded-2xl p-5" style={{ width: width - 32, backgroundColor: item.bgColor || "#0C5A35" }}>
            <View className="z-10 flex-1 pr-1">
              <View className="mb-3 self-start rounded-full bg-white/20 px-3 py-1">
                <Text className="text-[10px] font-semibold text-white">
                  {item.note || "Farm Fresh"}
                </Text>
              </View>
              <Text className="mb-2 text-[20px] font-semibold leading-7 text-white">
                {item.title || "Get more from Pench"}
              </Text>
              <Text className="mb-5 text-[10px] leading-[14px] text-white/80">
                {item.subtitle || "Order more dairy products on your daily subscription and get awesome discounts"}
              </Text>
              <TouchableOpacity className="self-start rounded-xl bg-[#F4C553] px-5 py-2">
                <Text className="text-[12px] font-bold text-[#0C5A35]">Order now</Text>
              </TouchableOpacity>
            </View>
            <View className="absolute -bottom-6 -right-6 h-36 w-36 overflow-hidden rounded-full opacity-90">
               <Image
                 source={{ uri: "https://images.unsplash.com/photo-1628105652613-2d5fc2f3a6cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" }}
                 className="h-full w-full"
                 resizeMode="cover"
               />
            </View>
          </View>
        )}
      />
      <View className="mt-3 flex-row justify-center gap-1.5">
        {items.map((item, index) => (
          <View
            key={item.id}
            className={`h-1.5 rounded-full ${
              index === activeIndex ? "w-5 bg-[#0C5A35]" : "w-1.5 bg-[#0C5A35]/20"
            }`}
          />
        ))}
      </View>
    </View>
  );
}

export function ProductCard({ item, cartQty, onAdd, onRemove }: any) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const price = item.unit_price || item.price || 0;

  // Placeholder mapping based on category or name for realistic images
  const getProductImage = (cat: string, name: string) => {
    const text = (cat + " " + name).toLowerCase();
    if (text.includes("milk")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-21.png";
    if (text.includes("paneer")) return "https://penchfoods.com/wp-content/uploads/2020/11/Paneer.png";
    if (text.includes("ghee")) return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-22.png";
    return "https://images.unsplash.com/photo-1628105652613-2d5fc2f3a6cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80";
  };

  const pulse = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  // We are forcing the high-quality mock images because Android often blocks local http:// cleartext images.
  const productImageUrl = getProductImage(item.category || "", item.name || "");

  return (
    <Animated.View
      className="mb-4 overflow-hidden rounded-[16px] bg-white"
      style={{ width: PRODUCT_CARD_WIDTH, transform: [{ scale: scaleAnim }] }}
    >
      <TouchableOpacity activeOpacity={0.95} className="flex-1 rounded-[16px] border border-[#F0F0F0]">
        
        {/* Top Half: Image */}
        <View className="relative h-[130px] w-full bg-[#F8F9FA]">
           <Image
              source={{ uri: productImageUrl }}
              className="rounded-t-[16px]"
              style={{ width: '100%', height: '100%', flex: 1 }}
              resizeMode="cover"
           />
           <TouchableOpacity className="absolute right-2 top-2">
             <Ionicons name="heart-outline" size={20} color="#F4C553" />
           </TouchableOpacity>
           
           {cartQty === 0 ? (
             <TouchableOpacity
                className="absolute bottom-2 right-2 flex-row items-center rounded-xl border border-[#0C5A35] bg-white px-4 py-1"
                onPress={() => { pulse(); onAdd(); }}
                activeOpacity={0.88}
             >
                <Text className="text-[12px] font-bold text-[#0C5A35]">Add</Text>
             </TouchableOpacity>
           ) : (
             <View className="absolute bottom-2 right-2 flex-row items-center rounded-xl bg-[#0C5A35]">
                <TouchableOpacity className="px-2 py-1" onPress={onRemove}>
                  <Ionicons name="remove" size={16} color="#fff" />
                </TouchableOpacity>
                <Text className="px-1 text-[13px] font-bold text-white">{cartQty}</Text>
                <TouchableOpacity className="px-2 py-1" onPress={() => { pulse(); onAdd(); }}>
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
             </View>
           )}
        </View>

        {/* Bottom Half: Details */}
        <View className="p-3">
          <View className="mb-1 flex-row justify-between">
             <Text className="text-[9px] text-gray-500 uppercase">Subscription</Text>
             <Text className="text-[9px] text-gray-500">{item.unit || "1 Liter"}</Text>
          </View>
          
          <Text className="mb-2 min-h-[36px] text-[13px] font-semibold leading-[18px] text-gray-800" numberOfLines={2}>
            {item.name}
          </Text>

          <View className="mt-auto flex-row items-center justify-between">
             <Text className="text-sm font-bold text-gray-900">₹ {price}</Text>
             <Text className="text-[10px] font-bold text-[#1B5E37]">10% off</Text>
          </View>
        </View>

      </TouchableOpacity>
    </Animated.View>
  );
}
