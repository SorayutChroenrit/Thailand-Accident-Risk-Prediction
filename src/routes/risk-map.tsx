import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { Header } from "~/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  MapPin,
  AlertTriangle,
  Filter,
  X,
  Clock,
  RefreshCw,
  Layers,
  List,
  Info,
  Car,
  Loader2,
  Navigation2,
  MapPinned,
  Hospital,
  Shield,
  Fuel,
  Camera,
} from "lucide-react";
import { useLanguage } from "~/contexts/LanguageContext";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { waitForLongdo } from "~/lib/longdo";
import {
  getRiskEvents,
  formatEventTime,
  getEventTypeLabel,
  getSeverityLabel,
  getEventColor,
  getEventStatistics,
  type RiskEvent,
  type EventFilter,
  type ExtendedEventType,
} from "~/lib/event-manager";
import { getBangkokTrafficIndex } from "~/lib/traffic-service";
import { calculateRiskScore, getRiskIndex } from "~/lib/risk-calculator";
import { fetchTrafficSpeed } from "~/lib/longdo-traffic-api";
import { provinces } from "~/lib/thailand-provinces";

export const Route = createFileRoute("/risk-map")({
  component: () => (
    <ProtectedRoute>
      <RiskMapPage />
    </ProtectedRoute>
  ),
});

function RiskMapPage() {
  const { language } = useLanguage();

  // State
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<RiskEvent[]>([]);
  const [trafficIndex, setTrafficIndex] = useState<number>(5);
  const [riskIndex, setRiskIndex] = useState<number>(5);
  const [showSidebar, setShowSidebar] = useState(false); // Hidden by default
  const [showLegend, setShowLegend] = useState(false); // Hidden by default
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<RiskEvent | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [currentTrafficSpeed, setCurrentTrafficSpeed] = useState<number | null>(
    null,
  );
  const [selectedProvince, setSelectedProvince] = useState<string>("bangkok");

  // Filter state - รองรับ event types ทั้งหมด
  const [activeFilters, setActiveFilters] = useState<EventFilter>({
    types: [
      "accident",
      "breakdown",
      "construction",
      "congestion",
      "weather",
      "flooding",
      "fire",
      "checkpoint",
    ],
    severities: ["low", "medium", "high"],
  });

  // Map refs
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  // Get user location first
  useEffect(() => {
    if (navigator.geolocation) {
      console.log("📍 Requesting user location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log("✅ Got user location:", loc);
          setUserLocation(loc);

          // Fetch traffic speed at user location (async, don't block)
          fetchTrafficSpeed(loc.lat, loc.lng).then((data) => {
            if (data) {
              const speedKmh = data.speed * 3.6;
              setCurrentTrafficSpeed(speedKmh);
            }
          });
        },
        (error) => {
          console.log(
            "⚠️ Could not get user location, using Bangkok:",
            error.message,
          );
          // Default to Bangkok if GPS not available
          setUserLocation({ lat: 13.7563, lng: 100.5018 });
        },
      );
    } else {
      console.log("⚠️ Geolocation not supported, using Bangkok");
      setUserLocation({ lat: 13.7563, lng: 100.5018 });
    }
  }, []);

  // Load initial data - optimized to load faster
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load data in parallel for faster loading
        const [trafficIdx, riskScore] = await Promise.all([
          getBangkokTrafficIndex(),
          calculateRiskScore({ lat: 13.7563, lng: 100.5018 }),
        ]);

        setTrafficIndex(trafficIdx);
        setRiskIndex(getRiskIndex(riskScore.overall));

        // Load events in background (don't block UI)
        getRiskEvents(
          {
            north: 13.95,
            south: 13.55,
            east: 100.75,
            west: 100.35,
          },
          {
            userLocation: userLocation || undefined,
          },
        ).then((trafficEvents) => {
          setEvents(trafficEvents);
          setFilteredEvents(trafficEvents);
        });

        setLoading(false);
      } catch (error) {
        console.error("Error loading risk map data:", error);
        setLoading(false);
      }
    };

    loadData();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...events];

    if (activeFilters.types && activeFilters.types.length > 0) {
      filtered = filtered.filter((event) =>
        activeFilters.types?.includes(event.type),
      );
    }

    if (activeFilters.severities && activeFilters.severities.length > 0) {
      filtered = filtered.filter((event) =>
        activeFilters.severities?.includes(event.severity),
      );
    }

    setFilteredEvents(filtered);
  }, [events, activeFilters]);

  // Initialize map with Traffic Layer - optimized loading
  useEffect(() => {
    console.log("🔄 Map useEffect triggered");
    console.log("mapContainerRef.current:", mapContainerRef.current);
    console.log("mapRef.current:", mapRef.current);

    if (!mapContainerRef.current) {
      console.log("⚠️ Map container not ready yet");
      return;
    }

    if (mapRef.current) {
      console.log("⚠️ Map already exists");
      return;
    }

    const initMap = async () => {
      console.log("🗺️ Starting map initialization...");
      setMapLoading(true);

      try {
        await waitForLongdo();

        if (!mapContainerRef.current) {
          console.error("❌ Map container disappeared");
          setMapLoading(false);
          return;
        }

        if (!(window as any).longdo) {
          console.error("❌ Longdo not available after waiting");
          setMapLoading(false);
          return;
        }

        console.log("📍 Creating map instance...");
        // Use user location if available, otherwise Bangkok
        const centerLat = userLocation?.lat || 13.7563;
        const centerLng = userLocation?.lng || 100.5018;
        console.log(`📌 Center at: ${centerLat}, ${centerLng}`);

        const map = new (window as any).longdo.Map({
          placeholder: mapContainerRef.current,
          location: { lon: centerLng, lat: centerLat },
          zoom: 12,
          language: language === "th" ? "th" : "en",
          ui: (window as any).longdo.UiComponent.None, // Hide all controls
        });

        console.log("🚦 Adding traffic layer...");
        map.Layers.add((window as any).longdo.Layers.TRAFFIC);

        mapRef.current = map;

        console.log("📍 Map instance ready for POI overlays");

        console.log("✅ Map initialization complete!");
        setMapLoading(false);
        console.log("🎉 Map should be visible now!");
      } catch (error) {
        console.error("❌ Error loading map:", error);
        setMapLoading(false);
      }
    };

    initMap();
  }, []); // Only run once on mount

  // Traffic Layer is always on - no toggle needed

  // Handle province selection
  useEffect(() => {
    if (!mapRef.current) return;

    const province = provinces[selectedProvince as keyof typeof provinces];
    if (province) {
      console.log(`📍 Moving to ${province.name_en}...`);
      mapRef.current.location({ lon: province.lng, lat: province.lat });
      mapRef.current.zoom(province.zoom);
    }
  }, [selectedProvince]);

  // Update user location marker and move map when location changes
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    console.log("📌 Adding user location marker at:", userLocation);

    // Move map to user location
    mapRef.current.location({ lon: userLocation.lng, lat: userLocation.lat });

    // Add user location marker
    const userMarker = new (window as any).longdo.Marker(
      { lon: userLocation.lng, lat: userLocation.lat },
      {
        title: language === "en" ? "Your Location" : "ตำแหน่งของคุณ",
        icon: {
          html: `<div style="background: #2563EB; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
          offset: { x: 10, y: 10 },
        },
      },
    );
    mapRef.current.Overlays.add(userMarker);
  }, [userLocation, language]);

  // POI feature temporarily disabled

  // Update markers when events change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers (except user marker)
    markersRef.current.forEach((marker) => {
      mapRef.current.Overlays.remove(marker);
    });
    markersRef.current.clear();

    // Add new markers
    filteredEvents.forEach((event) => {
      const color = getEventColor(event.severity);
      const icon = event.icon || "⚠️";

      const marker = new (window as any).longdo.Marker(
        { lon: event.location.lng, lat: event.location.lat },
        {
          title: language === "en" ? event.title_en : event.title_th,
          detail: `
            <div style="font-family: system-ui; padding: 4px; min-width: 200px;">
              <strong>${language === "en" ? event.title_en : event.title_th}</strong><br/>
              <span style="color: ${color}; font-weight: bold;">
                ${getSeverityLabel(event.severity, language)}
              </span><br/>
              <small>${event.roadName || ""}</small><br/>
              <small style="color: #666;">${formatEventTime(event.timestamp, language)}</small>
            </div>
          `,
          icon: {
            html: `<div style="
              background: ${color};
              width: ${event.severity === "high" ? "32px" : event.severity === "medium" ? "24px" : "20px"};
              height: ${event.severity === "high" ? "32px" : event.severity === "medium" ? "24px" : "20px"};
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${event.severity === "high" ? "16px" : "12px"};
            ">${icon}</div>`,
            offset: { x: 16, y: 16 },
          },
        },
      );

      // Click handler
      const clickHandler = () => {
        setSelectedEvent(event);
        mapRef.current.location(
          { lon: event.location.lng, lat: event.location.lat },
          true,
        );
      };

      mapRef.current.Event.bind("overlayClick", (overlay: any) => {
        if (overlay === marker) {
          clickHandler();
        }
      });

      mapRef.current.Overlays.add(marker);
      markersRef.current.set(event.id, marker);
    });
  }, [filteredEvents, language]);

  // Toggle filter
  const toggleFilter = (filterType: "type" | "severity", value: string) => {
    if (filterType === "type") {
      const types = activeFilters.types || [];
      const newTypes = types.includes(value as ExtendedEventType)
        ? types.filter((t) => t !== value)
        : [...types, value as ExtendedEventType];
      setActiveFilters({ ...activeFilters, types: newTypes });
    } else {
      const severities = activeFilters.severities || [];
      const newSeverities = severities.includes(value as any)
        ? severities.filter((s) => s !== value)
        : [...severities, value as any];
      setActiveFilters({ ...activeFilters, severities: newSeverities });
    }
  };

  // Event statistics
  const stats = useMemo(
    () => getEventStatistics(filteredEvents),
    [filteredEvents],
  );

  // Get traffic level info
  const getTrafficInfo = (index: number) => {
    if (index <= 3)
      return {
        level: "low",
        label_en: "Smooth",
        label_th: "คล่องตัว",
        color: "#22C55E",
      };
    if (index <= 5)
      return {
        level: "moderate",
        label_en: "Light",
        label_th: "เบาบาง",
        color: "#F59E0B",
      };
    if (index <= 7)
      return {
        level: "high",
        label_en: "Moderate",
        label_th: "ปานกลาง",
        color: "#EA580C",
      };
    return {
      level: "severe",
      label_en: "Heavy",
      label_th: "หนาแน่น",
      color: "#DC2626",
    };
  };

  const trafficInfo = getTrafficInfo(trafficIndex);
  const riskInfo = getTrafficInfo(riskIndex);

  // Don't block rendering - let map container mount first

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 relative">
        {/* Map Container */}
        <div className="absolute inset-0">
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ position: "relative", zIndex: 1 }}
          />

          {/* Map Loading Overlay */}
          {mapLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[2000]">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === "en" ? "Loading map..." : "กำลังโหลดแผนที่..."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Top Bar - Traffic & Risk Index */}
        <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
            <Card className="shadow-lg">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {language === "en" ? "Traffic Index" : "ดัชนีจราจร"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-2xl font-bold"
                        style={{ color: trafficInfo.color }}
                      >
                        {trafficIndex}
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: trafficInfo.color }}
                      >
                        {language === "en"
                          ? trafficInfo.label_en
                          : trafficInfo.label_th}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {language === "en" ? "Risk Index" : "ดัชนีความเสี่ยง"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-2xl font-bold"
                        style={{ color: riskInfo.color }}
                      >
                        {riskIndex}
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: riskInfo.color }}
                      >
                        {language === "en"
                          ? riskInfo.label_en
                          : riskInfo.label_th}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {currentTrafficSpeed !== null && (
              <Card className="shadow-lg">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Navigation2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {language === "en"
                          ? "Current Speed"
                          : "ความเร็วปัจจุบัน"}
                      </p>
                      <span className="text-2xl font-bold">
                        {Math.round(currentTrafficSpeed)}
                      </span>
                      <span className="text-sm ml-1">km/h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex-1" />

            {/* Province Selector */}
            <Card className="shadow-lg">
              <CardContent className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4 text-primary" />
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="text-sm bg-transparent border-none outline-none cursor-pointer font-medium"
                  >
                    {Object.entries(provinces).map(([key, province]) => (
                      <option key={key} value={key}>
                        {language === "en"
                          ? province.name_en
                          : province.name_th}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="secondary"
              size="icon"
              className="shadow-lg"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="shadow-lg"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend - Bottom Left */}
        {showLegend && (
          <div className="absolute bottom-4 left-4 z-[1000]">
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    {language === "en" ? "Legend" : "สัญลักษณ์"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowLegend(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-risk-high border-2 border-white" />
                  <span>
                    {language === "en" ? "High Risk" : "ความเสี่ยงสูง"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-risk-medium border-2 border-white" />
                  <span>
                    {language === "en" ? "Medium Risk" : "ความเสี่ยงปานกลาง"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-risk-low border-2 border-white" />
                  <span>
                    {language === "en" ? "Low Risk" : "ความเสี่ยงต่ำ"}
                  </span>
                </div>
                <div className="pt-2 border-t space-y-1">
                  <div className="text-xs flex items-center gap-2">
                    <span>💥</span>{" "}
                    {language === "en" ? "Accident" : "อุบัติเหตุ"}
                  </div>
                  <div className="text-xs flex items-center gap-2">
                    <span>⚠️</span> {language === "en" ? "Breakdown" : "รถเสีย"}
                  </div>
                  <div className="text-xs flex items-center gap-2">
                    <span>🚧</span>{" "}
                    {language === "en" ? "Construction" : "งานก่อสร้าง"}
                  </div>
                  <div className="text-xs flex items-center gap-2">
                    <span>🚦</span> {language === "en" ? "Congestion" : "รถติด"}
                  </div>
                  <div className="text-xs flex items-center gap-2">
                    <span>🌊</span> {language === "en" ? "Flooding" : "น้ำท่วม"}
                  </div>
                  <div className="text-xs flex items-center gap-2">
                    <span>🔥</span> {language === "en" ? "Fire" : "เพลิงไหม้"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!showLegend && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 left-4 z-[1000] shadow-lg"
            onClick={() => setShowLegend(true)}
          >
            <Layers className="h-4 w-4" />
          </Button>
        )}

        {/* POI feature temporarily disabled due to API issues */}

        {/* Sidebar - Event List */}
        {showSidebar && (
          <div className="absolute top-20 right-4 bottom-4 w-96 z-[1000] flex flex-col gap-2 max-w-[calc(100vw-2rem)] sm:w-96">
            {/* Filters */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {language === "en" ? "Filters" : "ตัวกรอง"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Event Type Filters */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {language === "en" ? "Event Type" : "ประเภทเหตุการณ์"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        "accident",
                        "breakdown",
                        "construction",
                        "congestion",
                        "weather",
                        "flooding",
                        "fire",
                        "checkpoint",
                      ] as ExtendedEventType[]
                    ).map((type) => (
                      <Badge
                        key={type}
                        variant={
                          activeFilters.types?.includes(type)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer text-xs"
                        onClick={() => toggleFilter("type", type)}
                      >
                        {getEventTypeLabel(type, language)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Severity Filters */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {language === "en" ? "Severity" : "ความรุนแรง"}
                  </p>
                  <div className="flex gap-1">
                    {["low", "medium", "high"].map((severity) => (
                      <Badge
                        key={severity}
                        variant={
                          activeFilters.severities?.includes(severity as any)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer text-xs"
                        onClick={() => toggleFilter("severity", severity)}
                        style={{
                          borderColor: activeFilters.severities?.includes(
                            severity as any,
                          )
                            ? getEventColor(severity as any)
                            : undefined,
                          backgroundColor: activeFilters.severities?.includes(
                            severity as any,
                          )
                            ? getEventColor(severity as any)
                            : undefined,
                        }}
                      >
                        {getSeverityLabel(severity as any, language)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {language === "en" ? "Total Events" : "เหตุการณ์ทั้งหมด"}
                    </span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-muted-foreground">
                      {language === "en" ? "Recent (1h)" : "ล่าสุด (1 ชม.)"}
                    </span>
                    <span className="font-medium text-primary">
                      {stats.recentCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event List */}
            <Card className="shadow-lg flex-1 overflow-hidden flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {language === "en" ? "Active Events" : "เหตุการณ์ที่เกิดขึ้น"}
                  <Badge variant="secondary" className="ml-auto">
                    {filteredEvents.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {filteredEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {language === "en" ? "No events found" : "ไม่พบเหตุการณ์"}
                    </p>
                  ) : (
                    filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedEvent?.id === event.id
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => {
                          setSelectedEvent(event);
                          if (mapRef.current) {
                            mapRef.current.location(
                              {
                                lon: event.location.lng,
                                lat: event.location.lat,
                              },
                              true,
                            );
                          }
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor:
                                getEventColor(event.severity) + "20",
                            }}
                          >
                            <span>{event.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm truncate">
                                {language === "en"
                                  ? event.title_en
                                  : event.title_th}
                              </p>
                              <Badge
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  backgroundColor:
                                    getEventColor(event.severity) + "20",
                                  color: getEventColor(event.severity),
                                  borderColor: getEventColor(event.severity),
                                }}
                              >
                                {getSeverityLabel(event.severity, language)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {event.roadName || ""}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatEventTime(event.timestamp, language)}
                              </span>
                              {event.distance && (
                                <>
                                  <span>•</span>
                                  <MapPin className="h-3 w-3" />
                                  <span>{event.distance.toFixed(1)} km</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
