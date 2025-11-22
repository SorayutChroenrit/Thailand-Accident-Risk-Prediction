// Event Manager for Risk Map Events
// Integrates with Longdo Traffic Events (16 event types)

import { TrafficEvent, fetchTrafficEvents } from "./traffic-service";
import { calculateRiskScore, RiskScore } from "./risk-calculator";
import {
  fetchLongdoEvents,
  LongdoEvent,
  LongdoEventTag,
  getLongdoEventIcon,
  mapSeverityToRisk,
  getLongdoEventLabel,
} from "./longdo-events";
import {
  scanAreaForRealTraffic,
  RealTrafficEvent,
  getTrafficColor as getRealTrafficColor,
} from "./longdo-real-traffic";

// Extended event types from Longdo (16 types)
export type ExtendedEventType =
  | "accident" // อุบัติเหตุ
  | "breakdown" // รถเสีย (broken_vehicle)
  | "construction" // งานก่อสร้าง
  | "congestion" // รถติด
  | "weather" // สภาพอากาศ (rainfall)
  | "flooding" // น้ำท่วม
  | "fire" // เพลิงไหม้
  | "checkpoint" // ด่านตรวจ
  | "gathering" // การชุมนุม
  | "announcement" // ประกาศ
  | "alert" // แจ้งเตือน
  | "event" // กิจกรรม
  | "discount" // ส่วนลด
  | "complaint" // ร้องเรียน
  | "high_risk"; // พื้นที่เสี่ยงสูง

export interface RiskEvent {
  id: string;
  type: ExtendedEventType;
  severity: "low" | "medium" | "high";
  location: { lat: number; lng: number };
  title_en: string;
  title_th: string;
  description_en: string;
  description_th: string;
  timestamp: Date;
  roadName?: string;
  riskScore?: RiskScore;
  distance?: number;
  icon?: string;
  source?: "longdo" | "traffic-service" | "high-risk-zone";
}

export type EventFilter = {
  types?: Array<ExtendedEventType>;
  severities?: Array<"low" | "medium" | "high">;
  maxDistance?: number; // in km
  userLocation?: { lat: number; lng: number };
};

/**
 * Convert Real Traffic Event to RiskEvent
 */
const convertRealTrafficEvent = (trafficEvent: RealTrafficEvent): RiskEvent => {
  const severity =
    trafficEvent.severity >= 8
      ? "high"
      : trafficEvent.severity >= 5
        ? "medium"
        : "low";

  return {
    id: trafficEvent.id,
    type: "congestion",
    severity,
    location: trafficEvent.location,
    title_en: trafficEvent.title_en,
    title_th: trafficEvent.title_th,
    description_en: trafficEvent.description_en,
    description_th: trafficEvent.description_th,
    timestamp: trafficEvent.timestamp,
    roadName: trafficEvent.road,
    icon: "🚦",
    source: "longdo",
  };
};

/**
 * Convert Longdo tag to EventType
 */
const convertLongdoTagToEventType = (
  tag: LongdoEventTag,
): ExtendedEventType => {
  const typeMap: Record<string, ExtendedEventType> = {
    accident: "accident",
    broken_vehicle: "breakdown",
    construction: "construction",
    rainfall: "weather",
    flooding: "flooding",
    gathering: "gathering",
    announcement: "announcement",
    checkpoint: "checkpoint",
    congestion: "congestion",
    alert: "alert",
    event: "event",
    discount: "discount",
    fire: "fire",
    complaint: "complaint",
  };
  return typeMap[tag] || "alert";
};

/**
 * Convert Longdo event to RiskEvent
 */
const convertLongdoEvent = (longdoEvent: LongdoEvent): RiskEvent => {
  const primaryTag = longdoEvent.tags[0];
  const eventType = convertLongdoTagToEventType(primaryTag);
  const severity = mapSeverityToRisk(longdoEvent.severity);

  return {
    id: longdoEvent.eid || `longdo-${Date.now()}-${Math.random()}`,
    type: eventType,
    severity,
    location: { lat: longdoEvent.lat, lng: longdoEvent.lon },
    title_en: longdoEvent.title,
    title_th: longdoEvent.title,
    description_en: longdoEvent.detail,
    description_th: longdoEvent.detail,
    timestamp: new Date(longdoEvent.start),
    icon: getLongdoEventIcon(primaryTag as LongdoEventTag),
    source: "longdo",
  };
};

/**
 * Get all risk events with optional filtering
 * Combines Longdo Events, Traffic Service events, and High Risk Zones
 */
export const getRiskEvents = async (
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  filter?: EventFilter,
): Promise<RiskEvent[]> => {
  let allEvents: RiskEvent[] = [];

  try {
    // 1. Fetch REAL Longdo Events (traffic, rain, flooding, accidents, etc.)
    console.log("🚦 Fetching REAL events from Longdo API...");
    const longdoEvents = await fetchLongdoEvents(bounds);

    // Convert Longdo events to RiskEvent format
    const convertedLongdoEvents: RiskEvent[] = longdoEvents.map((event) => ({
      id: event.eid || `longdo-${event.lat}-${event.lon}`,
      type: convertLongdoTagToEventType(event.tags[0]),
      severity: mapSeverityToRisk(event.severity),
      location: { lat: event.lat, lng: event.lon },
      title_en: event.title,
      title_th: event.title,
      description_en: event.detail,
      description_th: event.detail,
      timestamp: event.start,
      source: event.source || "longdo",
      icon: getLongdoEventIcon(event.tags[0]),
    }));

    allEvents.push(...convertedLongdoEvents);
    console.log(
      `✅ Added ${convertedLongdoEvents.length} REAL Longdo events (traffic: ${longdoEvents.filter((e) => e.tags.includes("congestion")).length}, others: ${longdoEvents.filter((e) => !e.tags.includes("congestion")).length})`,
    );

    // 2. Fetch traffic service events (legacy)
    try {
      const trafficEvents = await fetchTrafficEvents(bounds);
      const convertedTrafficEvents: RiskEvent[] = trafficEvents.map(
        (event) => ({
          id: event.id,
          type: event.type as ExtendedEventType,
          severity: event.severity,
          location: event.location,
          title_en: event.title_en,
          title_th: event.title_th,
          description_en: event.description_en,
          description_th: event.description_th,
          timestamp: event.timestamp,
          roadName: event.roadName,
          icon: getEventIcon(event.type),
          source: "traffic-service",
        }),
      );
      allEvents.push(...convertedTrafficEvents);
    } catch (err) {
      console.warn("Traffic service events unavailable:", err);
    }

    // 3. Add high-risk zones
    const highRiskZones = getHighRiskZones();
    allEvents.push(...highRiskZones);
  } catch (error) {
    console.error("Error fetching risk events:", error);
  }

  // Apply type filter
  if (filter?.types && filter.types.length > 0) {
    allEvents = allEvents.filter((event) => filter.types?.includes(event.type));
  }

  // Apply severity filter
  if (filter?.severities && filter.severities.length > 0) {
    allEvents = allEvents.filter((event) =>
      filter.severities?.includes(event.severity),
    );
  }

  // Calculate distance from user location if provided
  if (filter?.userLocation) {
    allEvents = allEvents.map((event) => ({
      ...event,
      distance: calculateDistance(
        filter.userLocation!.lat,
        filter.userLocation!.lng,
        event.location.lat,
        event.location.lng,
      ),
    }));

    // Apply distance filter
    if (filter.maxDistance) {
      allEvents = allEvents.filter(
        (event) => (event.distance || 0) <= filter.maxDistance!,
      );
    }

    // Sort by distance
    allEvents.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  } else {
    // Sort by timestamp (most recent first)
    allEvents.sort((a, b) => {
      const timeA =
        typeof a.timestamp === "string"
          ? new Date(a.timestamp).getTime()
          : a.timestamp.getTime();
      const timeB =
        typeof b.timestamp === "string"
          ? new Date(b.timestamp).getTime()
          : b.timestamp.getTime();
      return timeB - timeA;
    });
  }

  // Add risk scores
  const enrichedEvents = await Promise.all(
    allEvents.map(async (event) => {
      if (event.riskScore) return event;

      const riskScore = await calculateRiskScore(event.location, {
        historicalAccidents:
          event.severity === "high" ? 30 : event.severity === "medium" ? 15 : 5,
      });

      return {
        ...event,
        riskScore,
      };
    }),
  );

  return enrichedEvents;
};

/**
 * Calculate distance between two points (Haversine formula)
 */
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get icon HTML for event type
 */
const getEventIcon = (type: string): string => {
  const icons: Record<string, string> = {
    accident: "💥",
    breakdown: "⚠️",
    construction: "🚧",
    congestion: "🚦",
    weather: "🌧️",
    flooding: "🌊",
    fire: "🔥",
    checkpoint: "👮",
    gathering: "👥",
    announcement: "📢",
    alert: "⚡",
    event: "🎉",
    discount: "💰",
    complaint: "📝",
    high_risk: "🚨",
  };
  return icons[type] || "⚠️";
};

/**
 * Get event color by severity
 */
export const getEventColor = (severity: "low" | "medium" | "high"): string => {
  const colors = {
    low: "#22C55E",
    medium: "#F59E0B",
    high: "#DC2626",
  };
  return colors[severity];
};

/**
 * Format timestamp for display
 */
export const formatEventTime = (
  timestamp: Date,
  language: "en" | "th",
): string => {
  const now = new Date();
  const timestampDate =
    typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const diffMs = now.getTime() - timestampDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (language === "en") {
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return timestamp.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } else {
    if (diffMins < 1) return "เมื่อสักครู่";
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays === 1) return "เมื่อวาน";
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

    return timestamp.toLocaleDateString("th-TH", {
      month: "short",
      day: "numeric",
    });
  }
};

/**
 * Get event type label
 */
export const getEventTypeLabel = (
  type: ExtendedEventType,
  language: "en" | "th",
): string => {
  const labels: Record<ExtendedEventType, { en: string; th: string }> = {
    accident: { en: "Accident", th: "อุบัติเหตุ" },
    breakdown: { en: "Breakdown", th: "รถเสีย" },
    construction: { en: "Construction", th: "งานก่อสร้าง" },
    congestion: { en: "Congestion", th: "รถติด" },
    weather: { en: "Weather", th: "ฝนตก" },
    flooding: { en: "Flooding", th: "น้ำท่วม" },
    fire: { en: "Fire", th: "เพลิงไหม้" },
    checkpoint: { en: "Checkpoint", th: "ด่านตรวจ" },
    gathering: { en: "Gathering", th: "การชุมนุม" },
    announcement: { en: "Announcement", th: "ประกาศ" },
    alert: { en: "Alert", th: "แจ้งเตือน" },
    event: { en: "Event", th: "กิจกรรม" },
    discount: { en: "Discount", th: "ส่วนลด" },
    complaint: { en: "Complaint", th: "ร้องเรียน" },
    high_risk: { en: "High Risk Zone", th: "พื้นที่เสี่ยงสูง" },
  };
  return labels[type][language];
};

/**
 * Get severity label
 */
export const getSeverityLabel = (
  severity: "low" | "medium" | "high",
  language: "en" | "th",
): string => {
  const labels = {
    low: { en: "Low", th: "ต่ำ" },
    medium: { en: "Medium", th: "ปานกลาง" },
    high: { en: "High", th: "สูง" },
  };
  return labels[severity][language];
};

/**
 * Generate high-risk zone events from historical data
 * These are static markers for known dangerous locations
 */
export const getHighRiskZones = (): RiskEvent[] => {
  const zones = [
    {
      id: "hrz-1",
      location: { lat: 13.7563, lng: 100.5018 }, // Victory Monument
      title_en: "High Risk Zone - Victory Monument",
      title_th: "พื้นที่เสี่ยงสูง - อนุสาวรีย์ชัยสมรภูมิ",
      description_en: "Frequent accidents reported at this busy intersection",
      description_th: "มีรายงานอุบัติเหตุบ่อยครั้งที่สี่แยกที่วุ่นวายนี้",
      roadName: "Phahonyothin Road / Ratchawithi Road",
    },
    {
      id: "hrz-2",
      location: { lat: 13.7278, lng: 100.5241 }, // Silom
      title_en: "High Risk Zone - Silom",
      title_th: "พื้นที่เสี่ยงสูง - สีลม",
      description_en: "High pedestrian and vehicle traffic area",
      description_th: "พื้นที่ที่มีคนเดินและรถจำนวนมาก",
      roadName: "Silom Road",
    },
    {
      id: "hrz-3",
      location: { lat: 13.8078, lng: 100.5608 }, // Don Mueang
      title_en: "High Risk Zone - Don Mueang",
      title_th: "พื้นที่เสี่ยงสูง - ดอนเมือง",
      description_en: "Busy airport route with heavy traffic",
      description_th: "เส้นทางสนามบินที่มีการจราจรหนาแน่น",
      roadName: "Vibhavadi Rangsit Road",
    },
    {
      id: "hrz-4",
      location: { lat: 13.7465, lng: 100.5356 }, // Ratchaprasong
      title_en: "High Risk Zone - Ratchaprasong",
      title_th: "พื้นที่เสี่ยงสูง - ราชประสงค์",
      description_en: "Major intersection with complex traffic patterns",
      description_th: "สี่แยกใหญ่ที่มีรูปแบบการจราจรซับซ้อน",
      roadName: "Ratchadamri Road / Phloen Chit Road",
    },
    {
      id: "hrz-5",
      location: { lat: 13.7245, lng: 100.5674 }, // Asok
      title_en: "High Risk Zone - Asok",
      title_th: "พื้นที่เสี่ยงสูง - อโศก",
      description_en: "Congested area with high accident rate",
      description_th: "พื้นที่แออัดที่มีอัตราอุบัติเหตุสูง",
      roadName: "Sukhumvit Road / Asok Road",
    },
  ];

  return zones.map((zone) => ({
    id: zone.id,
    type: "high_risk" as const,
    severity: "high" as const,
    location: zone.location,
    title_en: zone.title_en,
    title_th: zone.title_th,
    description_en: zone.description_en,
    description_th: zone.description_th,
    timestamp: new Date(),
    roadName: zone.roadName,
    icon: "🚨",
    source: "high-risk-zone",
  }));
};

/**
 * Subscribe to real-time event updates
 * In production, this would connect to a WebSocket or use polling
 */
export const subscribeToEvents = (
  callback: (events: RiskEvent[]) => void,
  interval: number = 5 * 60 * 1000, // 5 minutes
): (() => void) => {
  const fetchEvents = async () => {
    const events = await getRiskEvents();
    callback(events);
  };

  // Initial fetch
  fetchEvents();

  // Set up interval
  const intervalId = setInterval(fetchEvents, interval);

  // Return cleanup function
  return () => clearInterval(intervalId);
};

/**
 * Get event statistics
 */
export const getEventStatistics = (
  events: RiskEvent[],
): {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  recentCount: number; // last hour
} => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let recentCount = 0;

  events.forEach((event) => {
    // Count by type
    byType[event.type] = (byType[event.type] || 0) + 1;

    // Count by severity
    bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;

    // Count recent
    if (event.timestamp >= oneHourAgo) {
      recentCount++;
    }
  });

  return {
    total: events.length,
    byType,
    bySeverity,
    recentCount,
  };
};
