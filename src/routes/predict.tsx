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
  Eye,
  Skull,
  Loader2,
  Car,
  Undo2,
  ChevronRight,
  Info,
  Crosshair,
} from "lucide-react";
import { riskLocations } from "~/lib/mock-data";
import { useLanguage } from "~/contexts/LanguageContext";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { waitForLongdo } from "~/lib/longdo";

export const Route = createFileRoute("/predict")({
  component: () => (
    <ProtectedRoute>
      <PredictPage />
    </ProtectedRoute>
  ),
});

// Calculate distance between two points
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
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Generate nearby risk points
const generateNearbyRiskPoints = (userLat: number, userLng: number) => {
  return riskLocations
    .map((loc) => ({
      ...loc,
      distance: calculateDistance(userLat, userLng, loc.lat, loc.lng),
    }))
    .filter((loc) => loc.distance <= 10)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);
};

// Calculate risk score
const calculateLocationRisk = (nearbyPoints: any[]) => {
  if (nearbyPoints.length === 0) return 25;
  let totalWeight = 0;
  let weightedScore = 0;
  nearbyPoints.forEach((point) => {
    const weight = 1 / (point.distance + 0.1);
    weightedScore += point.risk_score * weight;
    totalWeight += weight;
  });
  return Math.round(weightedScore / totalWeight);
};

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
  const [nearbyRisks, setNearbyRisks] = useState<any[]>([]);
  const [riskScore, setRiskScore] = useState<number>(0);
  const [showDetails, setShowDetails] = useState(false);

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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
        const nearby = generateNearbyRiskPoints(latitude, longitude);
        setNearbyRisks(nearby);
        setRiskScore(calculateLocationRisk(nearby));
        setLocationStatus("success");
      },
      () => {
        // Use default Bangkok location for demo
        const defaultLocation = {
          lat: 13.7649,
          lng: 100.5442,
          address: "Din Daeng, Bangkok",
        };
        setUserLocation(defaultLocation);
        const nearby = generateNearbyRiskPoints(
          defaultLocation.lat,
          defaultLocation.lng,
        );
        setNearbyRisks(nearby);
        setRiskScore(calculateLocationRisk(nearby));
        setLocationStatus("success");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Initialize Longdo Map
  useEffect(() => {
    if (!mapContainerRef.current || !userLocation || mapRef.current) return;

    const initMap = async () => {
      await waitForLongdo();

      if (!mapContainerRef.current || !(window as any).longdo) return;

      // Initialize Longdo Map
      const map = new (window as any).longdo.Map({
        placeholder: mapContainerRef.current,
        location: { lon: userLocation.lng, lat: userLocation.lat },
        zoom: 12,
        language: language === "th" ? "th" : "en",
      });

      mapRef.current = map;

      // User location marker (blue pulse)
      const userMarker = new (window as any).longdo.Marker(
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

      // 10km radius circle
      const radiusCircle = new (window as any).longdo.Circle(
        { lon: userLocation.lng, lat: userLocation.lat },
        10000, // 10km in meters
        {
          lineWidth: 2,
          lineColor: "rgba(37, 99, 235, 1)",
          fillColor: "rgba(37, 99, 235, 0.08)",
        },
      );
      map.Overlays.add(radiusCircle);

      // Risk point markers
      nearbyRisks.forEach((point) => {
        const color =
          point.severity === "high"
            ? "#DC2626"
            : point.severity === "medium"
              ? "#F59E0B"
              : "#22C55E";

        const riskMarker = new (window as any).longdo.Marker(
          { lon: point.lng, lat: point.lat },
          {
            title: language === "en" ? point.name_en : point.name_th,
            detail: `
            <div style="font-family: system-ui; padding: 4px;">
              <strong>${language === "en" ? point.name_en : point.name_th}</strong><br/>
              ${language === "en" ? "Risk" : "ความเสี่ยง"}: <span style="color: ${color}; font-weight: bold;">${point.risk_score}%</span><br/>
              ${language === "en" ? "Distance" : "ระยะทาง"}: ${point.distance.toFixed(1)} km
            </div>
          `,
            icon: {
              html: `<div style="background: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
              offset: { x: 8, y: 8 },
            },
          },
        );
        map.Overlays.add(riskMarker);
      });
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.Overlays.clear();
      }
      mapRef.current = null;
    };
  }, [userLocation, nearbyRisks, language]);

  // Get severity info
  const getSeverityInfo = (score: number) => {
    if (score >= 70)
      return {
        level: "high",
        label_en: "High Risk",
        label_th: "เสี่ยงสูง",
        color: "#DC2626",
        bgColor: "bg-red-500",
        textColor: "text-red-500",
        icon: <Skull className="h-5 w-5" />,
      };
    if (score >= 40)
      return {
        level: "medium",
        label_en: "Moderate Risk",
        label_th: "เสี่ยงปานกลาง",
        color: "#F59E0B",
        bgColor: "bg-amber-500",
        textColor: "text-amber-500",
        icon: <AlertTriangle className="h-5 w-5" />,
      };
    return {
      level: "low",
      label_en: "Low Risk",
      label_th: "เสี่ยงต่ำ",
      color: "#22C55E",
      bgColor: "bg-green-500",
      textColor: "text-green-500",
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
    if (nearbyRisks.some((r) => r.severity === "high")) {
      recs.push({
        icon: <Eye className="h-4 w-4" />,
        text_en: "High-risk zone nearby - stay alert",
        text_th: "มีพื้นที่เสี่ยงสูงใกล้เคียง - ระวัง",
      });
    }
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
          <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
            <Card className="max-w-sm w-full shadow-lg">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Crosshair className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-3">
                  {language === "en" ? "Risk Prediction" : "ทำนายความเสี่ยง"}
                </h1>
                <p className="text-muted-foreground text-sm mb-8">
                  {language === "en"
                    ? "Get instant risk assessment based on your current location"
                    : "รับการประเมินความเสี่ยงทันทีจากตำแหน่งปัจจุบัน"}
                </p>
                <Button
                  onClick={requestLocation}
                  size="lg"
                  className="w-full gap-2"
                >
                  <Navigation className="h-5 w-5" />
                  {language === "en" ? "Start Prediction" : "เริ่มทำนาย"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {locationStatus === "requesting" && (
          <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === "en"
                  ? "Getting your location..."
                  : "กำลังรับตำแหน่ง..."}
              </p>
            </div>
          </div>
        )}

        {/* Results State */}
        {locationStatus === "success" && userLocation && (
          <div className="h-[calc(100vh-4rem)] relative">
            {/* Full Screen Map */}
            <div ref={mapContainerRef} className="absolute inset-0" />

            {/* Top Bar - Location & Reset */}
            <div className="absolute top-4 left-4 right-4 z-[1000]">
              <div className="flex items-center gap-2">
                <Card className="flex-1 shadow-lg">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {userLocation.address}
                        </p>
                        <p className="text-xs text-muted-foreground">
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
                  className="shadow-lg h-[52px] w-[52px]"
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
                  <Undo2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Risk Score Card - Bottom Left */}
            <div className="absolute bottom-4 left-4 z-[1000]">
              <Card
                className="shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setShowDetails(true)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 ${severityInfo.bgColor} rounded-xl flex items-center justify-center text-white`}
                    >
                      <span className="text-2xl font-bold">{riskScore}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={severityInfo.textColor}>
                          {severityInfo.icon}
                        </span>
                        <span className="font-semibold">
                          {language === "en"
                            ? severityInfo.label_en
                            : severityInfo.label_th}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {nearbyRisks.length}{" "}
                        {language === "en"
                          ? "risk points nearby"
                          : "จุดเสี่ยงใกล้เคียง"}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-primary mt-1">
                        <span>
                          {language === "en" ? "View details" : "ดูรายละเอียด"}
                        </span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Update Location Button - Bottom Right */}
            <div className="absolute bottom-4 right-4 z-[1000]">
              <Button
                onClick={() => {
                  setLocationStatus("idle");
                  setUserLocation(null);
                  setNearbyRisks([]);
                  setRiskScore(0);
                  if (mapRef.current) {
                    mapRef.current.Overlays.clear();
                    mapRef.current = null;
                  }
                }}
                variant="secondary"
                className="shadow-lg gap-2"
              >
                <Navigation className="h-4 w-4" />
                {language === "en" ? "Update" : "อัพเดท"}
              </Button>
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
                    {/* Risk Score Header */}
                    <div className="text-center py-4">
                      <div
                        className={`inline-flex items-center justify-center w-20 h-20 ${severityInfo.bgColor} rounded-2xl text-white mb-3`}
                      >
                        <span className="text-3xl font-bold">{riskScore}%</span>
                      </div>
                      <h2 className="text-xl font-bold">
                        {language === "en"
                          ? severityInfo.label_en
                          : severityInfo.label_th}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {language === "en"
                          ? "Current Location Risk Level"
                          : "ระดับความเสี่ยงตำแหน่งปัจจุบัน"}
                      </p>
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

                    {/* Nearby Risk Points */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {language === "en"
                            ? "Nearby Risk Points (10 km)"
                            : "จุดเสี่ยงใกล้เคียง (10 กม.)"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {nearbyRisks.length > 0 ? (
                          <div className="space-y-3">
                            {nearbyRisks.map((point) => (
                              <div
                                key={point.id}
                                className="flex items-center gap-3"
                              >
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor:
                                      point.severity === "high"
                                        ? "#DC2626"
                                        : point.severity === "medium"
                                          ? "#F59E0B"
                                          : "#22C55E",
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {language === "en"
                                      ? point.name_en
                                      : point.name_th}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {point.distance.toFixed(1)} km •{" "}
                                    {point.risk_score}%
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    point.severity === "high"
                                      ? "danger"
                                      : point.severity === "medium"
                                        ? "warning"
                                        : "success"
                                  }
                                  className="text-xs"
                                >
                                  {point.severity}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            {language === "en"
                              ? "No risk points within 10 km"
                              : "ไม่พบจุดเสี่ยงในรัศมี 10 กม."}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          {language === "en"
                            ? "Safety Recommendations"
                            : "คำแนะนำความปลอดภัย"}
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
                      className="w-full"
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
          <div className="h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <Card className="max-w-sm w-full">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  {language === "en" ? "Location Error" : "เกิดข้อผิดพลาด"}
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  {language === "en"
                    ? "Unable to get your location. Please enable location services."
                    : "ไม่สามารถรับตำแหน่งได้ กรุณาเปิดบริการตำแหน่ง"}
                </p>
                <Button onClick={requestLocation} className="w-full">
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
