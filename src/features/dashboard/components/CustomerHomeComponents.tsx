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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCartStore } from "@/store/useCartStore";

const { width } = Dimensions.get("window");
const PRODUCT_CARD_WIDTH = (width - 40) / 2; // 2 columns with gaps

export function HeaderSection({ locationName = "Bilzen, Tanjungbalai" }: { locationName?: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <LinearGradient
      colors={["#f5d591ff", "#FDFDFD"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="px-4 pb-4"
      style={{ paddingTop: insets.top + 12 }}
    >
      {/* Top row: Location & Profile */}
      <View className="mb-5 mt-2 flex-row items-center justify-between">
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
        <TouchableOpacity
          onPress={() => router.push("/(customer)/cart")}
          className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-200/50 relative"
        >
          <Ionicons name="cart-outline" size={20} color="#0C5A35" />
          {cartCount > 0 && (
            <View className="absolute -top-1.5 -right-1.5 bg-[#E53E3E] rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
              <Text className="text-white text-[10px] font-black">{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center rounded-full bg-white px-4 py-2.5 shadow-md shadow-gray-200/50 border border-gray-300/50">
        <Ionicons name="search-outline" size={18} color="#757575" style={{ opacity: 0.9 }} />
        <TextInput
          placeholder="Search Milk, Ghee, Paneer..."
          placeholderTextColor="#9E9E9E"
          className="ml-2.5 flex-1 text-md text-gray-800 font-medium p-0"
        />
        <View className="h-4 w-px bg-gray-200 mx-2" />
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="options-outline" size={18} color="#0C5A35" />
        </TouchableOpacity>
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

const getGradientColors = (bgColor: string): [string, string] => {
  switch (bgColor?.toLowerCase()) {
    case "#0b6035":
      return ["#0B6035", "#053D20"];
    case "#105b74":
      return ["#105B74", "#093A4B"];
    case "#7a470a":
      return ["#7A470A", "#4E2D04"];
    case "#0e5a37":
      return ["#0E5A37", "#073A21"];
    default:
      return [bgColor || "#0C5A35", "#053D20"];
  }
};

const getBannerImage = (id: string) => {
  switch (id) {
    case "b1":
      return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-21.png"; // milk bottle
    case "b2":
      return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-21.png"; // milk bottle (subscription theme)
    case "b3":
      return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-22.png"; // ghee jar
    case "b4":
      return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-21.png"; // milk bottle (bottle promise theme)
    default:
      return "https://penchfoods.com/wp-content/uploads/2020/11/Untitled-design-21.png";
  }
};

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
          <LinearGradient
            colors={getGradientColors(item.bgColor)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-row overflow-hidden rounded-[24px] p-5"
            style={{ width: width - 32 }}
          >
            <View className="z-10 flex-1 pr-1 justify-between">
              <View>
                <View className="mb-3 self-start rounded-full bg-white/20 px-3 py-1">
                  <Text className="text-[10px] font-bold text-white uppercase tracking-wider">
                    {item.note || "Farm Fresh"}
                  </Text>
                </View>
                <Text className="mb-1 text-[18px] font-bold leading-6 text-white tracking-tight" numberOfLines={2}>
                  {item.title || "Get more from Pench"}
                </Text>
                <Text className="mb-4 text-[10px] leading-[14px] text-white/80 font-medium" numberOfLines={2}>
                  {item.subtitle || "Order more dairy products on your daily subscription and get awesome discounts"}
                </Text>
              </View>
              <TouchableOpacity className="self-start rounded-xl bg-[#F4C553] px-5 py-2">
                <Text className="text-[12px] font-bold text-[#0C5A35]">Order now</Text>
              </TouchableOpacity>
            </View>
            <View className="relative justify-center items-center">
              {/* Circular container for masking */}
              <View 
                className="h-28 w-28 overflow-hidden rounded-full bg-white/10 items-center justify-center"
                style={{ overflow: 'hidden', borderRadius: 56 }}
              >
                 <Image
                   source={{ uri: getBannerImage(item.id) }}
                   className="h-24 w-24 rounded-full"
                   style={{ width: 96, height: 96, borderRadius: 48 }}
                   resizeMode="cover"
                 />
              </View>
            </View>
          </LinearGradient>
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
  const [isFavorite, setIsFavorite] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const price = item.unit_price || item.price || 0;
  const mrp = item.mrp || (price > 0 ? Math.round(price * 1.15) : 0);
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

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

  const productImageUrl = getProductImage(item.category || "", item.name || "");

  return (
    <Animated.View
      className="mb-4 rounded-[24px] bg-white border border-gray-100/70"
      style={{
        width: PRODUCT_CARD_WIDTH,
        transform: [{ scale: scaleAnim }],
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="flex-1 rounded-[24px] overflow-hidden">
        
        {/* Top Half: Image Container */}
        <View className="relative h-[135px] w-full bg-[#FAF9F5] overflow-hidden">
           <Image
              source={{ uri: productImageUrl }}
              className="h-full w-full"
              resizeMode="cover"
           />
           
           {/* Glass Bottle Badge */}
           {item.is_returnable && (
             <View className="absolute left-2.5 top-2.5 flex-row items-center rounded-full bg-white/90 px-2.5 py-0.5 border border-gray-200/50 shadow-xs">
               <Ionicons name="leaf" size={9} color="#0C5A35" />
               <Text className="ml-1 text-[8px] font-bold text-[#0C5A35] uppercase tracking-wider">Glass Bottle</Text>
             </View>
           )}

           {/* Heart/Favorite Overlay */}
           <TouchableOpacity 
             activeOpacity={0.7} 
             onPress={() => setIsFavorite(!isFavorite)}
             className="absolute right-2.5 top-2.5 h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm border border-gray-100"
           >
             <Ionicons 
               name={isFavorite ? "heart" : "heart-outline"} 
               size={14} 
               color={isFavorite ? "#E11D48" : "#757575"} 
             />
           </TouchableOpacity>
        </View>

        {/* Bottom Half: Details */}
        <View className="p-3.5">
          <View className="mb-1 flex-row justify-between items-center">
             <Text className="text-[9px] font-bold text-[#0C5A35] uppercase tracking-widest">
               {item.category || "DAIRY"}
             </Text>
             <Text className="text-[10px] font-semibold text-gray-500">
               {item.unit || "500 ml"}
             </Text>
          </View>
          
          <Text className="mb-2.5 min-h-[38px] text-[13px] font-bold leading-[18px] text-gray-800" numberOfLines={2}>
            {item.name}
          </Text>

          <View className="mt-1 flex-row items-end justify-between">
             <View>
                {discountPercent > 0 && (
                  <Text className="text-[10px] text-gray-400 line-through font-bold mb-0.5">
                    ₹ {mrp}
                  </Text>
                )}
                <Text className="text-base font-extrabold text-gray-900">₹ {price}</Text>
             </View>

             {/* Cart Controller */}
             {cartQty === 0 ? (
               <TouchableOpacity
                  className="flex-row items-center rounded-full bg-[#0C5A35] px-3.5 py-1.5 shadow-sm active:opacity-90"
                  onPress={() => { pulse(); onAdd(); }}
                  activeOpacity={0.88}
               >
                  <Ionicons name="add" size={11} color="#fff" style={{ marginRight: 2 }} />
                  <Text className="text-[11px] font-bold text-white uppercase tracking-wider">Add</Text>
               </TouchableOpacity>
             ) : (
               <View className="flex-row items-center rounded-full bg-[#0C5A35] px-2 py-1.5 shadow-sm">
                  <TouchableOpacity className="px-1.5" onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="remove" size={12} color="#fff" />
                  </TouchableOpacity>
                  <Text className="px-1.5 text-[12px] font-bold text-white">{cartQty}</Text>
                  <TouchableOpacity className="px-1.5" onPress={() => { pulse(); onAdd(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="add" size={12} color="#fff" />
                  </TouchableOpacity>
               </View>
             )}
          </View>
        </View>

      </View>
    </Animated.View>
  );
}
