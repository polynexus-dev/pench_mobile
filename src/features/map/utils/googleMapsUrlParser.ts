/**
 * Utility to parse coordinates from various Google Maps links and plain coordinate strings.
 */
export async function parseGoogleMapsUrl(
  input: string
): Promise<{ lat: number; lng: number } | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Direct coordinates pattern: "21.1458, 79.0882" or "21.1458 79.0882"
  const directMatch = trimmed.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/);
  if (directMatch) {
    const lat = parseFloat(directMatch[1]);
    const lng = parseFloat(directMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // 2. Direct @lat,lng in URL string (e.g. google.com/maps/place/.../@21.1458,79.0882,17z)
  const atMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // 3. Query parameters like ?q=lat,lng or &ll=lat,lng or loc:lat,lng
  const qMatch =
    trimmed.match(/[?&](?:q|ll|query|loc:)=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    trimmed.match(/loc:(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    trimmed.match(/[?&]daddr=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // 4. Short links (maps.app.goo.gl or goo.gl/maps or short redirection links)
  if (
    trimmed.includes("goo.gl") ||
    trimmed.includes("maps.app.goo.gl") ||
    trimmed.includes("google.com/maps") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    try {
      const response = await fetch(trimmed, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36",
        },
      });

      const finalUrl = response.url || "";
      const atFinal =
        finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
        finalUrl.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
        finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);

      if (atFinal) {
        const lat = parseFloat(atFinal[1]);
        const lng = parseFloat(atFinal[2]);
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
      }

      // If URL didn't contain coords directly, inspect page HTML for embedded coordinates
      const html = await response.text();
      const htmlMatch =
        html.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
        html.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/) ||
        html.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/) ||
        html.match(/"coordinates":\s*\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/);

      if (htmlMatch) {
        const lat = parseFloat(htmlMatch[1]);
        const lng = parseFloat(htmlMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
      }
    } catch (err) {
      console.warn("Failed resolving Google Maps URL:", err);
    }
  }

  return null;
}
