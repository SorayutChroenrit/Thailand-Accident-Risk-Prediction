import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Header } from "~/components/layout/Header";
import { Badge } from "~/components/ui/badge";
import { X, Search, MapPin, ChevronLeft, ChevronRight, Plus, CheckCircle } from "lucide-react";
import { ReportDialog } from "~/components/report-dialog";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { useLanguage } from "~/contexts/LanguageContext";
import { waitForLongdo } from "~/lib/longdo";

export const Route = createFileRoute("/map")({
  component: () => (
    <ProtectedRoute>
      <MapPage />
    </ProtectedRoute>
  ),
});

// Event types with icons (matching Longdo Traffic + our data)
// Event types with icons (matching Longdo Traffic + our data)
const EVENT_CATEGORIES = [
  { id: "accident", label: "อุบัติเหตุ", icon: "⚠️", color: "#dc2626" },
  { id: "traffic_jam", label: "รถติด", icon: "🚗", color: "#ea580c" },
  { id: "flooding", label: "น้ำท่วม", icon: "🌊", color: "#3b82f6" },
  { id: "construction", label: "ก่อสร้าง", icon: "🚧", color: "#f59e0b" },
  { id: "pothole", label: "หลุมบ่อ", icon: "🕳️", color: "#f97316" },
  { id: "lighting", label: "ไฟทางดับ", icon: "💡", color: "#eab308" },
  { id: "traffic_light", label: "สัญญาณไฟเสีย", icon: "🚦", color: "#ef4444" },
  { id: "breakdown", label: "รถเสีย", icon: "🔧", color: "#78716c" },
  { id: "road_closed", label: "ถนนปิด", icon: "⛔", color: "#991b1b" },
  { id: "fallen_tree", label: "ต้นไม้ล้ม", icon: "🌳", color: "#15803d" },
  { id: "animal", label: "สัตว์บนถนน", icon: "🐕", color: "#b45309" },
  { id: "visibility", label: "ทัศนวิสัยแย่", icon: "🌫️", color: "#6b7280" },
  { id: "fire", label: "เพลิงไหม้", icon: "🔥", color: "#dc2626" },
  { id: "other", label: "อื่นๆ", icon: "❓", color: "#6b7280" },
];

interface TrafficEvent {
  id: string;
  title: string;
  description: string;
  lat: number;
  lon: number;
  category: string;
  severity: number;
  pubDate: string;
  location?: string;
  source: string;
  year?: number;
}

function MapPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TrafficEvent[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    EVENT_CATEGORIES.map((c) => c.id),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<TrafficEvent | null>(null);
  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [trafficIndex, setTrafficIndex] = useState<number | null>(null);
  const [displayLimit, setDisplayLimit] = useState(20); // Show 20 events initially
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const { t } = useLanguage();

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  // ... existing code ...

  const handleReportSubmit = async (data: any) => {
    try {
      const response = await fetch("http://localhost:10000/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        loadUserReports(); // Refresh markers
        setShowSuccessAlert(true);
        setTimeout(() => setShowSuccessAlert(false), 5000); // Hide after 5 seconds
      }
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  // Load traffic index from Longdo
  useEffect(() => {
    const loadTrafficIndex = async () => {
      try {
        const response = await fetch("http://localhost:10000/traffic/index");
        const data = await response.json();
        setTrafficIndex(data.current);
      } catch (error) {
        console.error("Error loading traffic index:", error);
      }
    };

    loadTrafficIndex();
    // Refresh every 5 minutes (same as Longdo)
    const interval = setInterval(loadTrafficIndex, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Load events from Supabase
  useEffect(() => {
    let isCancelled = false;

    const loadEvents = async () => {
      try {
        setLoading(true);

        // Get events from November 1st to today
        const today = new Date();
        const startDate = new Date(today.getFullYear(), 10, 1); // November 1st (month is 0-indexed)

        const params = new URLSearchParams({
          start_date: startDate.toISOString().split("T")[0], // YYYY-MM-DD format
          end_date: today.toISOString().split("T")[0],
          limit: "1000",
        });

        const url = `http://localhost:10000/events/database?${params}`;
        console.log(`🔍 Fetching events from Nov 1 to today: ${url}`);

        const response = await fetch(url);
        const data = await response.json();

        // Only update state if this effect hasn't been cancelled
        if (!isCancelled) {
          console.log(
            `✅ Loaded ${data.events?.length || 0} events (Nov 1 - Today)`,
          );
          setEvents(data.events || []);
          setLoading(false);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error loading events:", error);
          setLoading(false);
        }
      }
    };

    loadEvents();

    // Cleanup function to prevent state updates if component unmounts or dependencies change
    return () => {
      isCancelled = true;
    };
  }, []); // Load once on mount - no filters

  // Load user reports
  const loadUserReports = async () => {
    try {
      const response = await fetch("http://localhost:10000/reports");
      const data = await response.json();
      setUserReports(data.reports || []);
      console.log(`✅ Loaded ${data.reports?.length || 0} user reports`);
    } catch (error) {
      console.error("Error loading user reports:", error);
    }
  };

  useEffect(() => {
    loadUserReports();
    const interval = setInterval(loadUserReports, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);



  // Filter events (client-side for category and search only)
  useEffect(() => {
    // Convert userReports to TrafficEvent format
    const formattedUserReports: TrafficEvent[] = userReports.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      lat: r.lat,
      lon: r.lon,
      category: r.category,
      severity: r.severity,
      pubDate: r.pubDate,
      location: `Lat: ${r.lat.toFixed(4)}, Lon: ${r.lon.toFixed(4)}`,
      source: "User Report",
      year: new Date(r.pubDate).getFullYear(),
    }));

    // Combine database events with user reports
    // Sort by date (newest first)
    let allEvents = [...formattedUserReports, ...events].sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

    let filtered = allEvents;

    // Month filtering is now done server-side for better performance

    // Filter by category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((e) =>
        selectedCategories.includes(e.category),
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title?.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query) ||
          e.location?.toLowerCase().includes(query),
      );
    }

    setFilteredEvents(filtered);
  }, [events, userReports, selectedCategories, searchQuery]);

  // Initialize Longdo Map
  useEffect(() => {
    const initMap = async () => {
      try {
        await waitForLongdo();

        if (!mapContainerRef.current || mapRef.current) return;

        const map = new window.longdo.Map({
          placeholder: mapContainerRef.current,
          language: "th",
        });

        map.Layers.setBase(window.longdo.Layers.GRAY);
        map.location({ lon: 100.5018, lat: 13.7563 }, true);
        map.zoom(12);

        mapRef.current = map;
        console.log("✅ Longdo Map initialized");
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initMap();
  }, []);

  // Setup global event handler for marker clicks - use Longdo Popup
  useEffect(() => {
    (window as any).selectEvent = (eventId: string) => {
      const event = filteredEvents.find((e) => e.id === eventId);
      if (event && mapRef.current) {
        console.log("Marker clicked:", event.title);

        // Create clean popup - no slider, no badges, minimal icons
        const category = EVENT_CATEGORIES.find((c) => c.id === event.category);

        // Best practice: Use box-sizing and proper text wrapping
        const popupContent = `
          <div style="
            box-sizing: border-box;
            padding: 14px;
            width: 280px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          ">
            <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
              <div style="
                background: ${category?.color || "#dc2626"};
                border-radius: 50%;
                width: 38px;
                height: 38px;
                min-width: 38px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
              ">${category?.icon || "⚠️"}</div>
              <div style="
                flex: 1;
                overflow: hidden;
              ">
                <div style="
                  font-size: 14px;
                  font-weight: 600;
                  color: #1f2937;
                  line-height: 1.3;
                  white-space: pre-wrap;
                  word-break: break-word;
                ">${event.title}</div>
              </div>
            </div>

            ${
              event.description
                ? `
              <div style="
                font-size: 13px;
                color: #4b5563;
                line-height: 1.4;
                margin-bottom: 10px;
                white-space: pre-wrap;
                word-break: break-word;
              ">${event.description}</div>
            `
                : ""
            }

            <div style="
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
              font-size: 12px;
              color: #6b7280;
            ">
              ${event.location ? `<div style="margin-bottom: 4px; white-space: pre-wrap; word-break: break-word;">${event.location}</div>` : ""}
              <div>${formatTime(event.pubDate)}</div>
            </div>
          </div>
        `;

        // Create Longdo Popup
        const popup = new window.longdo.Popup(
          { lon: event.lon, lat: event.lat },
          {
            title: "",
            detail: popupContent,
            closable: true,
            visibleRange: { min: 1, max: 20 },
          },
        );

        // Remove old popup if exists
        if ((window as any).currentPopup) {
          mapRef.current.Overlays.remove((window as any).currentPopup);
        }

        // Add new popup
        mapRef.current.Overlays.add(popup);
        (window as any).currentPopup = popup;

        // Center on event
        mapRef.current.location({ lon: event.lon, lat: event.lat }, true);
      }
    };

    return () => {
      delete (window as any).selectEvent;
      if ((window as any).currentPopup && mapRef.current) {
        mapRef.current.Overlays.remove((window as any).currentPopup);
        delete (window as any).currentPopup;
      }
    };
  }, [filteredEvents]);

  // Update markers on map
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapRef.current.Overlays.remove(marker);
    });
    markersRef.current.clear();

    // Add markers for filtered events
    filteredEvents.forEach((event) => {
      const category = EVENT_CATEGORIES.find((c) => c.id === event.category);

      // Create custom SVG icon based on category
      const getCustomIcon = () => {
        const color = category?.color || "#dc2626";

        switch (event.category) {
          case "accident":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <path d="M16 4 L28 26 L4 26 Z" fill="${color}" stroke="white" stroke-width="2" stroke-linejoin="round"/>
              <path d="M16 12 L16 18 M16 21 L16 23" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>`;
          case "traffic_jam":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <path d="M7 16 L12 16 M20 16 L25 16 M14 12 L18 12 M14 20 L18 20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>`;
          case "flooding":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <path d="M8 18 Q10 16 12 18 Q14 20 16 18 Q18 16 20 18 Q22 20 24 18" stroke="white" stroke-width="2" fill="none"/>
              <path d="M8 22 Q10 20 12 22 Q14 24 16 22 Q18 20 20 22 Q22 24 24 22" stroke="white" stroke-width="2" fill="none"/>
            </svg>`;
          case "construction":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <rect x="10" y="14" width="12" height="8" fill="white" rx="1"/>
              <rect x="12" y="10" width="8" height="4" fill="white"/>
            </svg>`;
          case "pothole":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <ellipse cx="16" cy="18" rx="8" ry="4" fill="white"/>
            </svg>`;
          case "lighting":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
              <path d="M16 6 L16 8 M16 24 L16 26 M6 16 L8 16 M24 16 L26 16" stroke="white" stroke-width="2"/>
            </svg>`;
          case "traffic_light":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <rect x="10" y="6" width="12" height="20" rx="2" fill="${color}" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="11" r="2" fill="#ef4444"/>
              <circle cx="16" cy="16" r="2" fill="#fbbf24"/>
              <circle cx="16" cy="21" r="2" fill="#22c55e"/>
            </svg>`;
          case "breakdown":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <path d="M12 16 L20 16 M16 12 L16 20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="16" cy="16" r="6" stroke="white" stroke-width="2" fill="none"/>
            </svg>`;
          case "road_closed":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="16" r="8" stroke="white" stroke-width="2.5" fill="none"/>
              <line x1="10" y1="10" x2="22" y2="22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>`;
          case "fallen_tree":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <path d="M16 8 L10 24 H22 Z" fill="white"/>
            </svg>`;
          case "animal":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
            </svg>`;
          case "visibility":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <path d="M8 14 H24 M10 18 H22 M12 22 H20" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>`;
          case "fire":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <path d="M16 8 Q18 12 16 16 Q14 12 16 8 M16 16 Q20 18 18 22 Q16 24 14 22 Q12 18 16 16" fill="white"/>
            </svg>`;
          default:
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <path d="M16 8 L16 18 M16 22 L16 24" stroke="white" stroke-width="3" stroke-linecap="round"/>
            </svg>`;
        }
      };

      const marker = new window.longdo.Marker(
        { lon: event.lon, lat: event.lat },
        {
          title: event.title,
          icon: {
            html: `<div
              onclick="window.selectEvent('${event.id}')"
              style="
              cursor: pointer;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
            ">${getCustomIcon()}</div>`,
            offset: { x: 16, y: 16 },
          },
          visibleRange: { min: 1, max: 20 },
        },
      );

      mapRef.current.Overlays.add(marker);
      markersRef.current.set(event.id, marker);
    });

    console.log(`✅ Added ${filteredEvents.length} markers to map`);
  }, [filteredEvents]);

  // Add user report markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Add markers for user reports
    userReports.forEach((report) => {
      // Check if marker already exists to avoid flickering (optional optimization)
      
      const marker = new window.longdo.Marker(
        { lon: report.lon, lat: report.lat },
        {
          title: report.title,
          icon: {
            html: `<div
              style="
              cursor: pointer;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
              background: #ec4899;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid white;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
            </div>`,
            offset: { x: 16, y: 16 },
          },
          detail: `${report.description}\n\nแจ้งโดย: ${report.reporter || "Anonymous"}`,
        }
      );

      mapRef.current.Overlays.add(marker);
      // Store reference if needed for cleanup
    });
  }, [userReports]);

  // Get traffic index color and status
  const getTrafficIndexStatus = (index: number) => {
    if (index < 2)
      return {
        color: "#22c55e",
        bg: "#dcfce7",
        text: "ว่าง",
        label: "Traffic is smooth",
      };
    if (index < 4)
      return {
        color: "#84cc16",
        bg: "#ecfccb",
        text: "คล่องตัว",
        label: "Traffic is flowing",
      };
    if (index < 6)
      return {
        color: "#eab308",
        bg: "#fef9c3",
        text: "ปานกลาง",
        label: "Moderate traffic",
      };
    if (index < 8)
      return {
        color: "#f97316",
        bg: "#ffedd5",
        text: "หนาแน่น",
        label: "Heavy traffic",
      };
    return {
      color: "#dc2626",
      bg: "#fee2e2",
      text: "ติดหนัก",
      label: "Very congested",
    };
  };

  // Toggle category filter
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  // Format time display - Today: HH:MM, Other days: DD MMM YY
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();

      // Check if same day
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      if (isToday) {
        // Today: show time only (14:30)
        return date.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        // Other days: show date (17 ต.ค. 68)
        return date.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        });
      }
    } catch {
      return "--";
    }
  };

  // Zoom to event
  const zoomToEvent = (event: TrafficEvent) => {
    if (mapRef.current && mapContainerRef.current) {
      mapRef.current.location({ lon: event.lon, lat: event.lat }, true);
      mapRef.current.zoom(15);
      setSelectedEvent(event);

      // Set popup position near the marker
      setTimeout(() => {
        const point = mapRef.current.location2Pixel({
          lon: event.lon,
          lat: event.lat,
        });
        if (point) {
          setPopupPosition({
            x: point.x,
            y: point.y - 60,
          });
        }
      }, 300); // Wait for map animation
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />

      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar - Event List */}
        <div
          className={`bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ${
            sidebarOpen ? "w-96" : "w-0"
          }`}
          style={{ minWidth: sidebarOpen ? "24rem" : "0" }}
        >
          {/* View All Events Button - Top */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <a
              href="/reports"
              className="block w-full px-4 py-3 text-sm font-semibold text-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md"
            >
              ดูเหตุการณ์ทั้งหมด
            </a>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาเหตุการณ์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Latest Events Header */}
            <div className="mt-3 px-2 py-1 bg-blue-50 rounded">
              <div className="text-sm font-medium text-blue-900">
                เหตุการณ์ล่าสุด
              </div>
              <div className="text-xs text-blue-600">Latest Traffic Events</div>
            </div>
          </div>

          {/* Traffic Index Widget */}
          {trafficIndex !== null && (
            <div className="px-4 py-3 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-600 font-medium">
                    Longdo Traffic Index
                  </div>
                  <div className="text-xs text-gray-500">กรุงเทพและปริมณฑล</div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="px-3 py-1 rounded-full font-semibold text-sm"
                    style={{
                      backgroundColor: getTrafficIndexStatus(trafficIndex).bg,
                      color: getTrafficIndexStatus(trafficIndex).color,
                    }}
                  >
                    {trafficIndex.toFixed(1)}
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: getTrafficIndexStatus(trafficIndex).color }}
                  >
                    {getTrafficIndexStatus(trafficIndex).text}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Results */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              ผลการค้นหา{" "}
              <span className="font-semibold text-gray-900">
                {filteredEvents.length}
              </span>{" "}
              รายการ
            </div>
          </div>

          {/* Event List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">กำลังโหลด...</div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">ไม่พบเหตุการณ์</div>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {filteredEvents.slice(0, displayLimit).map((event) => {
                    const category = EVENT_CATEGORIES.find(
                      (c) => c.id === event.category,
                    );
                    return (
                      <button
                        key={event.id}
                        onClick={() => zoomToEvent(event)}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                          selectedEvent?.id === event.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg"
                            style={{
                              backgroundColor: category?.color || "#dc2626",
                            }}
                          >
                            {category?.icon || "⚠️"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {event.title || "เหตุการณ์"}
                              </span>
                            </div>
                            {event.description && (
                              <div className="text-xs text-gray-600 line-clamp-2 mb-1">
                                {event.description}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{formatTime(event.pubDate)}</span>
                              {event.location && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">
                                    {event.location}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Load More Button */}
                {displayLimit < filteredEvents.length && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => setDisplayLimit((prev) => prev + 20)}
                      className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      โหลดเพิ่มเติม ({filteredEvents.length - displayLimit}{" "}
                      รายการ)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-300 rounded-r-lg shadow-lg p-2 hover:bg-gray-50 transition-all"
          style={{
            left: sidebarOpen ? "24rem" : "0",
            transition: "left 0.3s ease",
          }}
          title={sidebarOpen ? "ซ่อนแถบด้านข้าง" : "แสดงแถบด้านข้าง"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Category Filter Icons (Top) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex gap-1">
            {EVENT_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`px-3 py-2 rounded-md transition-all ${
                  selectedCategories.includes(category.id)
                    ? "bg-gray-100 shadow-sm"
                    : "opacity-40 hover:opacity-60"
                }`}
                title={category.label}
              >
                <span className="text-xl">{category.icon}</span>
                <div className="text-xs mt-0.5">{category.label}</div>
              </button>
            ))}
          </div>

          {/* Event Detail Popup */}
          {selectedEvent && popupPosition && (
            <div
              className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 max-w-sm"
              style={{
                left: `${popupPosition.x}px`,
                top: `${popupPosition.y}px`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {EVENT_CATEGORIES.find((c) => c.id === selectedEvent.category)
                    ?.icon && (
                    <span className="text-2xl">
                      {
                        EVENT_CATEGORIES.find(
                          (c) => c.id === selectedEvent.category,
                        )?.icon
                      }
                    </span>
                  )}
                  <h3 className="font-semibold text-lg text-gray-900">
                    {selectedEvent.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {selectedEvent.description && (
                <p className="text-sm text-gray-700 mb-3">
                  {selectedEvent.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedEvent.location || "ไม่ระบุตำแหน่ง"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>เวลา: {formatTime(selectedEvent.pubDate)}</span>
                </div>
                {selectedEvent.year && (
                  <div className="flex items-center gap-1">
                    <span>ปี: {selectedEvent.year}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {selectedEvent.source}
                </Badge>
                <Badge
                  variant={
                    selectedEvent.severity >= 7
                      ? "destructive"
                      : selectedEvent.severity >= 5
                        ? "default"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {selectedEvent.severity >= 7
                    ? "ระดับสูง"
                    : selectedEvent.severity >= 5
                      ? "ระดับกลาง"
                      : "ระดับต่ำ"}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Button (FAB) */}
      <button
        onClick={() => setReportDialogOpen(true)}
        className="absolute bottom-8 right-8 z-50 bg-pink-600 hover:bg-pink-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
      >
        <Plus className="h-6 w-6" />
        <span className="font-semibold">{t("reporting.reportRisk")}</span>
      </button>

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in fade-in slide-in-from-top-5">
          <Alert className="bg-green-50 border-green-200 text-green-800 shadow-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 font-semibold">{t("reporting.success.title")}</AlertTitle>
            <AlertDescription className="text-green-700">
              {t("reporting.success.message")}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        onSubmit={handleReportSubmit}
        currentLocation={
          mapRef.current
            ? mapRef.current.location()
            : { lat: 13.7563, lon: 100.5018 }
        }
      />
    </div>
  );
}
