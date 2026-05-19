## Add the [Route response] tyes because it's untyped now (16/05/2026)
*****
## If location permission denied -> handle it properly instead of error 
Important issue in your code
Your alert button says Open Settings, but it calls Location.enableNetworkProviderAsync() . That is not the same as opening device settings; it enables high-accuracy location services, so the label is misleading .

Better placement => better flow for customer 
For a cleaner design, permission should ideally be requested in a dedicated tracking hook or at the top of the driver dashboard flow, not inside a map component . That way, OSMMap stays focused on rendering the map, and tracking logic stays in one place .

Minimal fix
If you want to keep the current structure, your component is already fine; the permission prompt will appear through startTracking() automatically . The main improvement is to rename the alert action or open app settings properly i nstead of calling enableNetworkProviderAsync() .

Would you like me to rewrite startTracking() so it correctly opens app settings on Android and iOS?
*****

UI SETUP
| Purpose    | Package           |
| ---------- | ----------------- |
| Navigation | Expo Router       |
| Styling    | NativeWind        |
| Animation  | Reanimated        |
| Gestures   | Gesture Handler   |
| Blur       | expo-blur         |
| Haptics    | expo-haptics      |
| Icons      | Expo Vector Icons |


# Tailwindcss Config
// tailwind.config.js
const { hairlineWidth } = require("nativewind/theme");

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1B5E37",
          secondary: "#2E7D52",
          light: "#eaf6ef",
        },
        bg: {
          screen: "#F0EBE1",
          card: "#FFFFFF",
          input: "#f9f9f9",
          auth: "#f3f3f3",
        },
        text: {
          primary: "#1A1A1A",
          secondary: "#4A4A4A",
          muted: "#9E9E9E",
          link: "#D4872A",
          white: "#FFFFFF",
        },
        border: {
          disable: "#ececec",
          focus: "#1B5E37",
        },
        success: "#1B5E37",
        warning: "#D4872A",
        error: "#E53E3E",
        footer: {
          bg: "#FFFFFF",
          text: "#6B7280",
          badge: "#1B5E37",
        },
      },

      fontFamily: {
        sans: ["System"],
        heading: ["System"],
      },

      fontSize: {
        display: [28, { lineHeight: "36px", fontWeight: "700" }],
        title: [22, { lineHeight: "30px", fontWeight: "700" }],
        "body-lg": [16, { lineHeight: "24px", fontWeight: "400" }],
        body: [14, { lineHeight: "22px", fontWeight: "400" }],
        "body-sm": [13, { lineHeight: "20px", fontWeight: "400" }],
        caption: [12, { lineHeight: "18px", fontWeight: "400" }],
        label: [14, { lineHeight: "20px", fontWeight: "600" }],
      },

      borderRadius: {
        // ✅ CHANGED: card from 20px → 24px (guide recommends 24px)
        card: "24px",
        input: "12px",
        btn: "999px",   // ✅ CHANGED: btn from 12px → 999px (pill shape, matches auth button style)
        badge: "999px",
      },

      spacing: {
        // ✅ CHANGED: screen-x from 24px → 20px (guide recommends 20px screen padding)
        "screen-x": "20px",
        "card-x": "20px",    // ✅ CHANGED: card-x aligned to match screen-x
        "card-y": "24px",    // ✅ CHANGED: card-y from 32px → 24px (guide recommends 24px section spacing)
        "section": "24px",   // ✅ NEW: explicit section spacing token
        "touch": "12px",     // ✅ NEW: touch target padding helper (min 48px height)
      },

      // ✅ NEW: Centralized shadow tokens (platform shadows should be used in StyleSheet, these are fallback for web/light use)
      boxShadow: {
        card: "0 4px 12px rgba(0, 0, 0, 0.08)",
        "card-strong": "0 6px 20px rgba(0, 0, 0, 0.12)",
        input: "0 1px 4px rgba(0, 0, 0, 0.04)",
      },

      // ✅ NEW: Minimum height tokens for touch targets
      minHeight: {
        touch: "48px",   // guide recommends 48px+ for all touch targets
        input: "56px",
        btn: "48px",
      },

      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  plugins: [],
};