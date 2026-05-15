// src/shared/theme/tokens.js
// ← Plain CJS — no TypeScript, no ESM
// Used by: tailwind.config.js (Node) + re-exported by colors.ts

module.exports = {
  Colors: {
    brand: {
      primary:   "#1B5E37",
      secondary: "#2E7D52",
      light:     "#E8F5EE",
    },
    bg: {
      screen: "#F0EBE1",
      card:   "#FFFFFF",
      input:  "#F5F5F5",
    },
    text: {
      primary:   "#1A1A1A",
      secondary: "#4A4A4A",
      muted:     "#9E9E9E",
      link:      "#D4872A",
      white:     "#FFFFFF",
    },
    border: {
      default: "#E0E0E0",
      focus:   "#1B5E37",
    },
    success: "#1B5E37",
    warning: "#D4872A",
    error:   "#E53E3E",
  },

  typography: {
    fontFamily: {
      sans:   "Inter_400Regular",
      medium: "Inter_500Medium",
      bold:   "Inter_700Bold",
    },
    fontSize: {
      xs: 12, sm: 14, base: 16,
      lg: 18, xl: 20, "2xl": 24, "3xl": 30,
    },
  },

  spacing: {
    0: 0,  1: 4,  2: 8,  3: 12,
    4: 16, 5: 20, 6: 24, 8: 32,
    10: 40, 12: 48, 16: 64,
  },
};