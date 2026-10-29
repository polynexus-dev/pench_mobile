import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { parseGoogleMapsUrl } from "../utils/googleMapsUrlParser";
import { locationApi } from "@/services/api/locationApi";
import type { CustomerLocation } from "@/types/domain/location.types";

type Props = {
  onClose: () => void;
  onConfirm: (location: {
    lat: number;
    lng: number;
    address: string;
    profile: string;
  }) => void;
  onSkip: () => void;
};

type SavedProfile = {
  id?: number | string;
  profile: string;
  address: string;
  landmark?: string;
  lat: number;
  lng: number;
  is_default?: boolean;
};

type SearchResult = {
  displayName: string;
  name: string;
  lat: number;
  lng: number;
};

// Default coordinates: Nagpur, Maharashtra
const DEFAULT_LAT = 21.1458;
const DEFAULT_LNG = 79.0882;

export const LocationSelectBottomSheet = forwardRef<BottomSheetModal, Props>(
  function LocationSelectBottomSheet({ onClose, onConfirm, onSkip }, ref) {
    const router = useRouter();
    const modalRef = useRef<BottomSheetModal>(null);
    const currentUser = useAuthStore((s) => s.user);

    const snapPoints = useMemo(() => ["75%", "92%"], []);

    const [isLocationEnabled, setIsLocationEnabled] = useState(false);
    const [locating, setLocating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Manual address form state
    const [showManualForm, setShowManualForm] = useState(false);
    const [gmapsLink, setGmapsLink] = useState("");
    const [isParsingLink, setIsParsingLink] = useState(false);
    const [linkSuccessMsg, setLinkSuccessMsg] = useState("");

    const [flatNo, setFlatNo] = useState("");
    const [floorNo, setFloorNo] = useState("");
    const [buildingName, setBuildingName] = useState("");
    const [areaLocality, setAreaLocality] = useState("");
    const [landmark, setLandmark] = useState("");
    const [profileType, setProfileType] = useState<"Home" | "Work" | "Other">("Home");

    const [coords, setCoords] = useState<{ lat: number; lng: number }>({
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
    });
    const [addressTitle, setAddressTitle] = useState("Nagpur");
    const [address, setAddress] = useState("");

    // Saved address profiles & active location
    const [savedAddresses, setSavedAddresses] = useState<SavedProfile[]>([]);
    const [activeLocationStr, setActiveLocationStr] = useState<string>("");

    // Load saved customer locations and profiles
    const loadSavedAddresses = useCallback(async () => {
      try {
        const addressMap = new Map<string, SavedProfile>();
        const domainName = useAuthStore.getState().domain_name;

        // 1. Attempt to fetch from backend location API
        let backendLocations: CustomerLocation[] = [];
        try {
          backendLocations = await locationApi.getLocations(domainName);
        } catch (apiErr) {
          console.warn("Location API fetch failed, falling back to cache:", apiErr);
        }

        if (backendLocations && backendLocations.length > 0) {
          const cachedProfileObj: Record<string, any> = {};

          backendLocations.forEach((loc) => {
            const rawTag = (loc.tag || "home").trim();
            const profileLabel = rawTag.charAt(0).toUpperCase() + rawTag.slice(1);
            const lat = typeof loc.latitude === "string" ? parseFloat(loc.latitude) : loc.latitude;
            const lng = typeof loc.longitude === "string" ? parseFloat(loc.longitude) : loc.longitude;
            const safeLat = isNaN(lat) ? DEFAULT_LAT : lat;
            const safeLng = isNaN(lng) ? DEFAULT_LNG : lng;

            const item: SavedProfile = {
              id: loc.id,
              profile: profileLabel,
              address: loc.address,
              landmark: loc.landmark,
              lat: safeLat,
              lng: safeLng,
              is_default: loc.is_default,
            };

            addressMap.set(String(loc.id), item);
            cachedProfileObj[profileLabel] = {
              id: loc.id,
              lat: safeLat,
              lng: safeLng,
              address: loc.address,
              landmark: loc.landmark,
              is_default: loc.is_default,
            };

            if (loc.is_default) {
              setActiveLocationStr(loc.address);
              AsyncStorage.setItem(
                "pench_customer_location",
                JSON.stringify({
                  id: loc.id,
                  lat: safeLat,
                  lng: safeLng,
                  address: loc.address,
                  landmark: loc.landmark,
                  profile: profileLabel,
                })
              ).catch(() => {});
            }
          });

          // Sync cache to AsyncStorage
          AsyncStorage.setItem(
            "pench_customer_location_profiles",
            JSON.stringify(cachedProfileObj)
          ).catch(() => {});

          setSavedAddresses(Array.from(addressMap.values()));
          return;
        }

        // 2. Load profiles object from AsyncStorage (offline cache)
        const savedProfilesStr = await AsyncStorage.getItem("pench_customer_location_profiles");
        if (savedProfilesStr) {
          try {
            const parsed = JSON.parse(savedProfilesStr);
            Object.entries(parsed).forEach(([key, val]: [string, any]) => {
              if (val && (val.address || val.lat)) {
                addressMap.set(key.toLowerCase(), {
                  id: val.id,
                  profile: key,
                  address: val.address || "Nagpur, Maharashtra",
                  landmark: val.landmark,
                  lat: val.lat || DEFAULT_LAT,
                  lng: val.lng || DEFAULT_LNG,
                  is_default: val.is_default,
                });
              }
            });
          } catch (e) {}
        }

        // 3. Load primary single location from AsyncStorage
        const singleLocStr = await AsyncStorage.getItem("pench_customer_location");
        if (singleLocStr) {
          try {
            const parsed = JSON.parse(singleLocStr);
            if (parsed && parsed.address) {
              const prof = parsed.profile || "Home";
              setActiveLocationStr(parsed.address);
              if (!addressMap.has(prof.toLowerCase())) {
                addressMap.set(prof.toLowerCase(), {
                  id: parsed.id,
                  profile: prof,
                  address: parsed.address,
                  landmark: parsed.landmark,
                  lat: parsed.lat || DEFAULT_LAT,
                  lng: parsed.lng || DEFAULT_LNG,
                  is_default: true,
                });
              }
            }
          } catch (e) {}
        }

        // 4. Check current user ERP city_name
        const currentCity = useAuthStore.getState().user?.city_name;
        if (currentCity) {
          setActiveLocationStr((prev) => prev || currentCity);
          const parts = currentCity.split(":");
          const profileTag = parts.length > 1 ? parts[0].trim() : "Home";
          const addrText = parts.length > 1 ? parts.slice(1).join(":").trim() : currentCity.trim();

          if (!addressMap.has(profileTag.toLowerCase())) {
            addressMap.set(profileTag.toLowerCase(), {
              profile: profileTag,
              address: addrText,
              lat: DEFAULT_LAT,
              lng: DEFAULT_LNG,
            });
          }
        }

        setSavedAddresses(Array.from(addressMap.values()));
      } catch (err) {
        console.warn("Failed to load saved addresses:", err);
      }
    }, []);

    // Re-load saved addresses whenever presented
    useImperativeHandle(
      ref,
      () => ({
        present: (data?: any) => {
          loadSavedAddresses();
          modalRef.current?.present(data);
        },
        dismiss: () => modalRef.current?.dismiss(),
        close: () => modalRef.current?.close(),
        expand: () => modalRef.current?.expand(),
        collapse: () => modalRef.current?.collapse(),
        snapToIndex: (i: number) => modalRef.current?.snapToIndex(i),
        snapToPosition: (p: any) => modalRef.current?.snapToPosition(p),
        forceClose: () => modalRef.current?.forceClose(),
      } as any),
      [loadSavedAddresses]
    );

    // Initial load on mount
    useEffect(() => {
      loadSavedAddresses();
    }, [loadSavedAddresses]);

    // Check device location permission on mount
    useEffect(() => {
      Location.getForegroundPermissionsAsync()
        .then(({ status }) => {
          setIsLocationEnabled(status === "granted");
        })
        .catch(() => {
          setIsLocationEnabled(false);
        });
    }, []);

    // Reverse geocode
    const fetchAddress = async (lat: number, lng: number) => {
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geo && geo.length > 0) {
          const a = geo[0];
          const area = [a.name, a.street, a.subregion, a.district].filter(Boolean)[0] || "Nagpur";
          const fullParts = [
            a.name,
            a.street,
            a.subregion || a.district,
            a.city,
            a.region,
            a.postalCode,
          ].filter(Boolean);
          const uniqueParts = fullParts.filter((item, index) => fullParts.indexOf(item) === index);
          const fullAddr = uniqueParts.join(", ") || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          return { area, full: fullAddr, street: a.street || a.name || "" };
        }
      } catch (err) {}

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          { headers: { "User-Agent": "PenchFoodsApp/1.0" } }
        );
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const area =
            addr.suburb ||
            addr.neighbourhood ||
            addr.residential ||
            addr.road ||
            addr.city ||
            "Nagpur";
          const full = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          return { area, full, street: addr.road || addr.suburb || "" };
        }
      } catch (e) {}

      return {
        area: "Current Location",
        full: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        street: "",
      };
    };

    // Debounced search for places
    useEffect(() => {
      const q = searchQuery.trim();
      if (!q || q.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
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
          }
        } catch (e) {
          console.warn("Place search failed:", e);
        } finally {
          setIsSearching(false);
        }
      }, 400);

      return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle "Use current location" -> Open ConfirmLocationScreen map
    const handleOpenCurrentLocationMap = () => {
      modalRef.current?.dismiss();
      router.push("/(customer)/confirm-location" as any);
    };

    // Handle Enable device location button
    const handleEnableLocation = async () => {
      setLocating(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          setIsLocationEnabled(true);
          handleOpenCurrentLocationMap();
        } else {
          Alert.alert(
            "Location Permission Required",
            "Please enable location permission to detect your current location."
          );
        }
      } catch (e) {
        handleOpenCurrentLocationMap();
      } finally {
        setLocating(false);
      }
    };

    // Handle Function 2: Parse Google Maps link
    const handleExtractGoogleMapsLink = async () => {
      if (!gmapsLink.trim()) {
        Alert.alert("Link Required", "Please paste a Google Maps link first.");
        return;
      }

      setIsParsingLink(true);
      setLinkSuccessMsg("");
      try {
        const parsed = await parseGoogleMapsUrl(gmapsLink);
        if (!parsed) {
          Alert.alert(
            "Could Not Extract Coordinates",
            "Please verify the Google Maps link or enter your address details manually."
          );
          return;
        }

        setCoords({ lat: parsed.lat, lng: parsed.lng });
        const res = await fetchAddress(parsed.lat, parsed.lng);
        if (res) {
          setAddressTitle(res.area);
          setAddress(res.full);
          if (res.area && !areaLocality) setAreaLocality(res.area);
          if (res.street && !buildingName) setBuildingName(res.street);
          setLinkSuccessMsg(`✓ Location detected (${res.area})`);
        } else {
          setLinkSuccessMsg(
            `✓ Coordinates detected (${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)})`
          );
        }
      } catch (err) {
        Alert.alert("Error", "Failed to extract location from the link.");
      } finally {
        setIsParsingLink(false);
      }
    };

    // Selecting a place from search results
    const handleSelectSearchResult = (item: SearchResult) => {
      setCoords({ lat: item.lat, lng: item.lng });
      setAddressTitle(item.name);
      setAddress(item.displayName);
      setAreaLocality(item.name);
      setBuildingName(item.name);
      setSearchQuery("");
      setSearchResults([]);
      setShowManualForm(true);
    };

    // Selecting a saved address
    const handleSelectSavedAddress = async (saved: SavedProfile) => {
      setActiveLocationStr(saved.address);
      const domainName = useAuthStore.getState().domain_name;

      // 1. Set default location on backend if ID exists
      if (saved.id) {
        locationApi.setDefaultLocation(domainName, saved.id).catch((err) => {
          console.warn("Backend set-default location failed:", err);
        });
      }

      // 2. Persist active location locally
      await AsyncStorage.setItem(
        "pench_customer_location",
        JSON.stringify({
          id: saved.id,
          lat: saved.lat,
          lng: saved.lng,
          address: saved.address,
          landmark: saved.landmark,
          profile: saved.profile,
        })
      );

      // 3. Update auth store user city_name
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          city_name: `${saved.profile}: ${saved.address.split(",")[0]?.trim() || "Nagpur"}`,
        });
      }

      await onConfirm({
        lat: saved.lat,
        lng: saved.lng,
        address: saved.address,
        profile: saved.profile,
      });
      modalRef.current?.dismiss();
    };

    // Delete a saved address
    const handleDeleteSavedAddress = async (saved: SavedProfile) => {
      try {
        const domainName = useAuthStore.getState().domain_name;
        if (saved.id) {
          try {
            await locationApi.deleteLocation(domainName, saved.id);
          } catch (apiErr) {
            console.warn("Backend delete location failed:", apiErr);
          }
        }

        const savedProfilesStr = await AsyncStorage.getItem("pench_customer_location_profiles");
        if (savedProfilesStr) {
          const parsed = JSON.parse(savedProfilesStr);
          delete parsed[saved.profile];
          await AsyncStorage.setItem(
            "pench_customer_location_profiles",
            JSON.stringify(parsed)
          );
        }
        setSavedAddresses((prev) =>
          prev.filter((p) => (saved.id ? p.id !== saved.id : p.profile !== saved.profile))
        );
      } catch (e) {
        console.warn("Error deleting saved address:", e);
      }
    };

    const executeManualSave = async (isUpdate: boolean, locationId?: number | string) => {
      setSaving(true);
      try {
        const parts = [
          flatNo.trim(),
          floorNo.trim()
            ? floorNo.trim().toLowerCase().includes("floor")
              ? floorNo.trim()
              : `${floorNo.trim()} Floor`
            : null,
          buildingName.trim(),
          areaLocality.trim() || null,
          landmark.trim() ? `(Near ${landmark.trim()})` : null,
          address || addressTitle || "Nagpur",
        ].filter(Boolean);

        const completeAddress = parts.join(", ");
        const domainName = useAuthStore.getState().domain_name;
        const tag = profileType.toLowerCase();

        let finalLocationId = locationId;

        const payload = {
          tag,
          label: profileType === "Other" ? (areaLocality || "Other") : "",
          address: completeAddress,
          landmark: landmark.trim(),
          latitude: coords.lat.toFixed(6),
          longitude: coords.lng.toFixed(6),
          is_default: true,
        };

        if (isUpdate && locationId) {
          // Use UPDATE endpoint: PATCH /api/accounts/locations/{{location_id}}/
          const updated = await locationApi.updateLocation(domainName, locationId, payload);
          if (updated?.id) finalLocationId = updated.id;
        } else {
          // Use CREATE endpoint: POST /api/accounts/locations/
          const res = await locationApi.createLocation(domainName, payload);
          if (res?.id) finalLocationId = res.id;
        }

        // 2. Save to local profiles cache
        const savedStr = await AsyncStorage.getItem("pench_customer_location_profiles");
        const currentProfiles = savedStr ? JSON.parse(savedStr) : {};
        currentProfiles[profileType] = {
          id: finalLocationId,
          lat: coords.lat,
          lng: coords.lng,
          address: completeAddress,
          landmark: landmark.trim(),
        };
        await AsyncStorage.setItem(
          "pench_customer_location_profiles",
          JSON.stringify(currentProfiles)
        );

        // 3. Save as active location
        await AsyncStorage.setItem(
          "pench_customer_location",
          JSON.stringify({
            id: finalLocationId,
            lat: coords.lat,
            lng: coords.lng,
            address: completeAddress,
            landmark: landmark.trim(),
            profile: profileType,
          })
        );

        // 4. Update auth store city_name
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setUser({
            ...currentUser,
            city_name: `${profileType}: ${flatNo.trim()}, ${buildingName.trim()}`,
          });
        }

        await onConfirm({
          lat: coords.lat,
          lng: coords.lng,
          address: completeAddress,
          profile: profileType,
        });

        loadSavedAddresses();
        modalRef.current?.dismiss();
      } catch (err: any) {
        const errMsg = err?.message || "";
        if (
          errMsg.toLowerCase().includes("already have") &&
          errMsg.toLowerCase().includes("location")
        ) {
          const tag = profileType.toLowerCase();
          const existing = savedAddresses.find((p) => p.profile.toLowerCase() === tag);
          if (existing?.id) {
            promptManualUpdateConfirmation(existing);
            return;
          }
        }
        Alert.alert("Error Saving Location", err?.message || "Failed to save delivery location.");
      } finally {
        setSaving(false);
      }
    };

    const promptManualUpdateConfirmation = (existing: SavedProfile) => {
      Alert.alert(
        `Update Existing ${profileType} Location?`,
        `You already have a location saved under "${profileType}".\n\nExisting: ${existing.address}\n\nWould you like to update it with your new details?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => setSaving(false) },
          {
            text: "Update",
            style: "default",
            onPress: () => executeManualSave(true, existing.id),
          },
        ]
      );
    };

    // Confirm manual address submission
    const handleManualConfirm = async () => {
      if (!flatNo.trim()) {
        Alert.alert("House / Flat Number Required", "Please enter your Flat / House / Plot Number.");
        return;
      }
      if (!buildingName.trim()) {
        Alert.alert("Building Name Required", "Please enter your Building / Apartment / Street Name.");
        return;
      }

      const tag = profileType.toLowerCase();
      const existing = savedAddresses.find((p) => p.profile.toLowerCase() === tag);

      if (existing?.id) {
        promptManualUpdateConfirmation(existing);
      } else {
        await executeManualSave(false);
      }
    };

    const renderHandle = useCallback(
      () => (
        <View style={styles.handleWrapper}>
          <TouchableOpacity
            onPress={() => modalRef.current?.dismiss()}
            style={styles.floatingCloseBtn}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={snapPoints}
        onDismiss={onClose}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
        handleComponent={renderHandle}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.45}
          />
        )}
      >
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Banner: Device location not enabled (Light Mode) */}
          {!isLocationEnabled && (
            <View style={styles.disabledBanner}>
              <View style={styles.disabledIconContainer}>
                <Ionicons name="locate-outline" size={24} color="#374151" />
                <View style={styles.redSlash} />
              </View>

              <View style={styles.bannerTextColumn}>
                <Text style={styles.bannerTitle}>Device location not enabled</Text>
                <Text style={styles.bannerSubtitle}>
                  Enable for a better delivery experience
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleEnableLocation}
                disabled={locating}
                style={styles.enableButton}
                activeOpacity={0.85}
              >
                {locating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.enableButtonText}>Enable</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Section Heading: Select delivery location */}
          <Text style={styles.headerTitle}>Select delivery location</Text>

          {/* Search Bar (Light Mode) */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for area, street name..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isSearching && (
              <ActivityIndicator size="small" color="#16A34A" style={{ marginLeft: 6 }} />
            )}
            {searchQuery.length > 0 && !isSearching && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Dropdown List */}
          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              {searchResults.map((item, index) => (
                <TouchableOpacity
                  key={`${item.lat}-${item.lng}-${index}`}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectSearchResult(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="#16A34A"
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchResultTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.searchResultSubtitle} numberOfLines={1}>
                      {item.displayName}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Manual Address Form (Function 2: Manual location + Google Maps link) */}
          {showManualForm ? (
            <View style={styles.manualFormContainer}>
              <View style={styles.formHeaderRow}>
                <TouchableOpacity
                  onPress={() => setShowManualForm(false)}
                  style={styles.backRowBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={18} color="#16A34A" />
                  <Text style={styles.backBtnText}>Back to options</Text>
                </TouchableOpacity>
                <Text style={styles.formHeading}>ADD ADDRESS MANUALLY</Text>
              </View>

              {/* Google Maps Link Box */}
              <View style={styles.gmapsBox}>
                <View style={styles.gmapsHeader}>
                  <Ionicons name="link-outline" size={16} color="#16A34A" />
                  <Text style={styles.gmapsTitle}>Google Maps Link (Optional)</Text>
                </View>
                <Text style={styles.gmapsSubtitle}>
                  Paste a link from Google Maps to auto-detect coordinates
                </Text>

                <View style={styles.gmapsInputRow}>
                  <TextInput
                    style={styles.gmapsInput}
                    placeholder="e.g. https://maps.app.goo.gl/..."
                    placeholderTextColor="#9CA3AF"
                    value={gmapsLink}
                    onChangeText={(val) => {
                      setGmapsLink(val);
                      setLinkSuccessMsg("");
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={handleExtractGoogleMapsLink}
                    disabled={isParsingLink}
                    style={styles.gmapsExtractBtn}
                    activeOpacity={0.8}
                  >
                    {isParsingLink ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.gmapsExtractBtnText}>Fetch</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {linkSuccessMsg ? (
                  <View style={styles.successBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                    <Text style={styles.successBadgeText}>{linkSuccessMsg}</Text>
                  </View>
                ) : null}
              </View>

              {address ? (
                <View style={styles.selectedAreaBadge}>
                  <Ionicons name="location-sharp" size={16} color="#16A34A" />
                  <Text style={styles.selectedAreaText} numberOfLines={2}>
                    {address}
                  </Text>
                </View>
              ) : null}

              {/* Flat / Plot & Floor */}
              <View style={styles.inputRow}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.inputLabel}>House / Flat / Plot No.*</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Flat 402"
                    placeholderTextColor="#9CA3AF"
                    value={flatNo}
                    onChangeText={setFlatNo}
                    autoCapitalize="words"
                  />
                </View>

                <View style={{ flex: 0.9 }}>
                  <Text style={styles.inputLabel}>Floor No. (optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 4th Floor"
                    placeholderTextColor="#9CA3AF"
                    value={floorNo}
                    onChangeText={setFloorNo}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Building Name */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>Building / Apartment / Colony Name*</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Marvel Heights, Palm Road"
                  placeholderTextColor="#9CA3AF"
                  value={buildingName}
                  onChangeText={setBuildingName}
                  autoCapitalize="words"
                />
              </View>

              {/* Street / Locality */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>Area / Locality / Street*</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Dharampeth, Ramdaspeth"
                  placeholderTextColor="#9CA3AF"
                  value={areaLocality}
                  onChangeText={setAreaLocality}
                  autoCapitalize="words"
                />
              </View>

              {/* Landmark */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>Nearby Landmark (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Opposite Central Mall"
                  placeholderTextColor="#9CA3AF"
                  value={landmark}
                  onChangeText={setLandmark}
                  autoCapitalize="words"
                />
              </View>

              {/* Profile Chips */}
              <View style={{ marginTop: 16 }}>
                <Text style={styles.inputLabel}>SAVE ADDRESS AS</Text>
                <View style={styles.profileRow}>
                  {[
                    { id: "Home", label: "Home", icon: "home" },
                    { id: "Work", label: "Work", icon: "briefcase" },
                    { id: "Other", label: "Other", icon: "location" },
                  ].map((item) => {
                    const isSelected = profileType === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setProfileType(item.id as any)}
                        activeOpacity={0.8}
                        style={[
                          styles.profileChip,
                          isSelected && styles.profileChipActive,
                        ]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={16}
                          color={isSelected ? "#16A34A" : "#6B7280"}
                        />
                        <Text
                          style={[
                            styles.profileChipText,
                            isSelected && styles.profileChipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={handleManualConfirm}
                  disabled={saving}
                  style={[styles.confirmButton, saving && { opacity: 0.75 }]}
                  activeOpacity={0.88}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={19} color="#FFFFFF" />
                      <Text style={styles.confirmButtonText}>Save Delivery Address</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Action Options + Saved Addresses List */
            <>
              {/* Primary Actions Card */}
              <View style={styles.optionsCard}>
                {/* Row 1: Function 1: "Use current location" -> Opens ConfirmLocationScreen */}
                <TouchableOpacity
                  onPress={handleOpenCurrentLocationMap}
                  style={styles.optionRow}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionIconContainer}>
                    <Ionicons name="locate-outline" size={22} color="#16A34A" />
                  </View>
                  <Text style={styles.optionGreenText}>Use current location</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>

                <View style={styles.optionDivider} />

                {/* Row 2: Function 2: "Add new address" -> Opens manual form with Google Maps link */}
                <TouchableOpacity
                  onPress={() => setShowManualForm(true)}
                  style={styles.optionRow}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionIconContainer}>
                    <Ionicons name="add" size={24} color="#16A34A" />
                  </View>
                  <Text style={styles.optionGreenText}>Add new address</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* SAVED ADDRESSES SECTION */}
              <View style={styles.savedSectionWrapper}>
                <View style={styles.savedSectionHeader}>
                  <Text style={styles.sectionHeadingTitle}>SAVED ADDRESSES</Text>
                  <View style={styles.savedCountPill}>
                    <Text style={styles.savedCountPillText}>
                      {savedAddresses.length} {savedAddresses.length === 1 ? "address" : "addresses"}
                    </Text>
                  </View>
                </View>

                {savedAddresses.length > 0 ? (
                  <View style={styles.savedAddressesContainer}>
                    {savedAddresses.map((saved, idx) => {
                      const isCurrent =
                        activeLocationStr &&
                        (saved.address.includes(activeLocationStr) ||
                          activeLocationStr.includes(saved.address) ||
                          currentUser?.city_name?.includes(saved.profile));

                      return (
                        <View key={`${saved.profile}-${idx}`}>
                          {idx > 0 && <View style={styles.savedItemDivider} />}
                          <TouchableOpacity
                            onPress={() => handleSelectSavedAddress(saved)}
                            style={[
                              styles.savedAddressRow,
                              isCurrent && styles.savedAddressRowActive,
                            ]}
                            activeOpacity={0.7}
                          >
                            {/* Profile Icon Badge */}
                            <View
                              style={[
                                styles.savedIconBadge,
                                isCurrent && styles.savedIconBadgeActive,
                              ]}
                            >
                              <Ionicons
                                name={
                                  saved.profile.toLowerCase() === "work"
                                    ? "briefcase"
                                    : saved.profile.toLowerCase() === "home"
                                    ? "home"
                                    : "location"
                                }
                                size={18}
                                color={isCurrent ? "#16A34A" : "#374151"}
                              />
                            </View>

                            {/* Address Details */}
                            <View style={styles.savedDetailsColumn}>
                              <View style={styles.savedTitleRow}>
                                <Text style={styles.savedAddressTitle}>{saved.profile}</Text>
                                {isCurrent && (
                                  <View style={styles.currentBadge}>
                                    <Text style={styles.currentBadgeText}>CURRENT</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.savedAddressSubtitle} numberOfLines={2}>
                                {saved.address}
                              </Text>
                            </View>

                            {/* Actions Right */}
                            <View style={styles.savedActionsRow}>
                              <TouchableOpacity
                                onPress={() => handleDeleteSavedAddress(saved)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={styles.deleteAddressBtn}
                              >
                                <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
                              </TouchableOpacity>

                              <Ionicons
                                name={isCurrent ? "checkmark-circle" : "chevron-forward"}
                                size={20}
                                color={isCurrent ? "#16A34A" : "#9CA3AF"}
                                style={{ marginLeft: 6 }}
                              />
                            </View>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptySavedBox}>
                    <Ionicons name="location-outline" size={28} color="#9CA3AF" />
                    <Text style={styles.emptySavedText}>
                      No saved addresses found. Pin your location above or add an address manually.
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  handleWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 2,
    backgroundColor: "transparent",
  },
  floatingCloseBtn: {
    marginTop: -24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // Disabled Banner (Light Mode)
  disabledBanner: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  disabledIconContainer: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  redSlash: {
    position: "absolute",
    width: 2.2,
    height: 28,
    backgroundColor: "#EF4444",
    borderRadius: 2,
    transform: [{ rotate: "-45deg" }],
  },
  bannerTextColumn: {
    flex: 1,
    marginHorizontal: 12,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "400",
  },
  enableButton: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  enableButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Header Title
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
    marginBottom: 14,
  },

  // Search Bar (Light Mode)
  searchBarContainer: {
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },

  // Search Results
  searchResultsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  searchResultSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  // Primary Options Card
  optionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionIconContainer: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionGreenText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#16A34A",
  },
  optionDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 16,
  },

  // SAVED ADDRESSES SECTION STYLES
  savedSectionWrapper: {
    marginTop: 4,
    marginBottom: 24,
  },
  savedSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeadingTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  savedCountPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  savedCountPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  savedAddressesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  savedAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  savedAddressRowActive: {
    backgroundColor: "#F0FDF4",
  },
  savedItemDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 62,
    marginRight: 14,
  },
  savedIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  savedIconBadgeActive: {
    backgroundColor: "#DCFCE7",
  },
  savedDetailsColumn: {
    flex: 1,
    paddingRight: 8,
  },
  savedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 3,
  },
  savedAddressTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  currentBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#16A34A",
    letterSpacing: 0.3,
  },
  savedAddressSubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
    fontWeight: "400",
  },
  savedActionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteAddressBtn: {
    padding: 6,
  },
  emptySavedBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptySavedText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },

  // Manual Form (Light Mode)
  manualFormContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  formHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  backRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16A34A",
  },
  formHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0.5,
  },

  // Google Maps Link Box
  gmapsBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  gmapsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gmapsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
  },
  gmapsSubtitle: {
    fontSize: 11,
    color: "#15803D",
    marginTop: 2,
    marginBottom: 8,
  },
  gmapsInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gmapsInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#111827",
  },
  gmapsExtractBtn: {
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  gmapsExtractBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  successBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },

  selectedAreaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedAreaText: {
    flex: 1,
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  profileRow: {
    flexDirection: "row",
    gap: 10,
  },
  profileChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  profileChipActive: {
    backgroundColor: "#DCFCE7",
    borderColor: "#16A34A",
  },
  profileChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  profileChipTextActive: {
    color: "#16A34A",
    fontWeight: "800",
  },
  actionRow: {
    marginTop: 20,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#16A34A",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});

export default LocationSelectBottomSheet;
