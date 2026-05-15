# Smart Dairy ERP — Codebase Review
> Project: **Pench Foods — Multi-City Milk Distribution Platform**
> Stack: React Native + Expo Router v3 + NativeWind v4 + Zustand + TanStack Query
> Last reviewed: May 14, 2026

---

## Architecture Rule
| Folder | Purpose |
|---|---|
| `./app/` | Routing **only** — thin exports to `src/features/` |
| `./src/` | All business logic, components, stores, services |

---

## src/constants/

| File | Purpose |
|---|---|
| `routes.ts` | Type-safe `ROUTES` constants for all `router.push()` calls — Auth, Driver, Customer. Static routes are plain strings, dynamic routes are functions `(id) => string` |

---

## src/errors/

| File | Purpose |
|---|---|
| `AppError.ts` | Base custom error class — adds `code` (string) + `statusCode` (number) on top of native `Error` |
| `ApiError.ts` | Extends `AppError` — adds `endpoint?`, auto-generates `code` as `API_{status}`, `fromResponse()` static factory |
| `errorMessages.ts` | All user-facing error strings as `as const` — HTTP, Auth, Attendance categories |
| `errorHandler.ts` | `getErrorMessage(err)` normalizes any thrown value → clean string. `logError(err, context)` logs in `__DEV__` only |

---

## src/utils/

| File | Purpose |
|---|---|
| `cn.ts` | `clsx` + `twMerge` className utility — merges classes, resolves Tailwind conflicts |
| `validators.ts` | 6 pure boolean validators: `isValidEmail`, `isValidPhone` (Indian), `isValidOTP`, `isNonEmpty`, `isValidPassword`, `isValidSessionCode` |
| `dateFormatter.ts` | `formatDate`, `formatTime`, `formatDateTime`, `isToday`, `getRelativeLabel` — all `en-IN` locale |

---

## src/hooks/

| File | Purpose |
|---|---|
| `useAuthInit.ts` | Bootstrap hook — reads tokens from SecureStore → validates via `/api/accounts/me/` → populates Zustand. Always sets `isReady = true` in `finally` |
| `useAppState.ts` | Fires callback on app foreground/background state change via `AppState.addEventListener` |
| `useNetworkStatus.ts` | Live connectivity via `NetInfo` → syncs `isConnected` to local state + `appStore` |
| `useDebounce.ts` | Generic `useDebounce<T>(value, delay = 300)` — delays value update until input stops changing |
| `useToast.ts` | Handler-registration toast system — register once in `_layout.tsx`, call `show()` from anywhere |

---

## src/store/

| File | Purpose |
|---|---|
| `devtools.ts` | `createStore` factory — wraps every store with Immer (direct mutation) + Redux DevTools (DEV only) |
| `authStore.ts` | `user`, `accessToken`, `refreshToken`, `domain_name`, `route_id` — actions: `setUser`, `setTokens`, `clearAuth`, `setDomainAndRoute` |
| `appStore.ts` | `colorScheme`, `isNetworkConnected`, `isAppLoading` — fed by `useNetworkStatus` |
| `trackingStore.ts` | Driver GPS tracking: `startTrip/stopTrip`, `connectSocket/disconnectSocket`, `startTracking/stopTracking`. WebSocket auto-reconnects every 3s |
| `index.ts` | Barrel: `useAuthStore`, `useAppStore`, `useTrackingStore`, `createStore` |

---

## src/services/storage/

| File | Purpose |
|---|---|
| `secureStorage.ts` | `expo-secure-store` wrapper — for sensitive data (tokens, domain_name). Encrypted keychain storage |
| `asyncStorage.ts` | `AsyncStorage` wrapper — for non-sensitive data (onboarding flag, preferences). Unencrypted, persists across restarts |

> **Rule:** Tokens → `secureStorage`. Everything else → `asyncStorage`.

---

## src/services/api/

| File | Purpose |
|---|---|
| `httpClient.ts` | Axios instance — auto-attaches Bearer token via request interceptor, unwraps `.data` globally, rejects with typed `ApiError` on failure |
| `requestHandler.ts` | Generic `handle<T>(promise)` wrapper — converts raw errors to `ApiError` for non-httpClient calls (e.g. `fetch()` in trackingStore) |
| `queryClient.ts` | TanStack Query config — `retry: 1` for queries, `retry: 0` for mutations, `staleTime: 5min`, `refetchOnWindowFocus: false` |
| `index.ts` | Barrel: `httpClient`, `requestHandler`, `queryClient` |

---

## src/shared/theme/

| File | Purpose |
|---|---|
| `tokens.js` | **Single source of truth** — plain CJS file consumed by both `tailwind.config.js` (Node) and TypeScript theme files |
| `colors.ts` | `Colors` object typed from `tokens.js` — brand, bg, text, border, success, warning, error |
| `typography.ts` | `typography` typed from `tokens.js` — Inter font families, font size scale (xs→3xl), line heights |
| `spacing.ts` | `spacing` scale typed from `tokens.js` — Tailwind-style numeric keys mapping to 4px increments |
| `index.ts` | Barrel: `Colors`, `typography`, `spacing` |

> **Token flow:** `tokens.js` → `tailwind.config.js` (NativeWind classnames) + `colors/typography/spacing.ts` (StyleSheet imports)

---

## Root Config Files

| File | Purpose |
|---|---|
| `tailwind.config.js` | NativeWind v4 — imports tokens from `tokens.js`, defines colors, fonts, spacing, borderRadius, shadows |
| `babel.config.js` | Expo + NativeWind presets + `babel-plugin-module-resolver` with 13 path aliases |
| `tsconfig.json` | Strict mode, `baseUrl: "."`, all 13 path aliases matching `babel.config.js` |
| `nativewind.d.ts` | `/// <reference types="nativewind/types" />` — enables NativeWind className type safety |

---

## Path Aliases

| Alias | Path |
|---|---|
| `@/*` | `src/*` |
| `@features/*` | `src/features/*` |
| `@shared/*` | `src/shared/*` |
| `@store/*` | `src/store/*` |
| `@services/*` | `src/services/*` |
| `@roles/*` | `src/roles/*` |
| `@config/*` | `src/config/*` |
| `@constants/*` | `src/constants/*` |
| `@utils/*` | `src/utils/*` |
| `@hooks/*` | `src/hooks/*` |
| `@types/*` | `src/types/*` |
| `@assets/*` | `src/assets/*` |
| `@errors/*` | `src/errors/*` |

---

## Key Rules & Gotchas

| Rule | Detail |
|---|---|
| `app/` is routing only | All logic lives in `src/features/` |
| `__DEV__` is automatic | Injected by React Native — `true` in debug, `false` in release |
| `httpClient` returns `T` not `AxiosResponse<T>` | Use `as unknown as T` cast — interceptor unwraps `.data` |
| `createStore` for all Zustand stores | Gives Immer + DevTools automatically |
| `secureStorage` for tokens | `asyncStorage` for everything else |
| `tokens.js` is plain CJS | Required because `tailwind.config.js` runs in Node, bypasses Babel |
| `mutate` is not async | Use `mutateAsync` if you need `await` in React Query mutations |
| `injectJavaScript` must end with `true;` | Silent failure in WebView otherwise |
