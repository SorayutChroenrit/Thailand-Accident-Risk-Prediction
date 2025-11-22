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
 * Uses Traffic Speed API to detect real congestion and create events
 */
export async function fetchLongdoEvents(bounds?: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<LongdoEvent[]> {
  // Traffic Speed API is DISABLED due to rate limits on free tier
  // To enable: upgrade Longdo API plan or contact mm.co.th
  const realEvents: LongdoEvent[] = [];

  console.log(
    `ℹ️ Traffic Speed API disabled (rate limit). Using mock traffic events.`,
  );

  // Add some static mock events for other types (rain, construction, etc.)
  const mockEvents: LongdoEvent[] = [
    {
      eid: "evt_001",
      title: "อุบัติเหตุรถชนท้าย",
      detail: "รถชนท้ายกัน 3 คัน บริเวณทางด่วนเอกมัย",
      lat: 13.7307,
      lon: 100.5838,
      start: new Date(Date.now() - 30 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      stop: new Date(Date.now() + 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      tags: ["accident"],
      severity: 8,
    },
    {
      eid: "evt_002",
      title: "น้ำท่วมขัง",
      detail: "น้ำท่วมขังบริเวณถนนพระราม 9 สูงประมาณ 20 ซม.",
      lat: 13.759,
      lon: 100.5644,
      start: new Date(Date.now() - 2 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      stop: new Date(Date.now() + 4 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      tags: ["flooding"],
      severity: 6,
    },
    {
      eid: "evt_003",
      title: "งานซ่อมถนน",
      detail: "ปิดเลน 2 เลนสำหรับซ่อมถนน บริเวณสะพานพระราม 3",
      lat: 13.7095,
      lon: 100.5357,
      start: new Date(Date.now() - 5 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      stop: new Date(Date.now() + 19 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      tags: ["construction"],
      severity: 5,
    },
    {
      eid: "evt_004",
      title: "ฝนตกหนัก",
      detail: "ฝนตกหนักบริเวณรัชดาภิเษก อาจมีน้ำท่วมขัง",
      lat: 13.765,
      lon: 100.57,
      start: new Date(Date.now() - 15 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      stop: new Date(Date.now() + 2 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      tags: ["rainfall"],
      severity: 4,
    },
    {
      eid: "evt_005",
      title: "รถเสีย",
      detail: "รถบรรทุกเสียบริเวณเลนซ้าย ถนนสุขุมวิท",
      lat: 13.7365,
      lon: 100.573,
      start: new Date(Date.now() - 10 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      stop: new Date(Date.now() + 30 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      tags: ["broken_vehicle"],
      severity: 3,
    },
    {
      eid: "evt_006",
      title: "รถติดหนัก",
      detail: "การจราจรติดขัดหนักบริเวณถนนพระราม 4",
      lat: 13.732,
      lon: 100.544,
      start: new Date(Date.now() - 45 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      stop: new Date(Date.now() + 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      tags: ["congestion"],
      severity: 7,
    },
    {
      eid: "evt_007",
      title: "ด่านตรวจ",
      detail: "ด่านตรวจจับผู้กระทำผิดกฎจราจร บริเวณถนนวิภาวดี",
      lat: 13.795,
      lon: 100.553,
      start: new Date(Date.now() - 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      stop: new Date(Date.now() + 3 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      tags: ["checkpoint"],
      severity: 2,
    },
    {
      eid: "evt_008",
      title: "เพลิงไหม้",
      detail: "เพลิงไหม้รถยนต์ บริเวณถนนเพชรบุรี",
      lat: 13.749,
      lon: 100.554,
      start: new Date(Date.now() - 5 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      stop: new Date(Date.now() + 45 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      tags: ["fire"],
      severity: 9,
    },
  ];

  // Combine real traffic events with mock events for other types
  const allEvents = [...realEvents, ...mockEvents];

  // Filter by bounds if provided
  if (bounds) {
    return allEvents.filter(
      (event) =>
        event.lat >= bounds.south &&
        event.lat <= bounds.north &&
        event.lon >= bounds.west &&
        event.lon <= bounds.east,
    );
  }

  return allEvents;
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
