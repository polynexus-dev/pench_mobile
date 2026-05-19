// tailwind.config.js
// ─────────────────────────────────────────────────────────────────
// All design values flow from tokens.js — never hardcode here.
// Exception: hairlineWidth (nativewind utility, not a design token)
// ─────────────────────────────────────────────────────────────────
const { hairlineWidth } = require("nativewind/theme");
const {
  Colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  sizes,
  opacity,
  zIndex,
} = require("./src/shared/theme/tokens");

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

      // ── Colors ───────────────────────────────────────────────────
      // Usage: bg-brand-primary · text-text-primary · border-border-focus
      colors: {
        brand: Colors.brand,
        accent: Colors.accent,
        bg: Colors.bg,
        text: Colors.text,
        border: Colors.border,
        neutral: Colors.neutral,
        success: Colors.success,
        successLight: Colors.successLight,
        warning: Colors.warning,
        warningLight: Colors.warningLight,
        error: Colors.error,
        errorLight: Colors.errorLight,
        info: Colors.info,
        infoLight: Colors.infoLight,

        // Footer (not in tokens — one-off surface, kept inline)
        footer: {
          bg: "#FFFFFF",
          text: Colors.neutral[600],
          badge: Colors.brand.primary,
        },
      },

      // ── Font Family ───────────────────────────────────────────────
      // Usage: font-sans · font-medium · font-semibold · font-bold
      fontFamily: {
        sans: [typography.fontFamily.sans],
        medium: [typography.fontFamily.medium],
        semibold: [typography.fontFamily.semibold],
        bold: [typography.fontFamily.bold],
        heading: [typography.fontFamily.bold],
      },

      // ── Font Size + Line Height ───────────────────────────────────
      // Usage: text-base · text-lg · text-display · text-title
      // Every size ships with its paired line-height automatically.
      fontSize: {
        // ── Numeric scale (from tokens) ──
        "2xs": [typography.fontSize["2xs"], { lineHeight: `${typography.lineHeight["2xs"]}px` }],
        xs: [typography.fontSize.xs, { lineHeight: `${typography.lineHeight.xs}px` }],
        sm: [typography.fontSize.sm, { lineHeight: `${typography.lineHeight.sm}px` }],
        base: [typography.fontSize.base, { lineHeight: `${typography.lineHeight.base}px` }],
        md: [typography.fontSize.md, { lineHeight: `${typography.lineHeight.md}px` }],
        lg: [typography.fontSize.lg, { lineHeight: `${typography.lineHeight.lg}px` }],
        xl: [typography.fontSize.xl, { lineHeight: `${typography.lineHeight.xl}px` }],
        "2xl": [typography.fontSize["2xl"], { lineHeight: `${typography.lineHeight["2xl"]}px` }],
        "3xl": [typography.fontSize["3xl"], { lineHeight: `${typography.lineHeight["3xl"]}px` }],
        "4xl": [typography.fontSize["4xl"], { lineHeight: `${typography.lineHeight["4xl"]}px` }],
        "5xl": [typography.fontSize["5xl"], { lineHeight: `${typography.lineHeight["5xl"]}px` }],

        // ── Semantic scale (Figma / design spec names) ──
        // Maps to numeric scale above — use whichever your team prefers.
        //
        //   display  → 34px / lh 41  — iOS Large Title, hero
        //   title    → 28px / lh 36  — page title, modal heading
        //   heading  → 24px / lh 32  — section heading
        //   subhead  → 20px / lh 28  — card title, list heading
        //   body-lg  → 17px / lh 26  — iOS default body
        //   body     → 15px / lh 22  — standard body
        //   body-sm  → 13px / lh 19  — secondary body
        //   label    → 13px / lh 19  — form labels (semibold in practice)
        //   caption  → 12px / lh 17  — metadata, timestamps
        //   caption-sm→ 11px / lh 15 — legal, footnotes

        display: [typography.fontSize["4xl"], { lineHeight: `${typography.lineHeight["4xl"]}px`, fontWeight: typography.fontWeight.bold }],
        title: [typography.fontSize["3xl"], { lineHeight: `${typography.lineHeight["3xl"]}px`, fontWeight: typography.fontWeight.bold }],
        heading: [typography.fontSize["2xl"], { lineHeight: `${typography.lineHeight["2xl"]}px`, fontWeight: typography.fontWeight.bold }],
        subhead: [typography.fontSize.xl, { lineHeight: `${typography.lineHeight.xl}px`, fontWeight: typography.fontWeight.semibold }],
        "body-lg": [typography.fontSize.lg, { lineHeight: `${typography.lineHeight.lg}px`, fontWeight: typography.fontWeight.regular }],
        body: [typography.fontSize.base, { lineHeight: `${typography.lineHeight.base}px`, fontWeight: typography.fontWeight.regular }],
        "body-sm": [typography.fontSize.sm, { lineHeight: `${typography.lineHeight.sm}px`, fontWeight: typography.fontWeight.regular }],
        label: [typography.fontSize.sm, { lineHeight: `${typography.lineHeight.sm}px`, fontWeight: typography.fontWeight.semibold }],
        caption: [typography.fontSize.xs, { lineHeight: `${typography.lineHeight.xs}px`, fontWeight: typography.fontWeight.regular }],
        "caption-sm": [typography.fontSize["2xs"], { lineHeight: `${typography.lineHeight["2xs"]}px`, fontWeight: typography.fontWeight.regular }],
      },

      // ── Font Weight ───────────────────────────────────────────────
      // Usage: font-regular · font-medium · font-semibold · font-bold
      fontWeight: {
        regular: typography.fontWeight.regular,
        medium: typography.fontWeight.medium,
        semibold: typography.fontWeight.semibold,
        bold: typography.fontWeight.bold,
        extrabold: typography.fontWeight.extrabold,
      },

      // ── Letter Spacing ────────────────────────────────────────────
      // Usage: tracking-tight · tracking-wide · tracking-widest
      letterSpacing: {
        tightest: `${typography.letterSpacing.tightest}px`,
        tight: `${typography.letterSpacing.tight}px`,
        normal: `${typography.letterSpacing.normal}px`,
        wide: `${typography.letterSpacing.wide}px`,
        wider: `${typography.letterSpacing.wider}px`,
        widest: `${typography.letterSpacing.widest}px`,
      },

      // ── Spacing ───────────────────────────────────────────────────
      // Usage: p-4 · px-screen-x · gap-item-gap · mb-section-gap
      spacing: {
        // Numeric scale
        0: spacing[0],
        0.5: spacing[0.5],
        1: spacing[1],
        1.5: spacing[1.5],
        2: spacing[2],
        2.5: spacing[2.5],
        3: spacing[3],
        3.5: spacing[3.5],
        4: spacing[4],
        5: spacing[5],
        6: spacing[6],
        7: spacing[7],
        8: spacing[8],
        9: spacing[9],
        10: spacing[10],
        11: spacing[11],
        12: spacing[12],
        14: spacing[14],
        16: spacing[16],
        20: spacing[20],
        24: spacing[24],
        32: spacing[32],

        // Semantic aliases
        "screen-x": spacing["screen-x"],
        "screen-x-md": spacing["screen-x-md"],
        "card-x": spacing["card-x"],
        "card-y": spacing["card-y"],
        "section-gap": spacing["section-gap"],
        "item-gap": spacing["item-gap"],
        "input-x": spacing["input-x"],
        "input-y": spacing["input-y"],
        "btn-x": spacing["btn-x"],
        "btn-y": spacing["btn-y"],
        "icon-gap": spacing["icon-gap"],
      },

      // ── Border Radius ─────────────────────────────────────────────
      // Usage: rounded-lg (buttons) · rounded-xl (cards) · rounded-full (pills)
      borderRadius: {
        none: borderRadius.none,
        xs: borderRadius.xs,
        sm: borderRadius.sm,
        md: borderRadius.md,
        lg: borderRadius.lg,       // buttons, inputs  ← use this for controls
        xl: borderRadius.xl,       // compact cards
        "2xl": borderRadius["2xl"],   // comfortable cards, sheets ← use this for cards
        "3xl": borderRadius["3xl"],   // large modals
        full: borderRadius.full,     // pills, avatars, FABs

        // Semantic aliases (preferred in components)
        btn: borderRadius.lg,       // all button shapes
        input: borderRadius.lg,       // all input shapes
        card: borderRadius["2xl"],   // all card shapes
        badge: borderRadius.full,     // badges, chips, pills
        avatar: borderRadius.full,     // profile pictures
        modal: borderRadius["3xl"],   // bottom sheets, modals
      },

      // ── Box Shadow ────────────────────────────────────────────────
      // Note: on Android use elevation in StyleSheet; shadows are iOS-only
      // Usage: shadow-md (cards) · shadow-xl (modals) · shadow-brand (CTAs)
      boxShadow: {
        none: shadows.none,
        xs: shadows.xs,
        sm: shadows.sm,
        md: shadows.md,
        lg: shadows.lg,
        xl: shadows.xl,
        brand: shadows.brand,

        // Semantic aliases
        card: shadows.md,
        input: shadows.sm,
        modal: shadows.xl,
        btn: shadows.brand,
      },

      // ── Sizes (width/height) ──────────────────────────────────────
      // Usage: h-btn-md · w-icon-lg · h-input-md · w-avatar-md
      width: {
        "icon-xs": sizes.iconXs,
        "icon-sm": sizes.iconSm,
        "icon-md": sizes.iconMd,
        "icon-lg": sizes.iconLg,
        "icon-xl": sizes.iconXl,
        "icon-2xl": sizes.icon2xl,
        "avatar-xs": sizes.avatarXs,
        "avatar-sm": sizes.avatarSm,
        "avatar-md": sizes.avatarMd,
        "avatar-lg": sizes.avatarLg,
        "avatar-xl": sizes.avatarXl,
        "avatar-2xl": sizes.avatar2xl,
        "touch-min": sizes.touchMin,
        "touch-comfy": sizes.touchComfy,
      },
      height: {
        "btn-sm": sizes.btnSm,
        "btn-md": sizes.btnMd,
        "btn-lg": sizes.btnLg,
        "btn-xl": sizes.btnXl,
        "input-sm": sizes.inputSm,
        "input-md": sizes.inputMd,
        "input-lg": sizes.inputLg,
        "icon-xs": sizes.iconXs,
        "icon-sm": sizes.iconSm,
        "icon-md": sizes.iconMd,
        "icon-lg": sizes.iconLg,
        "icon-xl": sizes.iconXl,
        "icon-2xl": sizes.icon2xl,
        "avatar-xs": sizes.avatarXs,
        "avatar-sm": sizes.avatarSm,
        "avatar-md": sizes.avatarMd,
        "avatar-lg": sizes.avatarLg,
        "avatar-xl": sizes.avatarXl,
        "avatar-2xl": sizes.avatar2xl,
        "tab-bar": sizes.tabBarHeight,
        "header": sizes.headerHeight,
        "touch-min": sizes.touchMin,
        "touch-comfy": sizes.touchComfy,
      },

      // ── Opacity ───────────────────────────────────────────────────
      // Usage: opacity-disabled · opacity-muted · active:opacity-high
      opacity: {
        0: opacity[0],
        disabled: opacity.disabled,
        muted: opacity.muted,
        secondary: opacity.secondary,
        high: opacity.high,
        full: opacity.full,
      },

      // ── Z-Index ───────────────────────────────────────────────────
      // Usage: z-overlay · z-modal · z-toast
      zIndex: {
        below: zIndex.below,
        base: zIndex.base,
        raised: zIndex.raised,
        dropdown: zIndex.dropdown,
        sticky: zIndex.sticky,
        overlay: zIndex.overlay,
        modal: zIndex.modal,
        toast: zIndex.toast,
        top: zIndex.top,
      },

      // ── Border Width ──────────────────────────────────────────────
      borderWidth: {
        hairline: hairlineWidth(),
        DEFAULT: 1,
        2: 2,
      },
    },
  },
  plugins: [],
};
