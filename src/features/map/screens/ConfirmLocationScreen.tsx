import { buildUrl } from "@/services/api/buildUrl";
import { httpClient } from "@/services/api/httpClient";
import { locationApi } from "@/services/api/locationApi";
import { useAuthStore } from "@/store/authStore";
import type { CustomerLocation } from "@/types/domain/location.types";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const DEFAULT_LAT = 21.1458;
const DEFAULT_LNG = 79.0882;

type SearchResult = {
  displayName: string;
  name: string;
  lat: number;
  lng: number;
};

export function ConfirmLocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const domainName = useAuthStore((s) => s.domain_name) || "";
  const webRef = useRef<WebView>(null);
  const searchInputRef = useRef<TextInput>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
  });
  const [addressTitle, setAddressTitle] = useState("Nagpur");
  const [addressSubtitle, setAddressSubtitle] = useState("Detecting address...");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Tag & address details state
  const [selectedTag, setSelectedTag] = useState<"home" | "work" | "other">("home");
  const [tagLabel, setTagLabel] = useState("");
  const [landmark, setLandmark] = useState("");
  const [houseDetails, setHouseDetails] = useState("");
  const [existingLocations, setExistingLocations] = useState<CustomerLocation[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Load initial location (either saved or current GPS)
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("pench_customer_location");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.lat && parsed.lng) {
            setCoords({ lat: parsed.lat, lng: parsed.lng });
            if (parsed.address) {
              const parts = parsed.address.split(",");
              setAddressTitle(parts[0]?.trim() || "Delivery Location");
              setAddressSubtitle(parts.slice(1).join(",").trim() || "Nagpur");
            }
            return;
          }
        }

        // Try getting current position
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });
          zoomMapTo(latitude, longitude);
          fetchAddress(latitude, longitude);
        } else {
          fetchAddress(DEFAULT_LAT, DEFAULT_LNG);
        }
      } catch (e) {
        fetchAddress(DEFAULT_LAT, DEFAULT_LNG);
      }
    })();
  }, []);

  const zoomMapTo = (lat: number, lng: number) => {
    webRef.current?.injectJavaScript(`
      if (window.centerOnLocation) {
        window.centerOnLocation(${lat}, ${lng});
      }
      true;
    `);
  };

  // Reverse geocode
  const fetchAddress = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geo && geo.length > 0) {
        const a = geo[0];
        const primary = a.name || a.street || a.subregion || a.district || "Location";
        const secondaryParts = [
          a.street && a.street !== primary ? a.street : null,
          a.subregion || a.district,
          a.city || "Nagpur",
          a.region,
          a.postalCode,
        ].filter(Boolean);
        const secondary = secondaryParts.join(", ") || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        setAddressTitle(primary);
        setAddressSubtitle(secondary);
        setIsGeocoding(false);
        return;
      }
    } catch (e) {
      // Fallback to OSM
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { "User-Agent": "PenchFoodsApp/1.0" } }
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const primary =
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.road ||
          addr.city ||
          "Delivery Location";
        const secondary = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setAddressTitle(primary);
        setAddressSubtitle(secondary);
        setIsGeocoding(false);
        return;
      }
    } catch (e) { }

    setAddressTitle("Pinned Location");
    setAddressSubtitle(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    setIsGeocoding(false);
  };

  // Handle map events from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "dragStart") {
        setIsDragging(true);
      } else if (data.type === "locationChange") {
        setIsDragging(false);
        const { lat, lng } = data;
        setCoords({ lat, lng });
        fetchAddress(lat, lng);
      }
    } catch (e) {
      // ignore
    }
  };

  // Live search for areas
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&countrycodes=in&addressdetails=1&limit=5`;
        const res = await fetch(url, {
          headers: { "User-Agent": "PenchFoodsApp/1.0" },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setSearchResults(
            data.map((item: any) => ({
              displayName: item.display_name,
              name: item.name || item.display_name.split(",")[0],
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            }))
          );
          setShowSearchResults(true);
        }
      } catch (e) {
        console.warn("Search failed:", e);
      } finally {
        setIsSearching(false);
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select search result
  const handleSelectSearchResult = (item: SearchResult) => {
    Keyboard.dismiss();
    setShowSearchResults(false);
    setSearchQuery("");
    setCoords({ lat: item.lat, lng: item.lng });
    setAddressTitle(item.name);
    setAddressSubtitle(item.displayName);
    zoomMapTo(item.lat, item.lng);
  };

  // "Use current location" button handler
  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      // 1. Request foreground permissions directly (prompts Android OS dialog if not yet asked)
      const perm = await Location.requestForegroundPermissionsAsync();

      // If permission is not granted, show the permission prompt dialog
      if (perm.status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Pench needs access to your device location to detect your delivery address. Please grant location permission in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Give Permission",
              style: "default",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }

      // 2. Check if device location services (GPS) are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Device GPS / Location is turned off. Please turn on Location in your phone settings to detect your current position.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      // 3. Get accurate current GPS position
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lng: longitude });
      zoomMapTo(latitude, longitude);
      await fetchAddress(latitude, longitude);
    } catch (e: any) {
      console.warn("Location detection error:", e);
      Alert.alert(
        "Location Detection Failed",
        "Could not detect your current location. Please verify that GPS and location permissions are enabled.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
    } finally {
      setIsLocating(false);
    }
  };

  // Pre-fetch user's saved locations from backend to know which tags are already used
  useEffect(() => {
    (async () => {
      if (!domainName) return;
      try {
        const locs = await locationApi.getLocations(domainName);
        if (locs && Array.isArray(locs)) {
          setExistingLocations(locs);
        }
      } catch (e) {
        console.warn("Could not pre-fetch existing locations:", e);
      }
    })();
  }, [domainName]);

  const getExistingLocationForTag = useCallback(
    (tag: string): CustomerLocation | undefined => {
      return existingLocations.find(
        (l) => (l.tag || "").toLowerCase() === tag.toLowerCase()
      );
    },
    [existingLocations]
  );

  const executeSaveLocation = async (isUpdate: boolean, locationId?: number | string) => {
    setIsSaving(true);
    try {
      const parts = [
        houseDetails.trim() || null,
        addressTitle,
        addressSubtitle,
      ].filter(Boolean);
      const fullAddress = parts.join(", ");

      const tagFormatted = selectedTag.toLowerCase();
      const profileName =
        selectedTag === "home"
          ? "Home"
          : selectedTag === "work"
            ? "Work"
            : tagLabel.trim() || "Other";
      const labelValue = selectedTag === "other" ? tagLabel.trim() : "";

      const payload = {
        tag: tagFormatted,
        label: labelValue,
        address: fullAddress,
        landmark: landmark.trim(),
        latitude: coords.lat.toFixed(6),
        longitude: coords.lng.toFixed(6),
        is_default: true,
      };

      let finalId = locationId;

      if (isUpdate && locationId) {
        // Use UPDATE endpoint: PATCH /api/accounts/locations/{{location_id}}/
        const updated = await locationApi.updateLocation(domainName, locationId, payload);
        if (updated?.id) finalId = updated.id;
      } else {
        // Use CREATE endpoint: POST /api/accounts/locations/
        const created = await locationApi.createLocation(domainName, payload);
        if (created?.id) finalId = created.id;
      }

      const locData = {
        id: finalId,
        lat: coords.lat,
        lng: coords.lng,
        address: fullAddress,
        landmark: landmark.trim(),
        profile: profileName,
      };

      // 2. Save to AsyncStorage
      await AsyncStorage.setItem("pench_customer_location", JSON.stringify(locData));

      const savedStr = await AsyncStorage.getItem("pench_customer_location_profiles");
      const currentProfiles = savedStr ? JSON.parse(savedStr) : {};
      currentProfiles[profileName] = {
        id: finalId,
        lat: locData.lat,
        lng: locData.lng,
        address: fullAddress,
        landmark: landmark.trim(),
      };
      await AsyncStorage.setItem(
        "pench_customer_location_profiles",
        JSON.stringify(currentProfiles)
      );

      // 3. Patch ERP user profile and update authStore
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          city_name: `${profileName}: ${houseDetails.trim() ? houseDetails.trim() + ", " : ""}${addressTitle}`,
        });
      }

      if (domainName) {
        try {
          const url = buildUrl(domainName, "/api/accounts/me/");
          const response = await httpClient.patch(url, {
            city_name: `${profileName}: ${houseDetails.trim() ? houseDetails.trim() + ", " : ""}${addressTitle}`,
          });
          useAuthStore.getState().setUser(response as any);
        } catch (apiErr) {
          console.warn("ERP profile patch error:", apiErr);
        }
      }

      router.back();
    } catch (err: any) {
      const errMsg = err?.message || "";
      if (
        errMsg.toLowerCase().includes("already have") &&
        errMsg.toLowerCase().includes("location")
      ) {
        try {
          const locs = await locationApi.getLocations(domainName, selectedTag);
          const found = locs.find(
            (l) => (l.tag || "").toLowerCase() === selectedTag.toLowerCase()
          );
          if (found?.id) {
            promptUpdateConfirmation(found);
            return;
          }
        } catch { }
      }

      Alert.alert("Error Saving Location", err?.message || "Failed to confirm location.");
    } finally {
      setIsSaving(false);
    }
  };

  const promptUpdateConfirmation = (existing: CustomerLocation) => {
    const tagName =
      existing.tag === "home"
        ? "Home"
        : existing.tag === "work"
          ? "Work"
          : existing.label || "Other";

    Alert.alert(
      `Update Existing ${tagName} Location?`,
      `You already have a location saved under "${tagName}".\n\nExisting: ${existing.address}\n\nWould you like to update it with your selected location?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setIsSaving(false),
        },
        {
          text: "Update",
          style: "default",
          onPress: () => executeSaveLocation(true, existing.id),
        },
      ]
    );
  };

  // Confirm Location Handler
  const handleConfirmLocation = async () => {
    let existing = getExistingLocationForTag(selectedTag);

    // If not found in cache, query backend for latest status
    if (!existing && domainName) {
      try {
        const found = await locationApi.getLocations(domainName, selectedTag);
        existing = found.find(
          (l) => (l.tag || "").toLowerCase() === selectedTag.toLowerCase()
        );
      } catch (e) { }
    }

    if (existing?.id) {
      // Ask for confirmation before updating
      promptUpdateConfirmation(existing);
    } else {
      // Create fresh location
      await executeSaveLocation(false);
    }
  };

  // Leaflet HTML (Light Mode)
  const mapHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #map { height: 100%; width: 100%; overflow: hidden; background: #e5e7eb; }
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      doubleClickZoom: true,
      fadeAnimation: true,
      zoomAnimation: true
    }).setView([${coords.lat}, ${coords.lng}], 16);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    window.centerOnLocation = function(lat, lng) {
      map.flyTo([lat, lng], 17, { animate: true, duration: 0.9 });
    };

    map.on('movestart', function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dragStart' }));
      }
    });

    map.on('moveend', function() {
      var center = map.getCenter();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'locationChange',
          lat: center.lat,
          lng: center.lng
        }));
      }
    });
  </script>
</body>
</html>`;
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar (Light Mode) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm location</Text>
      </View>

      {/* Floating Search Bar */}
      <View style={styles.searchFloatingWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search for a new area, locality..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#16A34A" style={{ marginLeft: 6 }} />
          )}
          {searchQuery.length > 0 && !isSearching && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <View style={styles.searchDropdown}>
            {searchResults.map((item, idx) => (
              <TouchableOpacity
                key={`${item.lat}-${item.lng}-${idx}`}
                style={styles.searchResultRow}
                onPress={() => handleSelectSearchResult(item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color="#16A34A"
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchRowTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.searchRowSubtitle} numberOfLines={1}>
                    {item.displayName}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webRef}
          source={{ html: mapHtml }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          scrollEnabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />

        {/* Center Pointer & Tooltip Overlay */}
        <View style={styles.centerMarkerWrapper} pointerEvents="none">
          {/* Tooltip Speech Bubble */}
          <View style={styles.tooltipPill}>
            <Text style={styles.tooltipText}>Move the pin to adjust your location</Text>
          </View>
          <View style={styles.tooltipArrow} />

          {/* Red Pin Marker with accurate needle tip */}
          <View
            style={[
              styles.pinContainer,
              isDragging && { transform: [{ translateY: -14 }] },
            ]}
          >
            <Image
              source={require("@/assets/images/red_pin.png")}
              style={styles.redPinImage}
              resizeMode="contain"
            />
          </View>
          {/* Ground shadow dot under needle tip */}
          <View
            style={[
              styles.pinShadow,
              isDragging && { transform: [{ scale: 0.55 }], opacity: 0.2 },
            ]}
          />
        </View>

        {/* Floating "Use current location" button */}
        <TouchableOpacity
          onPress={handleUseCurrentLocation}
          disabled={isLocating}
          style={styles.floatingCurrentLocationBtn}
          activeOpacity={0.85}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="locate" size={19} color="#FFFFFF" />
          )}
          <Text style={styles.floatingCurrentLocationText}>
            {isLocating ? "Locating..." : "Use current location"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Card (Delivering your order to) */}
      <View style={[styles.bottomCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          style={styles.bottomCardScroll}
        >
          <Text style={styles.deliveringTitle}>Delivering your order to</Text>

          {/* Address Info Box */}
          <View style={styles.addressBox}>
            {/* Red Pin Icon Badge */}
            <View style={styles.addressIconWrap}>
              <Image
                source={require("@/assets/images/red_pin.png")}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            </View>

            {/* Area & Subtitle */}
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.addressMainTitle} numberOfLines={1}>
                  {addressTitle}
                </Text>
                {isGeocoding && (
                  <ActivityIndicator
                    size="small"
                    color="#16A34A"
                    style={{ transform: [{ scale: 0.75 }] }}
                  />
                )}
              </View>
              <Text style={styles.addressSubtitle} numberOfLines={1}>
                {isGeocoding ? "Detecting address..." : addressSubtitle}
              </Text>
            </View>

            {/* Change Button */}
            <TouchableOpacity
              onPress={() => searchInputRef.current?.focus()}
              style={styles.changeBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* House / Flat / Floor (Optional) */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>HOUSE / FLAT / PLOT / FLOOR (OPTIONAL)</Text>
            <TextInput
              style={styles.textInputField}
              placeholder="e.g. Flat 302, 3rd Floor"
              placeholderTextColor="#9CA3AF"
              value={houseDetails}
              onChangeText={setHouseDetails}
              autoCapitalize="words"
            />
          </View>

          {/* Nearby Landmark (Optional) */}
          <View style={[styles.inputWrap, { marginTop: 10 }]}>
            <Text style={styles.inputLabel}>NEARBY LANDMARK (OPTIONAL)</Text>
            <TextInput
              style={styles.textInputField}
              placeholder="e.g. Near Trikoni Park"
              placeholderTextColor="#9CA3AF"
              value={landmark}
              onChangeText={setLandmark}
              autoCapitalize="words"
            />
          </View>

          {/* Save Address As Tag Selector */}
          <View style={{ marginTop: 12, marginBottom: 14 }}>
            <Text style={styles.inputLabel}>SAVE LOCATION AS</Text>
            <View style={styles.tagRow}>
              {[
                { id: "home", label: "Home", icon: "home" },
                { id: "work", label: "Work", icon: "briefcase" },
                { id: "other", label: "Other", icon: "location" },
              ].map((item) => {
                const isSelected = selectedTag === item.id;
                const hasExisting = Boolean(getExistingLocationForTag(item.id));
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSelectedTag(item.id as any)}
                    activeOpacity={0.8}
                    style={[
                      styles.tagChip,
                      isSelected && styles.tagChipActive,
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={16}
                      color={isSelected ? "#16A34A" : "#6B7280"}
                    />
                    <Text
                      style={[
                        styles.tagChipText,
                        isSelected && styles.tagChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {hasExisting && (
                      <View
                        style={[
                          styles.existingDot,
                          isSelected && styles.existingDotActive,
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* If Other: Custom Label Input */}
            {selectedTag === "other" && (
              <View style={{ marginTop: 10 }}>
                <TextInput
                  style={styles.textInputField}
                  placeholder="Tag label (e.g. Mom's House, Gym)"
                  placeholderTextColor="#9CA3AF"
                  value={tagLabel}
                  onChangeText={setTagLabel}
                  autoCapitalize="words"
                />
              </View>
            )}

            {/* Notice if this tag already exists */}
            {Boolean(getExistingLocationForTag(selectedTag)) && (
              <View style={styles.existingNoticeBox}>
                <Ionicons name="information-circle-outline" size={15} color="#D97706" />
                <Text style={styles.existingNoticeText}>
                  A {selectedTag === "home" ? "Home" : selectedTag === "work" ? "Work" : "matching"} location exists. Confirming will update it.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Confirm / Update Location Button */}
        <TouchableOpacity
          onPress={handleConfirmLocation}
          disabled={isSaving}
          style={[styles.confirmBtn, isSaving && { opacity: 0.8 }]}
          activeOpacity={0.88}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>
                {getExistingLocationForTag(selectedTag)
                  ? `Update ${selectedTag === "home" ? "Home" : selectedTag === "work" ? "Work" : "Location"}`
                  : "Confirm Location"}
              </Text>
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  searchFloatingWrap: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    paddingVertical: 0,
  },
  searchDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  searchRowSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
    backgroundColor: "#E5E7EB",
  },

  // Center Marker Overlay
  centerMarkerWrapper: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -120 }, { translateY: -86 }],
    width: 240,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  tooltipPill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 4,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderStyle: "solid",
    backgroundColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
    marginBottom: 2,
  },
  pinContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  redPinImage: {
    width: 48,
    height: 48,
  },
  pinShadow: {
    width: 14,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    marginTop: 0,
  },

  // Floating Use Current Location Button
  floatingCurrentLocationBtn: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0C5A35",
    borderWidth: 1.5,
    borderColor: "#16A34A",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#0C5A35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 30,
  },
  floatingCurrentLocationText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  // Bottom Card
  bottomCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  deliveringTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  addressIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addressMainTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  addressSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  changeBtn: {
    borderWidth: 1,
    borderColor: "#16A34A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
    height: 50,
    borderRadius: 14,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  bottomCardScroll: {
    maxHeight: 380,
  },
  inputWrap: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInputField: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: "#111827",
  },
  tagRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  tagChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  tagChipActive: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
  },
  tagChipTextActive: {
    color: "#16A34A",
  },
  existingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D97706",
  },
  existingDotActive: {
    backgroundColor: "#16A34A",
  },
  existingNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 8,
  },
  existingNoticeText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
    flex: 1,
  },
});

export default ConfirmLocationScreen;
