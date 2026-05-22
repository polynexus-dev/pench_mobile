// import React, {
//   forwardRef,
//   useEffect,
//   useImperativeHandle,
//   useRef,
//   useState,
// } from "react";
// import { StatusBar, View, Text } from "react-native";
// import { WebView } from "react-native-webview";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useAuthStore } from "@store/authStore";
// import { useTrackingStore } from "@store/trackingStore";
// import { useFetchMyRoute } from "../hooks/useFetchMyRoute";


// export type OSMMapHandle = {
//   centerOnUser: () => void;
// };

// const OSMMap = forwardRef<OSMMapHandle>(function OSMMap(_, ref) {

//   const { data: routeData, isLoading, error: routeError } = useFetchMyRoute();
//   if (__DEV__) console.log("OSMMap.tsx", routeData);


//   const webRef = useRef<WebView>(null);
//   const [webViewReady, setWebViewReady] = useState(false);
//   // const [routeData, setRouteData] = useState<RouteResponse | null>(null);

//   const token = useAuthStore((s) => s.accessToken);
//   const domain_name = useAuthStore((s) => s.domain_name);

//   const location = useTrackingStore((s) => s.location);
//   const error = useTrackingStore((s) => s.error);

//   useImperativeHandle(ref, () => ({
//     centerOnUser: () => {
//       if (!webViewReady || !webRef.current || !location) return;
//       webRef.current.injectJavaScript(`
//         (function() {
//           if (window.centerOnUser) {
//             window.centerOnUser(${location.lat}, ${location.lng});
//           }
//         })();
//         true;
//       `);
//     },
//   }));

//   useEffect(() => {
//     if (!routeData || !webViewReady || !webRef.current) return;

//     const stops = routeData.stops || [];
//     webRef.current.injectJavaScript(`
//       (function() {
//         if (window.loadStops) {
//           window.loadStops(${JSON.stringify(stops)});
//         }
//       })();
//       true;
//     `);
//   }, [routeData, webViewReady]);

//   useEffect(() => {
//     if (!location || !webViewReady || !webRef.current) return;

//     webRef.current.injectJavaScript(`
//       (function() {
//         if (window.updateUserLocation) {
//           window.updateUserLocation({
//             lat: ${location.lat},
//             lng: ${location.lng}
//           });
//         }
//       })();
//       true;
//     `);
//   }, [location, webViewReady]);

//   const html = `
// <!DOCTYPE html>
// <html>
// <head>
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
//   <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
//   <style>
//     html, body, #map { height: 100%; margin: 0; padding: 0; }
//   </style>
// </head>
// <body>
//   <div id="map"></div>
//   <script>
//     var map = L.map('map', {zoomControl: false}).setView([20.5937, 78.9629], 13);

//     L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       maxZoom: 19
//     }).addTo(map);

//     var userMarker = null;
//     var customerMarkers = [];
//     var routePolyline = null;
//     var autoCenter = true;

//     window.centerOnUser = function(lat, lng) {
//       autoCenter = true;
//       if (!userMarker) {
//         userMarker = L.marker([lat, lng]).addTo(map).bindPopup("📍 You");
//       } else {
//         userMarker.setLatLng([lat, lng]);
//       }
//       map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
//     };

//     map.on('dragstart', function() {
//       autoCenter = false;
//     });

//     window.updateUserLocation = function(latlng) {
//       if (!userMarker) {
//         userMarker = L.marker([latlng.lat, latlng.lng])
//           .addTo(map)
//           .bindPopup("📍 You");
//         map.setView([latlng.lat, latlng.lng], 15);
//       } else {
//         userMarker.setLatLng([latlng.lat, latlng.lng]);
//         if (autoCenter) {
//           map.panTo([latlng.lat, latlng.lng], { animate: true, duration: 1 });
//         }
//       }

//       if (customerMarkers.length) drawRouteToCustomers(latlng);
//     };

//     window.loadStops = function(stops) {
//       customerMarkers.forEach(m => map.removeLayer(m));
//       customerMarkers = [];

//       stops.forEach(stop => {
//         const marker = L.marker([stop.latitude, stop.longitude])
//           .addTo(map)
//           .bindPopup("<b>" + stop.customer_name + "</b><br/>" + stop.address);
//         customerMarkers.push(marker);
//       });

//       if (userMarker && customerMarkers.length) {
//         const allPoints = customerMarkers.map(m => m.getLatLng());
//         allPoints.push(userMarker.getLatLng());
//         map.fitBounds(allPoints, { padding: [50, 50] });
//       }
//     };

//     async function drawRouteToCustomers(user) {
//       if (!customerMarkers.length) return;

//       const coords = [[user.lng, user.lat]];
//       customerMarkers.forEach(m => {
//         coords.push([m.getLatLng().lng, m.getLatLng().lat]);
//       });

//       const coordString = coords.map(c => c.join(',')).join(';');
//       const url = \`https://router.project-osrm.org/route/v1/driving/\${coordString}?overview=full&geometries=geojson\`;

//       try {
//         const res = await fetch(url);
//         const json = await res.json();
//         if (json.code === "Ok") {
//           const route = json.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
//           if (routePolyline) map.removeLayer(routePolyline);
//           routePolyline = L.polyline(route, {
//             color: '#2563eb',
//             weight: 5,
//             opacity: 0.9,
//             dashArray: '8, 10'
//           }).addTo(map);
//         }
//       } catch (err) {
//         console.error("OSRM routing failed:", err);
//       }
//     }
//   </script>
// </body>
// </html>`;

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
//       <StatusBar barStyle="light-content" />
//       <View style={{ flex: 1 }}>
//         <WebView
//           ref={webRef}
//           originWhitelist={["*"]}
//           source={{ html }}
//           javaScriptEnabled
//           domStorageEnabled
//           onLoad={() => {
//             if (__DEV__) console.log("🗺️ WebView ready");
//             setWebViewReady(true);
//           }}
//         />

//         {error ? (
//           <Text style={{ color: "#fca5a5", position: "absolute", bottom: 140, alignSelf: "center" }}>
//             {error}
//           </Text>
//         ) : null}
//       </View>
//     </SafeAreaView>
//   );
// });

// export default OSMMap;


import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StatusBar, View, Text } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@store/authStore";
import { useTrackingStore } from "@store/trackingStore";
import { useFetchMyRoute } from "../hooks/useFetchMyRoute";

export type OSMMapHandle = {
  centerOnUser: () => void;
};

const OSMMap = forwardRef<OSMMapHandle>(function OSMMap(_, ref) {
  const { data: routeData } = useFetchMyRoute();
  const webRef = useRef<WebView>(null);
  const [webViewReady, setWebViewReady] = useState(false);

  // const token = useAuthStore((s) => s.accessToken);
  // const domain_name = useAuthStore((s) => s.domain_name);

  const location = useTrackingStore((s) => s.location);
  const error = useTrackingStore((s) => s.error);
  const activeStopId = useTrackingStore((s) => s.activeStopId as any);
  const selectedStopId = useTrackingStore((s) => s.selectedStopId as any);
  // const activeStopId = useTrackingStore((s) => s.activeStopId);
  // const selectedStopId = useTrackingStore((s) => s.selectedStopId);

  useImperativeHandle(ref, () => ({
    centerOnUser: () => {
      if (!webViewReady || !webRef.current || !location) return;
      webRef.current.injectJavaScript(`
        (function() {
          if (window.centerOnUser) {
            window.centerOnUser(${location.lat}, ${location.lng});
          }
        })();
        true;
      `);
    },
  }));

  useEffect(() => {
    if (!routeData || !webViewReady || !webRef.current) return;

    const stops = routeData.stops || [];
    webRef.current.injectJavaScript(`
    (function() {
      if (window.loadStops) {
        window.loadStops(${JSON.stringify(stops)}, "${activeStopId ?? ""}", "${selectedStopId ?? ""}");
      }
    })();
    true;
  `);
  }, [routeData, webViewReady, activeStopId, selectedStopId]);

  ///new 
  useEffect(() => {
    if (!webViewReady || !webRef.current) return;
    if (!selectedStopId && !activeStopId) return;

    webRef.current.injectJavaScript(`
    (function() {
      if (window.updateSelectedStop) {
        window.updateSelectedStop("${selectedStopId ?? ""}", "${activeStopId ?? ""}");
      }
    })();
    true;
  `);
  }, [selectedStopId, activeStopId, webViewReady]);

  useEffect(() => {
    if (!location || !webViewReady || !webRef.current) return;

    webRef.current.injectJavaScript(`
      (function() {
        if (window.updateUserLocation) {
          window.updateUserLocation({
            lat: ${location.lat},
            lng: ${location.lng}
          });
        }
      })();
      true;
    `);
  }, [location, webViewReady]);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([20.5937, 78.9629], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var userMarker = null;
    var customerMarkers = [];
    var routePolyline = null;
    var autoCenter = true;

    function makeIcon(color) {
      return L.divIcon({
        className: '',
        html: '<div style="width:24px;height:24px;border-radius:999px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);background:' + color + ';"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
    }

    var driverIcon = makeIcon('#ef4444');
    var selectedIcon = makeIcon('#22c55e');
    var normalIcon = makeIcon('#3b82f6');

    function clearCustomerMarkers() {
      customerMarkers.forEach(function(m) {
        map.removeLayer(m);
      });
      customerMarkers = [];
    }

    window.centerOnUser = function(lat, lng) {
      autoCenter = true;

      if (!userMarker) {
        userMarker = L.marker([lat, lng], { icon: driverIcon })
          .addTo(map)
          .bindPopup("📍 Driver");
      } else {
        userMarker.setLatLng([lat, lng]);
      }

      map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
    };

    map.on('dragstart', function() {
      autoCenter = false;
    });

    window.updateUserLocation = function(latlng) {
      if (!userMarker) {
        userMarker = L.marker([latlng.lat, latlng.lng], { icon: driverIcon })
          .addTo(map)
          .bindPopup("📍 Driver");
        map.setView([latlng.lat, latlng.lng], 15);
      } else {
        userMarker.setLatLng([latlng.lat, latlng.lng]);
        if (autoCenter) {
          map.panTo([latlng.lat, latlng.lng], { animate: true, duration: 1 });
        }
      }

      if (customerMarkers.length) {
        drawRouteToCustomers(latlng);
      }
    };

    window.loadStops = function(stops, activeStopId, selectedStopId) {
      clearCustomerMarkers();

      stops.forEach(function(stop) {
        var isSelected = String(stop.id) === String(selectedStopId);
        var isActive = String(stop.id) === String(activeStopId);

        var marker = L.marker([stop.latitude, stop.longitude], {
          icon: (isSelected || isActive) ? selectedIcon : normalIcon
        })
          .addTo(map)
          .bindPopup("<b>" + stop.customer_name + "</b><br/>" + stop.address);

        marker._stopId = String(stop.id);
        customerMarkers.push(marker);
      });

      if (userMarker && customerMarkers.length) {
        var allPoints = customerMarkers.map(function(m) { return m.getLatLng(); });
        allPoints.push(userMarker.getLatLng());
        map.fitBounds(allPoints, { padding: [50, 50] });
      }
    };

    window.updateSelectedStop = function(selectedStopId, activeStopId) {
      customerMarkers.forEach(function(m) {
        var id = String(m._stopId);
        var isSelected = id === String(selectedStopId);
        var isActive = id === String(activeStopId);
        m.setIcon((isSelected || isActive) ? selectedIcon : normalIcon);
      });
    };

    async function drawRouteToCustomers(user) {
      if (!customerMarkers.length) return;

      var coords = [[user.lng, user.lat]];
      customerMarkers.forEach(function(m) {
        coords.push([m.getLatLng().lng, m.getLatLng().lat]);
      });

      var coordString = coords.map(function(c) {
        return c.join(',');
      }).join(';');

      var url = 'https://router.project-osrm.org/route/v1/driving/' + coordString + '?overview=full&geometries=geojson';

      try {
        var res = await fetch(url);
        var json = await res.json();

        if (json.code === "Ok") {
          var route = json.routes[0].geometry.coordinates.map(function(c) {
            return [c[1], c[0]];
          });

          if (routePolyline) {
            map.removeLayer(routePolyline);
          }

          routePolyline = L.polyline(route, {
            color: '#2563eb',
            weight: 5,
            opacity: 0.9,
            dashArray: '8, 10'
          }).addTo(map);
        }
      } catch (err) {
        console.error("OSRM routing failed:", err);
      }
    }
  </script>
</body>
</html>`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1 }}>
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html }}
          javaScriptEnabled
          domStorageEnabled
          onLoad={() => {
            if (__DEV__) console.log("🗺️ WebView ready");
            setWebViewReady(true);
          }}
        />

        {error ? (
          <Text style={{ color: "#fca5a5", position: "absolute", bottom: 140, alignSelf: "center" }}>
            {error}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
});

export default OSMMap;