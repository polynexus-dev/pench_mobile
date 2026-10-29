# Summary of Uncommitted Git Changes

This document contains the complete list of files and changes made in this working tree so they can be easily replicated or reviewed in another branch.

---

## 1. New Files (Untracked)

### Services & API
- **`src/services/api/locationApi.ts`**
  - Implements full CRUD for customer saved locations:
    - `getLocations(domainName, tag?)`: `GET /api/accounts/locations/`
    - `createLocation(domainName, payload)`: `POST /api/accounts/locations/`
    - `updateLocation(domainName, locationId, payload)`: `PATCH /api/accounts/locations/${id}/`
    - `setDefaultLocation(domainName, locationId)`: `POST /api/accounts/locations/${id}/set-default/`
    - `deleteLocation(domainName, locationId)`: `DELETE /api/accounts/locations/${id}/`

### Domain Types
- **`src/types/domain/location.types.ts`**
  - Defines `CustomerLocation`, `LocationTag` (`"home" | "work" | "other"`), `CreateLocationPayload`, `UpdateLocationPayload`.

### Stores
- **`src/store/productStore.ts`**
  - Zustand store caching products and providing `getProductPrice(id)` for live unit pricing.

### Map & Location Components
- **`src/assets/images/red_pin.png`**
  - Pin icon asset for interactive map marker.
- **`src/features/map/utils/googleMapsUrlParser.ts`**
  - Utility to parse latitude & longitude from Google Maps URLs.
- **`src/features/map/screens/ConfirmLocationScreen.tsx`**
  - Screen for selecting/confirming delivery location on map, setting tags, and updating existing tags.
- **`app/(customer)/confirm-location.tsx`**
  - Expo Router route wrapper for `ConfirmLocationScreen`.

---

## 2. Modified Files

### Dependencies & Configuration
- **`app.json`**, **`package.json`**, & **`android/app/build.gradle`**
  - Bumped version to `1.0.4` and `versionCode` to `4` for Play Store release.
- **`package.json`** & **`package-lock.json`**
  - Added `"expo-image-picker": "~17.0.11"` (bundled version compatible with Expo SDK 54).

### API Services
- **`src/services/api/buildUrl.ts`**
  - Updated URL builder to handle domain routing and relative API path resolution properly.
- **`src/services/api/index.ts`**
  - Exported `locationApi`.
- **`src/features/ecommerce/api/subscriptionApi.ts`**
  - **Multipart Create**: Updated `createSubscription` to accept `payment_amount`, `payment_screenshot`, and `payment_transaction_id` using multipart `FormData` (with `items` stringified as JSON string).
  - Added `getSubscription(domainName, id)`: `GET /api/erp/subscriptions/${id}/`
  - Added `updateSubscription(domainName, id, payload, method)`: `PATCH` / `PUT /api/erp/subscriptions/${id}/`
  - Added `updateSubscriptionQuantity(domainName, id, payload)`: `POST /api/erp/subscriptions/${id}/update-quantity/`
  - Added `deleteSubscription(domainName, id)`: `DELETE /api/erp/subscriptions/${id}/`
- **`src/features/dashboard/api/orderApi.ts`**
  - **Multipart Create**: Updated `createOrder` to accept multipart `FormData` with `payment_screenshot`, `payment_amount`, and `payment_transaction_id`.
  - Added `is_special` query parameter filter to `getOrders`.
  - Added `getOrder(domainName, id)` and `latest_payment` field to `Order`.

### Domain Models & Types
- **`src/types/domain/user.types.ts`**
  - Added `customer_location?: { latitude: string | number; longitude: string | number; address: string } | null;` to `User`.
- **`src/features/auth/types/auth.types.ts`**
  - Added `customer_location` to `AuthResponse`.
- **`src/types/index.ts`**
  - Re-exported all location types.
- **`src/features/ecommerce/types/ecommerce.types.ts`**
  - Added `LatestPayment` interface (`id`, `amount`, `status`, `screenshot`, `created_at`, `transaction_id`).
  - Added `latest_payment?: LatestPayment | null;` to `Subscription`.

### State Management
- **`src/store/index.ts`**
  - Exported `useProductStore`.
- **`src/store/useCartStore.ts`**
  - Added metadata support for custom subscription configurations.

### Navigation & Layouts
- **`app/(customer)/_layout.tsx`**
  - Registered stack screen `<Stack.Screen name="confirm-location" options={{ headerShown: false }} />`.
- **`app/(customer)/(tabs)/_layout.tsx`**
  - Removed incorrect `tabBarBadge` from Orders tab button (which previously showed `cartCount`).

### Screens & Features

#### 1. Location & Profile
- **`src/features/map/components/LocationSelectMap.tsx`**
  - Interactive map integration with red pin, reverse geocoding, and GPS button.
- **`src/features/map/screens/LocationSelectBottomSheet.tsx`**
  - Bottom sheet for selecting location tag (`home`, `work`, `other`).
  - Added check for existing tagged locations; asks user confirmation before updating via `updateLocation`.
- **`src/features/map/hooks/useStartupSync.ts`**
  - Automatically loads and syncs default customer location on launch.
- **`src/features/user/screens/CustomerProfileScreen.tsx`**
  - Displays customer location details and added a "Change Location" button.

#### 2. Dashboard
- **`src/features/dashboard/screens/CustomerDashboard.tsx`**
  - Removed floating "View cart" pill button.
  - Linked location select bottom sheet and product details bottom sheet.
- **`src/features/dashboard/components/CustomerHomeComponents.tsx`** & **`ProductDetailBottomSheet.tsx`**
  - Integrated product pricing and live price sync.

#### 3. E-Commerce, Payment & Subscriptions
- **`src/features/ecommerce/screens/PaymentScreen.tsx`**
  - Added image picker integration (`expo-image-picker`) for payment receipts (Gallery and Camera).
  - Added UI card for uploading payment receipt and entering optional UPI Transaction ID / UTR.
  - Validates payment screenshot before order confirmation.
  - Sends `payment_amount`, `payment_screenshot`, and `payment_transaction_id` in `createSubscriptions` and `createOrder`.
- **`src/features/ecommerce/screens/SubscriptionsScreen.tsx`**
  - Removed floating "View cart" pill button.
  - Added **"Manage Selected Plan"** card when an active plan is selected:
    - Quick `-` / `+` daily quantity adjustment with instant API sync (`POST /api/erp/subscriptions/${id}/update-quantity/`).
    - **"Edit Details"** modal to change quantity, frequency (`daily`, `alternate`, `custom`), start date, and status (`active`, `paused`) (`PATCH /api/erp/subscriptions/${id}/`).
    - **"Cancel Plan"** destructive action button with confirmation alert (`DELETE /api/erp/subscriptions/${id}/`).
- **`src/features/ecommerce/screens/CartScreen.tsx`**
  - Improved quantity and total calculation for multi-month subscriptions.
- **`src/features/ecommerce/components/SubscriptionModelCard.tsx`**
  - Updated model card display and live price calculation.

---

## 3. Quick Git Commands for Another Branch

If you want to apply these exact changes to another branch:

### Option A: Create a Patch and Apply
```bash
# 1. From current branch, create a patch file including unstaged changes:
git diff > my_changes.patch

# 2. Switch to target branch:
git checkout <other-branch>

# 3. Apply the patch:
git apply my_changes.patch
```

### Option B: Commit and Cherry-pick or Merge
```bash
# 1. Commit on current branch:
git add .
git commit -m "feat: subscriptions payment proof, location API, and subscription management"

# 2. Switch to other branch and cherry-pick:
git checkout <other-branch>
git cherry-pick main
```
