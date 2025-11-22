/**
 * Real Longdo Traffic API Integration
 * Uses actual Longdo APIs instead of mock data
 */

const LONGDO_API_KEY = '370a1776e0879ff8bb99731798210fd7';

export interface TrafficSpeedData {
  road: string;
  dir: 'forward' | 'reverse';
  speed: number; // m/s
  source: 'real-time' | 'predicted';
  lon: number;
  lat: number;
}

export interface TrafficSpeedResponse {
  data?: TrafficSpeedData;
  meta?: {
    code: number;
    message: string;
  };
}

/**
 * Fetch real-time traffic speed at a location
 * API: https://api.longdo.com/RouteService/json/traffic/speed
 */
export async function fetchTrafficSpeed(
  lat: number,
  lon: number,
  range: number = 0.001 // ~100m
): Promise<TrafficSpeedData | null> {
  try {
    const url = new URL('https://api.longdo.com/RouteService/json/traffic/speed');
    url.searchParams.append('lat', lat.toString());
    url.searchParams.append('lon', lon.toString());
    url.searchParams.append('range', range.toString());
    url.searchParams.append('key', LONGDO_API_KEY);

    const response = await fetch(url.toString());
    const data: TrafficSpeedResponse = await response.json();

    if (data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching traffic speed:', error);
    return null;
  }
}

/**
 * Fetch traffic speeds for multiple locations (for heatmap)
 */
export async function fetchTrafficSpeedsInArea(
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  gridSize: number = 10
): Promise<Array<TrafficSpeedData & { location: { lat: number; lng: number } }>> {
  const results: Array<TrafficSpeedData & { location: { lat: number; lng: number } }> = [];

  const latStep = (bounds.north - bounds.south) / gridSize;
  const lngStep = (bounds.east - bounds.west) / gridSize;

  const promises: Promise<void>[] = [];

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = bounds.south + i * latStep;
      const lng = bounds.west + j * lngStep;

      const promise = fetchTrafficSpeed(lat, lng).then((data) => {
        if (data) {
          results.push({
            ...data,
            location: { lat, lng },
          });
        }
      });

      promises.push(promise);

      // Add delay to avoid rate limiting
      if (promises.length % 5 === 0) {
        setTimeout(() => {}, 200);
      }
    }
  }

  await Promise.all(promises);
  return results;
}

/**
 * Calculate traffic index from speed data
 * Speed: m/s, converted to congestion level (0-10)
 */
export function calculateTrafficIndex(speedMps: number, speedLimitKmh: number = 80): number {
  const speedKmh = speedMps * 3.6;
  const ratio = speedKmh / speedLimitKmh;

  // 0-10 scale (10 = worst traffic)
  if (ratio >= 0.8) return 2; // Free flow
  if (ratio >= 0.6) return 4; // Light traffic
  if (ratio >= 0.4) return 6; // Moderate traffic
  if (ratio >= 0.2) return 8; // Heavy traffic
  return 10; // Severe congestion
}

/**
 * Get traffic condition description
 */
export function getTrafficCondition(
  index: number,
  language: 'en' | 'th'
): { level: string; color: string } {
  if (index <= 3) {
    return {
      level: language === 'en' ? 'Smooth' : 'คล่องตัว',
      color: '#22C55E',
    };
  }
  if (index <= 5) {
    return {
      level: language === 'en' ? 'Light' : 'เบาบาง',
      color: '#84CC16',
    };
  }
  if (index <= 7) {
    return {
      level: language === 'en' ? 'Moderate' : 'ปานกลาง',
      color: '#F59E0B',
    };
  }
  if (index <= 9) {
    return {
      level: language === 'en' ? 'Heavy' : 'หนาแน่น',
      color: '#EA580C',
    };
  }
  return {
    level: language === 'en' ? 'Severe' : 'ติดขัดมาก',
    color: '#DC2626',
  };
}

/**
 * Search for places using Longdo Search API
 */
export async function searchPlace(query: string, limit: number = 5) {
  try {
    const url = `https://search.longdo.com/mapsearch/json/search?keyword=${encodeURIComponent(query)}&limit=${limit}&key=${LONGDO_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching place:', error);
    return [];
  }
}

/**
 * Get route using Longdo Routing API
 */
export async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  mode: 'c' | 't' = 'c' // c = car, t = traffic-aware
) {
  try {
    const url = `https://api.longdo.com/RouteService/json/route/guide?flon=${from.lng}&flat=${from.lat}&tlon=${to.lng}&tlat=${to.lat}&mode=${mode}&key=${LONGDO_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}

export const LONGDO_MAP_KEY = LONGDO_API_KEY;
