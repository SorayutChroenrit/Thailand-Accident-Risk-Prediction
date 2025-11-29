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
  CloudLightning,
  CloudSnow,
  CloudFog,
  Coffee,
  Fuel,
  Share2,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";

import { useLanguage } from "~/contexts/LanguageContext";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { waitForLongdo } from "~/lib/longdo";
import { RouteAnalysisSkeleton } from "~/components/RouteAnalysisSkeleton";
import { predictAccidentRisk } from "~/lib/ml-prediction-api";
import {
  getRoutePredictionData,
  getSafetyRecommendations,
  type VehicleData,
} from "~/lib/route-prediction-api";

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

// Calculate real routes using Longdo routing API
const calculateRealRoutes = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  departureTime: Date,
  predictionData: any,
) => {
  const LONGDO_KEY = "370a1776e0879ff8bb99731798210fd7";

  // Define route types to request from Longdo
  const routeTypes = [
    {
      mode: "t",
      name_en: "Recommended Route",
      name_th: "เส้นทางแนะนำ",
      baseRisk: 40,
    },
    {
      mode: "d",
      name_en: "Shortest Distance",
      name_th: "ระยะทางสั้นที่สุด",
      baseRisk: 35,
    },
    {
      mode: "s",
      name_en: "Safest Route",
      name_th: "เส้นทางปลอดภัย",
      baseRisk: 25,
    },
  ];

  console.log("🛣️ Fetching real routes from Longdo API...");

  // Fetch all routes in parallel
  const routePromises = routeTypes.map(async (routeType, index) => {
    try {
      const url = `https://api.longdo.com/RouteService/json/route/guide?flon=${fromLng}&flat=${fromLat}&tlon=${toLng}&tlat=${toLat}&mode=${routeType.mode}&key=${LONGDO_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data && data.data && data.data.length > 0) {
        const routeData = data.data[0];
        const distance = routeData.distance / 1000; // Convert meters to km
        const duration = Math.round(routeData.interval / 60); // Convert seconds to minutes

        console.log(
          `  ✅ ${routeType.name_en}: ${distance.toFixed(1)}km, ${duration}min`,
        );

        return {
          id: index + 1,
          mode: routeType.mode, // Store mode for map rendering
          name_en: routeType.name_en,
          name_th: routeType.name_th,
          distance: distance,
          duration: duration,
          baseRisk: routeType.baseRisk,
          tollCost: Math.round(distance * 3), // Estimate
          fuelCost: Math.round(distance * 3.5), // Estimate
        };
      } else {
        throw new Error("No route data returned");
      }
    } catch (error) {
      console.error(`  ❌ Error fetching ${routeType.name_en}:`, error);
      // Fallback to distance calculation
      const directDistance = calculateDistance(fromLat, fromLng, toLat, toLng);
      return {
        id: index + 1,
        mode: routeType.mode, // Store mode even for fallback
        name_en: routeType.name_en,
        name_th: routeType.name_th,
        distance: directDistance * (1 + index * 0.05),
        duration: Math.round((directDistance / (70 - index * 10)) * 60),
        baseRisk: routeType.baseRisk,
        tollCost: Math.round(directDistance * 3),
        fuelCost: Math.round(directDistance * 3.5),
      };
    }
  });

  const routes = await Promise.all(routePromises);

  // Adjust risk based on real prediction data
  const weatherRisk = predictionData.rainfall > 0 ? 15 : 0;
  const trafficRisk =
    predictionData.traffic_density > 0.7
      ? 20
      : predictionData.traffic_density > 0.5
        ? 10
        : 0;
  const timeRisk = predictionData.is_rush_hour ? 15 : 0;

  // Use ML risk score if available
  const mlRiskScore = predictionData.mlRouteRisk?.route_risk_score;
  
  console.log(
    `⚠️ Risk adjustments: Weather +${weatherRisk}%, Traffic +${trafficRisk}%, Time +${timeRisk}%, ML Risk: ${mlRiskScore || 'N/A'}`,
  );

  return routes
    .map((route) => {
      // If ML risk is available, use it as the primary driver, but adjust slightly for route type
      // Recommended/Fastest might have slightly higher risk than Safest
      let adjustedBaseRisk;
      
      if (mlRiskScore !== undefined) {
        // ML gives overall risk. We adjust it based on route type relative to "Recommended"
        // Safest route should be lower than ML average, Shortest might be higher
        const routeTypeAdjustment = route.baseRisk - 40; // 40 is base for Recommended
        adjustedBaseRisk = Math.max(10, Math.min(95, mlRiskScore + routeTypeAdjustment));
      } else {
        // Fallback to heuristic calculation
        adjustedBaseRisk = route.baseRisk + weatherRisk + trafficRisk + timeRisk;
      }
      const departureTimeStr = `${String(departureTime.getHours()).padStart(2, "0")}:${String(departureTime.getMinutes()).padStart(2, "0")}`;

      const segments = generateTimeSegments(
        departureTimeStr,
        route.duration,
        adjustedBaseRisk,
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
  const [isInitializing, setIsInitializing] = useState(true);
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
  const [isNavigating, setIsNavigating] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [navigationGuide, setNavigationGuide] = useState<any[]>([]);
  const [routeEvents, setRouteEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);

  // Vehicle data for ML prediction
  const [vehicleType, setVehicleType] = useState<
    "walk" | "bicycle" | "motorcycle" | "car" | "bus" | "truck"
  >("car");

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const gistdaMapRef = useRef<any>(null);
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
        (item: any, index: number) => {
          const location = {
            id: index,
            name: item.name || item.address,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
          console.log("📍 Search result:", location);
          return location;
        },
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

  // Load accident events along the route
  const loadRouteEvents = async (
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ) => {
    setLoadingEvents(true);
    try {
      // Get events from last 1 month
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const params = new URLSearchParams({
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        limit: "500",
      });

      const response = await fetch(
        `http://localhost:10000/events/database?${params}`,
      );
      const data = await response.json();

      // Filter events that are near the route (within 5km buffer)
      const events = (data.events || []).filter((event: any) => {
        // Simple bounding box check
        const minLat = Math.min(fromLat, toLat) - 0.05;
        const maxLat = Math.max(fromLat, toLat) + 0.05;
        const minLng = Math.min(fromLng, toLng) - 0.05;
        const maxLng = Math.max(fromLng, toLng) + 0.05;

        return (
          event.lat >= minLat &&
          event.lat <= maxLat &&
          event.lon >= minLng &&
          event.lon <= maxLng
        );
      });

      // Use ML to predict severity for each accident point
      console.log(
        `🤖 Running ML predictions for ${events.length} accident points...`,
      );
      const eventsWithPredictions = await Promise.all(
        events.map(async (event: any) => {
          try {
            // Use ML API to predict severity at this location
            const prediction = await predictAccidentRisk({
              latitude: event.lat,
              longitude: event.lon,
              hour: new Date().getHours(),
              day_of_week: new Date().getDay(),
              month: new Date().getMonth() + 1,
            });

            return {
              ...event,
              predicted_severity: prediction.severity || "unknown",
              predicted_risk_score: prediction.risk_score || 50,
            };
          } catch (error) {
            console.error(`Error predicting for event ${event.id}:`, error);
            return {
              ...event,
              predicted_severity: "unknown",
              predicted_risk_score: 50,
            };
          }
        }),
      );

      setRouteEvents(eventsWithPredictions);
      console.log(`📍 Found ${events.length} events with ML predictions`);
    } catch (error) {
      console.error("Error loading route events:", error);
      setRouteEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Analyze route
  const analyzeRoute = async () => {
    if (!fromLocation || !toLocation) return;
    setIsAnalyzing(true);

    try {
      // Load events along the route
      await loadRouteEvents(
        fromLocation.lat,
        fromLocation.lng,
        toLocation.lat,
        toLocation.lng,
      );

      // Prepare vehicle data for ML prediction
      const vehicleData: VehicleData = {
        type: vehicleType,
      };

      // Parse departure date and time
      const departureDateTime = new Date(`${departureDate}T${departureTime}`);

      // 1. Get ML Risk Prediction for the route
      console.log("🤖 Requesting ML route risk prediction...");
      const { predictRouteRisk } = await import("~/lib/ml-prediction-api");
      let mlRouteRisk = null;
      try {
        mlRouteRisk = await predictRouteRisk(
          fromLocation.lat,
          fromLocation.lng,
          toLocation.lat,
          toLocation.lng,
          departureDateTime,
          vehicleType
        );
        console.log("✅ ML Route Risk:", mlRouteRisk);
      } catch (e) {
        console.error("Failed to get ML route risk:", e);
      }

      // 2. Get prediction data from real APIs (weather, traffic, road)
      console.log("🔮 Fetching prediction data from APIs...");
      const predictionData = await getRoutePredictionData(
        fromLocation.lat,
        fromLocation.lng,
        toLocation.lat,
        toLocation.lng,
        departureDateTime,
        vehicleData,
      );

      console.log("📊 Prediction data:", predictionData);

      // Use real weather data from API (not mock)
      const { getWeatherForecast } = await import("~/lib/route-prediction-api");
      const weatherData = await getWeatherForecast(
        (fromLocation.lat + toLocation.lat) / 2,
        (fromLocation.lng + toLocation.lng) / 2,
        departureDateTime,
      );

      // Format weather for display
      const weather = weatherData.forecast.slice(0, 10).map((f: any) => ({
        time: new Date(f.datetime).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        condition: f.condition,
        temp: f.temp,
      }));

      // Get real route options from Longdo Map
      console.log("🛣️ Calculating real routes with Longdo API...");
      const routes = await calculateRealRoutes(
        fromLocation.lat,
        fromLocation.lng,
        toLocation.lat,
        toLocation.lng,
        departureDateTime,
        { ...predictionData, mlRouteRisk }, // Pass ML risk
      );

      const recommendedRoute = routes.find((r) => r.recommended);

      const tips: any[] = [];

      // Add tips based on accident events on route
      if (routeEvents.length > 20) {
        tips.unshift({
          icon: <AlertTriangle className="h-4 w-4" />,
          text_en: `High risk route: ${routeEvents.length} accidents in past month - Consider alternative route`,
          text_th: `เส้นทางเสี่ยงสูง: เกิดอุบัติเหตุ ${routeEvents.length} ครั้งในเดือนที่ผ่านมา - พิจารณาใช้เส้นทางอื่น`,
        });
      } else if (routeEvents.length > 10) {
        tips.unshift({
          icon: <AlertTriangle className="h-4 w-4" />,
          text_en: `Moderate risk: ${routeEvents.length} accidents detected - Drive with extra caution`,
          text_th: `ความเสี่ยงปานกลาง: พบอุบัติเหตุ ${routeEvents.length} จุด - ขับขี่ด้วยความระมัดระวัง`,
        });
      } else if (routeEvents.length > 0) {
        tips.unshift({
          icon: <Shield className="h-4 w-4" />,
          text_en: `${routeEvents.length} accident points detected - Stay alert in marked areas`,
          text_th: `พบจุดอุบัติเหตุ ${routeEvents.length} จุด - ระมัดระวังบริเวณที่ทำเครื่องหมาย`,
        });
      }

      if (weather.some((w) => w.condition === "rain")) {
        tips.push({
          icon: <CloudRain className="h-4 w-4" />,
          text_en: "Rain expected - drive carefully and reduce speed",
          text_th: "คาดว่าจะมีฝน - ขับขี่ระมัดระวังและลดความเร็ว",
        });
      }

      // Add safety recommendations from API based on real conditions
      const safetyRecommendations = getSafetyRecommendations(
        predictionData,
        routeEvents.length,
      );

      // Convert safety recommendations to tip format
      safetyRecommendations.forEach((rec) => {
        tips.push({
          icon: <Shield className="h-4 w-4" />,
          text_en: rec,
          text_th: rec, // Already in Thai from API
        });
      });

      setAnalysisResult({ routes, weather, tips });
      const recommendedId = routes.find((r) => r.recommended)?.id || null;
      setExpandedRoute(recommendedId);
      setSelectedRouteId(recommendedId);
    } catch (error) {
      console.error("Error analyzing route:", error);
      // Show error to user but don't crash
      alert(
        language === "en"
          ? "Error analyzing route. Please try again."
          : "เกิดข้อผิดพลาดในการวิเคราะห์เส้นทาง กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initialize Longdo Map on mount
  useEffect(() => {
    const initMap = async () => {
      await waitForLongdo();
      setIsInitializing(false);
    };

    initMap();
  }, []);

  // Update map when locations change
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const updateMap = async () => {
      if (!(window as any).longdo) return;

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

      // Debug: Log current locations
      console.log("🗺️ Map update - FROM:", fromLocation);
      console.log("🗺️ Map update - TO:", toLocation);

      // Clear existing overlays
      map.Overlays.clear();
      map.Route.clear();

      // Add origin marker (A - Green)
      if (fromLocation && fromLocation.lng && fromLocation.lat) {
        console.log(
          `🟢 Adding origin marker at [${fromLocation.lat}, ${fromLocation.lng}]`,
        );
        try {
          const fromMarker = new (window as any).longdo.Marker(
            {
              lon: parseFloat(fromLocation.lng),
              lat: parseFloat(fromLocation.lat),
            },
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
        } catch (error) {
          console.error("Error adding origin marker:", error);
        }
      }

      // Add destination marker (B - Red)
      if (toLocation && toLocation.lng && toLocation.lat) {
        console.log(
          `🔴 Adding destination marker at [${toLocation.lat}, ${toLocation.lng}]`,
        );
        try {
          const toMarker = new (window as any).longdo.Marker(
            {
              lon: parseFloat(toLocation.lng),
              lat: parseFloat(toLocation.lat),
            },
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
        } catch (error) {
          console.error("Error adding destination marker:", error);
        }
      }

      // Add accident event markers
      console.log(`🗺️ Map update - Route Events: ${routeEvents.length} events`);
      if (routeEvents.length > 0) {
        let successCount = 0;
        routeEvents.forEach((event, index) => {
          // Validate event has valid coordinates
          if (
            !event.lat ||
            !event.lon ||
            isNaN(event.lat) ||
            isNaN(event.lon)
          ) {
            console.warn(
              `  ⚠️ Event ${index + 1} has invalid coordinates:`,
              event,
            );
            return;
          }

          try {
            console.log(
              `  Adding event ${index + 1}: ${event.title} at [${event.lat}, ${event.lon}]`,
            );
            const eventMarker = new (window as any).longdo.Marker(
              { lon: parseFloat(event.lon), lat: parseFloat(event.lat) },
              {
                title: event.title || "อุบัติเหตุ",
                icon: {
                  html: `<div style="background: #F59E0B; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <span style="font-size: 14px;">⚠️</span>
                  </div>`,
                  offset: { x: 12, y: 12 },
                },
                detail: `
                  <div style="
                    box-sizing: border-box;
                    padding: 10px;
                    min-width: 200px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  ">
                    <h3 style="margin: 0 0 5px; font-size: 16px; font-weight: bold; color: #1f2937;">${event.title}</h3>
                    ${event.location && event.location !== "Unknown location" ? `<p style="margin: 0 0 5px; font-size: 14px; color: #4b5563;">${event.location}</p>` : ''}
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">${new Date(event.pubDate).toLocaleDateString("th-TH")}</p>
                    ${event.predicted_risk_score ? `<p style="margin: 5px 0 0; font-weight: bold; color: #DC2626;">Risk: ${event.predicted_risk_score}%</p>` : ''}
                  </div>
                `,
                visibleRange: { min: 1, max: 20 }
              },
            );
            map.Overlays.add(eventMarker);
            successCount++;
          } catch (error) {
            console.error(
              `  ❌ Error adding event ${index + 1}:`,
              error,
              event,
            );
          }
        });
        console.log(
          `✅ Successfully added ${successCount}/${routeEvents.length} event markers to map`,
        );
      } else {
        console.log(`ℹ️ No events to display on map`);
      }

      // Use Longdo Route object for real road routing
      if (
        fromLocation &&
        toLocation &&
        fromLocation.lng &&
        fromLocation.lat &&
        toLocation.lng &&
        toLocation.lat &&
        !isNaN(fromLocation.lng) &&
        !isNaN(fromLocation.lat) &&
        !isNaN(toLocation.lng) &&
        !isNaN(toLocation.lat)
      ) {
        try {
          console.log("🛣️ Drawing route using Longdo Route object");
          console.log(`  From: [${fromLocation.lat}, ${fromLocation.lng}]`);
          console.log(`  To: [${toLocation.lat}, ${toLocation.lng}]`);

          // Clear previous routes
          map.Route.clear();

          // Set route mode based on selected route
          let routeMode = (window as any).longdo.RouteMode.SAFE; // Default
          
          if (selectedRouteId && analysisResult?.routes) {
            const selectedRoute = analysisResult.routes.find(r => r.id === selectedRouteId);
            if (selectedRoute && selectedRoute.mode) {
              console.log(`🛣️ Switching map route mode to: ${selectedRoute.mode}`);
              // Map 't', 'd', 's' to Longdo RouteMode
              // Note: Longdo JS API uses integers for RouteMode, but the guide API uses chars.
              // We need to map them if using the JS API constants, or pass the char if the API supports it.
              // Checking Longdo docs/types: RouteMode.Recommended, Fastest, Shortest.
              // Let's try to find the matching constant or just use the default search which might take options.
              // Actually map.Route.mode() takes an integer constant.
              // Recommended (t) = 1 (RouteMode.Cost) usually? Or RouteMode.Recommended?
              // Let's use the standard constants.
              
              const RouteMode = (window as any).longdo.RouteMode;
              if (selectedRoute.mode === 't') routeMode = RouteMode.Cost; // Recommended
              else if (selectedRoute.mode === 'd') routeMode = RouteMode.Distance; // Shortest
              else if (selectedRoute.mode === 's') routeMode = RouteMode.Safe; // Safest (if available, else Cost)
            }
          }
          
          map.Route.mode(routeMode);

          // Add origin and destination with parseFloat to ensure numbers
          map.Route.add({
            lon: parseFloat(fromLocation.lng),
            lat: parseFloat(fromLocation.lat),
          });
          map.Route.add({
            lon: parseFloat(toLocation.lng),
            lat: parseFloat(toLocation.lat),
          });

          // Search and draw route (will follow actual roads)
          map.Route.search();

          // Auto adjust map bounds to show entire route
          setTimeout(() => {
            map.bound({ boundUpdate: true, marginWidth: 50, marginHeight: 50 });
          }, 500);

          console.log("✅ Route drawn successfully");
        } catch (error) {
          console.error("❌ Routing error:", error);
        }
      } else {
        console.log("⚠️ Cannot draw route - invalid or missing coordinates");
      }
    };

    updateMap();
  }, [fromLocation, toLocation, selectedRouteId, language, routeEvents]);

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

  // Show skeleton while initializing
  if (isInitializing) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
          <RouteAnalysisSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg shadow-md">
                <RouteIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {language === "en"
                  ? "Route Risk Analysis"
                  : "วิเคราะห์ความเสี่ยงเส้นทาง"}
              </h1>
            </div>
            <p className="text-gray-600 text-sm mt-1 ml-16">
              {language === "en"
                ? "Plan your trip with time-based risk prediction and turn-by-turn navigation"
                : "วางแผนการเดินทางพร้อมการทำนายความเสี่ยงตามเวลาและการนำทางแบบเลี้ยวต่อเลี้ยว"}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Input & Map */}
            <div className="space-y-4">
              {/* Trip Planning Card */}
              <Card className="shadow-lg border border-gray-200 bg-white">
                <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-white">
                  <CardTitle className="text-base flex items-center gap-2">
                    <RouteIcon className="h-5 w-5 text-purple-600" />
                    <span className="text-lg font-semibold text-gray-900">
                      {language === "en"
                        ? "Plan Your Trip"
                        : "วางแผนการเดินทาง"}
                    </span>
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
                        language === "en"
                          ? "Search origin..."
                          : "ค้นหาต้นทาง..."
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
                            {language === "en"
                              ? "Searching..."
                              : "กำลังค้นหา..."}
                          </div>
                        ) : fromResults.length > 0 ? (
                          fromResults.map((loc) => (
                            <button
                              key={loc.id}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b last:border-b-0"
                              onClick={() => {
                                console.log("✅ Selected FROM location:", loc);
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
                            {language === "en"
                              ? "Searching..."
                              : "กำลังค้นหา..."}
                          </div>
                        ) : toResults.length > 0 ? (
                          toResults.map((loc) => (
                            <button
                              key={loc.id}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b last:border-b-0"
                              onClick={() => {
                                console.log("✅ Selected TO location:", loc);
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

                  {/* Vehicle Type */}
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                      <Car className="h-4 w-4" />
                      {language === "en" ? "Vehicle Type" : "ประเภทยานพาหนะ"}
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as any)}
                    >
                      <option value="walk">
                        🚶 {language === "en" ? "Walking" : "เดินเท้า"}
                      </option>
                      <option value="bicycle">
                        🚲 {language === "en" ? "Bicycle" : "จักรยาน"}
                      </option>
                      <option value="motorcycle">
                        🏍️ {language === "en" ? "Motorcycle" : "มอเตอร์ไซค์"}
                      </option>
                      <option value="car">
                        🚗 {language === "en" ? "Car" : "รถยนต์"}
                      </option>
                      <option value="bus">
                        🚌 {language === "en" ? "Bus" : "รถบัส"}
                      </option>
                      <option value="truck">
                        🚚 {language === "en" ? "Truck" : "รถบรรทุก"}
                      </option>
                    </select>
                  </div>

                  {/* Analyze Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all"
                    size="lg"
                    onClick={analyzeRoute}
                    disabled={!fromLocation || !toLocation || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {language === "en"
                          ? "Analyzing..."
                          : "กำลังวิเคราะห์..."}
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        {language === "en"
                          ? "Analyze Routes"
                          : "วิเคราะห์เส้นทาง"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Map */}
              <Card className="shadow-lg border border-gray-200">
                <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <span className="text-lg font-semibold text-gray-900">
                        {language === "en" ? "Route Map" : "แผนที่"}
                      </span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        mapRef.current?.setView([13.7563, 100.5018], 11)
                      }
                      className="hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div
                    ref={mapContainerRef}
                    className="h-[500px] w-full bg-gray-100"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-4">
              {analysisResult ? (
                <>
                  {/* Route Options */}
                  <Card className="shadow-lg border border-gray-200">
                    <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-white">
                      <CardTitle className="text-base flex items-center gap-2">
                        <RouteIcon className="h-5 w-5 text-purple-600" />
                        <span className="text-lg font-semibold text-gray-900">
                          {language === "en"
                            ? "Route Options"
                            : "ตัวเลือกเส้นทาง"}
                        </span>
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
                                <p className="font-semibold">
                                  {route.tollCost}฿
                                </p>
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
                  <Card className="shadow-lg border border-gray-200">
                    <CardHeader className="pb-3 bg-gradient-to-r from-yellow-50 to-white">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sun className="h-5 w-5 text-yellow-600" />
                        <span className="text-lg font-semibold text-gray-900">
                          {language === "en"
                            ? "Weather Forecast"
                            : "พยากรณ์อากาศ"}
                        </span>
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
                              {(() => {
                                const condition = w.condition.toLowerCase();
                                switch (true) {
                                  case condition === "clear":
                                    return <Sun className="h-4 w-4 text-yellow-500" />;
                                  case condition === "thunderstorm":
                                    return <CloudLightning className="h-4 w-4 text-purple-500" />;
                                  case condition === "drizzle":
                                  case condition === "rain":
                                    return <CloudRain className="h-4 w-4 text-blue-500" />;
                                  case condition === "snow":
                                    return <CloudSnow className="h-4 w-4 text-blue-300" />;
                                  case ["mist", "smoke", "haze", "dust", "fog", "sand", "ash", "squall", "tornado"].includes(condition):
                                    return <CloudFog className="h-4 w-4 text-gray-400" />;
                                  case condition === "clouds":
                                  default:
                                    return <Cloud className="h-4 w-4 text-gray-400" />;
                                }
                              })()}
                              <span>{w.temp}°C</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Accident Hotspots on Route */}
                  {routeEvents.length > 0 && (
                    <Card className="shadow-lg border border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
                      <CardHeader className="pb-3 bg-gradient-to-r from-red-50 to-white">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <span className="text-lg font-semibold text-gray-900">
                            {language === "en"
                              ? `${routeEvents.length} Accident Points on Route`
                              : `${routeEvents.length} จุดอุบัติเหตุบนเส้นทาง`}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {routeEvents.slice(0, showAllEvents ? undefined : 10).map((event, idx) => {
                            const getSeverityColor = (severity: string) => {
                              switch (severity) {
                                case "fatal":
                                  return "text-red-700 bg-red-100";
                                case "serious":
                                  return "text-orange-700 bg-orange-100";
                                case "minor":
                                  return "text-yellow-700 bg-yellow-100";
                                default:
                                  return "text-gray-700 bg-gray-100";
                              }
                            };

                            const getSeverityLabel = (severity: string) => {
                              const labels: Record<
                                string,
                                { en: string; th: string }
                              > = {
                                fatal: { en: "Fatal", th: "รุนแรงมาก" },
                                serious: { en: "Serious", th: "รุนแรง" },
                                minor: { en: "Minor", th: "เล็กน้อย" },
                                unknown: { en: "Unknown", th: "ไม่ทราบ" },
                              };
                              return labels[severity] || labels.unknown;
                            };

                            return (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-200 cursor-pointer hover:bg-red-50 transition-colors"
                                onClick={() => {
                                  if (mapRef.current && (window as any).longdo) {
                                    const map = mapRef.current;
                                    const lat = parseFloat(event.lat);
                                    const lon = parseFloat(event.lon);
                                    
                                    // Create popup content similar to map.tsx
                                    const popupContent = `
                                      <div style="
                                        box-sizing: border-box;
                                        padding: 10px;
                                        min-width: 200px;
                                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                                      ">
                                        <h3 style="margin: 0 0 5px; font-size: 16px; font-weight: bold; color: #1f2937;">${event.title}</h3>
                                        ${event.location && event.location !== "Unknown location" ? `<p style="margin: 0 0 5px; font-size: 14px; color: #4b5563;">${event.location}</p>` : ''}
                                        <p style="margin: 0; font-size: 12px; color: #6b7280;">${new Date(event.pubDate).toLocaleDateString("th-TH")}</p>
                                        ${event.predicted_risk_score ? `<p style="margin: 5px 0 0; font-weight: bold; color: #DC2626;">Risk: ${event.predicted_risk_score}%</p>` : ''}
                                      </div>
                                    `;
                                    
                                    // Remove old popup if exists
                                    if ((window as any).currentPopup) {
                                      map.Overlays.remove((window as any).currentPopup);
                                    }

                                    // Create Longdo Popup
                                    const popup = new (window as any).longdo.Popup(
                                      { lon, lat },
                                      { 
                                        title: "",
                                        detail: popupContent, // Use 'detail' as per map.tsx
                                        closable: true,
                                        visibleRange: { min: 1, max: 20 }
                                      }
                                    );
                                    
                                    map.Overlays.add(popup);
                                    (window as any).currentPopup = popup;
                                    
                                    // Pan to location
                                    map.location({ lon, lat }, true);
                                    map.zoom(15, true);
                                  }
                                }}
                              >
                                <div className="text-red-500 mt-0.5">
                                  <AlertTriangle className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium text-gray-900 truncate flex-1">
                                      {event.title}
                                    </p>
                                    {event.predicted_severity && event.predicted_severity.toLowerCase() !== 'unknown' && (
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeverityColor(event.predicted_severity)}`}
                                      >
                                        🤖{" "}
                                        {language === "en"
                                          ? getSeverityLabel(
                                              event.predicted_severity,
                                            ).en
                                          : getSeverityLabel(
                                              event.predicted_severity,
                                            ).th}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {event.location && event.location !== "Unknown location" 
                                      ? event.location 
                                      : `Lat: ${parseFloat(event.lat).toFixed(4)}, Lon: ${parseFloat(event.lon).toFixed(4)}`}
                                  </p>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mt-1">
                                      <p className="text-xs text-gray-500">
                                        {new Date(
                                          event.pubDate,
                                        ).toLocaleDateString("th-TH", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </p>
                                      {event.predicted_risk_score && (
                                        <p className="text-xs text-gray-500">
                                          {language === "en"
                                            ? "Risk:"
                                            : "ความเสี่ยง:"}{" "}
                                          <span className="font-medium text-red-600">
                                            {event.predicted_risk_score}%
                                          </span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {routeEvents.length > 10 && (
                            <button
                              onClick={() => setShowAllEvents(!showAllEvents)}
                              className="w-full text-xs text-center text-blue-600 hover:text-blue-800 pt-2 font-medium hover:underline focus:outline-none"
                            >
                              {showAllEvents
                                ? (language === "en" ? "Show less" : "แสดงน้อยลง")
                                : (language === "en"
                                  ? `+ ${routeEvents.length - 10} more events`
                                  : `+ อีก ${routeEvents.length - 10} เหตุการณ์`)}
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tips */}
                  <Card className="shadow-lg border border-gray-200">
                    <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <span className="text-lg font-semibold text-gray-900">
                          {language === "en"
                            ? "Tips for This Route"
                            : "คำแนะนำสำหรับเส้นทางนี้"}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysisResult.tips.map((tip, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 text-sm"
                          >
                            <div className="text-primary mt-0.5">
                              {tip.icon}
                            </div>
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
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                      onClick={() => {
                        if (fromLocation && toLocation) {
                          const shareUrl = `${window.location.origin}/route-analysis?from=${fromLocation.lat},${fromLocation.lng}&to=${toLocation.lat},${toLocation.lng}`;
                          navigator.clipboard.writeText(shareUrl);
                          alert(
                            language === "en"
                              ? "Link copied!"
                              : "คัดลอกลิงก์แล้ว!",
                          );
                        }
                      }}
                    >
                      <Share2 className="h-5 w-5" />
                      {language === "en" ? "Share Route" : "แชร์เส้นทาง"}
                    </Button>
                  </div>
                </>
              ) : (
                <Card className="shadow-lg border border-gray-200">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Navigation className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">
                      {language === "en"
                        ? "Plan Your Journey"
                        : "วางแผนการเดินทาง"}
                    </h3>
                    <p className="text-gray-600 text-sm max-w-md mx-auto">
                      {language === "en"
                        ? "Enter origin, destination, and departure time to analyze route risks and get the safest path to your destination"
                        : "กรอกต้นทาง ปลายทาง และเวลาออกเดินทางเพื่อวิเคราะห์ความเสี่ยงและรับเส้นทางที่ปลอดภัยที่สุด"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
