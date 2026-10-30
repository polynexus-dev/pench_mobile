# Implementation Changelog & iOS Branch Migration Guide

This document contains the complete list of all features, fixes, and architectural changes implemented in this branch. Use this guide to apply the exact same updates to the **`ios`** branch.

---

## Quick Migration Commands for the `ios` Branch

You can apply these changes to the `ios` branch using either of the two methods below:

### Method A: Git Patch (Recommended)
```bash
# 1. On this branch, create a patch of all committed/uncommitted changes:
git add -A
git diff --cached > changes.patch

# 2. Switch to your iOS branch:
git checkout ios

# 3. Apply the patch:
git apply --reject --whitespace=fix changes.patch
```

### Method B: Git Cherry-Pick / Merge
```bash
# 1. Commit everything on this branch:
git add -A
git commit -m "feat: tabs, location prompt, bottle packaging, resume delivery, order tracking, and custom alert modal"

# 2. Switch to the iOS branch and cherry-pick:
git checkout ios
git cherry-pick <commit-hash>
```

---

## 1. Summary of All New & Untracked Files

| File Path | Description |
|---|---|
| `src/shared/components/AlertModal/alertManager.ts` | Global alert manager that intercepts `Alert.alert(...)` and forwards alert configurations to the custom modal listener. |
| `src/shared/components/AlertModal/AlertModal.tsx` | High-polish custom alert modal with context-aware icons (Success, Destructive, Warning, Location, Info), typography, and styled buttons. |
| `app/(customer)/(tabs)/cart.tsx` | Route wrapper placing the Cart screen directly into the bottom tab bar. |
| `app/(customer)/orders.tsx` | Standalone route for orders accessible from Profile, Dashboard, and Track Order strips. |

---

## 2. Detailed Breakdown of Changes by Feature

### Feature 1: Tab Bar Navigation & Cart Tab
- **Requirement**: Replace the "Orders" tab with "Cart" in the bottom navigation bar; route orders to a standalone page with a back button.
- **Files Modified**:
  - `app/(customer)/(tabs)/_layout.tsx`, `_layout.android.tsx`, `_layout.ios.tsx`:
    - Replaced the `orders` tab screen with `<Tabs.Screen name="cart" ... />`.
    - Added Cart icon (`cart-outline`), Cart label, and cart item counter badge (`cartCount`).
    - Hid `orders` from the tab bar: `<Tabs.Screen name="orders" options={{ href: null }} />` (or removed from tab routes).
  - `app/(customer)/orders.tsx`:
    - Created standalone route pointing to `OrderScreen`.
  - `src/features/ecommerce/screens/OrderScreen.tsx`:
    - Added a header back button (`router.back()`) to easily return to the previous screen.
  - `src/features/ecommerce/screens/CartScreen.tsx`:
    - Added a header back button so users navigating to cart from buttons outside the tab bar can go back.
    - Fixed bottom padding (`paddingBottom: Math.max(insets.bottom, 12) + 72`) so checkout buttons ("Proceed to Pay") are never obscured by floating bottom tabs.
  - `src/features/ecommerce/screens/PaymentScreen.tsx`:
    - Fixed post-payment navigation to route to `/(customer)/orders` instead of the old tabs path.
    - Fixed bottom padding above the floating tab bar.

---

### Feature 2: Home Subscription Card Visibility
- **Requirement**: If customer already has an active subscription, do not show the promotional subscription card on the home screen.
- **Files Modified**:
  - `src/features/dashboard/screens/CustomerDashboard.tsx`:
    - Wrapped the promotional "Flexible Milk Subscriptions" card (`lines ~239-296`) with `{!hasSubscription && ( ... )}`.
    - Updated `checkSubscriptionStatus` to inspect active subscriptions from both `subscriptionApi.getSubscriptions()` and `user.customer_dashboard.active_subscriptions`.

---

### Feature 3: Payment Screenshot Upload (Camera Button Removed)
- **Requirement**: Remove the "Take Photo" camera button; show only a single "Upload Screenshot" / "Update Screenshot" gallery picker button.
- **Files Modified**:
  - `src/features/ecommerce/screens/PaymentScreen.tsx`:
    - Removed `takePhoto` function and camera permissions request.
    - Replaced the split Camera + Gallery buttons with a single full-width button calling `pickImage` from `expo-image-picker`.
    - Button text dynamically reflects state: `"Upload Payment Screenshot"` vs `"Change Payment Screenshot"`.

---

### Feature 4: Location Permissions & Highlighted "Use Current Location" Button
- **Requirement**: Prompt Android/iOS native location permission prompt when tapping "Use current location"; if denied or services disabled, alert user with direct "Give Permission" / "Open Settings" action. Highlight the button for high visibility.
- **Files Modified**:
  - `src/features/map/screens/ConfirmLocationScreen.tsx`:
    - Added permission verification (`Location.getForegroundPermissionsAsync()`, `Location.requestForegroundPermissionsAsync()`).
    - Added check for location services enabled (`Location.hasServicesEnabledAsync()`).
    - If denied or disabled, prompts user with a modal offering `"Open Settings"` (`Linking.openSettings()`).
    - Redesigned the floating "Use Current Location" button with solid brand green (`#0C5A35`), white icon, white bold text, and elevated shadow (`elevation: 8`).
  - `src/features/map/screens/LocationSelectBottomSheet.tsx` & `src/features/dashboard/components/LocationSetupSheet.tsx`:
    - Added identical permission handling and fallback to device settings.

---

### Feature 5: Delivery Location Tag Switcher on Accounts Page
- **Requirement**: Show all saved location tags (`home`, `work`, `other`) in the Account/Profile page with the active/default tag highlighted.
- **Files Modified**:
  - `src/features/user/screens/CustomerProfileScreen.tsx`:
    - Fetches customer saved locations using `locationApi.getLocations(domain_name)`.
    - Renders all location tags with icons (`home`, `briefcase`, `location`).
    - Highlights the currently active location with `#0C5A35` background tint, green border, and an `"ACTIVE"` badge.
    - Tapping any saved location immediately switches the active delivery location and updates local storage (`pench_customer_location`).

---

### Feature 6: Single Active Subscription Card with Edit & Cancel
- **Requirement**: Instead of showing two separate cards for active subscriptions, show only one unified card with "Edit" and "Cancel" buttons.
- **Files Modified**:
  - `src/features/ecommerce/screens/SubscriptionsScreen.tsx`:
    - Combined "Your Active Plans" and "Manage Selected Plan" into a single unified card per subscription.
    - Included title, frequency, quantity, and status badge.
    - Placed **"Edit"** (`handleOpenEditModal`) and **"Cancel"** (`handleConfirmDeleteSubscription`) buttons side-by-side at the bottom of the card.

---

### Feature 7: Dynamic Bottle Packaging Size Restriction
- **Requirement**: If customer chooses 1 Litre quantity, disable the 1.5 Litre bottle packaging size and only show 1/2 Litre and 1 Litre bottles; apply this logic across all quantities (e.g. 0.5L only shows 1/2L; 1.5L+ shows all sizes).
- **Files Modified**:
  - `src/features/ecommerce/screens/SubscriptionsScreen.tsx`:
    - Filtered bottle packaging options so only sizes `<= selectedDeliveryQty` are rendered:
      ```tsx
      {([
        { id: "0.5", label: "1/2 Litre", sublabel: "500 ml", icon: "flask-outline", sizeVal: 0.5 },
        { id: "1", label: "1 Litre", sublabel: "1000 ml", icon: "wine-outline", sizeVal: 1.0 },
        { id: "1.5", label: "1.5 Litres", sublabel: "1500 ml", icon: "beaker-outline", sizeVal: 1.5 },
      ])
        .filter((bottle) => bottle.sizeVal <= selectedDeliveryQty)
        .map((bottle) => ( ... ))}
      ```
    - Added an automatic fallback `useEffect`:
      ```tsx
      useEffect(() => {
        const currentSizeVal = parseFloat(selectedBottleSize);
        if (currentSizeVal > selectedDeliveryQty) {
          if (selectedDeliveryQty >= 1.0) {
            setSelectedBottleSize("1");
          } else {
            setSelectedBottleSize("0.5");
          }
        }
      }, [selectedDeliveryQty, selectedBottleSize]);
      ```

---

### Feature 8: Resume Subscription API & Vacation Delivery Actions
- **Requirement**: Integrate `POST {{city_url}}/api/erp/subscriptions/{{last_id}}/resume/` to resume deliveries if paused for vacation by mistake.
- **Files Modified**:
  - `src/features/ecommerce/api/subscriptionApi.ts`:
    - Added:
      ```ts
      resumeSubscription: (domainName: string, subscriptionId: string): Promise<any> => {
        return httpClient.post(
          buildUrl(domainName, `/api/erp/subscriptions/${subscriptionId}/resume/`),
          {}
        );
      },
      ```
  - `src/features/ecommerce/screens/SubscriptionsScreen.tsx`:
    - Added `handleConfirmResumeSubscription(targetSubId?)`.
    - Added an amber alert banner on the active subscription card when paused, featuring a direct **"Resume Delivery"** button.
    - Updated Delivery Calendar section to display a dedicated **"Deliveries are Paused"** box with **"Resume Deliveries"** and **"Change Dates"** buttons.
    - Added **"Cancel Vacation & Resume Delivery"** button inside the Delivery Status bottom sheet when clicking on any vacation day.
    - Toggling status from paused to active in the Edit modal automatically triggers the resume API.
  - `src/features/dashboard/screens/CustomerDashboard.tsx`:
    - Added a banner on the customer dashboard when a subscription is paused for vacation with an instant **"Resume"** button.

---

### Feature 9: Order Counter Tag & Home "Track Order" Strip
- **Requirement**: Show a counter tag on "Your orders" button on the accounts page if orders exist; show a "Track Order" strip below the search bar on the home screen if orders exist.
- **Files Modified**:
  - `src/features/user/screens/CustomerProfileScreen.tsx`:
    - Updated `StatsCard` to support a `badge` property.
    - If `orderCount > 0`, renders a `#0C5A35` circular badge on the top right corner of the "Your orders" button.
    - Uses `orderApi.getOrders(domain_name)` and `useFocusEffect` to keep the order count fresh.
  - `src/features/dashboard/components/CustomerHomeComponents.tsx`:
    - Added `orders?: Order[]` prop to `HeaderSection`.
    - Rendered a **"Track Order"** strip directly below the Search Bar inside the header gradient:
      - Delivery icon (`bicycle`).
      - "Track Order" title.
      - Status pill (e.g. `SCHEDULED`, `PENDING`, `IN TRANSIT`).
      - Summary text (`{itemsSummary} • ₹{orderToTrack.total}`).
      - Direct navigation to `/(customer)/orders`.
      - Only displays if orders exist.
  - `src/features/dashboard/screens/CustomerDashboard.tsx`:
    - Fetches orders using `orderApi.getOrders(domainName)` and passes `orders={orders}` to `HeaderSection`.
    - Re-fetches orders on mount, on pull-to-refresh, and on screen focus via `useFocusEffect`.

---

### Feature 10: Global Custom Alert Modal (Replacing Native OS Alerts)
- **Requirement**: Replace all default OS alert popups throughout the app with a custom modal.
- **Files Created**:
  - `src/shared/components/AlertModal/alertManager.ts`:
    - Overrides `Alert.alert(...)` at the React Native runtime level.
    - Forwards alert requests (`title`, `message`, `buttons`, `options`) to the modal listener.
  - `src/shared/components/AlertModal/AlertModal.tsx`:
    - Custom modal component using React Native's `<Modal transparent statusBarTranslucent>`.
    - Features a centered white card (`rounded-3xl p-6 shadow-2xl`), dimmed backdrop (`bg-black/60`), context-aware icons (Success, Error, Warning, Destructive, Location, Info), clean typography, and styled action buttons (cancel, destructive, primary).
- **Files Modified**:
  - `app/_layout.tsx`:
    - Mounted `<AlertModalProvider />` inside the root `<BottomSheetModalProvider>`.
    - Automatically upgrades all 65+ alerts across the entire app into the custom modal without requiring changes to individual screens.

---

## 3. Complete Checklist for Applying to `ios` Branch

1. [ ] **Copy New Files**:
   - `src/shared/components/AlertModal/alertManager.ts`
   - `src/shared/components/AlertModal/AlertModal.tsx`
   - `app/(customer)/(tabs)/cart.tsx`
   - `app/(customer)/orders.tsx`
2. [ ] **Update Root Layout**:
   - In `app/_layout.tsx`, import and mount `<AlertModalProvider />`.
3. [ ] **Update Tab Layouts**:
   - In `app/(customer)/(tabs)/_layout.tsx`, `_layout.android.tsx`, and `_layout.ios.tsx`, replace `orders` tab with `cart`.
4. [ ] **Update API Client**:
   - In `src/features/ecommerce/api/subscriptionApi.ts`, add `resumeSubscription`.
5. [ ] **Update Dashboard Components & Screen**:
   - In `src/features/dashboard/components/CustomerHomeComponents.tsx`, add `orders` prop and Track Order strip to `HeaderSection`.
   - In `src/features/dashboard/screens/CustomerDashboard.tsx`, add order fetching, pass `orders` to `HeaderSection`, add paused vacation banner, and wrap subscription promo card with `!hasSubscription`.
6. [ ] **Update Subscriptions Screen**:
   - In `src/features/ecommerce/screens/SubscriptionsScreen.tsx`, implement dynamic bottle size filtering (`<= selectedDeliveryQty`), bottle fallback `useEffect`, single active subscription card with Edit/Cancel, and resume delivery actions.
7. [ ] **Update Profile Screen**:
   - In `src/features/user/screens/CustomerProfileScreen.tsx`, add `badge` support to `StatsCard`, fetch order count, and render saved location switcher cards.
8. [ ] **Update Location Screens**:
   - In `src/features/map/screens/ConfirmLocationScreen.tsx`, add permissions prompt before fetching current location and highlight the GPS button.
9. [ ] **Verify with TypeScript**:
   - Run `npx tsc --noEmit` on the `ios` branch to ensure zero type errors.

