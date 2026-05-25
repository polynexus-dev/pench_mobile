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



# ENV old 
*** package.json -> 
  "scripts": {
    "start": "expo start",
    "reset-project": "node ./scripts/reset-project.js",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "lint": "expo lint"
  },

*************************************************
# REVAMPED MAP TRACKING & GEOFENCE SETUP
Yes — with these files, the cleanest production fix is to **stop fetching the heavy route in three places** and make the route a single cached source of truth. The best pattern is: fetch once with React Query, sync a trimmed route snapshot into geofence state once, and let both `DriverDashboard` and `OSMMap` read from that shared state. [tanstack](https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults)

## Recommended flow

1. `useFetchMyRoute()` becomes the only network fetch for `my-route`. React Query already shares cached results by query key, so multiple consumers should read the same cached response instead of refetching independently. [tanstack](https://tanstack.com/query/v5/docs/framework/react/guides/query-options)
2. `MapScreen` or a dedicated sync hook copies only the needed route fields into `useGeofenceStore`. Keep this sync one-way so the geofence engine stays fast and predictable. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf)
3. `OSMMap` renders from `useGeofenceStore` only. It should not fetch route data or own route lifecycle logic. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf)
4. `DriverDashboard` should read route summary state from the same store, not make a separate route request. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf)

## Step-by-step changes

### 1) Remove route fetching from `geoFenceStore.ts`
Right now `geoFenceStore.ts` does its own `fetchMyRoute()` and also starts GPS tracking. That makes the store do too much and duplicates API work. Move all network fetching out of the store and keep the store focused on geofence state only: route snapshot, location, near stop, active stop, and delivery eligibility. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf)

### 2) Make `useFetchMyRoute()` the single fetch path
Your query hook should be the only place that calls `/my-route`. TanStack Query is designed to share cached data across components with the same query key, and its defaults can be tuned with `staleTime` and `refetchOnMount` for heavy data. For this route payload, add a longer `staleTime`, disable refetch on every mount, and optionally refresh only on trip start or manual refresh. [tanstack](https://tanstack.com/query/v4/docs/framework/react/guides/important-defaults)

### 3) Add a lightweight route snapshot
Do not push the full route payload into UI state. Instead, normalize it into a smaller shape before storing it in geofence state, such as:
- route id,
- route name,
- stop id,
- stop sequence,
- customer name,
- coordinates,
- order status,
- order reference. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf)

That reduces memory use and makes geofence checks faster because you are not repeatedly carrying unrelated route data like notes, full metadata, or extra backend fields. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf)

### 4) Introduce a sync hook
Create a `useSyncRouteToGeofence()` hook and call it once from the screen that owns route loading. That hook should:
- read `data` from `useFetchMyRoute()`,
- transform the response into a lightweight route snapshot,
- store it in `useGeofenceStore`,
- set `activeStopId` to the first `in_transit` stop only if no active stop exists yet. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf)

This avoids the same `useEffect` pattern in multiple components and keeps state syncing consistent.

### 5) Update `DriverDashboard.tsx`
`DriverDashboard.tsx` currently calls `useFetchMyRoute()` just to check whether the route exists, while also reading `route` from `useGeofenceStore`. That is redundant. Remove the direct query call from the dashboard and read route status from the shared store instead. If the dashboard needs route summary numbers, store a precomputed summary object in the geofence or route store rather than pulling the whole route again. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf)

### 6) Update `OSMMap.tsx`
`OSMMap.tsx` should stop calling `useFetchMyRoute()` entirely and should use `route` from the store as the marker source. It should also read `activeStopId` and `selectedStopId` from the same store, not from `trackingStore`, so marker highlighting and bottom-sheet selection stay in sync. This makes the map purely presentational and much less fragile. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf)

### 7) Keep tracking store separate
`trackingStore.tsx` should only manage trip lifecycle, current GPS location, socket, and watcher lifecycle. It should not own route fetching or route data. That separation makes debugging easier because tracking bugs and route bugs will no longer be mixed together. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf)

### 8) Optimize GPS-driven geofence checks
Keep geofence evaluation in the store, but only against the lightweight route snapshot. Use the nearest valid stop among `in_transit` stops, and compare with a small tolerance such as `geofenceMeters + 5` to reduce false negatives from GPS drift. Expo location watchers should be created once and removed cleanly, since the subscription lifecycle matters for reliable updates. [til.hashrocket](https://til.hashrocket.com/posts/gp65vcfnla-unsubscribe-from-watchpositionasync-in-expo)

### 9) Fix the dashboard render pattern
In `DriverDashboard.tsx`, you currently call `show()` directly during render when `!data?.id`, which can cause repeated toast notifications and render side effects. Move that into a `useEffect` or remove it once route fetching is centralized. This is a common production hardening step: rendering should stay pure. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf)

### 10) Add clear invalidation rules
Use manual invalidation on these events:
- trip start,
- trip end,
- route reassignment,
- route completion,
- driver refresh action. [tanstack](https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults)

Do not automatically refetch the heavy route on every screen mount unless the app truly needs it. That preserves battery, reduces data usage, and keeps the UI snappy. [tanstack](https://tanstack.com/query/v4/docs/framework/react/guides/important-defaults)

## What I recommend as final state

| Concern | Current state | Recommended state |
|---|---|---|
| Route fetching | 3 places | 1 React Query hook  [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf) |
| Route storage | store + query + map | query cache + one lightweight store snapshot  [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf) |
| Geofence logic | store-based but heavy | store-based and normalized  [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf) |
| Map rendering | fetches and renders | render-only from store  [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf) |
| Dashboard route status | fetches directly | reads shared store summary  [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf) |

## Most important code changes

- Remove `fetchMyRoute()` from `geoFenceStore.ts`.  
- Remove `useFetchMyRoute()` from `OSMMap.tsx`.  
- Remove `useFetchMyRoute()` from `DriverDashboard.tsx` and use shared state instead.  
- Add `selectedStopId` to `geofenceStore` if map selection is controlled there.  
- Add `staleTime`, `refetchOnMount: false`, and optional manual refresh to the query hook. [tanstack](https://tanstack.com/query/v5/docs/framework/react/guides/query-options)
- Sync only a trimmed route snapshot into store, not the full payload. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf)

## One file I still need

To give you the exact refactor with minimal breakage, I need `MapScreen.tsx` next, because that is the best place to centralize route sync and geofence startup in your current flow. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_df11ee1d-7d0c-402b-891c-761159b382b5/d3519700-5b72-4bc0-ad0a-3120e4369f8e/Smart_Dairy_ERP_PenchFoods_Proposal.docx.pdf)