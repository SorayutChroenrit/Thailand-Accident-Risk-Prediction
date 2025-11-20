import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Header } from "~/components/layout/Header";
import { Footer } from "~/components/layout/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  MapPin,
  Navigation,
  AlertTriangle,
  Shield,
  Clock,
  Route as RouteIcon,
  Loader2,
  CheckCircle,
  ArrowRight,
  Car,
  Zap,
  Undo2,
  Star,
  Sun,
  Cloud,
  CloudRain,
  Coffee,
  Fuel,
  Share2,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { riskLocations } from "~/lib/mock-data";
import { useLanguage } from "~/contexts/LanguageContext";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { waitForLongdo } from "~/lib/longdo";

export const Route = createFileRoute("/route-analysis")({
  component: () => (
    <ProtectedRoute>
      <RouteAnalysisPage />
    </ProtectedRoute>
  ),
});

// Calculate distance
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Generate time segments with risk
const generateTimeSegments = (
  departureTime: string,
  duration: number,
  baseRisk: number,
) => {
  const segments = [];
  const [hours, minutes] = departureTime.split(":").map(Number);
  let currentMinutes = hours * 60 + minutes;
  let remainingDuration = duration;

  // Determine segment size based on total duration
  let segmentSize: number;
  if (duration < 30) {
    // Very short trip: single segment
    segmentSize = duration;
  } else if (duration <= 60) {
    // Short trip (30-60 min): 15-20 minute segments
    segmentSize = 15;
  } else if (duration <= 180) {
    // Medium trip (1-3 hours): 30 minute segments
    segmentSize = 30;
  } else {
    // Long trip (> 3 hours): 60 minute segments
    segmentSize = 60;
  }

  while (remainingDuration > 0) {
    const currentSegmentDuration = Math.min(segmentSize, remainingDuration);
    const startHour = Math.floor(currentMinutes / 60) % 24;
    const startMin = currentMinutes % 60;
    const endMinutes = currentMinutes + currentSegmentDuration;
    const endHour = Math.floor(endMinutes / 60) % 24;
    const endMin = endMinutes % 60;

    // Calculate risk based on time of day
    let timeRisk = baseRisk;
    if (startHour >= 7 && startHour <= 9) timeRisk += 15; // Morning rush
    if (startHour >= 17 && startHour <= 19) timeRisk += 20; // Evening rush
    if (startHour >= 22 || startHour <= 5) timeRisk += 10; // Night driving
    if (startHour >= 10 && startHour <= 12) timeRisk += 5; // Late morning

    timeRisk = Math.min(95, Math.max(10, timeRisk + (Math.random() * 10 - 5)));

    segments.push({
      startTime: `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`,
      endTime: `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`,
      risk: Math.round(timeRisk),
      duration: currentSegmentDuration,
    });

    currentMinutes = endMinutes;
    remainingDuration -= currentSegmentDuration;
  }

  return segments;
};

// Generate route options
const generateRouteOptions = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  departureTime: string,
) => {
  const directDistance = calculateDistance(fromLat, fromLng, toLat, toLng);

  const routes = [
    {
      id: 1,
      name_en: "Main Road (Direct)",
      name_th: "ถนนหลัก (ทางตรง)",
      distance: directDistance,
      duration: Math.round(directDistance * 3), // 3 min per km in city
      baseRisk: 45,
      tollCost: 0,
      fuelCost: Math.round(directDistance * 3.5),
    },
    {
      id: 2,
      name_en: "Via Expressway",
      name_th: "ทางด่วน",
      distance: directDistance * 1.2,
      duration: Math.round(directDistance * 2), // Faster via expressway
      baseRisk: 35,
      tollCost: Math.round(directDistance * 5),
      fuelCost: Math.round(directDistance * 3),
    },
    {
      id: 3,
      name_en: "Local Roads",
      name_th: "ถนนในซอย",
      distance: directDistance * 1.1,
      duration: Math.round(directDistance * 4), // Slower through local roads
      baseRisk: 30,
      tollCost: 0,
      fuelCost: Math.round(directDistance * 4),
    },
  ];

  return routes
    .map((route) => {
      const segments = generateTimeSegments(
        departureTime,
        route.duration,
        route.baseRisk,
      );
      const overallRisk = Math.round(
        segments.reduce((sum, s) => sum + s.risk, 0) / segments.length,
      );

      return {
        ...route,
        segments,
        overallRisk,
        recommended: false,
      };
    })
    .map((route, _, arr) => ({
      ...route,
      recommended:
        route.overallRisk === Math.min(...arr.map((r) => r.overallRisk)),
    }));
};

// Generate weather forecast
const generateWeatherForecast = (departureTime: string, duration: number) => {
  const [hours] = departureTime.split(":").map(Number);
  const forecasts = [];
  let currentHour = hours;
  let remaining = duration;

  while (remaining > 0) {
    const endHour = Math.min(
      currentHour + 4,
      currentHour + Math.floor(remaining / 60),
    );
    const weather = Math.random();

    forecasts.push({
      time: `${String(currentHour).padStart(2, "0")}:00-${String(endHour % 24).padStart(2, "0")}:00`,
      condition: weather < 0.6 ? "clear" : weather < 0.85 ? "cloudy" : "rain",
      temp: Math.round(28 + Math.random() * 6),
    });

    currentHour = endHour % 24;
    remaining -= 240;
  }

  return forecasts;
};

// Location type for search results
interface SearchLocation {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

function RouteAnalysisPage() {
  const { language } = useLanguage();
  const [fromLocation, setFromLocation] = useState<SearchLocation | null>(null);
  const [toLocation, setToLocation] = useState<SearchLocation | null>(null);
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [fromResults, setFromResults] = useState<SearchLocation[]>([]);
  const [toResults, setToResults] = useState<SearchLocation[]>([]);
  const [isSearchingFrom, setIsSearchingFrom] = useState(false);
  const [isSearchingTo, setIsSearchingTo] = useState(false);
  const [departureDate, setDepartureDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [departureTime, setDepartureTime] = useState("06:00");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    routes: any[];
    weather: any[];
    tips: any[];
  } | null>(null);

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fromSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  const toSearchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Search places using Longdo Search API
  const searchPlaces = async (
    query: string,
    setResults: (results: SearchLocation[]) => void,
    setLoading: (loading: boolean) => void,
  ) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://search.longdo.com/mapsearch/json/search?keyword=${encodeURIComponent(query)}&limit=5&key=370a1776e0879ff8bb99731798210fd7`,
      );
      const data = await response.json();

      const results: SearchLocation[] = (data.data || []).map(
        (item: any, index: number) => ({
          id: index,
          name: item.name || item.address,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }),
      );

      setResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search for From location
  useEffect(() => {
    if (fromSearchTimeout.current) {
      clearTimeout(fromSearchTimeout.current);
    }

    if (fromSearch.length >= 2) {
      fromSearchTimeout.current = setTimeout(() => {
        searchPlaces(fromSearch, setFromResults, setIsSearchingFrom);
      }, 300);
    } else {
      setFromResults([]);
    }

    return () => {
      if (fromSearchTimeout.current) {
        clearTimeout(fromSearchTimeout.current);
      }
    };
  }, [fromSearch]);

  // Debounced search for To location
  useEffect(() => {
    if (toSearchTimeout.current) {
      clearTimeout(toSearchTimeout.current);
    }

    if (toSearch.length >= 2) {
      toSearchTimeout.current = setTimeout(() => {
        searchPlaces(toSearch, setToResults, setIsSearchingTo);
      }, 300);
    } else {
      setToResults([]);
    }

    return () => {
      if (toSearchTimeout.current) {
        clearTimeout(toSearchTimeout.current);
      }
    };
  }, [toSearch]);

  // Analyze route
  const analyzeRoute = async () => {
    if (!fromLocation || !toLocation) return;
    setIsAnalyzing(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const routes = generateRouteOptions(
      fromLocation.lat,
      fromLocation.lng,
      toLocation.lat,
      toLocation.lng,
      departureTime,
    );

    const recommendedRoute = routes.find((r) => r.recommended);
    const weather = generateWeatherForecast(
      departureTime,
      recommendedRoute?.duration || 360,
    );

    const tips = [
      {
        icon: <Coffee className="h-4 w-4" />,
        text_en: `Rest stop recommended at km ${Math.round((recommendedRoute?.distance || 100) * 0.4)}`,
        text_th: `แนะนำให้พักที่ กม. ${Math.round((recommendedRoute?.distance || 100) * 0.4)}`,
      },
      {
        icon: <Fuel className="h-4 w-4" />,
        text_en: `Refuel at km ${Math.round((recommendedRoute?.distance || 100) * 0.6)}`,
        text_th: `เติมน้ำมันที่ กม. ${Math.round((recommendedRoute?.distance || 100) * 0.6)}`,
      },
    ];

    if (weather.some((w) => w.condition === "rain")) {
      tips.push({
        icon: <CloudRain className="h-4 w-4" />,
        text_en: "Rain expected - drive carefully and reduce speed",
        text_th: "คาดว่าจะมีฝน - ขับขี่ระมัดระวังและลดความเร็ว",
      });
    }

    setAnalysisResult({ routes, weather, tips });
    const recommendedId = routes.find((r) => r.recommended)?.id || null;
    setExpandedRoute(recommendedId);
    setSelectedRouteId(recommendedId);
    setIsAnalyzing(false);
  };

  // Initialize Longdo Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initMap = async () => {
      await waitForLongdo();

      if (!mapContainerRef.current || !(window as any).longdo) return;

      if (!mapRef.current) {
        const map = new (window as any).longdo.Map({
          placeholder: mapContainerRef.current,
          location: { lon: 100.5018, lat: 13.7563 },
          zoom: 11,
          language: language === "th" ? "th" : "en",
        });
        mapRef.current = map;
      }

      const map = mapRef.current;

      // Clear existing overlays
      map.Overlays.clear();
      map.Route.clear();

      // Add origin marker (A - Green)
      if (fromLocation) {
        const fromMarker = new (window as any).longdo.Marker(
          { lon: fromLocation.lng, lat: fromLocation.lat },
          {
            title: language === "en" ? "Origin" : "ต้นทาง",
            icon: {
              html: `<div style="background: #22C55E; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 16px; font-weight: bold;">A</span>
            </div>`,
              offset: { x: 16, y: 16 },
            },
          },
        );
        map.Overlays.add(fromMarker);
      }

      // Add destination marker (B - Red)
      if (toLocation) {
        const toMarker = new (window as any).longdo.Marker(
          { lon: toLocation.lng, lat: toLocation.lat },
          {
            title: language === "en" ? "Destination" : "ปลายทาง",
            icon: {
              html: `<div style="background: #DC2626; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 16px; font-weight: bold;">B</span>
            </div>`,
              offset: { x: 16, y: 16 },
            },
          },
        );
        map.Overlays.add(toMarker);
      }

      // Fetch and display route using Longdo Routing API
      if (fromLocation && toLocation) {
        const fetchRoute = async () => {
          try {
            // Use Longdo Routing API (free tier)
            const response = await fetch(
              `https://api.longdo.com/RouteService/json/route/guide?flon=${fromLocation.lng}&flat=${fromLocation.lat}&tlon=${toLocation.lng}&tlat=${toLocation.lat}&mode=c&key=370a1776e0879ff8bb99731798210fd7`,
            );
            const data = await response.json();

            if (data && data.data && data.data.length > 0) {
              // Get the route geometry
              const routeData = data.data[0];

              // Create polyline from route
              const coordinates = routeData.guide.map((point: any) => ({
                lon: point.x,
                lat: point.y,
              }));

              if (coordinates.length > 0) {
                // Background shadow for depth
                const shadowLine = new (window as any).longdo.Polyline(
                  coordinates,
                  {
                    lineWidth: 10,
                    lineColor: "rgba(30, 64, 175, 0.2)",
                    title: "",
                  },
                );
                map.Overlays.add(shadowLine);

                // Main route line (Apple Maps style - blue)
                const routeLine = new (window as any).longdo.Polyline(
                  coordinates,
                  {
                    lineWidth: 6,
                    lineColor: "rgba(59, 130, 246, 1)",
                    title: language === "en" ? "Route" : "เส้นทาง",
                  },
                );
                map.Overlays.add(routeLine);

                // Fit bounds to show entire route
                map.bound({
                  boundUpdate: true,
                  marginWidth: 50,
                  marginHeight: 50,
                });
              }
            } else {
              // Fallback: draw straight line if routing fails
              const straightLine = new (window as any).longdo.Polyline(
                [
                  { lon: fromLocation.lng, lat: fromLocation.lat },
                  { lon: toLocation.lng, lat: toLocation.lat },
                ],
                {
                  lineWidth: 6,
                  lineColor: "rgba(59, 130, 246, 0.8)",
                  lineStyle: (window as any).longdo.LineStyle.Dashed,
                },
              );
              map.Overlays.add(straightLine);
              map.bound({
                boundUpdate: true,
                marginWidth: 50,
                marginHeight: 50,
              });
            }
          } catch (error) {
            console.error("Routing error:", error);
            // Fallback: draw straight line
            const straightLine = new (window as any).longdo.Polyline(
              [
                { lon: fromLocation.lng, lat: fromLocation.lat },
                { lon: toLocation.lng, lat: toLocation.lat },
              ],
              {
                lineWidth: 6,
                lineColor: "rgba(59, 130, 246, 0.8)",
                lineStyle: (window as any).longdo.LineStyle.Dashed,
              },
            );
            map.Overlays.add(straightLine);
            map.bound({ boundUpdate: true, marginWidth: 50, marginHeight: 50 });
          }
        };

        fetchRoute();
      }
    };

    initMap();
  }, [fromLocation, toLocation, selectedRouteId, language]);

  const getRiskColor = (risk: number) => {
    if (risk >= 60) return "#DC2626";
    if (risk >= 40) return "#F59E0B";
    return "#22C55E";
  };

  const getRiskLabel = (risk: number) => {
    if (risk >= 60) return { en: "High", th: "สูง" };
    if (risk >= 40) return { en: "Medium", th: "ปานกลาง" };
    return { en: "Low", th: "ต่ำ" };
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {language === "en"
              ? "Route Risk Analysis"
              : "วิเคราะห์ความเสี่ยงเส้นทาง"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === "en"
              ? "Plan your trip with time-based risk prediction"
              : "วางแผนการเดินทางพร้อมการทำนายความเสี่ยงตามเวลา"}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Input & Map */}
          <div className="space-y-4">
            {/* Trip Planning Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <RouteIcon className="h-4 w-4" />
                  {language === "en" ? "Plan Your Trip" : "วางแผนการเดินทาง"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* From */}
                <div className="relative">
                  <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">A</span>
                    </div>
                    {language === "en" ? "Origin" : "ต้นทาง"}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      language === "en" ? "Search origin..." : "ค้นหาต้นทาง..."
                    }
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                    value={fromSearch}
                    onChange={(e) => {
                      setFromSearch(e.target.value);
                      setShowFromDropdown(true);
                      if (!e.target.value) setFromLocation(null);
                    }}
                    onFocus={() => setShowFromDropdown(true)}
                  />
                  {showFromDropdown && fromSearch.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {isSearchingFrom ? (
                        <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                          {language === "en" ? "Searching..." : "กำลังค้นหา..."}
                        </div>
                      ) : fromResults.length > 0 ? (
                        fromResults.map((loc) => (
                          <button
                            key={loc.id}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b last:border-b-0"
                            onClick={() => {
                              setFromLocation(loc);
                              setFromSearch(loc.name);
                              setShowFromDropdown(false);
                              setFromResults([]);
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <span className="line-clamp-2">{loc.name}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                          {language === "en"
                            ? "No results found"
                            : "ไม่พบผลลัพธ์"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* To */}
                <div className="relative">
                  <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">B</span>
                    </div>
                    {language === "en" ? "Destination" : "ปลายทาง"}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      language === "en"
                        ? "Search destination..."
                        : "ค้นหาปลายทาง..."
                    }
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                    value={toSearch}
                    onChange={(e) => {
                      setToSearch(e.target.value);
                      setShowToDropdown(true);
                      if (!e.target.value) setToLocation(null);
                    }}
                    onFocus={() => setShowToDropdown(true)}
                  />
                  {showToDropdown && toSearch.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {isSearchingTo ? (
                        <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                          {language === "en" ? "Searching..." : "กำลังค้นหา..."}
                        </div>
                      ) : toResults.length > 0 ? (
                        toResults.map((loc) => (
                          <button
                            key={loc.id}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b last:border-b-0"
                            onClick={() => {
                              setToLocation(loc);
                              setToSearch(loc.name);
                              setShowToDropdown(false);
                              setToResults([]);
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <span className="line-clamp-2">{loc.name}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                          {language === "en"
                            ? "No results found"
                            : "ไม่พบผลลัพธ์"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                      <Calendar className="h-4 w-4" />
                      {language === "en" ? "Date" : "วันที่"}
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                      <Clock className="h-4 w-4" />
                      {language === "en" ? "Time" : "เวลา"}
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Analyze Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={analyzeRoute}
                  disabled={!fromLocation || !toLocation || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === "en" ? "Analyzing..." : "กำลังวิเคราะห์..."}
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      {language === "en"
                        ? "Analyze Routes"
                        : "วิเคราะห์เส้นทาง"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Map */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {language === "en" ? "Route Map" : "แผนที่"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      mapRef.current?.setView([13.7563, 100.5018], 11)
                    }
                  >
                    <Undo2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  ref={mapContainerRef}
                  className="h-[250px] rounded-lg overflow-hidden"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-4">
            {analysisResult ? (
              <>
                {/* Route Options */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {language === "en" ? "Route Options" : "ตัวเลือกเส้นทาง"}
                    </CardTitle>
                    <CardDescription>
                      {language === "en"
                        ? "Compared by time-based risk prediction"
                        : "เปรียบเทียบด้วยการทำนายความเสี่ยงตามเวลา"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysisResult.routes.map((route) => (
                      <div
                        key={route.id}
                        className={`border rounded-lg overflow-hidden ${
                          route.recommended
                            ? "border-green-300 bg-green-50/50"
                            : ""
                        }`}
                      >
                        {/* Route Header */}
                        <button
                          className="w-full p-3 text-left"
                          onClick={() => {
                            setExpandedRoute(
                              expandedRoute === route.id ? null : route.id,
                            );
                            setSelectedRouteId(route.id);
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {language === "en"
                                  ? route.name_en
                                  : route.name_th}
                              </span>
                              {route.recommended && (
                                <Badge
                                  variant="success"
                                  className="text-xs gap-1"
                                >
                                  <Star className="h-3 w-3" />
                                  {language === "en" ? "Best" : "แนะนำ"}
                                </Badge>
                              )}
                            </div>
                            {expandedRoute === route.id ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">
                                {language === "en" ? "Distance" : "ระยะทาง"}
                              </p>
                              <p className="font-semibold">
                                {route.distance.toFixed(0)} km
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                {language === "en" ? "Time" : "เวลา"}
                              </p>
                              <p className="font-semibold">
                                {Math.floor(route.duration / 60)}h{" "}
                                {route.duration % 60}m
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                {language === "en" ? "Risk" : "ความเสี่ยง"}
                              </p>
                              <p
                                className="font-semibold"
                                style={{
                                  color: getRiskColor(route.overallRisk),
                                }}
                              >
                                {route.overallRisk}%
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                {language === "en" ? "Toll" : "ค่าทางด่วน"}
                              </p>
                              <p className="font-semibold">{route.tollCost}฿</p>
                            </div>
                          </div>
                        </button>

                        {/* Expanded Content - Time Segments */}
                        {expandedRoute === route.id && (
                          <div className="border-t bg-muted/30 p-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              {language === "en"
                                ? "Risk by Time Segment"
                                : "ความเสี่ยงตามช่วงเวลา"}
                            </p>
                            {route.segments.map((seg: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 text-xs"
                              >
                                <span className="w-24 text-muted-foreground">
                                  {seg.startTime}-{seg.endTime}
                                </span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${seg.risk}%`,
                                      backgroundColor: getRiskColor(seg.risk),
                                    }}
                                  />
                                </div>
                                <span
                                  className="w-12 text-right font-medium"
                                  style={{ color: getRiskColor(seg.risk) }}
                                >
                                  {seg.risk}%
                                </span>
                                <span className="w-16 text-muted-foreground">
                                  {language === "en"
                                    ? getRiskLabel(seg.risk).en
                                    : getRiskLabel(seg.risk).th}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Weather Forecast */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      {language === "en" ? "Weather Forecast" : "พยากรณ์อากาศ"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisResult.weather.map((w, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {w.time}
                          </span>
                          <div className="flex items-center gap-2">
                            {w.condition === "clear" && (
                              <Sun className="h-4 w-4 text-yellow-500" />
                            )}
                            {w.condition === "cloudy" && (
                              <Cloud className="h-4 w-4 text-gray-400" />
                            )}
                            {w.condition === "rain" && (
                              <CloudRain className="h-4 w-4 text-blue-500" />
                            )}
                            <span>{w.temp}°C</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {language === "en"
                        ? "Tips for This Route"
                        : "คำแนะนำสำหรับเส้นทางนี้"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.tips.map((tip, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 text-sm"
                        >
                          <div className="text-primary mt-0.5">{tip.icon}</div>
                          <span>
                            {language === "en" ? tip.text_en : tip.text_th}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button className="flex-1 gap-2">
                    <Navigation className="h-4 w-4" />
                    {language === "en" ? "Start Navigation" : "เริ่มนำทาง"}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <Navigation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {language === "en"
                      ? "Plan Your Journey"
                      : "วางแผนการเดินทาง"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {language === "en"
                      ? "Enter origin, destination, and departure time to analyze route risks"
                      : "กรอกต้นทาง ปลายทาง และเวลาออกเดินทางเพื่อวิเคราะห์ความเสี่ยง"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
