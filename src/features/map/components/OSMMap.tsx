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
};

const OSMMap = forwardRef<OSMMapHandle, OSMMapProps>(function OSMMap(
  { stops = [], activeStopId, selectedStopId },
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
  }));

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

    var driverIcon = makeIcon('#f97316');
    var activeIcon = makeIcon('#3b82f6');
    var selectedIcon = makeIcon('#f97316');
    var inTransitIcon = makeIcon('#ffbf00');
    var deliveredIcon = makeIcon('#22c55e');
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
        var marker = L.marker([stop.latitude, stop.longitude], {
          icon: getIcon(stop.id, activeStopId, selectedStopId, stop.order_status)
        })
          .addTo(map)
          .bindPopup("<b>" + stop.customer_name + "</b><br/>" + stop.address);

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

    async function drawRouteToCustomers(user) {
      if (!customerMarkers.length) return;

      var coords = [[user.lng, user.lat]];
      customerMarkers.forEach(function(m) {
        coords.push([m.getLatLng().lng, m.getLatLng().lat]);
      });

      var coordString = coords.map(function(c) {
        return c.join(',');
      }).join(';');

      var url = 'https://osrm.polynexus.in/route/v1/driving/' + coordString + '?overview=full&geometries=geojson';

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
            weight: 6,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round'
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