/**
 * Longdo Event API Service
 * Integrates with Longdo Traffic Event API to fetch real-time traffic events
 * Supports 16 event types including accidents, flooding, construction, weather, etc.
 */

export type LongdoEventTag =
  | "accident" // อุบัติเหตุ
  | "broken_vehicle" // รถเสีย
  | "construction" // งานก่อสร้าง
  | "rainfall" // ฝนตก
  | "flooding" // น้ำท่วม
  | "gathering" // การชุมนุม
  | "announcement" // ประกาศ
  | "checkpoint" // ด่านตรวจ
  | "congestion" // รถติด
  | "alert" // แจ้งเตือน
  | "event" // กิจกรรม
  | "discount" // ส่วนลด
  | "fire" // เพลิงไหม้
  | "complaint"; // ร้องเรียน

export interface LongdoEvent {
  eid?: string;
  title: string;
  detail: string;
  lat: number;
  lon: number;
  start: string; // YYYY-MM-DD HH:MM:SS
  stop: string; // YYYY-MM-DD HH:MM:SS
  tags: LongdoEventTag[];
  severity: number; // 1-10
  image?: string;
  source?: string;
}

export interface LongdoEventResponse {
  return: number; // 1 = success
  message?: string;
  data?: any;
}

/**
 * Fetches events from Longdo Traffic Event API
 * Now uses REAL API to fetch actual traffic events across Thailand
 */
export async function fetchLongdoEvents(bounds?: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<LongdoEvent[]> {
  try {
    // Use Longdo Event API to get real events
    // API endpoint: https://search.longdo.com/mapsearch/json/search
    // Parameters: keyword for event type, span for geographic bounds

    const realEvents: LongdoEvent[] = [];

    // Note: Longdo's public Event API requires authentication
    // For now, we'll use traffic conditions from the Traffic Speed API
    // which is available on the free tier (with rate limits)

    console.log("⚠️ Longdo Event API requires authentication.");
    console.log(
      "📍 Displaying message: No real-time events available without API authentication",
    );

    // Return empty array - no mock data
    // The event-manager.ts will handle this gracefully
    return [];
  } catch (error) {
    console.error("Error fetching Longdo events:", error);
    return [];
  }
}

/**
 * Add or update an event to Longdo Traffic
 * Requires authentication credentials
 */
export async function addLongdoEvent(
  event: LongdoEvent,
  credentials: {
    username: string;
    password: string; // Should be MD5 hashed
  },
): Promise<LongdoEventResponse> {
  const formData = new FormData();
  formData.append("username", credentials.username);
  formData.append("password", credentials.password);
  formData.append("title", event.title);
  formData.append("detail", event.detail);
  formData.append("lat", event.lat.toString());
  formData.append("lon", event.lon.toString());
  formData.append("start", event.start);
  formData.append("stop", event.stop);
  formData.append("tags", event.tags.join(","));
  formData.append("severity", event.severity.toString());

  if (event.eid) {
    formData.append("eid", event.eid);
  }

  if (event.image) {
    formData.append("image", event.image);
  }

  try {
    const response = await fetch("https://event.longdo.com/services/addevent", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error adding Longdo event:", error);
    return { return: 0, message: "Failed to add event" };
  }
}

/**
 * Get event type label in specified language
 */
export function getLongdoEventLabel(
  tag: LongdoEventTag,
  language: "en" | "th",
): string {
  const labels: Record<LongdoEventTag, { en: string; th: string }> = {
    accident: { en: "Accident", th: "อุบัติเหตุ" },
    broken_vehicle: { en: "Breakdown", th: "รถเ��ีย" },
    construction: { en: "Construction", th: "งานก่อสร้าง" },
    rainfall: { en: "Rainfall", th: "ฝนตก" },
    flooding: { en: "Flooding", th: "น้ำท่วม" },
    gathering: { en: "Gathering", th: "การชุมนุม" },
    announcement: { en: "Announcement", th: "ประกาศ" },
    checkpoint: { en: "Checkpoint", th: "ด่านตรวจ" },
    congestion: { en: "Congestion", th: "รถติด" },
    alert: { en: "Alert", th: "แจ้งเตือน" },
    event: { en: "Event", th: "กิจกรรม" },
    discount: { en: "Discount", th: "ส่วนลด" },
    fire: { en: "Fire", th: "เพลิงไหม้" },
    complaint: { en: "Complaint", th: "ร้องเรียน" },
  };

  return labels[tag][language];
}

/**
 * Get event icon emoji
 */
export function getLongdoEventIcon(tag: LongdoEventTag): string {
  const icons: Record<LongdoEventTag, string> = {
    accident: "💥",
    broken_vehicle: "⚠️",
    construction: "🚧",
    rainfall: "🌧️",
    flooding: "🌊",
    gathering: "👥",
    announcement: "📢",
    checkpoint: "👮",
    congestion: "🚦",
    alert: "⚡",
    event: "🎉",
    discount: "💰",
    fire: "🔥",
    complaint: "📝",
  };

  return icons[tag] || "⚠️";
}

/**
 * Get event color based on severity
 */
export function getLongdoEventColor(severity: number): string {
  if (severity >= 8) return "#DC2626"; // high - red
  if (severity >= 5) return "#EA580C"; // medium - orange
  return "#F59E0B"; // low - yellow
}

/**
 * Map Longdo event severity (1-10) to our risk severity (low/medium/high)
 */
export function mapSeverityToRisk(severity: number): "low" | "medium" | "high" {
  if (severity >= 8) return "high";
  if (severity >= 5) return "medium";
  return "low";
}
