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
// import { useTrackingStore } from "@store/trackingStore";

// export type OSMMapHandle = {
//   centerOnUser: () => void;
// };

// type RouteStop = {
//   id: string;
//   sequence_number: number;
//   order: string | null;
//   customer_name: string;
//   address: string;
//   latitude: number;
//   longitude: number;
//   order_status?: "in_transit" | "delivered" | "cancelled" | "undelivered" | string;
// };

// type OSMMapProps = {
//   stops?: RouteStop[];
//   activeStopId?: string | null;
//   selectedStopId?: string | null;
//   navigationStopId?: string | null;
//   navigationPolyline?: { lat: number; lng: number }[];
// };

// const OSMMap = forwardRef<OSMMapHandle, OSMMapProps>(function OSMMap(
//   { stops = [], activeStopId, selectedStopId },
//   ref
// ) {
//   const webRef = useRef<WebView>(null);
//   const [webViewReady, setWebViewReady] = useState(false);

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
//     if (!webViewReady || !webRef.current) return;

//     webRef.current.injectJavaScript(`
//     (function() {
//       if (window.loadStops) {
//         window.loadStops(${JSON.stringify(stops)}, "${activeStopId ?? ""}", "${selectedStopId ?? ""}");
//       }
//     })();
//     true;
//   `);
//   }, [stops, webViewReady, activeStopId, selectedStopId]);

//   useEffect(() => {
//     if (!webViewReady || !webRef.current) return;
//     if (!selectedStopId && !activeStopId) return;

//     webRef.current.injectJavaScript(`
//     (function() {
//       if (window.updateSelectedStop) {
//         window.updateSelectedStop("${selectedStopId ?? ""}", "${activeStopId ?? ""}");
//       }
//     })();
//     true;
//   `);
//   }, [selectedStopId, activeStopId, webViewReady]);

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
//     html, body, #map {
//       height: 100%;
//       margin: 0;
//       padding: 0;
//     }
//   </style>
// </head>
// <body>
//   <div id="map"></div>
//   <script>
//     var map = L.map('map', { zoomControl: false }).setView([20.5937, 78.9629], 13);

//     L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       maxZoom: 19
//     }).addTo(map);

//     var userMarker = null;
//     var customerMarkers = [];
//     var routePolyline = null;
//     var autoCenter = true;

//     function makeIcon(color) {
//       return L.divIcon({
//         className: '',
//         html: '<div style="width:24px;height:24px;border-radius:999px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);background:' + color + ';"></div>',
//         iconSize: [24, 24],
//         iconAnchor: [12, 12]
//       });
//     }

//     var driverIcon = makeIcon('#f97316');
//     var activeIcon = makeIcon('#3b82f6');
//     var selectedIcon = makeIcon('#f97316');
//     var inTransitIcon = makeIcon('#ffbf00');
//     var deliveredIcon = makeIcon('#22c55e');
//     var undeliveredIcon = makeIcon('#ef4444');

//     function getIcon(stopId, activeStopId, selectedStopId, orderStatus) {
//       var id = String(stopId);
//       if (id === String(activeStopId)) return activeIcon;
//       if (id === String(selectedStopId)) return selectedIcon;

//       var status = String(orderStatus || '').toLowerCase();
//       if (status === 'delivered') return deliveredIcon;
//       if (status === 'undelivered') return undeliveredIcon;
//       return inTransitIcon;
//     }

//     function clearCustomerMarkers() {
//       customerMarkers.forEach(function(m) {
//         map.removeLayer(m);
//       });
//       customerMarkers = [];
//     }

//     window.centerOnUser = function(lat, lng) {
//       autoCenter = true;

//       if (!userMarker) {
//         userMarker = L.marker([lat, lng], { icon: driverIcon })
//           .addTo(map)
//           .bindPopup("📍 Driver");
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
//         userMarker = L.marker([latlng.lat, latlng.lng], { icon: driverIcon })
//           .addTo(map)
//           .bindPopup("📍 Driver");
//         map.setView([latlng.lat, latlng.lng], 15);
//       } else {
//         userMarker.setLatLng([latlng.lat, latlng.lng]);
//         if (autoCenter) {
//           map.panTo([latlng.lat, latlng.lng], { animate: true, duration: 1 });
//         }
//       }

//       if (customerMarkers.length) {
//         drawRouteToCustomers(latlng);
//       }
//     };

//     window.loadStops = function(stops, activeStopId, selectedStopId) {
//       clearCustomerMarkers();

//       stops.forEach(function(stop) {
//         var marker = L.marker([stop.latitude, stop.longitude], {
//           icon: getIcon(stop.id, activeStopId, selectedStopId, stop.order_status)
//         })
//           .addTo(map)
//           .bindPopup("<b>" + stop.customer_name + "</b><br/>" + stop.address);

//         marker._stopId = String(stop.id);
//         marker._orderStatus = String(stop.order_status || '');
//         customerMarkers.push(marker);
//       });

//       if (userMarker && customerMarkers.length) {
//         var allPoints = customerMarkers.map(function(m) { return m.getLatLng(); });
//         allPoints.push(userMarker.getLatLng());
//         map.fitBounds(allPoints, { padding: [50, 50] });
//       }
//     };

//     window.updateSelectedStop = function(selectedStopId, activeStopId) {
//       customerMarkers.forEach(function(m) {
//         m.setIcon(getIcon(m._stopId, activeStopId, selectedStopId, m._orderStatus));
//       });
//     };

//     async function drawRouteToCustomers(user) {
//       if (!customerMarkers.length) return;

//       var coords = [[user.lng, user.lat]];
//       customerMarkers.forEach(function(m) {
//         coords.push([m.getLatLng().lng, m.getLatLng().lat]);
//       });

//       var coordString = coords.map(function(c) {
//         return c.join(',');
//       }).join(';');

//       var url = 'https://osrm.polynexus.in/route/v1/driving/' + coordString + '?overview=full&geometries=geojson';

//       try {
//         var res = await fetch(url);
//         var json = await res.json();

//         if (json.code === "Ok") {
//           var route = json.routes[0].geometry.coordinates.map(function(c) {
//             return [c[1], c[0]];
//           });

//           if (routePolyline) {
//             map.removeLayer(routePolyline);
//           }

//           routePolyline = L.polyline(route, {
//             color: '#2563eb',
//             weight: 6,
//             opacity: 0.9,
//             lineCap: 'round',
//             lineJoin: 'round'
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


// June 1
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
import { useTrackingStore } from "@store/trackingStore";

export type OSMMapHandle = {
  centerOnUser: () => void;
  updateDriverHeading: (heading: number) => void;
};

type RouteStop = {
  id: string;
  sequence_number: number;
  order: string | null;
  customer_name: string;
  address: string;
  latitude: number;
  longitude: number;
  order_status?: "in_transit" | "delivered" | "cancelled" | "undelivered" | string;
};

type OSMMapProps = {
  stops?: RouteStop[];
  activeStopId?: string | null;
  selectedStopId?: string | null;
  navigationStopId?: string | null;                        // ← was ignored before
  navigationPolyline?: { lat: number; lng: number }[];     // ← was ignored before
};

const OSMMap = forwardRef<OSMMapHandle, OSMMapProps>(function OSMMap(
  {
    stops = [],
    activeStopId,
    selectedStopId,
    navigationStopId,         // ← ADD to destructure
    navigationPolyline,       // ← ADD to destructure
  },
  ref
) {
  const webRef = useRef<WebView>(null);
  const [webViewReady, setWebViewReady] = useState(false);

  const location = useTrackingStore((s) => s.location);
  const error = useTrackingStore((s) => s.error);

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

    updateDriverHeading: (heading: number) => {
      if (!webViewReady || !webRef.current) return;
      webRef.current.injectJavaScript(`
      (function() {
        if (window.updateDriverHeading) {
          window.updateDriverHeading(${heading});
        }
      })();
      true;
    `);
    },

  }));

  // ─── Existing: load all stop markers ─────────────────────────────────────
  useEffect(() => {
    if (!webViewReady || !webRef.current) return;
    webRef.current.injectJavaScript(`
      (function() {
        if (window.loadStops) {
          window.loadStops(${JSON.stringify(stops)}, "${activeStopId ?? ""}", "${selectedStopId ?? ""}");
        }
      })();
      true;
    `);
  }, [stops, webViewReady, activeStopId, selectedStopId]);

  // ─── Existing: update marker icons when selection changes ────────────────
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

  // ─── Existing: update driver location dot ────────────────────────────────
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

  // ─── NEW: Draw navigation polyline when it changes ───────────────────────
  useEffect(() => {
    if (!webViewReady || !webRef.current) return;
    if (!navigationPolyline?.length) return;

    const coords = navigationPolyline
      .map((c) => `[${c.lat},${c.lng}]`)
      .join(",");

    webRef.current.injectJavaScript(`
      (function() {
        if (window.drawNavPolyline) {
          window.drawNavPolyline([${coords}]);
        }
      })();
      true;
    `);
  }, [navigationPolyline, webViewReady]);

  // ─── NEW: Clear navigation polyline when nav is complete / cancelled ─────
  useEffect(() => {
    if (!webViewReady || !webRef.current) return;
    if (navigationStopId) return; // only clear when it becomes null

    webRef.current.injectJavaScript(`
      (function() {
        if (window.clearNavPolyline) {
          window.clearNavPolyline();
        }
      })();
      true;
    `);
  }, [navigationStopId, webViewReady]);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"><\/script>
<style>
  html, body, #map {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    background: #f3f4f6;
  }

  #map {
    position: absolute;
    inset: 0;
  }

  .leaflet-container {
    background: #e5e7eb;
    font-family: sans-serif;
  }

  .leaflet-tile {
    image-rendering: auto;
    outline: 1px solid transparent;
  }

  .leaflet-pane,
  .leaflet-tile,
  .leaflet-marker-icon,
  .leaflet-marker-shadow {
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }

  .driver-arrow-wrap {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .driver-arrow-border {
    position: relative;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 6px 14px rgba(0,0,0,0.22));
  }

  .driver-arrow-border::before {
    content: '';
    position: absolute;
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: rgba(255,255,255,0.96);
    box-shadow:
      0 0 0 2px rgba(15, 23, 42, 0.14),
      0 2px 6px rgba(0,0,0,0.10);
  }

  .driver-arrow-core {
    position: relative;
    z-index: 1;
    width: 0;
    height: 0;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-bottom: 22px solid #1a73e8;
    transform-origin: 50% 72%;
  }

  .driver-arrow-core::before {
    content: '';
    position: absolute;
    left: -6px;
    top: 4px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 12px solid #8ab4f8;
    opacity: 0.95;
  }

  .driver-arrow-core::after {
    content: '';
    position: absolute;
    left: -2px;
    top: 15px;
    width: 4px;
    height: 8px;
    background: #1a73e8;
    border-radius: 0 0 3px 3px;
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
    var navPolyline = null;
    var autoCenter = true;
    var currentHeading = 0;

    function makeIcon(color) {
      return L.divIcon({
        className: '',
        html: '<div style="width:24px;height:24px;border-radius:999px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);background:' + color + ';"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
    }

    function makeDriverArrowIcon(heading) {
      return L.divIcon({
        className: '',
        html:
          '<div class="driver-arrow-wrap">' +
            '<div class="driver-arrow-border" style="transform: rotate(' + Number(heading || 0) + 'deg);">' +
              '<div class="driver-arrow-core"><\/div>' +
            '<\/div>' +
          '<\/div>',
        iconSize: [52, 52],
        iconAnchor: [26, 26]
      });
    }

    var activeIcon      = makeIcon('#3b82f6');
    var selectedIcon    = makeIcon('#f97316');
    var inTransitIcon   = makeIcon('#ffbf00');
    var deliveredIcon   = makeIcon('#22c55e');
    var undeliveredIcon = makeIcon('#ef4444');

    function getIcon(stopId, activeStopId, selectedStopId, orderStatus) {
      var id = String(stopId);
      if (id === String(activeStopId)) return activeIcon;
      if (id === String(selectedStopId)) return selectedIcon;

      var status = String(orderStatus || '').toLowerCase();
      if (status === 'delivered') return deliveredIcon;
      if (status === 'undelivered') return undeliveredIcon;
      return inTransitIcon;
    }

    function clearCustomerMarkers() {
      customerMarkers.forEach(function(m) { map.removeLayer(m); });
      customerMarkers = [];
    }

    window.centerOnUser = function(lat, lng) {
      autoCenter = true;

      if (!userMarker) {
        userMarker = L.marker([lat, lng], { icon: makeDriverArrowIcon(currentHeading) })
          .addTo(map)
          .bindPopup("Driver");
      } else {
        userMarker.setLatLng([lat, lng]);
        userMarker.setIcon(makeDriverArrowIcon(currentHeading));
      }

      map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
    };

    window.updateDriverHeading = function(heading) {
      currentHeading = Number(heading || 0);
      if (userMarker) {
        userMarker.setIcon(makeDriverArrowIcon(currentHeading));
      }
    };

    map.on('dragstart', function() {
      autoCenter = false;
    });

    window.updateUserLocation = function(latlng) {
      if (!userMarker) {
        userMarker = L.marker([latlng.lat, latlng.lng], {
          icon: makeDriverArrowIcon(currentHeading)
        })
          .addTo(map)
          .bindPopup("Driver");
        map.setView([latlng.lat, latlng.lng], 15);
      } else {
        userMarker.setLatLng([latlng.lat, latlng.lng]);
        userMarker.setIcon(makeDriverArrowIcon(currentHeading));
        if (autoCenter) {
          map.panTo([latlng.lat, latlng.lng], { animate: true, duration: 1 });
        }
      }
    };

    window.loadStops = function(stops, activeStopId, selectedStopId) {
      clearCustomerMarkers();

      stops.forEach(function(stop) {
        var marker = L.marker([stop.latitude, stop.longitude], {
          icon: getIcon(stop.id, activeStopId, selectedStopId, stop.order_status)
        })
          .addTo(map)
          .bindPopup("<b>" + stop.customer_name + "<\/b><br/>" + stop.address);

        marker._stopId = String(stop.id);
        marker._orderStatus = String(stop.order_status || '');
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
        m.setIcon(getIcon(m._stopId, activeStopId, selectedStopId, m._orderStatus));
      });
    };

    window.drawNavPolyline = function(coords) {
      if (navPolyline) {
        map.removeLayer(navPolyline);
        navPolyline = null;
      }

      navPolyline = L.polyline(coords, {
        color: '#1B5E37',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      if (coords.length > 1) {
        map.fitBounds(navPolyline.getBounds(), { padding: [60, 60] });
        autoCenter = false;
      }
    };

    window.clearNavPolyline = function() {
      if (navPolyline) {
        map.removeLayer(navPolyline);
        navPolyline = null;
      }
    };
  <\/script>
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