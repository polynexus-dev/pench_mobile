## Add the Route response tyes because it's untyped now (16/05/2026)
*****
## If location permission denied -> handle it properly instead of error 
Important issue in your code
Your alert button says Open Settings, but it calls Location.enableNetworkProviderAsync() . That is not the same as opening device settings; it enables high-accuracy location services, so the label is misleading .

Better placement => better flow for customer 
For a cleaner design, permission should ideally be requested in a dedicated tracking hook or at the top of the driver dashboard flow, not inside a map component . That way, OSMMap stays focused on rendering the map, and tracking logic stays in one place .

Minimal fix
If you want to keep the current structure, your component is already fine; the permission prompt will appear through startTracking() automatically . The main improvement is to rename the alert action or open app settings properly i nstead of calling enableNetworkProviderAsync() .

Would you like me to rewrite startTracking() so it correctly opens app settings on Android and iOS?
*****