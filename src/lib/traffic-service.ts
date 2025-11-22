// Traffic Service for Longdo Traffic API Integration

export interface TrafficIndex {
  province: string;
  index: number; // 0-10 scale
  level: 'low' | 'moderate' | 'high' | 'severe';
  color: string;
  timestamp: string;
}

export interface TrafficSpeed {
  roadName: string;
  speed: number;
  averageSpeed: number;
  congestionLevel: number; // 0-100%
  location: {
    lat: number;
    lng: number;
  };
}

export interface TrafficEvent {
  id: string;
  type: 'accident' | 'breakdown' | 'construction' | 'congestion' | 'weather';
  severity: 'low' | 'medium' | 'high';
  location: {
    lat: number;
    lng: number;
  };
  title_en: string;
  title_th: string;
  description_en: string;
  description_th: string;
  timestamp: Date;
  roadName?: string;
}

// Cache for traffic data
let trafficIndexCache: { data: TrafficIndex[]; timestamp: number } | null = null;
let trafficEventsCache: { data: TrafficEvent[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch traffic index from Longdo Traffic API
 * Updates every 5 minutes
 */
export const fetchTrafficIndex = async (): Promise<TrafficIndex[]> => {
  const now = Date.now();

  // Return cached data if still valid
  if (trafficIndexCache && now - trafficIndexCache.timestamp < CACHE_DURATION) {
    return trafficIndexCache.data;
  }

  try {
    // Fetch from Longdo Traffic Index API
    const response = await fetch('https://traffic.longdo.com/api/json/traffic/index', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch traffic index');
    }

    const data = await response.json();

    // Parse and format the data
    const trafficData = parseTrafficIndex(data);

    // Update cache
    trafficIndexCache = {
      data: trafficData,
      timestamp: now,
    };

    return trafficData;
  } catch (error) {
    console.error('Error fetching traffic index:', error);

    // Return mock data as fallback
    return getMockTrafficIndex();
  }
};

/**
 * Parse traffic index data from API response
 */
const parseTrafficIndex = (data: any): TrafficIndex[] => {
  const results: TrafficIndex[] = [];

  if (data && typeof data === 'object') {
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      if (typeof value === 'number') {
        const index = Math.round(value);
        results.push({
          province: key,
          index,
          level: getTrafficLevel(index),
          color: getTrafficColor(index),
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  return results.sort((a, b) => b.index - a.index);
};

/**
 * Get traffic level from index (0-10)
 */
const getTrafficLevel = (index: number): 'low' | 'moderate' | 'high' | 'severe' => {
  if (index <= 3) return 'low';
  if (index <= 5) return 'moderate';
  if (index <= 7) return 'high';
  return 'severe';
};

/**
 * Get color for traffic index
 */
const getTrafficColor = (index: number): string => {
  if (index <= 3) return '#22C55E'; // Green
  if (index <= 5) return '#F59E0B'; // Yellow
  if (index <= 7) return '#EA580C'; // Orange
  if (index <= 8) return '#DC2626'; // Red
  return '#991B1B'; // Dark red/black
};

/**
 * Get Bangkok traffic index
 */
export const getBangkokTrafficIndex = async (): Promise<number> => {
  const trafficData = await fetchTrafficIndex();
  const bangkok = trafficData.find(
    (item) => item.province.toLowerCase().includes('bangkok') ||
              item.province.toLowerCase().includes('กรุงเทพ')
  );
  return bangkok?.index || 5;
};

/**
 * Fetch traffic events (simulated from historical data + real-time traffic)
 */
export const fetchTrafficEvents = async (
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  }
): Promise<TrafficEvent[]> => {
  const now = Date.now();

  // Return cached data if still valid
  if (trafficEventsCache && now - trafficEventsCache.timestamp < CACHE_DURATION) {
    return filterEventsByBounds(trafficEventsCache.data, bounds);
  }

  try {
    // In a real implementation, this would fetch from multiple sources:
    // 1. Longdo Traffic API for real-time traffic
    // 2. Historical accident data
    // 3. ML predictions
    // 4. Crowdsourced reports

    // For now, generate events based on traffic index + mock data
    const trafficIndex = await fetchTrafficIndex();
    const events = generateEventsFromTrafficData(trafficIndex);

    // Update cache
    trafficEventsCache = {
      data: events,
      timestamp: now,
    };

    return filterEventsByBounds(events, bounds);
  } catch (error) {
    console.error('Error fetching traffic events:', error);
    return [];
  }
};

/**
 * Filter events by map bounds
 */
const filterEventsByBounds = (
  events: TrafficEvent[],
  bounds?: { north: number; south: number; east: number; west: number }
): TrafficEvent[] => {
  if (!bounds) return events;

  return events.filter(
    (event) =>
      event.location.lat <= bounds.north &&
      event.location.lat >= bounds.south &&
      event.location.lng <= bounds.east &&
      event.location.lng >= bounds.west
  );
};

/**
 * Generate events from traffic data
 * This simulates real-time events based on traffic conditions
 */
const generateEventsFromTrafficData = (trafficData: TrafficIndex[]): TrafficEvent[] => {
  const events: TrafficEvent[] = [];
  const now = new Date();

  // Generate events for high-traffic areas
  trafficData
    .filter((item) => item.index >= 6)
    .slice(0, 15) // Limit to 15 events
    .forEach((item, index) => {
      // Bangkok area coordinates
      const bangkokCoords = [
        { lat: 13.7563, lng: 100.5018 }, // Victory Monument
        { lat: 13.7467, lng: 100.5342 }, // Asok
        { lat: 13.7278, lng: 100.5241 }, // Silom
        { lat: 13.8078, lng: 100.5608 }, // Don Mueang
        { lat: 13.6904, lng: 100.5998 }, // Bearing
        { lat: 13.7650, lng: 100.5377 }, // Ratchada
        { lat: 13.7368, lng: 100.5604 }, // Ekkamai
        { lat: 13.7245, lng: 100.4930 }, // Sathorn
        { lat: 13.8814, lng: 100.5632 }, // Rangsit
        { lat: 13.6897, lng: 100.5265 }, // Bang Na
      ];

      const coord = bangkokCoords[index % bangkokCoords.length];

      // Randomize slightly
      const lat = coord.lat + (Math.random() - 0.5) * 0.02;
      const lng = coord.lng + (Math.random() - 0.5) * 0.02;

      // Determine event type based on traffic level
      let type: TrafficEvent['type'] = 'congestion';
      let severity: TrafficEvent['severity'] = 'medium';

      if (item.index >= 8) {
        // Severe traffic - likely an incident
        const eventTypes: TrafficEvent['type'][] = ['accident', 'breakdown', 'construction'];
        type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        severity = 'high';
      } else if (item.index >= 7) {
        severity = 'medium';
        if (Math.random() > 0.5) {
          type = 'breakdown';
        }
      }

      // Generate timestamp (within last 2 hours)
      const timestamp = new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000);

      events.push({
        id: `event-${Date.now()}-${index}`,
        type,
        severity,
        location: { lat, lng },
        title_en: getEventTitle(type, 'en'),
        title_th: getEventTitle(type, 'th'),
        description_en: getEventDescription(type, severity, 'en'),
        description_th: getEventDescription(type, severity, 'th'),
        timestamp,
        roadName: getRandomRoadName(),
      });
    });

  return events;
};

/**
 * Get event title by type
 */
const getEventTitle = (type: TrafficEvent['type'], lang: 'en' | 'th'): string => {
  const titles = {
    accident: { en: 'Traffic Accident', th: 'อุบัติเหตุจราจร' },
    breakdown: { en: 'Vehicle Breakdown', th: 'รถเสีย' },
    construction: { en: 'Road Construction', th: 'งานก่อสร้าง' },
    congestion: { en: 'Heavy Traffic', th: 'รถติดหนัก' },
    weather: { en: 'Weather Alert', th: 'เตือนสภาพอากาศ' },
  };
  return titles[type][lang];
};

/**
 * Get event description
 */
const getEventDescription = (
  type: TrafficEvent['type'],
  severity: TrafficEvent['severity'],
  lang: 'en' | 'th'
): string => {
  const descriptions = {
    accident: {
      en: `${severity === 'high' ? 'Serious' : 'Minor'} accident reported. Expect delays.`,
      th: `รายงานอุบัติเหตุ${severity === 'high' ? 'ร้ายแรง' : 'เล็กน้อย'} คาดว่าจะมีการจราจรติดขัด`,
    },
    breakdown: {
      en: 'Vehicle breakdown causing lane blockage',
      th: 'รถเสียขวางเลน ทำให้การจราจรติดขัด',
    },
    construction: {
      en: 'Road construction in progress. Lane closure.',
      th: 'มีงานก่อสร้างถนน ปิดช่องจราจร',
    },
    congestion: {
      en: `${severity === 'high' ? 'Severe' : 'Heavy'} traffic congestion`,
      th: `การจราจร${severity === 'high' ? 'ติดขัดหนักมาก' : 'ติดขัดหนัก'}`,
    },
    weather: {
      en: 'Heavy rain affecting visibility',
      th: 'ฝนตกหนัก ส่งผลต่อทัศนวิสัย',
    },
  };
  return descriptions[type][lang];
};

/**
 * Get random road name from common Bangkok roads
 */
const getRandomRoadName = (): string => {
  const roads = [
    'Rama IV Road',
    'Sukhumvit Road',
    'Ratchadaphisek Road',
    'Phetchaburi Road',
    'Vibhavadi Rangsit Road',
    'Rama IX Road',
    'Lat Phrao Road',
    'Phaholyothin Road',
    'Silom Road',
    'Sathorn Road',
  ];
  return roads[Math.floor(Math.random() * roads.length)];
};

/**
 * Mock traffic index data (fallback)
 */
const getMockTrafficIndex = (): TrafficIndex[] => {
  return [
    { province: 'Bangkok', index: 7, level: 'high', color: '#EA580C', timestamp: new Date().toISOString() },
    { province: 'Samut Prakan', index: 6, level: 'high', color: '#EA580C', timestamp: new Date().toISOString() },
    { province: 'Nonthaburi', index: 5, level: 'moderate', color: '#F59E0B', timestamp: new Date().toISOString() },
    { province: 'Pathum Thani', index: 4, level: 'moderate', color: '#F59E0B', timestamp: new Date().toISOString() },
    { province: 'Chonburi', index: 5, level: 'moderate', color: '#F59E0B', timestamp: new Date().toISOString() },
  ];
};

/**
 * Clear cache (useful for manual refresh)
 */
export const clearTrafficCache = () => {
  trafficIndexCache = null;
  trafficEventsCache = null;
};
