import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Header } from "~/components/layout/Header";
import { Footer } from "~/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  MapPin,
  AlertTriangle,
  Shield,
  Navigation,
  Clock,
  Route as RouteIcon,
  Skull,
  Loader2,
  Car,
  Undo2,
  ChevronRight,
  ChevronLeft,
  Info,
  Crosshair,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { useLanguage } from "~/contexts/LanguageContext";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { waitForLongdo } from "~/lib/longdo";
import { predictAccidentRisk, checkMLApiHealth } from "~/lib/ml-prediction-api";
import {
  PredictSkeleton,
} from "~/components/PredictSkeleton";

export const Route = createFileRoute("/predict")({
  component: () => (
    <ProtectedRoute>
      <PredictPage />
    </ProtectedRoute>
  ),
});

// No more mock data calculations - using ML API only!

const EVENT_CATEGORIES = [
  { id: "accident", label: "อุบัติเหตุ", icon: "⚠️", color: "#dc2626" },
  { id: "construction", label: "ก่อสร้าง", icon: "🚧", color: "#f59e0b" },
  { id: "congestion", label: "รถติด", icon: "🚦", color: "#eab308" },
  { id: "flooding", label: "น้ำท่วม", icon: "🌊", color: "#3b82f6" },
  { id: "fire", label: "เพลิงไหม้", icon: "🔥", color: "#dc2626" },
  { id: "breakdown", label: "รถเสีย", icon: "🔧", color: "#f97316" },
  { id: "road_closed", label: "ถนนปิด", icon: "🚫", color: "#dc2626" },
  { id: "diversion", label: "เบี่ยงจราจร", icon: "↪️", color: "#8b5cf6" },
];

function PredictPage() {
  const { language } = useLanguage();
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "requesting" | "success" | "error"
  >("idle");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [riskScore, setRiskScore] = useState<number>(0);
  const [showDetails, setShowDetails] = useState(false);
  const [mlApiAvailable, setMlApiAvailable] = useState<boolean>(false);
  const [mlPrediction, setMlPrediction] = useState<any>(null);
  const [nearbyEvents, setNearbyEvents] = useState<any[]>([]);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Check ML API availability on mount
  useEffect(() => {
    checkMLApiHealth().then(setMlApiAvailable);
  }, []);

  // Find events within 10 kilometers radius
  const findNearbyEvents = async (
    lat: number,
    lng: number,
    radiusMeters: number = 5000,
  ) => {
    try {
      console.log(
        `🔍 Searching for events within ${radiusMeters}m of [${lat}, ${lng}]`,
      );

      // Get events from last 6 months
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);

      const params = new URLSearchParams({
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        limit: "1000",
      });

      const response = await fetch(
        `http://localhost:10000/events/database?${params}`,
      );
      const data = await response.json();

      // Calculate distance using Haversine formula (in meters)
      const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
      ) => {
        const R = 6371000; // Earth radius in meters
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in meters
      };

      // Filter events within radius
      const nearby = (data.events || [])
        .map((event: any) => ({
          ...event,
          distance: calculateDistance(lat, lng, event.lat, event.lon),
        }))
        .filter((event: any) => event.distance <= radiusMeters)
        .sort((a: any, b: any) => a.distance - b.distance);

      setNearbyEvents(nearby);
      console.log(`✅ Found ${nearby.length} events within ${radiusMeters}m`);

      return nearby;
    } catch (error) {
      console.error("Error loading nearby events:", error);
      setNearbyEvents([]);
      return [];
    }
  };

  // Predict risk using ML API with complete data
  const predictRiskWithML = async (lat: number, lng: number) => {
    if (!mlApiAvailable) {
      console.error(
        "ML API is not available. Please start the backend server.",
      );
      setRiskScore(0);
      setMlPrediction(null);
      setLocationStatus("error");
      return;
    }
    try {
      console.log("🔮 Collecting comprehensive data for ML prediction...");

      // 1. Find nearby events within 5km
      const events = await findNearbyEvents(lat, lng, 5000);

      // 2. Get real weather data
      const { getWeatherForecast } = await import(
        "~/lib/route-prediction-api"
      );
      const now = new Date();

      // Use Promise.allSettled to handle API failures gracefully
      const [weatherResult] = await Promise.allSettled([
        getWeatherForecast(lat, lng, now),
      ]);

      // Extract data with fallbacks
      const weatherData =
        weatherResult.status === "fulfilled"
          ? weatherResult.value
          : {
              current: {
                temp: 30,
                condition: "clear",
                rainfall: 0,
                humidity: 70,
              },
            };

      // Use default traffic values (model doesn't critically depend on real-time traffic)
      const trafficData = {
        density: 0.5,
        congestion: "moderate" as const,
        speed: 50,
      };

      console.log("📊 Data collected:");
      console.log(`  - Nearby events: ${events.length}`);
      console.log(
        `  - Weather: ${weatherData.current.temp}°C, ${weatherData.current.condition}`,
      );
      console.log(
        `  - Traffic: ${(trafficData.density * 100).toFixed(0)}% density, ${trafficData.speed} km/h`,
      );

      // 3. Prepare comprehensive prediction data
      const predictionData = {
        latitude: lat,
        longitude: lng,
        hour: now.getHours(),
        day_of_week: now.getDay(),
        month: now.getMonth() + 1,
        temperature: weatherData.current.temp,
        rainfall: weatherData.current.rainfall || 0,
        weather_condition: weatherData.current.condition,
        humidity: weatherData.current.humidity,
        traffic_density: trafficData.density,
        average_speed: trafficData.speed,
        congestion_level: trafficData.congestion,
        nearby_events_count: events.length,
        is_weekend: now.getDay() === 0 || now.getDay() === 6,
        is_rush_hour:
          (now.getHours() >= 7 && now.getHours() <= 9) ||
          (now.getHours() >= 17 && now.getHours() <= 19),
      };

      console.log("🤖 Sending to ML model:", predictionData);

      // 4. Get ML prediction
      const prediction = await predictAccidentRisk(predictionData);

      // Log ML model response
      console.log("✅ ML Model Response:", prediction);
      console.log("📊 Prediction Details:");
      console.log(`  - Severity: ${prediction.prediction}`);
      console.log(`  - Risk Score: ${prediction.risk_score}%`);
      console.log(
        `  - Confidence: ${(prediction.confidence * 100).toFixed(1)}%`,
      );
      if (prediction.probabilities) {
        console.log("  - Probabilities:", prediction.probabilities);
      }

      setMlPrediction({
        ...prediction,
        weather: weatherData.current,
        traffic: trafficData,
        nearbyEvents: events,
        timestamp: now.toISOString(),
      });
      setRiskScore(prediction.risk_score);
    } catch (error) {
      console.error("ML prediction failed:", error);
      setRiskScore(0);
      setMlPrediction(null);
      // Don't set error status - keep success so map shows
    }
  };

  // Request GPS location
  const requestLocation = () => {
    setLocationStatus("requesting");

    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = {
          lat: latitude,
          lng: longitude,
          address: "Current Location",
        };

        setUserLocation(location);
        await predictRiskWithML(latitude, longitude);
        setLocationStatus("success");
      },
      async () => {
        // Use default Bangkok location for demo
        const defaultLocation = {
          lat: 13.7649,
          lng: 100.5442,
          address: "Din Daeng, Bangkok",
        };
        setUserLocation(defaultLocation);
        await predictRiskWithML(defaultLocation.lat, defaultLocation.lng);
        setLocationStatus("success");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Initialize Longdo Map when location is ready
  useEffect(() => {
    if (
      locationStatus !== "success" ||
      !mapContainerRef.current ||
      !userLocation
    ) {
      return;
    }

    console.log("📍 Initializing map with container:", {
      hasContainer: !!mapContainerRef.current,
      hasLocation: !!userLocation,
      containerElement: mapContainerRef.current,
    });

    // Clear existing map before creating new one
    if (mapRef.current) {
      console.log("🧹 Clearing existing map");
      try {
        mapRef.current.Overlays.clear();
      } catch (e) {
        console.error("Error clearing overlays:", e);
      }
      mapRef.current = null;
    }

    const initMap = async () => {
      try {
        console.log("🗺️ Starting map initialization...");
        console.log("🗺️ Container element:", mapContainerRef.current);

        await waitForLongdo();

        if (!mapContainerRef.current) {
          console.error("❌ Container disappeared after waiting");
          return;
        }

        console.log("🗺️ Creating Longdo Map instance...");
        console.log("🗺️ Location:", userLocation);

        // Initialize Longdo Map (matching map.tsx pattern)
        const map = new window.longdo.Map({
          placeholder: mapContainerRef.current,
          language: language === "th" ? "th" : "en",
        });

        console.log("🗺️ Map object created:", map);

        // Set location and zoom separately (like map.tsx)
        map.location({ lon: userLocation.lng, lat: userLocation.lat }, true);
        map.zoom(12);

        mapRef.current = map;
        console.log("✅ Map initialized successfully at", userLocation);

        // User location marker (blue pulse)
        const userMarker = new window.longdo.Marker(
          { lon: userLocation.lng, lat: userLocation.lat },
          {
            title: language === "en" ? "Your Location" : "ตำแหน่งของคุณ",
            icon: {
              html: `<div style="background: #2563EB; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>
            <style>
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
              }
            </style>`,
              offset: { x: 12, y: 12 },
            },
          },
        );
        map.Overlays.add(userMarker);
        console.log("✅ User marker added");

        // 5km radius circle - ENHANCED for maximum visibility
        console.log("🔵 Adding 5km radius circle... (v3)");
        try {
          // Create circle with standard hex colors
          const radiusCircle = new window.longdo.Circle(
            { lon: userLocation.lng, lat: userLocation.lat },
            0.045, // ~5km in degrees (approx 111km per degree)
            {
              lineWidth: 2,
              lineColor: "rgba(0, 0, 255, 0.6)",
              fillColor: "rgba(0, 0, 255, 0.15)",
              detail: "5km Radius",
              visible: true
            }
          );
          
          map.Overlays.add(radiusCircle);
          console.log("✅ 5km circle added (v3 - degrees)");
        } catch (circleError) {
          console.error("❌ Error adding circle:", circleError);
        }

        // Set mapReady flag after map is fully initialized
        setMapReady(true);
        console.log("✅ Map is now ready for event markers");
      } catch (error: any) {
        console.error("❌ Error initializing map:", error);
        console.error("❌ Error details:", {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        });
      }
    };

    initMap();

    return () => {
      console.log("🧹 Cleanup: removing map");
      if (mapRef.current) {
        try {
          mapRef.current.Overlays.clear();
        } catch (e) {
          console.error("Error clearing overlays:", e);
        }
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, [locationStatus, userLocation, language]);

  // Setup global event handler for marker clicks - use Longdo Popup
  useEffect(() => {
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      const today = new Date();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      if (isToday) {
        const hour = date.getHours().toString().padStart(2, "0");
        const minute = date.getMinutes().toString().padStart(2, "0");
        return `วันนี้ ${hour}:${minute}`;
      } else {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear() + 543;
        return `${day}/${month}/${year}`;
      }
    };

    (window as any).selectEvent = (eventId: string) => {
      const event = nearbyEvents.find((e) => e.id === eventId);
      if (event && mapRef.current) {
        console.log("🔍 Marker clicked:", event.title);
        console.log("📊 Event Details:", {
          title: event.title,
          category: event.category,
          location: event.location,
          distance: `${event.distance.toFixed(0)}m`,
          pubDate: event.pubDate,
        });

        if (mlPrediction) {
          console.log("🤖 ML Prediction for this location:", {
            severity: mlPrediction.prediction || "N/A",
            riskScore: `${riskScore}%`,
            confidence: `${(mlPrediction.confidence * 100).toFixed(1)}%`,
            nearbyEventsCount: nearbyEvents.length,
          });
        }

        const category = EVENT_CATEGORIES.find((c) => c.id === event.category);

        // Get severity info from ML prediction
        const getSeverityColor = (prediction: string) => {
          if (prediction === "เสียชีวิต") {
            return {
              bg: "#7f1d1d",
              text: "#ffffff",
              label: "Fatal / เสียชีวิต",
              labelTh: "เสียชีวิต",
              labelEn: "Fatal",
            };
          } else if (prediction === "บาดเจ็บสาหัส") {
            return {
              bg: "#dc2626",
              text: "#ffffff",
              label: "Serious Injury / บาดเจ็บสาหัส",
              labelTh: "บาดเจ็บสาหัส",
              labelEn: "Serious Injury",
            };
          } else if (prediction === "บาดเจ็บเล็กน้อย") {
            return {
              bg: "#f59e0b",
              text: "#ffffff",
              label: "Slight Injury / บาดเจ็บเล็กน้อย",
              labelTh: "บาดเจ็บเล็กน้อย",
              labelEn: "Slight Injury",
            };
          }
          return {
            bg: "#22c55e",
            text: "#ffffff",
            label: "Low Risk",
            labelTh: "เสี่ยงต่ำ",
            labelEn: "Low Risk",
          };
        };

        // Only show ML prediction if prediction exists and is not null/N/A
        const severityInfo =
          mlPrediction &&
          mlPrediction.prediction &&
          mlPrediction.prediction !== "N/A"
            ? getSeverityColor(mlPrediction.prediction)
            : null;

        const popupContent = `
          <div style="
            box-sizing: border-box;
            padding: 14px;
            width: 320px;
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

            ${
              severityInfo
                ? `
              <div style="
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border: 2px solid #3b82f6;
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 10px;
              ">
                <div style="
                  font-size: 11px;
                  font-weight: 600;
                  color: #1e40af;
                  margin-bottom: 6px;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                ">
                  <span>🤖</span>
                  <span>AI PREDICTION FOR THIS LOCATION</span>
                </div>
                <div style="
                  background: ${severityInfo.bg};
                  color: ${severityInfo.text};
                  padding: 8px;
                  border-radius: 6px;
                  margin-bottom: 8px;
                  text-align: center;
                  font-weight: 600;
                  font-size: 13px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">
                  ${mlPrediction.prediction || "N/A"}
                </div>
                <div style="
                  display: flex;
                  gap: 8px;
                  font-size: 11px;
                ">
                  <div style="
                    flex: 1;
                    background: white;
                    padding: 6px;
                    border-radius: 4px;
                    text-align: center;
                  ">
                    <div style="color: #6b7280; margin-bottom: 2px;">ความมั่นใจ</div>
                    <div style="color: #1f2937; font-weight: 600;">${(mlPrediction.confidence * 100).toFixed(0)}%</div>
                  </div>
                  <div style="
                    flex: 1;
                    background: white;
                    padding: 6px;
                    border-radius: 4px;
                    text-align: center;
                  ">
                    <div style="color: #6b7280; margin-bottom: 2px;">Risk Score</div>
                    <div style="color: #1f2937; font-weight: 600;">${riskScore}%</div>
                  </div>
                </div>
              </div>
            `
                : ""
            }

            <div style="
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
              font-size: 12px;
              color: #6b7280;
            ">
              ${event.location ? `<div style="margin-bottom: 4px; white-space: pre-wrap; word-break: break-word;">📍 ${event.location}</div>` : ""}
              <div style="margin-bottom: 4px;">🕐 ${formatTime(event.pubDate)}</div>
              <div style="color: #3b82f6; font-weight: 600;">📏 ${event.distance.toFixed(0)}m away</div>
            </div>
          </div>
        `;

        const popup = new (window as any).longdo.Popup(
          { lon: event.lon, lat: event.lat },
          {
            title: "",
            detail: popupContent,
            closable: true,
            visibleRange: { min: 1, max: 20 },
          },
        );

        if ((window as any).currentPopup) {
          mapRef.current.Overlays.remove((window as any).currentPopup);
        }

        mapRef.current.Overlays.add(popup);
        (window as any).currentPopup = popup;

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
  }, [nearbyEvents, mlPrediction, riskScore, language]);

  // Display event markers on map when nearbyEvents changes
  useEffect(() => {
    if (
      !mapRef.current ||
      !mapReady ||
      !nearbyEvents ||
      nearbyEvents.length === 0
    ) {
      console.log("⏸️ Skipping event markers:", {
        hasMap: !!mapRef.current,
        mapReady,
        eventsCount: nearbyEvents?.length || 0,
      });
      return;
    }

    console.log(`📍 Adding ${nearbyEvents.length} event markers to map`);

    // Store markers in a map for cleanup
    const markers: any[] = [];

    nearbyEvents.forEach((event) => {
      const category = EVENT_CATEGORIES.find((c) => c.id === event.category);

      const getCustomIcon = () => {
        const color = category?.color || "#dc2626";

        switch (event.category) {
          case "accident":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <path d="M16 4 L28 26 L4 26 Z" fill="${color}" stroke="white" stroke-width="2" stroke-linejoin="round"/>
              <path d="M16 12 L16 18 M16 21 L16 23" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>`;
          case "construction":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <rect x="10" y="14" width="12" height="8" fill="white" rx="1"/>
              <rect x="12" y="10" width="8" height="4" fill="white"/>
            </svg>`;
          case "congestion":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="10" r="2.5" fill="#ef4444"/>
              <circle cx="16" cy="16" r="2.5" fill="#fbbf24"/>
              <circle cx="16" cy="22" r="2.5" fill="#22c55e"/>
            </svg>`;
          case "flooding":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <path d="M8 18 Q10 16 12 18 Q14 20 16 18 Q18 16 20 18 Q22 20 24 18" stroke="white" stroke-width="2" fill="none"/>
              <path d="M8 22 Q10 20 12 22 Q14 24 16 22 Q18 20 20 22 Q22 24 24 22" stroke="white" stroke-width="2" fill="none"/>
            </svg>`;
          case "fire":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <path d="M16 8 Q18 12 16 16 Q14 12 16 8 M16 16 Q20 18 18 22 Q16 24 14 22 Q12 18 16 16" fill="white"/>
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
              <circle cx="16" cy="16" r="10" stroke="white" stroke-width="2.5" fill="none"/>
              <line x1="10" y1="10" x2="22" y2="22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>`;
          case "diversion":
            return `<svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
              <path d="M10 16 L22 16 M18 12 L22 16 L18 20" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 12 Q10 12 10 16" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
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
      markers.push(marker);
    });

    console.log(`✅ Added ${markers.length} event markers to map`);

    // Cleanup function to remove markers when component unmounts or nearbyEvents changes
    return () => {
      if (mapRef.current) {
        markers.forEach((marker) => {
          try {
            mapRef.current.Overlays.remove(marker);
          } catch (e) {
            console.error("Error removing marker:", e);
          }
        });
      }
    };
  }, [nearbyEvents, mapReady]);

  // Get severity info
  const getSeverityInfo = (score: number) => {
    if (score >= 70)
      return {
        level: "high",
        label_en: "Fatal Risk",
        label_th: "เสี่ยงเสียชีวิต",
        color: "#7f1d1d",
        bgColor: "bg-red-900",
        textColor: "text-red-900",
        icon: <Skull className="h-5 w-5" />,
      };
    if (score >= 40)
      return {
        level: "medium",
        label_en: "Serious Injury Risk",
        label_th: "เสี่ยงบาดเจ็บสาหัส",
        color: "#DC2626",
        bgColor: "bg-red-500",
        textColor: "text-red-500",
        icon: <AlertTriangle className="h-5 w-5" />,
      };
    return {
      level: "low",
      label_en: "Slight Injury Risk",
      label_th: "เสี่ยงบาดเจ็บเล็กน้อย",
      color: "#F59E0B",
      bgColor: "bg-amber-500",
      textColor: "text-amber-500",
      icon: <Shield className="h-5 w-5" />,
    };
  };

  const severityInfo = getSeverityInfo(riskScore);

  // Get recommendations
  const getRecommendations = () => {
    const recs = [];
    if (riskScore >= 70) {
      recs.push({
        icon: <Clock className="h-4 w-4" />,
        text_en: "Avoid rush hours (17:00-19:00)",
        text_th: "เลี่ยงชั่วโมงเร่งด่วน (17:00-19:00)",
      });
      recs.push({
        icon: <RouteIcon className="h-4 w-4" />,
        text_en: "Consider alternative routes",
        text_th: "พิจารณาใช้เส้นทางอื่น",
      });
    }
    if (riskScore >= 40) {
      recs.push({
        icon: <Car className="h-4 w-4" />,
        text_en: "Maintain safe following distance",
        text_th: "รักษาระยะห่างที่ปลอดภัย",
      });
    }
    // ML-based recommendations only
    if (recs.length === 0) {
      recs.push({
        icon: <Shield className="h-4 w-4" />,
        text_en: "Area is relatively safe",
        text_th: "พื้นที่ค่อนข้างปลอดภัย",
      });
    }
    return recs;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Initial State - Request Location */}
        {locationStatus === "idle" && (
          <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
            <Card className="max-w-md w-full shadow-2xl border-0 overflow-hidden">
              <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-center">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Crosshair className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-3 text-white">
                  {language === "en" ? "Risk Prediction" : "ทำนายความเสี่ยง"}
                </h1>
                <p className="text-white/90 text-sm">
                  {language === "en"
                    ? "Get instant AI-powered risk assessment based on your current location"
                    : "รับการประเมินความเสี่ยงด้วย AI ทันทีจากตำแหน่งปัจจุบัน"}
                </p>
              </div>
              <CardContent className="pt-8 pb-8 text-center">
                <Button
                  onClick={requestLocation}
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all text-lg py-6"
                >
                  <Navigation className="h-6 w-6" />
                  {language === "en" ? "Start Prediction" : "เริ่มทำนาย"}
                </Button>
                <p className="text-gray-500 text-xs mt-4">
                  {language === "en"
                    ? "Using machine learning to predict accident risks"
                    : "ใช้การเรียนรู้ของเครื่องในการทำนายความเสี่ยงอุบัติเหตุ"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {locationStatus === "requesting" && <PredictSkeleton />}

        {/* Results State */}
        {locationStatus === "success" && userLocation && (
          <div className="h-[calc(100vh-4rem)] flex relative overflow-hidden">
            {/* Left Sidebar - Event List */}
            <div
              className={`bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ${
                sidebarOpen ? "w-96" : "w-0"
              }`}
              style={{ minWidth: sidebarOpen ? "24rem" : "0" }}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {language === "en" ? "AI Risk Prediction" : "การทำนายความเสี่ยงด้วย AI"}
                  </h2>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {language === "en"
                    ? "Machine Learning Analysis"
                    : "วิเคราะห์ด้วยแมชชีนเลิร์นนิง"}
                </p>
              </div>

              {/* Event Count - Show ML Stats */}
              <div className="px-4 py-3 bg-white border-b border-gray-200">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-500">{language === "en" ? "Risk" : "ความเสี่ยง"}</p>
                    <p className="font-bold text-sm text-orange-600">{riskScore}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{language === "en" ? "Confidence" : "ความมั่นใจ"}</p>
                    <p className="font-bold text-sm text-blue-600">
                      {mlPrediction ? (mlPrediction.confidence * 100).toFixed(0) : "0"}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{language === "en" ? "Events" : "เหตุการณ์"}</p>
                    <p className="font-bold text-sm text-gray-900">{nearbyEvents.length}</p>
                  </div>
                </div>
              </div>

              {/* Sidebar Content - ML Prediction */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {language === "en" ? "AI Risk Prediction" : "การทำนายความเสี่ยงด้วย AI"}
                      </h2>
                      <p className="text-xs text-gray-600">
                        {language === "en" ? "Machine Learning Analysis" : "วิเคราะห์ด้วยแมชชีนเลิร์นนิง"}
                      </p>
                    </div>
                  </div>

                  {mlPrediction ? (
                    <>
                      {/* Main Severity Card */}
                      <Card className="border-2 border-gray-200 shadow-lg">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Severity Icon & Label */}
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-20 h-20 ${severityInfo.bgColor} rounded-2xl flex items-center justify-center text-white shadow-xl flex-shrink-0`}
                              >
                                {severityInfo.icon}
                              </div>
                              <div className="flex-1">
                                <Badge className="text-xs mb-2 bg-blue-100 text-blue-700 border-blue-300">
                                  🤖 AI Prediction
                                </Badge>
                                <h3 className="font-bold text-2xl text-gray-900 leading-tight">
                                  {mlPrediction.prediction || "Low Risk"}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {language === "en"
                                    ? "Predicted accident severity"
                                    : "ความรุนแรงที่คาดการณ์"}
                                </p>
                              </div>
                            </div>

                            {/* Risk Metrics */}
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl">
                                <p className="text-xs text-gray-600 mb-1">
                                  {language === "en" ? "Risk Score" : "คะแนนความเสี่ยง"}
                                </p>
                                <p className="font-bold text-3xl text-orange-600">{riskScore}%</p>
                              </div>
                              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl">
                                <p className="text-xs text-gray-600 mb-1">
                                  {language === "en" ? "Confidence" : "ความมั่นใจ"}
                                </p>
                                <p className="font-bold text-3xl text-blue-600">
                                  {(mlPrediction.confidence * 100).toFixed(0)}%
                                </p>
                              </div>
                            </div>

                            {/* Historical Events */}
                            <div className="bg-gray-50 p-4 rounded-xl">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-gray-600">
                                    {language === "en" ? "Accidents within 5 km" : "อุบัติเหตุในระยะ 5 กม."}
                                  </p>
                                  <p className="font-bold text-2xl text-gray-900">{nearbyEvents.length}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Risk Level Indicator */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-700">
                          {language === "en" ? "Risk Level" : "ระดับความเสี่ยง"}
                        </p>
                        <div className="h-3 bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500 rounded-full relative">
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow-lg"
                            style={{ left: `${riskScore}%`, transform: 'translate(-50%, -50%)' }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{language === "en" ? "Low" : "ต่ำ"}</span>
                          <span>{language === "en" ? "High" : "สูง"}</span>
                        </div>
                      </div>

                      {/* Risk Factors - Why this prediction? */}
                      {mlPrediction.risk_factors && mlPrediction.risk_factors.length > 0 && (
                        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                  {language === "en" ? "Why this prediction?" : "ทำไมถึงทำนายแบบนี้?"}
                                </h4>
                                <ul className="text-xs text-gray-700 space-y-1">
                                  {mlPrediction.risk_factors.map((factor: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-amber-600">•</span>
                                      <span>{factor}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Safety Recommendations */}
                      {mlPrediction.recommendations && mlPrediction.recommendations.length > 0 && (
                        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                  {language === "en" ? "Safety Recommendations" : "คำแนะนำด้านความปลอดภัย"}
                                </h4>
                                <ul className="text-xs text-gray-700 space-y-1">
                                  {mlPrediction.recommendations.map((rec: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-blue-600">•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    /* Loading State */
                    <Card className="border-2 border-gray-200">
                      <CardContent className="p-8">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="w-20 h-20 bg-gray-300 rounded-2xl flex items-center justify-center animate-pulse">
                            <Loader2 className="h-10 w-10 text-white animate-spin" />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-lg text-gray-900">
                              {language === "en" ? "Analyzing location..." : "กำลังวิเคราะห์ตำแหน่ง..."}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {language === "en" ? "ML prediction loading" : "กำลังโหลดการทำนาย"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
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
              title={
                sidebarOpen
                  ? language === "en"
                    ? "Hide sidebar"
                    : "ซ่อนแถบด้านข้าง"
                  : language === "en"
                    ? "Show sidebar"
                    : "แสดงแถบด้านข้าง"
              }
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {/* Map Container */}
            <div className="flex-1 relative">
              <div
                ref={mapContainerRef}
                id="predict-map-container"
                className="absolute inset-0 bg-gray-100"
                style={{ minHeight: "400px", width: "100%", height: "100%" }}
              />

              {/* Top Bar - Location & Reset */}
              <div className="absolute top-4 left-4 right-4 z-[1000]">
                <div className="flex items-center gap-2">
                  <Card className="flex-1 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate text-gray-900">
                            {userLocation.address}
                          </p>
                          <p className="text-xs text-gray-600">
                            {userLocation.lat.toFixed(4)},{" "}
                            {userLocation.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="shadow-xl h-[58px] w-[58px] bg-white/95 backdrop-blur-sm hover:bg-white border-0"
                    onClick={() => {
                      if (mapRef.current && userLocation) {
                        mapRef.current.location(
                          { lon: userLocation.lng, lat: userLocation.lat },
                          true,
                        );
                        mapRef.current.zoom(12, true);
                      }
                    }}
                  >
                    <Undo2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Update Location Button - Bottom Right */}
              <div className="absolute bottom-4 right-4 z-[1000]">
                <Button
                  onClick={() => {
                    setLocationStatus("idle");
                    setUserLocation(null);
                    setRiskScore(0);
                    setMlPrediction(null);
                    if (mapRef.current) {
                      mapRef.current.Overlays.clear();
                      mapRef.current = null;
                    }
                  }}
                  className="shadow-2xl gap-2 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 border-0 text-base py-6 px-6"
                >
                  <Navigation className="h-5 w-5" />
                  {language === "en" ? "Update Location" : "อัพเดทตำแหน่ง"}
                </Button>
              </div>
            </div>

            {/* Details Panel - Slide up from bottom */}
            {showDetails && (
              <div
                className="absolute inset-0 z-[1001] bg-black/50"
                onClick={() => setShowDetails(false)}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[70vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Handle bar */}
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
                  </div>

                  <div className="px-4 pb-8 space-y-4">
                    {/* ML Prediction Header */}
                    <div className="text-center py-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl border-2 border-blue-200">
                      <Badge className="mb-3 bg-blue-600 text-white px-3 py-1">
                        🤖 Machine Learning Prediction
                      </Badge>
                      <div
                        className={`inline-flex items-center justify-center w-24 h-24 ${severityInfo.bgColor} rounded-3xl text-white mb-4 shadow-xl`}
                      >
                        {severityInfo.icon}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {mlPrediction?.prediction || "N/A"}
                      </h2>
                      <p className="text-sm text-gray-600 mb-3">
                        {language === "en"
                          ? "Predicted accident severity if incident occurs"
                          : "ระดับความรุนแรงที่คาดการณ์หากเกิดอุบัติเหตุ"}
                      </p>
                      <div className="flex justify-center gap-4 text-xs">
                        <div className="bg-white px-3 py-2 rounded-lg shadow">
                          <p className="text-gray-500">
                            {language === "en" ? "Risk Score" : "คะแนน"}
                          </p>
                          <p className="font-bold text-lg">{riskScore}%</p>
                        </div>
                        <div className="bg-white px-3 py-2 rounded-lg shadow">
                          <p className="text-gray-500">
                            {language === "en" ? "Confidence" : "ความมั่นใจ"}
                          </p>
                          <p className="font-bold text-lg">
                            {mlPrediction?.confidence
                              ? (mlPrediction.confidence * 100).toFixed(0)
                              : "0"}
                            %
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Risk Gauge */}
                    <div className="px-2">
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${riskScore}%`,
                            background: `linear-gradient(to right, #22C55E, #F59E0B, #DC2626)`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{language === "en" ? "Low" : "ต่ำ"}</span>
                        <span>{language === "en" ? "High" : "สูง"}</span>
                      </div>
                    </div>

                    {/* Nearby Events - Critical Training Data */}
                    <Card
                      className={`border-2 shadow-lg ${
                        nearbyEvents.length > 0
                          ? "border-orange-200 bg-gradient-to-br from-orange-50 to-red-50"
                          : "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {nearbyEvents.length > 0 ? (
                            <>
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <span className="text-orange-900 font-semibold">
                                {language === "en"
                                  ? `⚠️ ${nearbyEvents.length} Historical Accident(s) Within 10km`
                                  : `⚠️ พบประวัติอุบัติเหตุ ${nearbyEvents.length} ครั้ง ในรัศมี 10 กิโลเมตร`}
                              </span>
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 text-green-600" />
                              <span className="text-green-900 font-semibold">
                                {language === "en"
                                  ? "✓ No Historical Accidents Within 10km"
                                  : "✓ ไม่พบประวัติอุบัติเหตุในรัศมี 10 กิโลเมตร"}
                              </span>
                            </>
                          )}
                        </CardTitle>
                        <p className="text-xs text-gray-600 mt-1">
                          {language === "en"
                            ? "Historical data used for ML training"
                            : "ข้อมูลประวัติศาสตร์ที่ใช้ในการเทรนโมเดล"}
                        </p>
                      </CardHeader>
                      {nearbyEvents.length > 0 && (
                        <CardContent className="pt-0 space-y-2">
                          {nearbyEvents.slice(0, 5).map((event, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-white rounded-lg border border-orange-300 shadow-sm"
                            >
                              <div className="flex items-start gap-2 mb-2">
                                <Badge className="text-[10px] bg-orange-500 text-white">
                                  {event.distance.toFixed(1)}m
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {new Date(event.pubDate).toLocaleDateString(
                                    "th-TH",
                                  )}
                                </Badge>
                              </div>
                              <p className="text-xs font-medium text-gray-900 line-clamp-2">
                                {event.title}
                              </p>
                              {event.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          ))}
                          {nearbyEvents.length > 5 && (
                            <div className="text-center py-2 bg-white rounded border border-orange-200">
                              <p className="text-xs text-gray-600">
                                + {nearbyEvents.length - 5}{" "}
                                {language === "en"
                                  ? "more accidents"
                                  : "อุบัติเหตุเพิ่มเติม"}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>

                    {/* Current Conditions */}
                    {mlPrediction && mlPrediction.weather && (
                      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Info className="h-4 w-4 text-green-600" />
                            <span>
                              {language === "en"
                                ? "Current Conditions"
                                : "สภาพแวดล้อมปัจจุบัน"}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-white rounded border border-green-200">
                              <p className="text-xs text-gray-500">
                                {language === "en" ? "Weather" : "อากาศ"}
                              </p>
                              <p className="font-semibold text-sm">
                                {mlPrediction.weather.temp}°C,{" "}
                                {mlPrediction.weather.condition}
                              </p>
                            </div>
                            <div className="p-2 bg-white rounded border border-green-200">
                              <p className="text-xs text-gray-500">
                                {language === "en" ? "Traffic" : "จราจร"}
                              </p>
                              <p className="font-semibold text-sm">
                                {mlPrediction.traffic.congestionLevel}
                              </p>
                            </div>
                            <div className="p-2 bg-white rounded border border-green-200">
                              <p className="text-xs text-gray-500">
                                {language === "en" ? "Humidity" : "ความชื้น"}
                              </p>
                              <p className="font-semibold text-sm">
                                {mlPrediction.weather.humidity}%
                              </p>
                            </div>
                            <div className="p-2 bg-white rounded border border-green-200">
                              <p className="text-xs text-gray-500">
                                {language === "en" ? "Speed" : "ความเร็ว"}
                              </p>
                              <p className="font-semibold text-sm">
                                {mlPrediction.traffic.speed} km/h
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* ML Training Data Summary */}
                    {mlPrediction && (
                      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Badge className="text-xs bg-purple-600 text-white">
                              📊 Training Data Used
                            </Badge>
                          </CardTitle>
                          <p className="text-xs text-gray-600 mt-1">
                            {language === "en"
                              ? "All data collected and sent to ML model"
                              : "ข้อมูลทั้งหมดที่เก็บและส่งให้โมเดล ML"}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          {/* Location Data */}
                          <div className="bg-white p-3 rounded-lg border border-purple-200">
                            <p className="text-xs font-semibold text-purple-900 mb-2">
                              📍 {language === "en" ? "Location" : "ตำแหน่ง"}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Latitude:</span>
                                <span className="ml-1 font-mono">
                                  {userLocation?.lat.toFixed(6)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">
                                  Longitude:
                                </span>
                                <span className="ml-1 font-mono">
                                  {userLocation?.lng.toFixed(6)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Time Data */}
                          <div className="bg-white p-3 rounded-lg border border-purple-200">
                            <p className="text-xs font-semibold text-purple-900 mb-2">
                              🕐{" "}
                              {language === "en" ? "Time Context" : "บริบทเวลา"}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Hour:</span>
                                <span className="ml-1 font-mono">
                                  {new Date().getHours()}:00
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Day:</span>
                                <span className="ml-1">
                                  {
                                    [
                                      "Sun",
                                      "Mon",
                                      "Tue",
                                      "Wed",
                                      "Thu",
                                      "Fri",
                                      "Sat",
                                    ][new Date().getDay()]
                                  }
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Month:</span>
                                <span className="ml-1">
                                  {new Date().getMonth() + 1}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Weekend:</span>
                                <span className="ml-1">
                                  {[0, 6].includes(new Date().getDay())
                                    ? "Yes"
                                    : "No"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Weather Data */}
                          {mlPrediction.weather && (
                            <div className="bg-white p-3 rounded-lg border border-purple-200">
                              <p className="text-xs font-semibold text-purple-900 mb-2">
                                🌤️ {language === "en" ? "Weather" : "สภาพอากาศ"}
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-500">Temp:</span>
                                  <span className="ml-1 font-mono">
                                    {mlPrediction.weather.temp}°C
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Humidity:
                                  </span>
                                  <span className="ml-1 font-mono">
                                    {mlPrediction.weather.humidity}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Condition:
                                  </span>
                                  <span className="ml-1">
                                    {mlPrediction.weather.condition}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Rainfall:
                                  </span>
                                  <span className="ml-1 font-mono">
                                    {mlPrediction.weather.rainfall || 0} mm
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Traffic Data */}
                          {mlPrediction.traffic && (
                            <div className="bg-white p-3 rounded-lg border border-purple-200">
                              <p className="text-xs font-semibold text-purple-900 mb-2">
                                🚗 {language === "en" ? "Traffic" : "การจราจร"}
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-500">
                                    Density:
                                  </span>
                                  <span className="ml-1 font-mono">
                                    {(
                                      mlPrediction.traffic.density * 100
                                    ).toFixed(0)}
                                    %
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Speed:</span>
                                  <span className="ml-1 font-mono">
                                    {mlPrediction.traffic.speed} km/h
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-gray-500">Level:</span>
                                  <span className="ml-1">
                                    {mlPrediction.traffic.congestionLevel}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Prediction Result */}
                          <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-3 rounded-lg border-2 border-blue-300">
                            <p className="text-xs font-semibold text-blue-900 mb-2">
                              🎯{" "}
                              {language === "en"
                                ? "ML Prediction Result"
                                : "ผลการทำนาย ML"}
                            </p>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-700">
                                   {language === "en"
                                     ? "Severity:"
                                     : "ความรุนแรง:"}
                                 </span>
                                 <span className="text-sm font-bold text-blue-900">
                                   {mlPrediction.prediction || mlPrediction.severity || "Low Risk"}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-700">
                                  {language === "en"
                                    ? "Confidence:"
                                    : "ความมั่นใจ:"}
                                </span>
                                <span className="text-sm font-bold text-blue-900">
                                  {(mlPrediction.confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="pt-2 border-t border-blue-200">
                                <p className="text-xs text-gray-700 mb-1">
                                  {language === "en"
                                    ? "Probabilities:"
                                    : "ความน่าจะเป็น:"}
                                </p>
                                <div className="space-y-1">
                                  {mlPrediction.probabilities &&
                                    Object.entries(
                                      mlPrediction.probabilities,
                                    ).map(([className, prob]) => (
                                      <div
                                        key={className}
                                        className="flex items-center justify-between text-xs"
                                      >
                                        <span className="text-gray-700">
                                          {className}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-blue-600 rounded-full"
                                              style={{
                                                width: `${(prob as number) * 100}%`,
                                              }}
                                            />
                                          </div>
                                          <span className="font-mono text-gray-900 w-12 text-right">
                                            {((prob as number) * 100).toFixed(
                                              1,
                                            )}
                                            %
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Recommendations */}
                    <Card className="shadow-lg border border-gray-200">
                      <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-white">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Info className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-gray-900">
                            {language === "en"
                              ? "Safety Recommendations"
                              : "คำแนะนำความปลอดภัย"}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {getRecommendations().map((rec, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div
                                className={`mt-0.5 ${severityInfo.textColor}`}
                              >
                                {rec.icon}
                              </div>
                              <p className="text-sm">
                                {language === "en" ? rec.text_en : rec.text_th}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Close Button */}
                    <Button
                      variant="outline"
                      className="w-full hover:bg-gray-100 transition-colors"
                      onClick={() => setShowDetails(false)}
                    >
                      {language === "en" ? "Close" : "ปิด"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {locationStatus === "error" && (
          <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
            <Card className="max-w-md w-full shadow-2xl border-0">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <AlertTriangle className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-gray-900">
                  {language === "en" ? "Location Error" : "เกิดข้อผิดพลาด"}
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  {language === "en"
                    ? "Unable to get your location. Please enable location services in your browser settings."
                    : "ไม่สามารถรับตำแหน่งได้ กรุณาเปิดบริการตำแหน่งในการตั้งค่าเบราว์เซอร์"}
                </p>
                <Button
                  onClick={requestLocation}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
                  size="lg"
                >
                  {language === "en" ? "Try Again" : "ลองอีกครั้ง"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {locationStatus !== "success" && <Footer />}
    </div>
  );
}
