# React Native Responsiveness Framework
### Complete Guide — NativeWind (Tailwind CSS) + Custom Utilities

> **Stack:** React Native + Expo + NativeWind v4 + TypeScript  
> **Target:** iOS & Android · Phones & Tablets · Portrait & Landscape

---

## Table of Contents

1. [Decision Summary — Package vs Custom](#1-decision-summary)
2. [Required Packages](#2-required-packages)
3. [Project File Structure](#3-project-file-structure)
4. [NativeWind Setup](#4-nativewind-setup)
5. [Custom Utility File — `responsive.ts`](#5-custom-utility-file)
6. [Tailwind Config — Design Tokens](#6-tailwind-config)
7. [Typography System](#7-typography-system)
8. [Border Radius System](#8-border-radius-system)
9. [Container & Layout Sizing](#9-container--layout-sizing)
10. [Breakpoint Classes (Responsive Prefixes)](#10-breakpoint-classes)
11. [Platform & Safe Area Handling](#11-platform--safe-area-handling)
12. [Responsive Hooks](#12-responsive-hooks)
13. [Dynamic Class Utility — `cn()`](#13-dynamic-class-utility)
14. [Component Variants — CVA](#14-component-variants)
15. [Custom Text Component](#15-custom-text-component)
16. [Complete Screen Example](#16-complete-screen-example)
17. [Optimization Tricks](#17-optimization-tricks)
18. [Quick Reference Cheatsheet](#18-quick-reference-cheatsheet)

---

## 1. Decision Summary

| Concern | Use Package? | Use Custom File? | Verdict |
|---|---|---|---|
| Tailwind utility classes | ✅ NativeWind | — | **Package** |
| Breakpoint responsiveness (`md:`, `lg:`) | ✅ NativeWind built-in | — | **Package** |
| Scale math (`scale`, `moderateScale`) | — | ✅ `utils/responsive.ts` | **Custom** |
| Font size tokens | Both — math in custom, declared in tailwind config | | **Both** |
| Border radius tokens | Both — math in custom, declared in tailwind config | | **Both** |
| Safe area (notch/home bar) | ✅ `react-native-safe-area-context` | — | **Package** |
| Conditional class merging | ✅ `clsx` + `tailwind-merge` | — | **Package** |
| Component variants | ✅ `class-variance-authority` | — | **Package** |
| Platform detection | ✅ `Platform` from RN core | — | **Built-in** |
| Orientation / dimension change | ✅ `useWindowDimensions` from RN core | — | **Built-in** |

### Rule of Thumb
> Use **NativeWind classes** for static styles and breakpoint switching.  
> Use **`responsive.ts` scale functions** only inside `tailwind.config.js` to compute token values once.  
> Never call `scale()` directly in JSX — let Tailwind classes carry those values.

---

## 2. Required Packages

```bash
# Core — NativeWind
npm install nativewind
npm install --save-dev tailwindcss@3.x postcss autoprefixer

# Safe area (notch, Dynamic Island, Android status bar)
npm install react-native-safe-area-context

# Conditional class utilities
npm install clsx tailwind-merge

# Component variant system
npm install class-variance-authority

# Optional — enhanced device detection
npm install react-native-device-info
```

### Do NOT install these (redundant with NativeWind):
- `react-native-size-matters` — only needed if not using NativeWind
- `react-native-responsive-screen` — percentages are handled by Tailwind
- `styled-components` / `emotion` — conflicts with NativeWind

---

## 3. Project File Structure

```
├── app/
│   ├── _layout.tsx          ← import global.css here
│   └── (screens)/
├── components/
│   ├── Text.tsx             ← custom Text with scaling disabled
│   └── Button.tsx           ← CVA-based variant component
├── utils/
│   ├── responsive.ts        ← scale(), moderateScale(), verticalScale()
│   ├── cn.ts                ← clsx + twMerge helper
│   └── typography.ts        ← fontSize tokens (optional, or use config)
├── hooks/
│   └── useResponsive.ts     ← dimensions + isTablet + isLandscape
├── global.css               ← @tailwind directives
└── tailwind.config.js       ← ALL design tokens defined here
```

---

## 4. NativeWind Setup

### `tailwind.config.js` (base)
```js
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],  // ← required for v4
  theme: { extend: {} },
  plugins: [],
};
```

### `babel.config.js`
```js
module.exports = {
  presets: [
    ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    "nativewind/babel",
  ],
};
```

### `global.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### `app/_layout.tsx`
```tsx
import "../global.css";
// ... rest of root layout
```

---

## 5. Custom Utility File

**`utils/responsive.ts`** — The ONLY place where raw `Dimensions` math lives.

```ts
import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Base design canvas — design your Figma/Sketch at these dimensions
const BASE_WIDTH  = 390;   // iPhone 14 logical width
const BASE_HEIGHT = 844;   // iPhone 14 logical height

/**
 * scale() — horizontal scaling
 * Use for: icon sizes, horizontal spacing, image widths
 */
export const scale = (size: number): number =>
  (SCREEN_W / BASE_WIDTH) * size;

/**
 * verticalScale() — vertical scaling
 * Use for: component heights, vertical spacing
 */
export const verticalScale = (size: number): number =>
  (SCREEN_H / BASE_HEIGHT) * size;

/**
 * moderateScale() — balanced scaling (recommended for text & radius)
 * factor 0 = no scale, factor 1 = full scale
 * Default factor 0.3 is ideal for text; 0.5 for spacing
 */
export const moderateScale = (size: number, factor = 0.5): number =>
  size + (scale(size) - size) * factor;

/**
 * clamp() — prevent values from going too small or too large
 */
export const clamp = (val: number, min: number, max: number): number =>
  Math.min(Math.max(val, min), max);

/**
 * normalize() — pixel-density aware rounding
 */
export const normalize = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel(moderateScale(size)));

// Device type helpers
export const isTablet   = SCREEN_W >= 768;
export const isSmallPhone = SCREEN_W < 375;
```

> ⚠️ **Only import this file inside `tailwind.config.js`.**  
> Never import and call `scale()` directly in your JSX components.

---

## 6. Tailwind Config — Design Tokens

This is the heart of the system. All values are pre-computed at build time.

**`tailwind.config.js`** (complete)

```js
const { scale, moderateScale, verticalScale, clamp } = require('./utils/responsive');

module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {

      // ── Font Sizes ──────────────────────────────────────────────
      // factor 0.3 = gentle scaling; clamp prevents extreme sizes
      fontSize: {
        'xs':   [clamp(moderateScale(11, 0.3), 10, 14),  { lineHeight: `${clamp(moderateScale(16, 0.3), 14, 20)}px`  }],
        'sm':   [clamp(moderateScale(13, 0.3), 12, 16),  { lineHeight: `${clamp(moderateScale(18, 0.3), 16, 22)}px`  }],
        'base': [clamp(moderateScale(15, 0.3), 14, 18),  { lineHeight: `${clamp(moderateScale(22, 0.3), 20, 28)}px`  }],
        'lg':   [clamp(moderateScale(18, 0.4), 16, 22),  { lineHeight: `${clamp(moderateScale(26, 0.4), 24, 32)}px`  }],
        'xl':   [clamp(moderateScale(22, 0.4), 20, 26),  { lineHeight: `${clamp(moderateScale(30, 0.4), 28, 36)}px`  }],
        '2xl':  [clamp(moderateScale(26, 0.4), 24, 32),  { lineHeight: `${clamp(moderateScale(34, 0.4), 32, 42)}px`  }],
        '3xl':  [clamp(moderateScale(32, 0.5), 28, 40),  { lineHeight: `${clamp(moderateScale(40, 0.5), 36, 52)}px`  }],
        '4xl':  [clamp(moderateScale(40, 0.5), 34, 52),  { lineHeight: `${clamp(moderateScale(48, 0.5), 44, 64)}px`  }],
        'hero': [clamp(moderateScale(52, 0.5), 44, 68),  { lineHeight: `${clamp(moderateScale(60, 0.5), 52, 80)}px`  }],
      },

      // ── Spacing (padding, margin, gap) ───────────────────────────
      // Horizontal uses scale(), vertical uses verticalScale()
      spacing: {
        '0.5': scale(2),
        '1':   scale(4),
        '2':   scale(8),
        '3':   scale(12),
        '4':   scale(16),
        '5':   scale(20),
        '6':   scale(24),
        '7':   scale(28),
        '8':   scale(32),
        '10':  scale(40),
        '12':  scale(48),
        '16':  scale(64),
        '20':  scale(80),
        '24':  scale(96),
        // Vertical-specific (use sparingly via style prop if needed)
        'v2':  verticalScale(8),
        'v4':  verticalScale(16),
        'v6':  verticalScale(24),
        'v8':  verticalScale(32),
        'v12': verticalScale(48),
      },

      // ── Border Radius ────────────────────────────────────────────
      // factor 0.3 = subtle scaling; prevents pill shapes on tablets
      borderRadius: {
        'none': '0',
        'sm':   moderateScale(4,  0.3),
        'DEFAULT': moderateScale(8, 0.3),
        'md':   moderateScale(10, 0.3),
        'lg':   moderateScale(14, 0.3),
        'xl':   moderateScale(18, 0.3),
        '2xl':  moderateScale(24, 0.3),
        '3xl':  moderateScale(32, 0.3),
        'full': 9999,
      },

      // ── App Color Palette ────────────────────────────────────────
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        surface:    '#ffffff',
        background: '#f8fafc',
        border:     '#e2e8f0',
        muted:      '#94a3b8',
      },

      // ── Shadows ──────────────────────────────────────────────────
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'md':   '0 4px 16px rgba(0, 0, 0, 0.12)',
      },

      // ── Max Widths (prevent over-stretch on large tablets) ───────
      maxWidth: {
        'content': '680px',
        'wide':    '960px',
      },
    },
  },
};
```

---

## 7. Typography System

With tokens in `tailwind.config.js`, text sizing is just a class name.

```tsx
// Headings
<Text className="text-hero font-extrabold tracking-tight text-gray-900" />
<Text className="text-4xl font-bold text-gray-900" />
<Text className="text-3xl font-bold text-gray-800" />
<Text className="text-2xl font-semibold text-gray-800" />
<Text className="text-xl font-semibold text-gray-700" />

// Body
<Text className="text-lg text-gray-700" />
<Text className="text-base text-gray-700 leading-relaxed" />
<Text className="text-sm text-gray-500" />
<Text className="text-xs text-muted uppercase tracking-widest" />

// Responsive text (grows on tablet)
<Text className="text-2xl md:text-3xl lg:text-4xl font-bold" />
```

### Line Height Reference

| Class | Ratio | Use |
|---|---|---|
| `leading-none` | 1.0 | Display / hero text |
| `leading-tight` | 1.25 | Headings |
| `leading-snug` | 1.375 | Subheadings |
| `leading-normal` | 1.5 | Body text |
| `leading-relaxed` | 1.625 | Long-form paragraphs |
| `leading-loose` | 2.0 | Captions / labels |

---

## 8. Border Radius System

```tsx
<View className="rounded-sm"  />  {/* subtle — inputs, tags     */}
<View className="rounded"     />  {/* default — small cards     */}
<View className="rounded-md"  />  {/* medium cards              */}
<View className="rounded-lg"  />  {/* large cards               */}
<View className="rounded-xl"  />  {/* prominent cards, modals   */}
<View className="rounded-2xl" />  {/* hero cards                */}
<View className="rounded-3xl" />  {/* large hero sections       */}
<View className="rounded-full"/>  {/* pills, avatars, FABs      */}

// Responsive radius
<View className="rounded-xl md:rounded-2xl" />

// Specific corners
<View className="rounded-t-xl rounded-b-none" />   {/* bottom sheet top */}
<View className="rounded-tl-xl rounded-tr-xl" />   {/* top corners only */}
```

---

## 9. Container & Layout Sizing

### Core Principles

```tsx
// ❌ Never hardcode pixel dimensions
<View style={{ width: 320, height: 200 }} />

// ✅ Use Tailwind percentage + flex
<View className="w-full px-4 flex-1" />

// ✅ Use max-w to cap on tablets
<View className="w-full max-w-content self-center px-4 md:px-8" />
```

### Responsive Column Grid

```tsx
// ─── 1 col phone / 2 col tablet / 3 col large tablet ───
<View className="flex-row flex-wrap gap-3 px-4">
  <View className="w-full sm:w-[48%] lg:w-[31%]">...</View>
  <View className="w-full sm:w-[48%] lg:w-[31%]">...</View>
  <View className="w-full sm:w-[48%] lg:w-[31%]">...</View>
</View>

// ─── FlatList responsive columns ───
import { useWindowDimensions } from 'react-native';

const { width } = useWindowDimensions();
const numColumns = width >= 1024 ? 3 : width >= 768 ? 2 : 2;

<FlatList
  numColumns={numColumns}
  key={numColumns}           // ← forces re-render on orientation change
  columnWrapperStyle={numColumns > 1 ? { gap: 12, paddingHorizontal: 16 } : undefined}
  contentContainerStyle={{ gap: 12, paddingVertical: 16 }}
/>
```

### Standard Screen Container

```tsx
<SafeAreaView className="flex-1 bg-background">
  <ScrollView
    className="flex-1"
    contentContainerClassName="px-4 md:px-8 py-6 w-full max-w-wide self-center"
  >
    {/* screen content */}
  </ScrollView>
</SafeAreaView>
```

---

## 10. Breakpoint Classes

NativeWind maps Tailwind's responsive prefixes to **device screen width**.

| Prefix | Min Width | Typical Device |
|--------|-----------|----------------|
| *(none)* | 0px | All phones (base styles) |
| `sm:` | 640px | Large phones landscape |
| `md:` | 768px | Small tablets / iPad mini portrait |
| `lg:` | 1024px | iPad / tablets landscape |
| `xl:` | 1280px | iPad Pro landscape |

### Usage Patterns

```tsx
// Layout
<View className="flex-col md:flex-row" />
<View className="w-full md:w-1/2 lg:w-1/3" />

// Spacing
<View className="p-4 md:p-6 lg:p-8" />
<View className="gap-2 md:gap-4" />
<View className="mb-4 md:mb-8" />

// Typography
<Text className="text-lg md:text-xl lg:text-2xl" />

// Visibility
<View className="hidden md:flex" />    {/* tablet only   */}
<View className="flex md:hidden" />    {/* phone only    */}

// Radius
<View className="rounded-lg md:rounded-xl lg:rounded-2xl" />
```

---

## 11. Platform & Safe Area Handling

### Safe Area Setup

```tsx
// app/_layout.tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <YourNavigator />
    </SafeAreaProvider>
  );
}
```

### In Screens

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

// Method A — SafeAreaView (recommended for screens)
<SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
  ...
</SafeAreaView>

// Method B — useSafeAreaInsets (for custom layouts)
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();
<View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }} />
```

### Platform-Specific Classes (NativeWind v4)

```tsx
<View className="
  shadow-card        
  ios:shadow-md      
  android:elevation-4
"/>

<Text className="
  font-sans
  ios:tracking-tight
  android:tracking-normal
"/>
```

### Platform Shadow Utility (StyleSheet fallback)

```ts
// utils/shadows.ts
import { Platform } from 'react-native';

export const shadow = {
  sm: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 12 },
    android: { elevation: 8 },
  }),
};
```

---

## 12. Responsive Hooks

**`hooks/useResponsive.ts`**

```ts
import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

interface ScreenDims {
  width: number;
  height: number;
  isTablet: boolean;
  isLandscape: boolean;
  isSmallPhone: boolean;
  select: <T>(phone: T, tablet: T) => T;
}

export const useResponsive = (): ScreenDims => {
  const [screen, setScreen] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreen(window);
    });
    return () => sub?.remove();
  }, []);

  const isTablet    = screen.width >= 768;
  const isLandscape = screen.width > screen.height;
  const isSmallPhone = screen.width < 375;

  return {
    width:  screen.width,
    height: screen.height,
    isTablet,
    isLandscape,
    isSmallPhone,
    // Utility: pick value based on device type
    select: <T>(phone: T, tablet: T): T => (isTablet ? tablet : phone),
  };
};
```

```tsx
// Usage
const { isTablet, isLandscape, select } = useResponsive();

<View className={select("px-4", "px-8")}>
  <Text className={select("text-lg", "text-2xl")}>Hello</Text>
</View>
```

---

## 13. Dynamic Class Utility

**`utils/cn.ts`**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn() — merge Tailwind classes safely
 * - clsx: conditional class logic
 * - twMerge: deduplicates conflicting classes (e.g. "p-4 p-6" → "p-6")
 */
export const cn = (...inputs: ClassValue[]): string =>
  twMerge(clsx(inputs));
```

```tsx
// Conditional classes
<View className={cn(
  "bg-white rounded-xl p-4",
  isTablet  && "p-6 rounded-2xl",
  featured  && "border-2 border-primary-500",
  disabled  && "opacity-50",
)} />
```

---

## 14. Component Variants

**`components/Button.tsx`** — using `class-variance-authority`

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { cn } from '../utils/cn';

const buttonVariants = cva(
  // Base classes applied to all variants
  "items-center justify-center rounded-full active:opacity-80",
  {
    variants: {
      intent: {
        primary: "bg-primary-500",
        secondary: "bg-gray-100",
        outline:  "border-2 border-primary-500 bg-transparent",
        ghost:    "bg-transparent",
        danger:   "bg-red-500",
      },
      size: {
        sm:  "px-4 py-2",
        md:  "px-6 py-3",
        lg:  "px-8 py-4",
        xl:  "px-10 py-5",
      },
    },
    defaultVariants: {
      intent: 'primary',
      size:   'md',
    },
  }
);

const labelVariants = cva("font-semibold", {
  variants: {
    intent: {
      primary:   "text-white",
      secondary: "text-gray-900",
      outline:   "text-primary-500",
      ghost:     "text-gray-700",
      danger:    "text-white",
    },
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
  },
  defaultVariants: { intent: 'primary', size: 'md' },
});

type ButtonProps = VariantProps<typeof buttonVariants> & {
  label: string;
  onPress: () => void;
  className?: string;
  disabled?: boolean;
};

export const Button = ({ label, intent, size, onPress, className, disabled }: ButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    className={cn(buttonVariants({ intent, size }), disabled && "opacity-40", className)}
  >
    <Text className={cn(labelVariants({ intent, size }))}>
      {label}
    </Text>
  </TouchableOpacity>
);
```

```tsx
// Usage
<Button label="Get Started" intent="primary" size="lg" onPress={...} />
<Button label="Cancel" intent="ghost" size="md" onPress={...} />
<Button label="Delete" intent="danger" size="sm" onPress={...} />
```

---

## 15. Custom Text Component

Prevents system font scaling from breaking layouts.

**`components/Text.tsx`**

```tsx
import { Text as RNText, type TextProps } from 'react-native';

/**
 * Custom Text — disables aggressive system font scaling
 * Use maxFontSizeMultiplier for accessibility balance
 */
export const Text = ({ maxFontSizeMultiplier = 1.3, style, ...props }: TextProps) => (
  <RNText
    maxFontSizeMultiplier={maxFontSizeMultiplier}
    style={style}
    {...props}
  />
);
```

> Use this `Text` everywhere instead of the RN default. Import it as:
> `import { Text } from '../components/Text';`

---

## 16. Complete Screen Example

```tsx
import { ScrollView, View, FlatList, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';
import { useResponsive } from '../hooks/useResponsive';

const STATS  = ['Revenue', 'Users', 'Orders', 'Returns'];
const CARDS  = Array.from({ length: 8 }, (_, i) => ({ id: i, title: `Item ${i + 1}` }));

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const { isTablet, isLandscape } = useResponsive();

  const numColumns = width >= 1024 ? 3 : 2;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 md:px-8 py-6 w-full max-w-wide self-center"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ── */}
        <View className="mb-6 md:mb-10 flex-row items-center justify-between">
          <View>
            <Text className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Dashboard
            </Text>
            <Text className="text-sm md:text-base text-muted mt-1">
              Welcome back, have a great day!
            </Text>
          </View>
          <Button label="Export" intent="outline" size="sm" onPress={() => {}} />
        </View>

        {/* ── Stats Row ── */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          {STATS.map(stat => (
            <View
              key={stat}
              className={cn(
                "bg-surface rounded-xl p-4 md:p-5",
                isTablet ? "flex-1" : "w-[47%]",
              )}
            >
              <Text className="text-xs text-muted uppercase tracking-widest mb-1">
                {stat}
              </Text>
              <Text className="text-2xl md:text-3xl font-bold text-gray-900">
                1,284
              </Text>
              <Text className="text-xs text-green-500 font-medium mt-1">
                ↑ 12.4% this month
              </Text>
            </View>
          ))}
        </View>

        {/* ── Section Title ── */}
        <Text className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
          Recent Items
        </Text>

        {/* ── Responsive Grid ── */}
        <FlatList
          data={CARDS}
          key={numColumns}
          numColumns={numColumns}
          scrollEnabled={false}
          columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <View className={cn(
              "bg-surface rounded-xl p-4 md:p-5 flex-1",
            )}>
              <Text className="text-base md:text-lg font-semibold text-gray-900">
                {item.title}
              </Text>
              <Text className="text-sm text-muted mt-1">
                Subtitle text here
              </Text>
            </View>
          )}
        />

      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## 17. Optimization Tricks

### ✅ Do

| Trick | Reason |
|---|---|
| Define all tokens in `tailwind.config.js` | Values computed once at build, not per-render |
| Use `key={numColumns}` on FlatList | Forces re-mount when orientation changes column count |
| Use `max-w-*` on root containers | Prevents overstretched UI on iPad Pro landscape |
| Wrap `StyleSheet.create` in `useMemo` when using inline styles | Prevents recreation on every render |
| Use `contentContainerClassName` (NativeWind v4) on ScrollView | Avoids mixing `className` and `contentContainerStyle` |
| Use `self-center` + `max-w-content` on content views | Centers layout on wide tablets cleanly |
| `removeClippedSubviews={true}` on FlatList | Frees memory for off-screen items |
| `getItemLayout` on FlatList with fixed-height items | Eliminates dynamic measurement; huge scroll perf boost |

### ❌ Avoid

| Anti-Pattern | Problem |
|---|---|
| `style={{ padding: scale(16) }}` in JSX | Creates new object every render; bypasses Tailwind |
| Calling `scale()` / `moderateScale()` in components | Math runs per-render instead of at build time |
| `style={{ width: 300 }}` hardcoded values | Breaks on different screen sizes |
| Mixing `className` + `style` for the same property | Causes specificity conflicts |
| `twMerge` on every render without `useMemo` | Slight overhead on hot components |
| Stacking `md:` + `lg:` without a base style | Undefined base style causes flicker |
| Over-using arbitrary values like `text-[17px]` | Bypasses token system; hard to maintain |

### Memoized Styles (for dynamic values only)

```tsx
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { shadow } from '../utils/shadows';
import { useResponsive } from '../hooks/useResponsive';

const MyCard = () => {
  const { isTablet } = useResponsive();

  const dynamicStyle = useMemo(() => StyleSheet.create({
    card: {
      ...shadow.md,
      minHeight: isTablet ? 160 : 120,
    },
  }), [isTablet]);

  return (
    <View className="bg-surface rounded-xl p-4" style={dynamicStyle.card}>
      ...
    </View>
  );
};
```

---

## 18. Quick Reference Cheatsheet

```
ELEMENT            CLASS PATTERN                        NOTES
─────────────────────────────────────────────────────────────────────
Screen container   flex-1 bg-background                 Always wrap in SafeAreaView
Content wrapper    px-4 md:px-8 max-w-wide self-center  Prevent tablet over-stretch
Card               bg-surface rounded-xl p-4 md:p-5    Scale radius & padding together
Full-width card    w-full md:w-1/2 lg:w-1/3            Responsive grid column
Hero text          text-3xl md:text-4xl font-extrabold  Clamp handled in config
Body text          text-base leading-relaxed            Use relaxed for paragraphs
Caption            text-xs text-muted uppercase         tracking-widest for labels
Button pill        rounded-full px-6 py-3 text-base    Use CVA for variants
Input field        rounded-lg border border-border p-3  rounded-lg is ~14px scaled
Avatar             w-10 h-10 md:w-12 md:h-12 rounded-full  Circular, scale with md:
Icon               w-5 h-5 md:w-6 md:h-6              Scale icon container, not icon
Divider            h-px bg-border my-4                 Use opacity-50 for subtle
Section gap        mb-6 md:mb-10                       Breathe more on tablets
Row gap            gap-3 md:gap-4                      gap over margin for grids
```

### Scale Function Reference

| Function | Input | Best For |
|---|---|---|
| `scale(n)` | size at 390px base | Icon sizes, horizontal spacing |
| `verticalScale(n)` | size at 844px base | Component heights, vertical spacing |
| `moderateScale(n, 0.3)` | gentle growth | **Text sizes, border radius** |
| `moderateScale(n, 0.5)` | moderate growth | General spacing tokens |
| `clamp(val, min, max)` | any | Cap values on tiny/huge screens |

### Device Breakpoints

```
< 375px   isSmallPhone   iPhone SE, older Androids
375–767px phone          iPhone 14, Pixel, Samsung Galaxy (standard)
768–1023px md:           iPad mini, small Android tablets
1024–1279px lg:          iPad Air, 10" Android tablets  
≥ 1280px  xl:            iPad Pro 12.9", large Android tablets landscape
```

---

*Generated for React Native + Expo + NativeWind v4 + TypeScript*  
*Base design canvas: iPhone 14 (390 × 844pt)*  
*Last updated: 2025*
