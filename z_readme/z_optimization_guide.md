# React Native Native UI & Performance Optimization Guide

## Building Truly Native-Looking Android & iOS Apps with Expo + React Native

---

# Table of Contents

1. Introduction
2. Android vs iOS UI Differences
3. Best Practices for Native UI
4. Performance & Code Optimization
5. ERP App Specific Recommendations
6. Recommended Tech Stack
7. Common Mistakes to Avoid
8. Suggested Folder Architecture
9. Recommended Implementation Sequence

---

# 1. Introduction

To make a React Native app feel truly native on both Android and iOS, focus on these core areas:

* Platform-specific UI behavior
* Native spacing and layout patterns
* Performance optimization
* System integrations
* Touch feedback and gestures
* Typography and animations

A well-designed React Native app should:

* feel responsive
* respect platform conventions
* maintain consistent spacing
* provide smooth interactions
* look polished on both platforms

---

# 2. Android vs iOS UI Differences

---

## A. Navigation

| Android            | iOS                        |
| ------------------ | -------------------------- |
| Material Design    | Human Interface Guidelines |
| Floating feel      | Layered / glass feel       |
| More compact       | More breathing space       |
| Strong shadows     | Soft shadows               |
| System back button | Swipe gestures             |
| Ripple feedback    | Opacity fade feedback      |

---

## B. Header & Status Bar

### Android

* Colored status bars
* Compact headers
* Status bar blends with app

### iOS

* Transparent status bar feel
* More safe-area spacing
* Large titles common

---

## C. Cards & Surfaces

### Android

* Elevation-based shadows
* Stronger depth

### iOS

* Softer shadows
* Blur / frosted glass aesthetics

---

## D. Touch Feedback

### Android

* Ripple effects

### iOS

* Opacity fade animations

---

## E. Typography

### Android

* Roboto feel
* Denser spacing

### iOS

* SF Pro feel
* More breathing room

---

# 3. Best Practices for Native UI

---

# A. Use Platform-Specific Styles

Import:

```tsx
import { Platform } from "react-native";
```

Example:

```tsx
paddingTop:
  Platform.OS === "ios"
    ? 60
    : 30
```

Use for:

* headers
* bottom spacing
* modals
* tab bars
* safe area adjustments

---

# B. Use Proper Safe Areas

Always use:

```tsx
import { SafeAreaView } from "react-native-safe-area-context";
```

Avoid the older React Native SafeAreaView.

---

# C. Platform-Specific Shadows

## Android

```tsx
elevation: 4
```

## iOS

```tsx
shadowColor: "#000",
shadowOpacity: 0.08,
shadowRadius: 12,
shadowOffset: {
  width: 0,
  height: 4,
}
```

Recommended reusable style:

```tsx
const cardStyle = {
  backgroundColor: "#fff",
  borderRadius: 24,

  ...(Platform.OS === "android"
    ? {
        elevation: 4,
      }
    : {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: {
          width: 0,
          height: 4,
        },
      }),
};
```

---

# D. Use Pressable Instead of TouchableOpacity

Preferred component:

```tsx
<Pressable
  android_ripple={{
    color: "#E5E7EB",
  }}
  style={({ pressed }) => ({
    opacity: pressed ? 0.7 : 1,
  })}
>
```

Benefits:

* Native Android ripple
* Native iOS opacity animation
* Better performance
* More control

---

# E. Use Native Gestures

Install:

```bash
npx expo install react-native-gesture-handler
```

Use for:

* swipe gestures
* draggable lists
* bottom sheets
* card interactions

---

# F. Smooth Scroll Behavior

Recommended:

```tsx
<ScrollView
  showsVerticalScrollIndicator={false}
  bounces={false}
>
```

---

# G. Add Blur Effects (iOS Feel)

Install:

```bash
npx expo install expo-blur
```

Use for:

* tab bars
* overlays
* glassmorphism
* modals

---

# H. Maintain Consistent Spacing

## Recommended Universal Scale

| Element         | Recommended Value |
| --------------- | ----------------- |
| Screen Padding  | 20                |
| Card Radius     | 24                |
| Touch Height    | 48+               |
| Section Spacing | 24                |

---

# 4. Performance & Code Optimization

---

# A. Extract Reusable Components

Good:

```tsx
<SettingsSection>
  <MenuItem />
</SettingsSection>
```

Avoid repeating layouts across screens.

---

# B. Move Styles Outside Render

Avoid:

```tsx
style={{
  shadowOpacity: 0.1
}}
```

inside render methods.

Preferred:

```tsx
const styles = StyleSheet.create({
  card: {},
});
```

Benefits:

* Better performance
* Cleaner code
* Reduced re-renders

---

# C. Memoize Heavy Components

Use:

```tsx
React.memo()
```

Ideal for:

* cards
* list items
* stat boxes
* reusable UI components

---

# D. Use FlatList for Large Lists

Avoid rendering long lists inside ScrollView.

Preferred:

```tsx
<FlatList />
```

Benefits:

* Virtualization
* Lower memory usage
* Better scrolling performance

---

# E. Avoid Inline Functions in Lists

Avoid:

```tsx
onPress={() => handlePress(item)}
```

inside large lists.

Prefer memoized handlers.

---

# F. Centralize Theme Management

Suggested structure:

```text
theme/
  colors.ts
  spacing.ts
  shadows.ts
  radius.ts
```

Example:

```tsx
export const COLORS = {
  primary: "#1B5E37",
  background: "#F4F7F5",
};
```

Benefits:

* Easy maintenance
* Consistent design
* Faster scalability

---

# G. Use NativeWind Consistently

Recommended:

* NativeWind → layout & spacing
* StyleSheet → complex platform styles

Avoid mixing:

* inline styles
* NativeWind
* StyleSheet
  randomly.

---

# 5. ERP App Specific Recommendations

---

# Android UI Direction

* Material 3 inspired
* Stronger depth
* Structured cards
* Compact layouts

---

# iOS UI Direction

* Softer surfaces
* Larger spacing
* Smooth transitions
* Frosted overlays

---

# Recommended Enhancements

Add:

* subtle borders
* improved shadows
* larger touch targets
* haptic feedback
* smoother animations

---

# Add Haptic Feedback

Install:

```bash
npx expo install expo-haptics
```

Example:

```tsx
import * as Haptics from "expo-haptics";

Haptics.selectionAsync();
```

Benefits:

* Feels significantly more native
* Improves interaction quality

---

# Improve Keyboard Handling

Install:

```bash
npx expo install react-native-keyboard-controller
```

Especially beneficial for iOS forms.

---

# 6. Recommended Tech Stack

| Purpose      | Recommended Package |
| ------------ | ------------------- |
| Navigation   | Expo Router         |
| Styling      | NativeWind          |
| Animations   | Reanimated          |
| Gestures     | Gesture Handler     |
| Blur Effects | expo-blur           |
| Haptics      | expo-haptics        |
| Icons        | Expo Vector Icons   |

---

# 7. Common Mistakes to Avoid

---

## Avoid Inconsistent Spacing

Bad:

* random margins
* mixed padding values

Good:

* consistent spacing system

---

## Avoid Inconsistent Touch Feedback

Every interactive element should:

* animate consistently
* provide feedback
* feel responsive

---

## Avoid Mixing Styling Approaches Randomly

Do not heavily mix:

* inline styles
* NativeWind
* StyleSheet

without a clear strategy.

---

## Avoid Large ScrollViews

Use FlatList whenever possible.

---

# 8. Suggested Folder Architecture

```text
components/
  ui/
    Card.tsx
    MenuItem.tsx
    Section.tsx
    Header.tsx

theme/
  colors.ts
  spacing.ts
  shadows.ts
  radius.ts

screens/
hooks/
services/
utils/
```

Benefits:

* scalability
* maintainability
* cleaner codebase
* easier team collaboration

---

# 9. Recommended Implementation Sequence

Follow this order while improving your app.

---

## Phase 1 — Foundation

### Step 1

Set up:

* SafeAreaView
* StatusBar handling
* Screen padding system

### Step 2

Create centralized:

* colors
* spacing
* radius
* shadows

### Step 3

Standardize:

* typography
* card radius
* touch sizes

---

## Phase 2 — Reusable UI

### Step 4

Create reusable:

* Card
* MenuItem
* Section
* Header
  components

### Step 5

Replace duplicated layouts with reusable components.

---

## Phase 3 — Native Feel

### Step 6

Replace TouchableOpacity with Pressable.

### Step 7

Add:

* ripple feedback
* opacity feedback
* haptic feedback

### Step 8

Add platform-specific shadows and spacing.

---

## Phase 4 — Performance

### Step 9

Move styles outside render methods.

### Step 10

Memoize heavy components.

### Step 11

Replace large ScrollViews with FlatList.

---

## Phase 5 — Advanced Polish

### Step 12

Add:

* gestures
* blur effects
* animations
* keyboard optimizations

### Step 13

Refine:

* transitions
* spacing consistency
* interaction quality

---

# Final Recommendation

The biggest reason apps feel non-native is usually:

* inconsistent spacing
* inconsistent animations
* inconsistent touch feedback

Consistency matters more than visual complexity.

A simple but consistent UI always feels more premium than an overly complex inconsistent UI.

---
