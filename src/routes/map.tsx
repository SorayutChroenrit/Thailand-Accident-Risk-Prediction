import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Header } from "~/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  MapPin,
  Filter,
  Locate,
  AlertTriangle,
  Shield,
  Skull,
  Cloud,
  Car,
  X,
  Layers,
  Home,
} from "lucide-react";
import { riskLocations, severityLabels } from "~/lib/mock-data";
import { useLanguage } from "~/contexts/LanguageContext";

export const Route = createFileRoute("/map")({
  component: MapPage,
});

// Thailand bounds and center
const THAILAND_CENTER: [number, number] = [13.7563, 100.5018];
const THAILAND_ZOOM = 6;
const BANGKOK_ZOOM = 11;

function MapPage() {
  const { language, t } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState<
    (typeof riskLocations)[0] | null
  >(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<any>(null);

  const filteredLocations = riskLocations.filter(
    (loc) => filterSeverity === "all" || loc.severity === filterSeverity,
  );

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "low":
        return <Shield className="h-4 w-4 text-risk-low" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-risk-medium" />;
      case "high":
        return <Skull className="h-4 w-4 text-risk-high" />;
      default:
        return null;
    }
  };

  const resetToThailand = () => {
    if (mapRef.current) {
      mapRef.current.setView(THAILAND_CENTER, THAILAND_ZOOM);
    }
  };

  const goToCurrentLocation = () => {
    if (mapRef.current) {
      mapRef.current.setView(THAILAND_CENTER, BANGKOK_ZOOM);
    }
  };

  useEffect(() => {
    setMapReady(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r bg-card p-4 overflow-y-auto max-h-[300px] lg:max-h-none">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {language === "en" ? "Filters" : "ตัวกรอง"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {language === "en" ? "Severity Level" : "ระดับความรุนแรง"}
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      size="sm"
                      variant={filterSeverity === "all" ? "default" : "outline"}
                      onClick={() => setFilterSeverity("all")}
                    >
                      {language === "en" ? "All" : "ทั้งหมด"}
                    </Button>
                    <Button
                      size="sm"
                      variant={filterSeverity === "low" ? "default" : "outline"}
                      onClick={() => setFilterSeverity("low")}
                      className={
                        filterSeverity !== "low"
                          ? "text-risk-low border-risk-low hover:bg-risk-low/10"
                          : ""
                      }
                    >
                      {language === "en" ? "Low" : "ต่ำ"}
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        filterSeverity === "medium" ? "default" : "outline"
                      }
                      onClick={() => setFilterSeverity("medium")}
                      className={
                        filterSeverity !== "medium"
                          ? "text-risk-medium border-risk-medium hover:bg-risk-medium/10"
                          : ""
                      }
                    >
                      {language === "en" ? "Medium" : "ปานกลาง"}
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        filterSeverity === "high" ? "default" : "outline"
                      }
                      onClick={() => setFilterSeverity("high")}
                      className={
                        filterSeverity !== "high"
                          ? "text-risk-high border-risk-high hover:bg-risk-high/10"
                          : ""
                      }
                    >
                      {language === "en" ? "High" : "สูง"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  {language === "en" ? "Legend" : "คำอธิบาย"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-risk-low/20 flex items-center justify-center">
                    <Shield className="h-3 w-3 text-risk-low" />
                  </div>
                  <span>
                    {language === "en" ? "Minor Injury" : "บาดเจ็บน้อย"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-risk-medium/20 flex items-center justify-center">
                    <AlertTriangle className="h-3 w-3 text-risk-medium" />
                  </div>
                  <span>
                    {language === "en" ? "Serious Injury" : "บาดเจ็บสาหัส"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-risk-high/20 flex items-center justify-center">
                    <Skull className="h-3 w-3 text-risk-high" />
                  </div>
                  <span>{language === "en" ? "Fatal" : "เสียชีวิต"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {language === "en" ? "Risk Areas" : "พื้นที่เสี่ยง"} (
                  {filteredLocations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedLocation?.id === location.id
                        ? "bg-primary/10 border-2 border-primary shadow-sm"
                        : "hover:bg-muted border border-transparent"
                    }`}
                    onClick={() => setSelectedLocation(location)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {language === "en"
                            ? location.name_en
                            : location.name_th}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {language === "en" ? "Risk" : "ความเสี่ยง"}:{" "}
                            {location.risk_score}%
                          </span>
                          <Badge
                            variant={
                              location.severity === "high"
                                ? "danger"
                                : location.severity === "medium"
                                  ? "warning"
                                  : "success"
                            }
                            className="text-xs px-1.5 py-0"
                          >
                            {location.accidents_30d}
                          </Badge>
                        </div>
                      </div>
                      {getSeverityIcon(location.severity)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative min-h-[500px]">
          {mapReady && (
            <MapContainer
              filteredLocations={filteredLocations}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              language={language}
              mapRef={mapRef}
            />
          )}

          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="shadow-lg bg-white hover:bg-gray-100"
              onClick={resetToThailand}
              title={
                language === "en" ? "View all Thailand" : "ดูทั้งประเทศไทย"
              }
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="shadow-lg bg-white hover:bg-gray-100"
              onClick={goToCurrentLocation}
              title={language === "en" ? "Go to Bangkok" : "ไปกรุงเทพฯ"}
            >
              <Locate className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected Location Panel */}
          {selectedLocation && (
            <div className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-[1000]">
              <Card className="shadow-xl border-2">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(selectedLocation.severity)}
                      <CardTitle className="text-base">
                        {language === "en"
                          ? selectedLocation.name_en
                          : selectedLocation.name_th}
                      </CardTitle>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setSelectedLocation(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <span className="text-sm font-medium">
                      {language === "en" ? "Risk Score" : "คะแนนความเสี่ยง"}
                    </span>
                    <span
                      className="text-2xl font-bold"
                      style={{
                        color:
                          severityLabels[
                            selectedLocation.severity as keyof typeof severityLabels
                          ].color,
                      }}
                    >
                      {selectedLocation.risk_score}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">
                        {language === "en" ? "Severity" : "ความรุนแรง"}
                      </p>
                      <p className="text-sm font-medium">
                        {language === "en"
                          ? severityLabels[
                              selectedLocation.severity as keyof typeof severityLabels
                            ].en
                          : severityLabels[
                              selectedLocation.severity as keyof typeof severityLabels
                            ].th}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">
                        {language === "en"
                          ? "Accidents (30d)"
                          : "อุบัติเหตุ (30 วัน)"}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedLocation.accidents_30d}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">
                        {language === "en" ? "Road Type" : "ประเภทถนน"}
                      </p>
                      <p className="text-sm font-medium capitalize">
                        {selectedLocation.road_type}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">
                        {language === "en" ? "Speed Limit" : "จำกัดความเร็ว"}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedLocation.speed_limit} km/h
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {language === "en"
                        ? "Current Conditions"
                        : "สภาพปัจจุบัน"}
                    </p>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Cloud className="h-4 w-4 text-blue-500" />
                        <span>32°C, Clear</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Car className="h-4 w-4 text-orange-500" />
                        <span>High Traffic</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MapContainer({
  filteredLocations,
  selectedLocation,
  setSelectedLocation,
  language,
  mapRef,
}: {
  filteredLocations: typeof riskLocations;
  selectedLocation: (typeof riskLocations)[0] | null;
  setSelectedLocation: (loc: (typeof riskLocations)[0] | null) => void;
  language: string;
  mapRef: React.MutableRefObject<any>;
}) {
  const [MapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    import("leaflet/dist/leaflet.css");

    Promise.all([import("react-leaflet"), import("leaflet")]).then(
      ([reactLeaflet, L]) => {
        const createCustomIcon = (severity: string) => {
          const colors = {
            low: { bg: "#dcfce7", border: "#16A34A", icon: "#16A34A" },
            medium: { bg: "#ffedd5", border: "#EA580C", icon: "#EA580C" },
            high: { bg: "#fee2e2", border: "#DC2626", icon: "#DC2626" },
          };
          const color =
            colors[severity as keyof typeof colors] || colors.medium;

          const svgIcon =
            severity === "high"
              ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color.icon}" stroke-width="2"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>`
              : severity === "medium"
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color.icon}" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color.icon}" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`;

          return L.default.divIcon({
            html: `<div style="background-color:${color.bg};border:3px solid ${color.border};border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${svgIcon}</div>`,
            className: "custom-marker",
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18],
          });
        };

        setMapComponents({
          MapContainer: reactLeaflet.MapContainer,
          TileLayer: reactLeaflet.TileLayer,
          Marker: reactLeaflet.Marker,
          Popup: reactLeaflet.Popup,
          createCustomIcon,
        });
      },
    );
  }, []);

  if (!MapComponents) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  const {
    MapContainer: LeafletMap,
    TileLayer,
    Marker,
    Popup,
    createCustomIcon,
  } = MapComponents;

  return (
    <LeafletMap
      center={THAILAND_CENTER}
      zoom={BANGKOK_ZOOM}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {filteredLocations.map((location) => (
        <Marker
          key={location.id}
          position={[location.lat, location.lng]}
          icon={createCustomIcon(location.severity)}
          eventHandlers={{ click: () => setSelectedLocation(location) }}
        >
          <Popup>
            <div className="p-1 min-w-[150px]">
              <h3 className="font-semibold text-sm">
                {language === "en" ? location.name_en : location.name_th}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Risk Score: <strong>{location.risk_score}%</strong>
              </p>
              <p className="text-xs text-gray-600">
                Accidents (30d): <strong>{location.accidents_30d}</strong>
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </LeafletMap>
  );
}
