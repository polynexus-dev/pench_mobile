import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
} from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

export type LocationSelectMapHandle = {
  zoomToLocation: (lat: number, lng: number) => void;
};

type LocationSelectMapProps = {
  initialLat: number;
  initialLng: number;
  onLocationChange: (lat: number, lng: number) => void;
};

const LocationSelectMap = forwardRef<LocationSelectMapHandle, LocationSelectMapProps>(
  function LocationSelectMap({ initialLat, initialLng, onLocationChange }, ref) {
    const webRef = useRef<WebView>(null);
    const [webViewReady, setWebViewReady] = useState(false);

    useImperativeHandle(ref, () => ({
      zoomToLocation: (lat: number, lng: number) => {
        if (!webViewReady || !webRef.current) return;
        webRef.current.injectJavaScript(`
          (function() {
            if (window.centerOnLocation) {
              window.centerOnLocation(${lat}, ${lng});
            }
          })();
          true;
        `);
      },
    }));

    const html = useMemo(() => {
      return `
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
</style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${initialLat}, ${initialLng}], 14);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var marker = null;

    function updateMarker(lat, lng) {
      if (!marker) {
        marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: '',
            html: '<div style="width:28px;height:28px;border-radius:999px;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.35);background:#0C5A35;display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;border-radius:999px;background:#fff;"></div></div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })
        }).addTo(map);
      } else {
        marker.setLatLng([lat, lng]);
      }
    }

    // Set initial marker location
    updateMarker(${initialLat}, ${initialLng});

    window.centerOnLocation = function(lat, lng) {
      updateMarker(lat, lng);
      map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
    };

    map.on('click', function(e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;
      updateMarker(lat, lng);
      
      // Notify React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'location_selected',
        lat: lat,
        lng: lng
      }));
    });
  <\/script>
</body>
</html>`;
    }, []);

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "location_selected") {
          onLocationChange(data.lat, data.lng);
        }
      } catch (err) {
        console.warn("Failed to parse Leaflet message:", err);
      }
    };

    return (
      <View style={{ flex: 1, backgroundColor: "#e5e7eb" }}>
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html }}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleMessage}
          onLoad={() => {
            setWebViewReady(true);
          }}
        />
      </View>
    );
  }
);

export default LocationSelectMap;
