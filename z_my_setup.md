## Check for existing route to get the stauts of trip [copmleted, ongoing, notstarted]
## Disable Trip unless all delivery completes



---
## trackingStore.ts
Trip start/stop.
WebSocket connection.
Live location stream.
Background tracking

## geoFenceStore.ts
Route fetch from my-route.
Active stop selection.
Nearest stop detection.
canMarkActiveStopDelivered() logic.


## Next Steps
Finalize on DeliveryPage
On the delivery page, collect the remaining details before final submission, such as delivered quantity, empty bottles, broken bottles, payment mode, notes, and proof. This page should only be used after geofence approval, so it acts as the final confirmation step



********************************************
Here is the complete end-to-end flow from trip start to delivery finalization, with every variable and function involved. [perplexity](https://www.perplexity.ai/search/96843f00-170a-41e2-ae1b-8abe49765b40)

***

## 1. Trip Start

**Screen:** `DriverDashboardScreen` or `MapScreen`

**User action:** Driver taps **Start Trip** button on `TripStatusBanner`.

**Function called:**
```
handleTripToggle()
```

**Inside `trackingStore`:**
```
startTrip(accessToken)
  → POST /api/erp/orders/driver/start-trip/
  → sets isTripStarted = true
  → saves route_id in authStore

connectSocket(domain_name, accessToken)
  → opens WebSocket for live GPS

startTracking()
  → starts Location.watchPositionAsync
  → broadcasts position to socket
  → updates trackingStore.location
```

**Key variables set:**
```
trackingStore.isTripStarted       → true
trackingStore.loading             → false after start
authStore.route_id                → from API response
```

***

## 2. Route Load

**Screen:** `MapScreen` on mount

**Function called:**
```
fetchMyRoute()   ← from geofenceStore
```

**API:**
```
GET https://{domain_name}/api/erp/orders/driver/my-route
```

**Store updates:**
```
geofenceStore.route               → full RouteResponse { id, name, stops[] }
geofenceStore.routeLoading        → true → false
geofenceStore.activeStopId        → first stop with order_status === "in_transit"
geofenceStore.routeError          → null on success
```

**Key variables used:**
```
accessToken                       ← from authStore
domain_name                       ← from authStore
```

***

## 3. Geofence Tracking Start

**Screen:** `MapScreen` on mount (runs after `fetchMyRoute`)

**Function called:**
```
startGeofenceTracking()   ← from geofenceStore
```

**Internally:**
```
Location.requestForegroundPermissionsAsync()
Location.watchPositionAsync(
  { accuracy: High, timeInterval: 1000, distanceInterval: 3 },
  callback
)
```

**On each GPS update (callback loop):**
```
location = { lat, lng }           ← current driver coords
getDistanceMeters(lat, lng, stop.latitude, stop.longitude)
  → Haversine formula
  → loops over all stops with order_status === "in_transit"
  → finds closest stop within geofenceMeters (50m)

Sets:
geofenceStore.location            → { lat, lng }
geofenceStore.nearStopId          → stop.id if within 50m, else null
```

***

## 4. Bottom Sheet List Renders

**Screen:** `MapScreen` bottom sheet

**Derived state in MapScreen:**

```
routeStops = useMemo
  ← route?.stops filtered by order_status === "in_transit"

groupedStops = useMemo
  ← routeStops grouped by getLocationKey(lat, lng)
  ← getLocationKey = `${lat.toFixed(5)}_${lng.toFixed(5)}`
  ← each group: { groupKey, address, stops[] }

exactGroupedKeys = Set
  ← groupedStops where stops.length > 1
```

**Rendered:**
- `shouldGroup = group.stops.length > 1` → `GroupedStopCard`
- `shouldGroup = false` → `StopListItem`

***

## 5. Driver Approaches Customer

**Trigger:** `watchPositionAsync` callback fires

**State updates:**
```
geofenceStore.nearStopId          → matched stop.id
```

**`useEffect` in `MapScreen` watches `nearStopId`:**
```
setActiveStopId(nearStopId)       → geofenceStore
setSelectedStopId(nearStopId)     → local useState
setSelectedGroupKey(key)          → local useState
setExpandedGroupKey(key)          → local useState (auto-expands group)
bottomSheetRef.current?.snapToIndex(1)
scrollViewRef.current?.scrollTo({ y: cardYPositions[nearStopId] })
```

**`StopListItem` highlights:**
```
isNear  = stop.id === nearStopId
isActive = stop.id === activeStopId
```

***

## 6. Stop Selection (Driver taps a customer)

**Single stop tapped:**
```
onPress → setSelectedStopId(stop.id)
        → setSelectedGroupKey(null)
        → setActiveStopId(stop.id)
```

**Grouped stop customer tapped:**
```
onSelectStop(stopId, groupKey)
  → setSelectedStopId(stopId)
  → setSelectedGroupKey(groupKey)
  → setActiveStopId(stopId)
```

***

## 7. NextStopCard Derives Active Stop

**Derived in `MapScreen` component body:**

```
selectedGroup = groupedStops.find(g => g.groupKey === selectedGroupKey)

selectedGroupStops = selectedGroup?.stops
  .filter(s => s.order_status === "in_transit") ?? []

selectedStop =
  selectedGroupStops.find(s => s.id === selectedStopId)
  ?? selectedGroupStops[0]
  ?? route?.stops?.find(s => s.order_status === "in_transit")
  ?? null

activeStopIsDeliverable = selectedStop?.order_status === "in_transit"

canMark = selectedGroup
  ? selectedGroup.stops.some(s => s.order_status === "in_transit")
  : canMarkActiveStopDelivered()
```

**`canMarkActiveStopDelivered()` in geofenceStore:**
```
activeStopId === nearStopId
&& active?.order_status === "in_transit"
```

**`NextStopCard` renders when:**
```
selectedStop !== null && activeStopIsDeliverable
disabled = !canMark
```

***

## 8. Mark Delivered Button Pressed

**Function:**
```
handleMarkDelivered()
```

**Actions:**
```
bottomSheetRef.current?.dismiss()

router.push({
  pathname: ROUTES.DRIVER.FINALIZE_DELIVERY,
  params: {
    routeId: route.id,
    stopId: selectedStop.id,
    orderId: selectedStop.order,
  }
})
```

***

## 9. FinalizeDeliveryScreen

**Params read:**
```
useLocalSearchParams → { routeId, stopId, orderId }
```

**User fills:**
```
bottlesIssued  (string → Number())
bottlesReturned (string → Number())
```

**On submit — `handleSubmit()`:**

```
submitDelivery({
  domainName: domain_name,
  orderId,
  payload: { bottles_issued, bottles_returned }
})
  → POST https://{domain_name}/api/erp/orders/driver/submit-delivery/
```

**After success:**
```
useGeofenceStore.getState().markStopDelivered(orderId)
useGeofenceStore.getState().setActiveStopId(null)
router.back()
```

***

## 10. `markStopDelivered(orderId)` in geofenceStore

```
route.stops = stops.map(stop =>
  stop.order === orderId
    ? { ...stop, order_status: "delivered" }
    : stop
)

if (activeStopId === deliveredStop.id) {
  activeStopId = null
  nearStopId = null
}
```

This triggers a Zustand re-render that: [perplexity](https://www.perplexity.ai/search/8082a56b-91e0-4a55-9607-95a283e1e999)
- removes the customer from `routeStops` (filtered by `in_transit`)
- removes the customer from `groupedStops`
- removes the customer from `GroupedStopCard`
- recalculates `selectedStop` to the next `in_transit` customer
- updates `NextStopCard` to the next pending stop

***

## 11. Customer Not Home (alternate path)

**From `FinalizeDeliveryScreen`:**
```
customerNotHome()
  → router.push ROUTES.DRIVER.CAPTURE_POD
  → params: { orderId, routeId, stopId }
```

**In `CapturePodScreen`:**
```
submitUndelivered({
  domainName,
  orderId,
  payload: { photo_url, notes }
})
  → POST /api/erp/orders/driver/submit-undelivered/

useGeofenceStore.getState().markStopUndelivered(orderId)
  → order_status = "undelivered"
  → activeStopId = null
  → nearStopId = null
router.back()
```

***

## Full Variable Reference

| Variable | Type | Owner | Purpose |
|---|---|---|---|
| `isTripStarted` | `boolean` | `trackingStore` | Trip active flag |
| `route` | `RouteResponse` | `geofenceStore` | Full route with stops |
| `nearStopId` | `string\|null` | `geofenceStore` | Closest stop within 50m |
| `activeStopId` | `string\|null` | `geofenceStore` | Currently selected stop |
| `selectedStopId` | `string\|null` | `MapScreen` local | Exact customer tapped |
| `selectedGroupKey` | `string\|null` | `MapScreen` local | Group the selection belongs to |
| `expandedGroupKey` | `string\|null` | `MapScreen` local | Which group accordion is open |
| `groupedStops` | `GroupedStop[]` | `MapScreen` memo | Grouped by exact coordinate |
| `selectedGroup` | `GroupedStop\|null` | `MapScreen` memo | Active group object |
| `selectedGroupStops` | `RouteStop[]` | `MapScreen` derived | In-transit stops in active group |
| `selectedStop` | `RouteStop\|null` | `MapScreen` derived | Final stop for NextStopCard |
| `canMark` | `boolean` | `MapScreen` derived | Controls button enabled state |
| `bottlesIssued` | `string` | `FinalizeDeliveryScreen` | Driver input |
| `bottlesReturned` | `string` | `FinalizeDeliveryScreen` | Driver input |