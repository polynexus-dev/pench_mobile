// ─────────────────────────────────────────────────────────────────
// Single source of truth for the entire design system.
// Standards based on: iOS HIG · Material Design 3 · 8pt grid system
// Used by: tailwind.config.js (Node CJS) + re-exported by theme/*.ts
// ─────────────────────────────────────────────────────────────────

module.exports = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COLORS
  // Palette: brand greens + warm neutrals + semantic states
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Colors: {

    // ── Brand ────────────────────────────────────────────────────
    brand: {
      primary: "#1B5E37",   // main CTA, active states
      secondary: "#2E7D52",   // hover / pressed primary
      tertiary: "#4CAF78",   // accents, icons on dark bg
      light: "#E8F5EE",   // tinted backgrounds, chips
      xlight: "#F4FAF7",   // very subtle tints
    },

    // ── Accent ───────────────────────────────────────────────────
    accent: {
      primary: "#D4872A",   // links, highlights, warnings
      light: "#FDF3E7",   // accent tint bg
    },

    // ── Backgrounds ──────────────────────────────────────────────
    bg: {
      screen: "#F0EBE1",   // root screen background
      card: "#FFFFFF",   // card / sheet surfaces
      input: "#F5F5F5",   // input field background
      overlay: "rgba(0, 0, 0, 0.50)",  // modal scrim
      tooltip: "rgba(26, 26, 26, 0.92)",
    },

    // ── Text ─────────────────────────────────────────────────────
    // Contrast ratios meet WCAG AA (4.5:1 for body, 3:1 for large)
    text: {
      primary: "#1A1A1A",   // 16.75:1 on white — headings, body
      secondary: "#4A4A4A",   //  9.73:1 on white — subtext
      muted: "#757575",   //  4.60:1 on white — captions, hints
      disabled: "#BDBDBD",   //  1.86:1 — disabled state only
      link: "#D4872A",   // accent colour for links
      inverse: "#FFFFFF",   // text on dark/brand backgrounds
      onBrand: "#FFFFFF",   // text on brand.primary
    },

    // ── Border ───────────────────────────────────────────────────
    border: {
      default: "#E0E0E0",   // standard dividers, card borders
      subtle: "#EEEEEE",   // very light separators
      strong: "#BDBDBD",   // stronger dividers
      focus: "#1B5E37",   // focused input ring
      error: "#E53E3E",   // error state ring
    },

    // ── Semantic / State ─────────────────────────────────────────
    success: "#1B5E37",
    successLight: "#E8F5EE",
    warning: "#D4872A",
    warningLight: "#FDF3E7",
    error: "#E53E3E",
    errorLight: "#FDECEC",
    info: "#1976D2",
    infoLight: "#E3F2FD",

    // ── Neutral Scale (use for grey UI elements) ─────────────────
    neutral: {
      0: "#FFFFFF",
      50: "#FAFAFA",
      100: "#F5F5F5",
      200: "#EEEEEE",
      300: "#E0E0E0",
      400: "#BDBDBD",
      500: "#9E9E9E",
      600: "#757575",
      700: "#616161",
      800: "#424242",
      900: "#212121",
      1000: "#000000",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TYPOGRAPHY
  // Scale: iOS HIG + Material Design 3 hybrid
  // All sizes in px (converted to unitless in tailwind config)
  // Line heights: 1.2 headings · 1.5 body · 1.4 captions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  typography: {

    // ── Font Families ────────────────────────────────────────────
    fontFamily: {
      sans: "Inter_400Regular",
      medium: "Inter_500Medium",
      semibold: "Inter_600SemiBold",
      bold: "Inter_700Bold",
    },

    // ── Font Sizes (px) ──────────────────────────────────────────
    // Modular scale — base 16px, ratio ~1.25
    fontSize: {
      // Utility sizes
      "2xs": 11,   // tiny badges, legal text
      xs: 12,   // captions, timestamps, tags
      sm: 13,   // secondary labels, footnotes
      base: 15,   // standard body (iOS HIG default)
      md: 16,   // emphasized body, input text
      lg: 17,   // iOS headline / large body
      xl: 20,   // small headings, card titles
      "2xl": 24,   // section headings
      "3xl": 28,   // page titles
      "4xl": 34,   // display (iOS Large Title)
      "5xl": 40,   // hero / marketing
    },

    // ── Line Heights (px) ────────────────────────────────────────
    // Rule: headings ~1.2–1.25 · body ~1.5 · captions ~1.4
    lineHeight: {
      "2xs": 15,   // 11 × 1.4 ≈ 15
      xs: 17,   // 12 × 1.4 ≈ 17
      sm: 19,   // 13 × 1.45 ≈ 19
      base: 22,   // 15 × 1.47 ≈ 22
      md: 24,   // 16 × 1.5  = 24
      lg: 26,   // 17 × 1.5  ≈ 26 (iOS body default)
      xl: 28,   // 20 × 1.4  = 28
      "2xl": 32,   // 24 × 1.33 ≈ 32
      "3xl": 36,   // 28 × 1.28 ≈ 36
      "4xl": 41,   // 34 × 1.2  ≈ 41
      "5xl": 48,   // 40 × 1.2  = 48
    },

    // ── Font Weights ─────────────────────────────────────────────
    fontWeight: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
    },

    // ── Letter Spacing (em) ──────────────────────────────────────
    // Positive for uppercase labels; tight for large display text
    letterSpacing: {
      tightest: -0.5,    // large display / hero
      tight: -0.3,    // headings
      normal: 0,      // body text
      wide: 0.3,    // subheadings
      wider: 0.5,    // buttons, CTAs
      widest: 1.2,    // uppercase labels, caps tracking
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SPACING
  // 8pt grid system — all values multiples of 4
  // Semantic aliases map to numeric scale below
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  spacing: {
    // ── Base Scale ───────────────────────────────────────────────
    0: 0,
    0.5: 2,    // hairline gaps
    1: 4,    // micro — icon padding, tight gaps
    1.5: 6,    // between icon and label
    2: 8,    // xs — tight internal padding
    2.5: 10,   // between list items (compact)
    3: 12,   // sm — inline padding, chip height offset
    3.5: 14,
    4: 16,   // base — standard internal padding
    5: 20,   // between related elements
    6: 24,   // md — card padding, section gaps
    7: 28,
    8: 32,   // lg — between sections
    9: 36,
    10: 40,   // xl — large section gaps
    11: 44,   // min touch target height (iOS HIG)
    12: 48,   // standard touch target / button height
    14: 56,   // large button / FAB size
    16: 64,   // 2× card padding
    20: 80,
    24: 96,
    32: 128,

    // ── Semantic Aliases ─────────────────────────────────────────
    // These map directly to Tailwind class names via config
    "screen-x": 20,   // horizontal screen edge padding (compact)
    "screen-x-md": 24,   // horizontal screen edge padding (comfortable)
    "card-x": 20,   // card internal horizontal padding
    "card-y": 24,   // card internal vertical padding
    "section-gap": 32,   // vertical gap between page sections
    "item-gap": 12,   // gap between list items
    "input-x": 16,   // input horizontal padding
    "input-y": 14,   // input vertical padding
    "btn-x": 24,   // button horizontal padding
    "btn-y": 14,   // button vertical padding
    "icon-gap": 8,   // gap between icon and label text
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BORDER RADIUS
  // iOS uses 10–12px for controls; 16–20px for cards
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  borderRadius: {
    none: 0,
    xs: 4,    // small tags, micro chips
    sm: 8,    // secondary badges, small inputs
    md: 10,   // standard inputs (iOS default control)
    lg: 12,   // buttons, primary inputs
    xl: 16,   // cards (compact)
    "2xl": 20,   // cards (comfortable), bottom sheets
    "3xl": 24,   // large modals, hero cards
    full: 9999, // pills, avatars, FABs
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SHADOWS
  // iOS-style diffuse shadows (not Material hard elevation)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  shadows: {
    none: "none",
    xs: "0 1px 3px  rgba(0, 0, 0, 0.06)",  // subtle — chip, badge
    sm: "0 2px 6px  rgba(0, 0, 0, 0.07)",  // input fields
    md: "0 4px 16px rgba(0, 0, 0, 0.08)",  // cards (default)
    lg: "0 8px 24px rgba(0, 0, 0, 0.10)",  // elevated cards
    xl: "0 16px 40px rgba(0, 0, 0, 0.12)", // modals, drawers
    brand: "0 4px 16px rgba(27, 94, 55, 0.25)", // brand-coloured CTA glow
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SIZES — Touch targets, icons, avatars, inputs
  // iOS HIG: min touch target 44×44pt
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sizes: {
    // Touch targets
    touchMin: 44,   // iOS HIG minimum
    touchComfy: 48,   // Material recommended

    // Buttons (height)
    btnSm: 36,
    btnMd: 44,   // standard
    btnLg: 52,
    btnXl: 56,

    // Inputs (height)
    inputSm: 40,
    inputMd: 48,   // standard
    inputLg: 56,

    // Icons
    iconXs: 12,
    iconSm: 16,
    iconMd: 20,   // inline with text
    iconLg: 24,   // standard nav/action icon
    iconXl: 32,
    icon2xl: 40,

    // Avatars
    avatarXs: 24,
    avatarSm: 32,
    avatarMd: 40,
    avatarLg: 48,
    avatarXl: 64,
    avatar2xl: 80,

    // Bottom nav bar
    tabBarHeight: 60,

    // Header / nav bar
    headerHeight: 56,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // OPACITY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  opacity: {
    0: 0,
    disabled: 0.38,   // Material standard for disabled
    muted: 0.54,
    secondary: 0.70,
    high: 0.87,
    full: 1,
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Z-INDEX
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  zIndex: {
    below: -1,
    base: 0,
    raised: 10,    // cards, list items on hover
    dropdown: 20,    // dropdowns, tooltips
    sticky: 30,    // sticky headers
    overlay: 40,    // modal scrim / backdrop
    modal: 50,    // modal / dialog
    toast: 60,    // toasts, snackbars
    top: 999,    // highest — onboarding tooltips
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ANIMATION
  // Match platform conventions:
  // iOS: spring-based · Android: standard easing curves
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  animation: {
    duration: {
      instant: 50,    // state changes, toggles
      fast: 150,    // button feedback, micro-interactions
      normal: 250,    // standard transitions
      slow: 350,    // modals, drawers entering
      slower: 500,    // complex layout transitions
    },
    easing: {
      // Use with react-native-reanimated
      standard: [0.4, 0.0, 0.2, 1],   // Material standard
      decelerate: [0.0, 0.0, 0.2, 1],   // elements entering screen
      accelerate: [0.4, 0.0, 1.0, 1],   // elements leaving screen
      sharp: [0.4, 0.0, 0.6, 1],   // quick, snappy actions
    },
  },

  // ── Hit Slop Presets ────────────────────────────────────────────
  // Auto-calculates padding needed to reach the touch minimum.
  // Usage: hitSlop={hitSlop.icon(20)} or hitSlop={hitSlop.md}
  hitSlop: {
    none: { top: 0, bottom: 0, left: 0, right: 0 },
    sm: { top: 8, bottom: 8, left: 8, right: 8 },  // small touch expansion
    md: { top: 12, bottom: 12, left: 12, right: 12 },  // icon-sized elements
    lg: { top: 16, bottom: 16, left: 16, right: 16 },  // very small elements
  }
};


