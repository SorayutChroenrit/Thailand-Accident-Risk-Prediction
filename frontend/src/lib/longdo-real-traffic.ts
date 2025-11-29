/**
 * Real Longdo Traffic Event Generator
 * Uses actual Traffic Speed API to detect real traffic conditions
 * NO MOCK DATA - 100% real traffic information from Longdo
 */

const LONGDO_API_KEY = "370a1776e0879ff8bb99731798210fd7";

export interface RealTrafficEvent {
  id: string;
  type: "congestion" | "slow_traffic" | "smooth";
  severity: number; // 1-10
  location: { lat: number; lng: number };
  road: string;
  speed: number; // km/h
  speedLimit: number; // estimated
  title_en: string;
  title_th: string;
  description_en: string;
  description_th: string;
  timestamp: Date;
  source: "real-time" | "predicted";
}

/**
 * Fetch real traffic data from Longdo Traffic Speed API
 */
export async function fetchRealTrafficData(
  lat: number,
  lon: number,
  range: number = 0.001,
): Promise<RealTrafficEvent | null> {
  try {
    const url = `https://api.longdo.com/RouteService/json/traffic/speed?lat=${lat}&lon=${lon}&range=${range}&key=${LONGDO_API_KEY}`;
    const response = await fetch(url);

    // Check if response is successful
    if (!response.ok) {
      console.warn(
        `⚠️ API returned status ${response.status} for ${lat},${lon}`,
      );
      return null;
    }

    // Get response text first to handle non-JSON responses
    const text = await response.text();

    // Check if response looks like JSON
    if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
      console.warn(
        `⚠️ API returned non-JSON response: ${text.substring(0, 100)}`,
      );
      return null;
    }

    const data = JSON.parse(text);

    // Debug: log API response
    if (!data.data && !data.meta) {
      console.log(`⚠️ No data returned from API at ${lat},${lon}`);
    }

    if (!data.data || data.data.speed === undefined) {
      if (data.meta) {
        console.log(`ℹ️ API meta:`, data.meta);
      }
      return null;
    }

    const speedMps = data.data.speed;
    const speedKmh = speedMps * 3.6;
    const road = data.data.road || "Unknown Road";
    const source = data.data.source as "real-time" | "predicted";
    const actualLat = data.data.lat;
    const actualLon = data.data.lon;

    // Estimate speed limit based on road name
    const speedLimit = estimateSpeedLimit(road);

    // Calculate congestion level
    const speedRatio = speedKmh / speedLimit;

    let type: RealTrafficEvent["type"];
    let severity: number;
    let title_th: string;
    let title_en: string;
    let description_th: string;
    let description_en: string;

    if (speedKmh < 10 && speedKmh > 0) {
      // Severe congestion
      type = "congestion";
      severity = 9;
      title_th = `รถติดหนักมาก - ${road}`;
      title_en = `Severe Congestion - ${road}`;
      description_th = `การจราจรติดขัดอย่างหนัก ความเร็วเฉลี่ย ${Math.round(speedKmh)} กม./ชม.`;
      description_en = `Heavy traffic jam, average speed ${Math.round(speedKmh)} km/h`;
    } else if (speedKmh >= 10 && speedKmh < 20) {
      // Heavy traffic
      type = "congestion";
      severity = 7;
      title_th = `รถติดหนัก - ${road}`;
      title_en = `Heavy Traffic - ${road}`;
      description_th = `การจราจรหนาแน่น ความเร็วเฉลี่ย ${Math.round(speedKmh)} กม./ชม.`;
      description_en = `Heavy traffic, average speed ${Math.round(speedKmh)} km/h`;
    } else if (speedKmh >= 20 && speedKmh < 35) {
      // Moderate traffic
      type = "slow_traffic";
      severity = 5;
      title_th = `รถช้า - ${road}`;
      title_en = `Slow Traffic - ${road}`;
      description_th = `การจราจรช้า ความเร็วเฉลี่ย ${Math.round(speedKmh)} กม./ชม.`;
      description_en = `Slow moving traffic, average speed ${Math.round(speedKmh)} km/h`;
    } else if (speedKmh >= 35 && speedKmh < speedLimit * 0.7) {
      // Light traffic
      type = "slow_traffic";
      severity = 3;
      title_th = `การจราจรคล่องตัว - ${road}`;
      title_en = `Light Traffic - ${road}`;
      description_th = `การจราจรคล่องตัว ความเร็วเฉลี่ย ${Math.round(speedKmh)} กม./ชม.`;
      description_en = `Light traffic, average speed ${Math.round(speedKmh)} km/h`;
    } else {
      // Smooth traffic
      type = "smooth";
      severity = 1;
      title_th = `การจราจรปกติ - ${road}`;
      title_en = `Normal Traffic - ${road}`;
      description_th = `การจราจรปกติ ความเร็วเฉลี่ย ${Math.round(speedKmh)} กม./ชม.`;
      description_en = `Normal traffic flow, average speed ${Math.round(speedKmh)} km/h`;
    }

    return {
      id: `real-traffic-${actualLat}-${actualLon}-${Date.now()}`,
      type,
      severity,
      location: { lat: actualLat, lng: actualLon },
      road,
      speed: speedKmh,
      speedLimit,
      title_en,
      title_th,
      description_en,
      description_th,
      timestamp: new Date(),
      source,
    };
  } catch (error) {
    console.error("Error fetching real traffic data:", error);
    return null;
  }
}

/**
 * Scan entire area for real traffic conditions
 * Returns only problematic areas (congestion, slow traffic)
 */
export async function scanAreaForRealTraffic(
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  gridSize: number = 12, // 12x12 = 144 points
): Promise<RealTrafficEvent[]> {
  const events: RealTrafficEvent[] = [];

  console.log(`🔍 Scanning major roads in Bangkok for real traffic data...`);

  // Try major road points first (known traffic-heavy areas)
  const majorPoints = [
    { lat: 13.7563, lng: 100.5018, name: "Victory Monument" },
    { lat: 13.7465, lng: 100.5356, name: "Ratchaprasong" },
    { lat: 13.7245, lng: 100.5674, name: "Asoke" },
    { lat: 13.7278, lng: 100.5241, name: "Silom" },
    { lat: 13.765, lng: 100.57, name: "Ratchada" },
    { lat: 13.7307, lng: 100.5838, name: "Ekkamai" },
    { lat: 13.759, lng: 100.5644, name: "Rama 9" },
    { lat: 13.7095, lng: 100.5357, name: "Sathorn" },
    { lat: 13.8078, lng: 100.5608, name: "Don Mueang" },
    { lat: 13.6904, lng: 100.5998, name: "Bearing" },
  ];

  // Filter points within bounds if provided
  let pointsToCheck = majorPoints;
  if (bounds) {
    pointsToCheck = majorPoints.filter(
      (p) =>
        p.lat >= bounds.south &&
        p.lat <= bounds.north &&
        p.lng >= bounds.west &&
        p.lng <= bounds.east,
    );
  }

  // Limit to 5 points to avoid rate limits
  pointsToCheck = pointsToCheck.slice(0, 5);
  console.log(
    `📍 Checking ${pointsToCheck.length} major road points (limited to avoid rate limits)...`,
  );

  for (const point of pointsToCheck) {
    const trafficData = await fetchRealTrafficData(point.lat, point.lng, 0.005); // Larger range
    if (trafficData) {
      console.log(
        `✓ Found traffic at ${point.name}: ${Math.round(trafficData.speed)} km/h`,
      );
      if (
        trafficData.type === "congestion" ||
        trafficData.type === "slow_traffic"
      ) {
        events.push(trafficData);
      }
    }
    // Longer delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // If we got some data, return it
  if (events.length > 0) {
    console.log(
      `✅ Found ${events.length} real traffic issues from major roads`,
    );
    return events;
  }

  // Skip grid scan due to API rate limits
  console.log(
    `⚠️ Skipping grid scan to avoid API rate limits. Consider upgrading your Longdo API plan for more requests.`,
  );

  console.log(`✅ Found ${events.length} real traffic issues from Longdo API`);
  console.log(
    `📊 Data sources: Real-time: ${events.filter((e) => e.source === "real-time").length}, Predicted: ${events.filter((e) => e.source === "predicted").length}`,
  );

  return events;
}

/**
 * Estimate speed limit based on road name
 */
function estimateSpeedLimit(roadName: string): number {
  const road = roadName.toLowerCase();

  // Expressways / Highways
  if (
    road.includes("expressway") ||
    road.includes("ทางด่วน") ||
    road.includes("motorway")
  ) {
    return 90;
  }

  // Major roads
  if (
    road.includes("road") ||
    road.includes("ถนน") ||
    road.includes("avenue") ||
    road.includes("boulevard")
  ) {
    return 60;
  }

  // Streets / Sois
  if (road.includes("street") || road.includes("soi") || road.includes("ซอย")) {
    return 50;
  }

  // Default
  return 60;
}

/**
 * Get traffic condition color based on severity
 */
export function getTrafficColor(severity: number): string {
  if (severity >= 8) return "#DC2626"; // Red - severe
  if (severity >= 6) return "#EA580C"; // Orange - heavy
  if (severity >= 4) return "#F59E0B"; // Yellow - moderate
  if (severity >= 2) return "#84CC16"; // Light green - light
  return "#22C55E"; // Green - smooth
}

/**
 * Convert speed to traffic index (0-10)
 */
export function speedToTrafficIndex(
  speedKmh: number,
  speedLimit: number = 60,
): number {
  const ratio = speedKmh / speedLimit;

  if (ratio >= 0.8) return 2; // Smooth
  if (ratio >= 0.6) return 4; // Light
  if (ratio >= 0.4) return 6; // Moderate
  if (ratio >= 0.2) return 8; // Heavy
  return 10; // Severe
}
