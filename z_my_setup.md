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