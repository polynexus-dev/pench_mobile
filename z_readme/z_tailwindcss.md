// tailwind.config.js
const { hairlineWidth } = require("nativewind/theme");

// ── Single source of truth: import from theme folder
const { Colors, typography, spacing } = require("./src/shared/theme/tokens");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // ── Colors — from src/shared/theme/colors.ts
      colors: {
        brand:   Colors.brand,
        bg:      Colors.bg,
        text:    Colors.text,
        border:  Colors.border,
        success: Colors.success,
        warning: Colors.warning,
        error:   Colors.error,

        // ── Footer (not in colors.ts — kept inline)
        footer: {
          bg:    "#FFFFFF",
          text:  "#6B7280",
          badge: Colors.brand.primary,   // reuse brand.primary instead of hardcoding
        },
      },

      // ── Font Family — from src/shared/theme/typography.ts
      fontFamily: {
        sans:    [typography.fontFamily.sans],
        medium:  [typography.fontFamily.medium],
        bold:    [typography.fontFamily.bold],
        heading: [typography.fontFamily.bold],
      },

      // ── Font Size — from src/shared/theme/typography.ts
      fontSize: {
        xs:      [typography.fontSize.xs,  { lineHeight: "18px" }],
        sm:      [typography.fontSize.sm,  { lineHeight: "20px" }],
        base:    [typography.fontSize.base,{ lineHeight: "24px" }],
        lg:      [typography.fontSize.lg,  { lineHeight: "28px" }],
        xl:      [typography.fontSize.xl,  { lineHeight: "30px" }],
        "2xl":   [typography.fontSize["2xl"], { lineHeight: "32px" }],
        "3xl":   [typography.fontSize["3xl"], { lineHeight: "40px" }],

        // ── Figma semantic sizes (kept as-is)
        "display":  [28, { lineHeight: "36px", fontWeight: "700" }],
        "title":    [22, { lineHeight: "30px", fontWeight: "700" }],
        "body-lg":  [16, { lineHeight: "24px", fontWeight: "400" }],
        "body":     [14, { lineHeight: "22px", fontWeight: "400" }],
        "body-sm":  [13, { lineHeight: "20px", fontWeight: "400" }],
        "caption":  [12, { lineHeight: "18px", fontWeight: "400" }],
        "label":    [14, { lineHeight: "20px", fontWeight: "600" }],
      },

      // ── Spacing — from src/shared/theme/spacing.ts (merged with Figma tokens)
      spacing: {
        0:  spacing[0],
        1:  spacing[1],
        2:  spacing[2],
        3:  spacing[3],
        4:  spacing[4],
        5:  spacing[5],
        6:  spacing[6],
        8:  spacing[8],
        10: spacing[10],
        12: spacing[12],
        16: spacing[16],

        // ── Figma semantic spacing (kept as-is)
        "screen-x": "24px",
        "card-x":   "24px",
        "card-y":   "32px",
      },

      // ── Border Radius — Figma tokens (no theme file, kept inline)
      borderRadius: {
        card:  "20px",
        input: "12px",
        btn:   "12px",
        badge: "999px",
      },

      // ── Shadows — Figma tokens (kept inline)
      boxShadow: {
        card:  "0 4px 24px rgba(0, 0, 0, 0.08)",
        input: "0 1px 4px rgba(0, 0, 0, 0.04)",
      },

      // ── Border Width
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  plugins: [],
};