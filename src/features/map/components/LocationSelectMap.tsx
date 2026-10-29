import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
} from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

export type LocationSelectMapHandle = {
  zoomToLocation: (lat: number, lng: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

type LocationSelectMapProps = {
  initialLat: number;
  initialLng: number;
  onLocationChange: (lat: number, lng: number) => void;
  onDragStart?: () => void;
};

const LocationSelectMap = forwardRef<LocationSelectMapHandle, LocationSelectMapProps>(
  function LocationSelectMap({ initialLat, initialLng, onLocationChange, onDragStart }, ref) {
    const webRef = useRef<WebView>(null);
    const [webViewReady, setWebViewReady] = useState(false);
    const pendingLocationRef = useRef<{ lat: number; lng: number } | null>(null);

    useImperativeHandle(ref, () => ({
      zoomToLocation: (lat: number, lng: number) => {
        if (!webViewReady || !webRef.current) {
          pendingLocationRef.current = { lat, lng };
          return;
        }
        webRef.current.injectJavaScript(`
          (function() {
            if (window.centerOnLocation) {
              window.centerOnLocation(${lat}, ${lng});
            }
          })();
          true;
        `);
      },
      zoomIn: () => {
        if (!webViewReady || !webRef.current) return;
        webRef.current.injectJavaScript(`
          (function() {
            if (window.map) {
              window.map.zoomIn();
            }
          })();
          true;
        `);
      },
      zoomOut: () => {
        if (!webViewReady || !webRef.current) return;
        webRef.current.injectJavaScript(`
          (function() {
            if (window.map) {
              window.map.zoomOut();
            }
          })();
          true;
        `);
      },
    }));

    // If a location change was queued before webView was ready, run it now
    useEffect(() => {
      if (webViewReady && pendingLocationRef.current && webRef.current) {
        const { lat, lng } = pendingLocationRef.current;
        pendingLocationRef.current = null;
        webRef.current.injectJavaScript(`
          (function() {
            if (window.centerOnLocation) {
              window.centerOnLocation(${lat}, ${lng});
            }
          })();
          true;
        `);
      }
    }, [webViewReady]);

    const html = useMemo(() => {
      const safeLat = Number(initialLat) || 21.1458;
      const safeLng = Number(initialLng) || 79.0882;

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #f0f4f1;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #map {
      position: absolute;
      inset: 0;
      z-index: 1;
    }
    /* Fixed Center Pin overlay */
    .center-pin-wrapper {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      pointer-events: none;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .center-pin-wrapper.is-dragging {
      transform: translate(-50%, -135%);
    }
    .pin-bubble {
      width: 38px;
      height: 38px;
      border-radius: 50% 50% 50% 0;
      background: linear-gradient(135deg, #1B5E37 0%, #0C5A35 100%);
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(12, 90, 53, 0.45);
      border: 3px solid #ffffff;
    }
    .pin-inner-dot {
      width: 12px;
      height: 12px;
      background: #ffffff;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.25);
    }
    .pin-shadow {
      width: 16px;
      height: 6px;
      background: rgba(12, 90, 53, 0.28);
      border-radius: 50%;
      margin-top: 3px;
      transition: transform 0.22s ease, opacity 0.22s ease;
    }
    .center-pin-wrapper.is-dragging .pin-shadow {
      transform: scale(0.55);
      opacity: 0.15;
    }
    /* Custom pulse radar behind pin */
    .pulse-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid rgba(12, 90, 53, 0.35);
      pointer-events: none;
      animation: pulseAnim 2.2s infinite ease-out;
      z-index: 999;
    }
    @keyframes pulseAnim {
      0% { transform: translate(-50%, -50%) scale(0.6); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0; }
    }
    .leaflet-control-attribution {
      display: none !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="pulse-ring"></div>
  <div class="center-pin-wrapper" id="pinWrapper">
    <div class="pin-bubble">
      <div class="pin-inner-dot"></div>
    </div>
    <div class="pin-shadow"></div>
  </div>

  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      doubleClickZoom: true,
      touchZoom: true,
      scrollWheelZoom: true,
      inertia: true,
      inertiaDeceleration: 3000
    }).setView([${safeLat}, ${safeLng}], 15);

    // 100% free open-source OpenStreetMap Leaflet layer (no API key required)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    window.map = map;
    var pin = document.getElementById('pinWrapper');
    var isDragging = false;

    map.on('movestart', function() {
      isDragging = true;
      pin.classList.add('is-dragging');
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'drag_start' }));
      }
    });

    map.on('moveend', function() {
      isDragging = false;
      pin.classList.remove('is-dragging');
      var center = map.getCenter();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'location_selected',
          lat: center.lat,
          lng: center.lng
        }));
      }
    });

    map.on('click', function(e) {
      map.flyTo(e.latlng, map.getZoom(), { animate: true, duration: 0.6 });
    });

    window.centerOnLocation = function(lat, lng) {
      map.flyTo([lat, lng], 16, { animate: true, duration: 0.8 });
    };

    // Send ready event
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'map_ready',
        lat: ${safeLat},
        lng: ${safeLng}
      }));
    }
  </script>
</body>
</html>`;
    }, [initialLat, initialLng]);

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "location_selected") {
          onLocationChange(data.lat, data.lng);
        } else if (data.type === "drag_start") {
          onDragStart?.();
        } else if (data.type === "map_ready") {
          setWebViewReady(true);
        }
      } catch (err) {
        console.warn("Failed to parse map event:", err);
      }
    };

    return (
      <View style={styles.container}>
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html }}
          javaScriptEnabled
          domStorageEnabled
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onMessage={handleMessage}
          onLoad={() => {
            setWebViewReady(true);
          }}
          style={styles.webView}
        />
        {!webViewReady && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="small" color="#0C5A35" />
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#F0F4F1",
  },
  webView: {
    flex: 1,
    backgroundColor: "#F0F4F1",
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F0F4F1",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});

export default LocationSelectMap;
