import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Header } from "~/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Clock,
  CloudRain,
  Car,
  Calendar,
  MapPin,
  RefreshCw,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useLanguage } from "~/contexts/LanguageContext";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { waitForLongdo } from "~/lib/longdo";
import {
  scanAreaForMLRiskZones,
  MLRiskZone,
  getRiskZoneIcon,
  getRiskZoneColor,
} from "~/lib/ml-risk-scanner";

export const Route = createFileRoute("/labs")({
  component: () => (
    <ProtectedRoute>
      <TestRiskMapPage />
    </ProtectedRoute>
  ),
});

function TestRiskMapPage() {
  const { language } = useLanguage();

  // Map refs
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  // State
  const [mapLoading, setMapLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [zones, setZones] = useState<MLRiskZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<MLRiskZone | null>(null);
  const [showOnlyHighRisk, setShowOnlyHighRisk] = useState(false);

  // Test parameters
  const [hour, setHour] = useState(new Date().getHours());
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [rainfall, setRainfall] = useState([0]);
  const [trafficDensity, setTrafficDensity] = useState([0.5]);

  // Map center - Thailand center
  const [centerLat, setCenterLat] = useState(13.7563);
  const [centerLng, setCenterLng] = useState(100.5018);

  // Thailand boundaries
  const THAILAND_BOUNDS = {
    north: 20.5,
    south: 5.6,
    east: 105.6,
    west: 97.3,
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initMap = async () => {
      setMapLoading(true);
      try {
        await waitForLongdo();

        if (!mapContainerRef.current || !(window as any).longdo) {
          setMapLoading(false);
          return;
        }

        const map = new (window as any).longdo.Map({
          placeholder: mapContainerRef.current,
          location: { lon: centerLng, lat: centerLat },
          zoom: 6, // Zoom out to show all of Thailand
          language: language === "th" ? "th" : "en",
          ui: (window as any).longdo.UiComponent.None,
        });

        mapRef.current = map;
        setMapLoading(false);
      } catch (error) {
        console.error("Error loading map:", error);
        setMapLoading(false);
      }
    };

    initMap();
  }, []);

  // Scan area with current parameters - use real hotspot locations
  const scanArea = async () => {
    if (!mapRef.current) return;

    setScanning(true);
    setZones([]);

    try {
      console.log("🔬 Scanning real accident hotspots in Thailand:");
      console.log(
        `   Hour: ${hour}, Day: ${dayOfWeek}, Month: ${month}, Rain: ${rainfall[0]}mm, Traffic: ${(trafficDensity[0] * 100).toFixed(0)}%`
      );

      // Call backend hotspots endpoint with real accident-prone locations
      const response = await fetch("http://localhost:10000/predict/hotspots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hour,
          day_of_week: dayOfWeek,
          month,
          rainfall: rainfall[0],
          traffic_density: trafficDensity[0],
          min_probability: 0.0, // Show all locations
        }),
      });

      if (!response.ok) {
        console.error("Failed to fetch hotspots");
        setScanning(false);
        return;
      }

      const data = await response.json();
      console.log(`📍 Checked ${data.total_locations_checked} known accident locations`);
      console.log(`✅ Found ${data.hotspots_found} risk zones`);

      // Debug: Log sample predictions to verify they're changing
      if (data.hotspots.length > 0) {
        const samples = data.hotspots.slice(0, 3);
        console.log(`🔍 Sample predictions:`);
        samples.forEach((h: any, i: number) => {
          console.log(`   ${i+1}. ${h.name}: Risk=${h.risk_score}, Hotspot=${h.is_hotspot}, Prob=${h.hotspot_probability.toFixed(4)}`);
        });
        console.log(`   All scores: [${data.hotspots.map((h: any) => h.risk_score).join(', ')}]`);
      }

      // Convert to MLRiskZone format
      const zones: MLRiskZone[] = data.hotspots.map((hotspot: any) => {
        let severity: "low" | "medium" | "high";
        if (hotspot.risk_score >= 50 || hotspot.is_hotspot) {
          severity = "high";
        } else if (hotspot.risk_score >= 30) {
          severity = "medium";
        } else {
          severity = "low";
        }

        return {
          id: `hotspot-${hotspot.latitude}-${hotspot.longitude}`,
          location: { lat: hotspot.latitude, lng: hotspot.longitude },
          riskScore: hotspot.risk_score,
          hotspotProbability: hotspot.hotspot_probability,
          severity,
          severityClass: hotspot.severity_class,
          confidence: hotspot.confidence,
          factors: {
            isHotspot: hotspot.is_hotspot,
            isRushHour: (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19),
            isNight: hour >= 22 || hour < 6,
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            rainfall: rainfall[0],
            trafficDensity: trafficDensity[0],
          },
          timestamp: new Date(),
          name: hotspot.name, // Add location name
        } as MLRiskZone & { name: string };
      });

      // Log statistics
      const highRisk = zones.filter((z) => z.severity === "high").length;
      const mediumRisk = zones.filter((z) => z.severity === "medium").length;
      const lowRisk = zones.filter((z) => z.severity === "low").length;

      console.log(`   🔴 High: ${highRisk}, 🟠 Medium: ${mediumRisk}, 🟢 Low: ${lowRisk}`);

      if (zones.length > 0) {
        console.log(`   📊 Risk scores: ${zones[0].riskScore} (max) - ${zones[zones.length - 1].riskScore} (min)`);
      }

      setZones(zones);
    } catch (error) {
      console.error("Error scanning area:", error);
    } finally {
      setScanning(false);
    }
  };

  // Update markers when zones change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapRef.current.Overlays.remove(marker);
    });
    markersRef.current.clear();

    // Filter zones if needed
    const displayZones = showOnlyHighRisk
      ? zones.filter((z) => z.severity === "high")
      : zones;

    // Add new markers
    displayZones.forEach((zone) => {
      const color = getRiskZoneColor(zone.severity);
      const icon = getRiskZoneIcon(zone);
      const size =
        zone.severity === "high" ? 32 : zone.severity === "medium" ? 24 : 20;

      const zoneName = (zone as any).name || "Unknown Location";

      // Get risk factors text
      const factors = [];
      if (zone.factors.isHotspot) factors.push("Temporal Hotspot");
      if (zone.factors.isRushHour) factors.push("Rush Hour");
      if (zone.factors.isNight) factors.push("Night Time");
      if (zone.factors.isWeekend) factors.push("Weekend");
      if (zone.factors.rainfall > 0) factors.push(`Rain: ${zone.factors.rainfall}mm`);

      const marker = new (window as any).longdo.Marker(
        { lon: zone.location.lng, lat: zone.location.lat },
        {
          title: zoneName,
          detail: `
            <div style="
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 16px;
              min-width: 280px;
              background: white;
              border-radius: 12px;
            ">
              <div style="
                font-size: 16px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 12px;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 8px;
              ">${zoneName}</div>

              <div style="
                background: linear-gradient(135deg, ${color}15, ${color}25);
                padding: 12px;
                border-radius: 8px;
                border-left: 4px solid ${color};
                margin-bottom: 12px;
              ">
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Risk Score</div>
                <div style="font-size: 32px; font-weight: 800; color: ${color}; line-height: 1;">
                  ${zone.riskScore}<span style="font-size: 16px; color: #9ca3af;">/100</span>
                </div>
                <div style="
                  font-size: 14px;
                  font-weight: 700;
                  color: ${color};
                  margin-top: 6px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">${zone.severity} RISK</div>
              </div>

              ${zone.severityClass ? `
                <div style="
                  background: #f3f4f6;
                  padding: 8px 12px;
                  border-radius: 6px;
                  margin-bottom: 12px;
                ">
                  <span style="font-size: 12px; color: #6b7280;">Predicted Severity:</span>
                  <strong style="font-size: 13px; color: #374151; margin-left: 6px;">${zone.severityClass}</strong>
                </div>
              ` : ''}

              ${factors.length > 0 ? `
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px; font-weight: 600;">Risk Factors</div>
                  <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${factors.map(f => `
                      <span style="
                        background: ${f.includes('Hotspot') ? '#fee2e2' : '#e0e7ff'};
                        color: ${f.includes('Hotspot') ? '#991b1b' : '#3730a3'};
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: 600;
                      ">${f}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding-top: 12px;
                border-top: 1px solid #e5e7eb;
              ">
                <span style="font-size: 11px; color: #9ca3af;">Confidence</span>
                <div style="
                  background: #10b981;
                  color: white;
                  padding: 4px 10px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 700;
                ">${(zone.confidence * 100).toFixed(0)}%</div>
              </div>
            </div>
          `,
          icon: {
            html: `<div style="position: relative; width: ${size}px; height: ${size + 10}px;">
              <!-- Pin shape -->
              <svg width="${size}" height="${size + 10}" viewBox="0 0 24 34" style="filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 22 12 22s12-13.6 12-22c0-6.6-5.4-12-12-12z"
                      fill="${color}"
                      stroke="white"
                      stroke-width="2"/>
                <circle cx="12" cy="12" r="8" fill="white" opacity="0.9"/>
                <text x="12" y="16"
                      text-anchor="middle"
                      font-size="10"
                      font-weight="bold"
                      fill="${color}">${icon}</text>
              </svg>
            </div>`,
            offset: { x: size / 2, y: size + 10 },
          },
        }
      );

      mapRef.current.Overlays.add(marker);
      markersRef.current.set(zone.id, marker);
    });
  }, [zones, showOnlyHighRisk]);

  // Stats
  const stats = {
    total: zones.length,
    high: zones.filter((z) => z.severity === "high").length,
    medium: zones.filter((z) => z.severity === "medium").length,
    low: zones.filter((z) => z.severity === "low").length,
    avgScore:
      zones.length > 0
        ? Math.round(
            zones.reduce((sum, z) => sum + z.riskScore, 0) / zones.length
          )
        : 0,
    maxScore: zones.length > 0 ? Math.max(...zones.map((z) => z.riskScore)) : 0,
  };

  const days = [
    { value: 0, label: language === "en" ? "Sunday" : "อาทิตย์" },
    { value: 1, label: language === "en" ? "Monday" : "จันทร์" },
    { value: 2, label: language === "en" ? "Tuesday" : "อังคาร" },
    { value: 3, label: language === "en" ? "Wednesday" : "พุธ" },
    { value: 4, label: language === "en" ? "Thursday" : "พฤหัสบดี" },
    { value: 5, label: language === "en" ? "Friday" : "ศุกร์" },
    { value: 6, label: language === "en" ? "Saturday" : "เสาร์" },
  ];

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

        {/* Control Panel - Left Side */}
        <div className="absolute top-4 left-4 bottom-4 w-96 z-[1000] flex flex-col gap-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {language === "en"
                  ? "Risk Map - Thailand"
                  : "แผนที่ความเสี่ยง - ประเทศไทย"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {language === "en"
                  ? "Adjust parameters to predict accident risk zones across Thailand using ML"
                  : "ปรับค่าต่างๆ เพื่อทำนายจุดเสี่ยงอุบัติเหตุทั่วประเทศไทยด้วย ML"}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {language === "en" ? "Hour" : "ชั่วโมง"}: {hour}:00
                </Label>
                <Slider
                  value={[hour]}
                  onValueChange={(v) => setHour(v[0])}
                  min={0}
                  max={23}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {hour >= 7 && hour <= 9
                    ? language === "en"
                      ? "Morning Rush Hour"
                      : "ช่วงเร่งด่วนเช้า"
                    : hour >= 17 && hour <= 19
                      ? language === "en"
                        ? "Evening Rush Hour"
                        : "ช่วงเร่งด่วนเย็น"
                      : hour >= 22 || hour < 6
                        ? language === "en"
                          ? "Night Time"
                          : "เวลากลางคืน"
                        : language === "en"
                          ? "Normal Hours"
                          : "เวลาปกติ"}
                </p>
              </div>

              {/* Day of Week */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {language === "en" ? "Day of Week" : "วันในสัปดาห์"}
                </Label>
                <Select
                  value={dayOfWeek.toString()}
                  onValueChange={(v) => setDayOfWeek(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {language === "en" ? "Month" : "เดือน"}: {month}
                </Label>
                <Slider
                  value={[month]}
                  onValueChange={(v) => setMonth(v[0])}
                  min={1}
                  max={12}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Rainfall */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CloudRain className="h-4 w-4" />
                  {language === "en" ? "Rainfall" : "ปริมาณฝน"}: {rainfall[0]} mm
                </Label>
                <Slider
                  value={rainfall}
                  onValueChange={setRainfall}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {rainfall[0] === 0
                    ? language === "en"
                      ? "No Rain"
                      : "ไม่มีฝน"
                    : rainfall[0] < 5
                      ? language === "en"
                        ? "Light Rain"
                        : "ฝนเบา"
                      : rainfall[0] < 15
                        ? language === "en"
                          ? "Moderate Rain"
                          : "ฝนปานกลาง"
                        : language === "en"
                          ? "Heavy Rain"
                          : "ฝนหนัก"}
                </p>
              </div>

              {/* Traffic Density */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  {language === "en" ? "Traffic Density" : "ความหนาแน่นจราจร"}:{" "}
                  {(trafficDensity[0] * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={trafficDensity}
                  onValueChange={setTrafficDensity}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {trafficDensity[0] < 0.3
                    ? language === "en"
                      ? "Light Traffic"
                      : "จราจรเบาบาง"
                    : trafficDensity[0] < 0.7
                      ? language === "en"
                        ? "Moderate Traffic"
                        : "จราจรปานกลาง"
                      : language === "en"
                        ? "Heavy Traffic"
                        : "จราจรหนาแน่น"}
                </p>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <Label className="text-xs">
                  {language === "en" ? "Quick Scenarios" : "สถานการณ์ทดสอบ"}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHour(2);
                      setRainfall([15]);
                      setTrafficDensity([0.8]);
                      setDayOfWeek(6);
                      // Auto-scan after setting parameters
                      setTimeout(() => scanArea(), 100);
                    }}
                  >
                    {language === "en" ? "🌧️ Rainy Night" : "🌧️ กลางคืนฝนตก"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHour(18);
                      setRainfall([0]);
                      setTrafficDensity([0.9]);
                      setDayOfWeek(4);
                      // Auto-scan after setting parameters
                      setTimeout(() => scanArea(), 100);
                    }}
                  >
                    {language === "en" ? "🚗 Rush Hour" : "🚗 ชั่วโมงเร่งด่วน"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHour(23);
                      setRainfall([0]);
                      setTrafficDensity([0.6]);
                      setDayOfWeek(5);
                      // Auto-scan after setting parameters
                      setTimeout(() => scanArea(), 100);
                    }}
                  >
                    {language === "en" ? "🌙 Late Night" : "🌙 ดึกมาก"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHour(14);
                      setRainfall([0]);
                      setTrafficDensity([0.3]);
                      setDayOfWeek(0);
                      // Auto-scan after setting parameters
                      setTimeout(() => scanArea(), 100);
                    }}
                  >
                    {language === "en" ? "☀️ Clear Day" : "☀️ กลางวันปกติ"}
                  </Button>
                </div>
              </div>

              <Button
                onClick={scanArea}
                disabled={scanning}
                className="w-full"
                size="lg"
              >
                {scanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "en" ? "Scanning Thailand..." : "กำลังสแกนประเทศไทย..."}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {language === "en"
                      ? "Find Accident Hotspots"
                      : "ค้นหาจุดเสี่ยงอุบัติเหตุ"}
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {language === "en"
                  ? "Predictions using XGBoost ML model"
                  : "การทำนายด้วย ML model XGBoost"}
              </p>

              {/* Filter Toggle */}
              {zones.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <Label className="text-xs cursor-pointer" htmlFor="high-risk-filter">
                    {language === "en"
                      ? "Show only high risk"
                      : "แสดงเฉพาะเสี่ยงสูง"}
                  </Label>
                  <input
                    id="high-risk-filter"
                    type="checkbox"
                    checked={showOnlyHighRisk}
                    onChange={(e) => setShowOnlyHighRisk(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          {zones.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {language === "en" ? "Results" : "ผลลัพธ์"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-600 dark:text-blue-400 text-xs font-medium mb-1">
                      {language === "en" ? "Total Zones" : "พื้นที่ทั้งหมด"}
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-purple-600 dark:text-purple-400 text-xs font-medium mb-1">
                      {language === "en" ? "Avg Score" : "คะแนนเฉลี่ย"}
                    </p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.avgScore}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-3 rounded-lg border-2 border-red-300 dark:border-red-700">
                    <p className="text-red-600 dark:text-red-400 text-xs font-medium mb-1 flex items-center gap-1">
                      🔴 {language === "en" ? "High Risk" : "เสี่ยงสูง"}
                    </p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                      {stats.high}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-3 rounded-lg border-2 border-orange-300 dark:border-orange-700">
                    <p className="text-orange-600 dark:text-orange-400 text-xs font-medium mb-1 flex items-center gap-1">
                      🟠 {language === "en" ? "Medium" : "ปานกลาง"}
                    </p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {stats.medium}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">
                      {language === "en" ? "Top Risk Zones" : "พื้นที่เสี่ยงสูงสุด"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {language === "en" ? "Click to view" : "คลิกเพื่อดู"}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {zones.slice(0, 20).map((zone, idx) => {
                      const zoneName = (zone as any).name || "Unknown";
                      const riskBg =
                        zone.severity === "high" ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-400 dark:border-red-600" :
                        zone.severity === "medium" ? "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-400 dark:border-orange-600" :
                        "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-400 dark:border-yellow-600";

                      const textColor =
                        zone.severity === "high" ? "text-red-700 dark:text-red-300" :
                        zone.severity === "medium" ? "text-orange-700 dark:text-orange-300" :
                        "text-yellow-700 dark:text-yellow-300";

                      return (
                        <div
                          key={zone.id}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border-2 hover:shadow-lg cursor-pointer transition-all ${riskBg}`}
                          onClick={() => {
                            setSelectedZone(zone);
                            if (mapRef.current) {
                              mapRef.current.location(
                                {
                                  lon: zone.location.lng,
                                  lat: zone.location.lat,
                                },
                                true
                              );
                              mapRef.current.zoom(14, true);
                            }
                          }}
                        >
                          <div className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${textColor}`}
                               style={{
                                 background: zone.severity === "high" ? "#DC262630" :
                                            zone.severity === "medium" ? "#EA580C30" :
                                            "#F59E0B30"
                               }}>
                            {idx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs truncate text-foreground leading-tight">
                              {zoneName}
                            </div>
                            {(zone.factors.isHotspot || zone.factors.isRushHour || zone.factors.rainfall > 0) && (
                              <div className="flex items-center gap-1 mt-0.5">
                                {zone.factors.isHotspot && <span className="text-xs">🔥</span>}
                                {zone.factors.isRushHour && <span className="text-xs">🚗</span>}
                                {zone.factors.rainfall > 0 && <span className="text-xs">🌧️</span>}
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 text-right">
                            <div className={`text-xl font-bold leading-none ${textColor}`}>
                              {zone.riskScore}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
