import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "~/components/layout/Header";
import { Footer } from "~/components/layout/Footer";
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
} from "lucide-react";
import { riskLocations, severityLabels } from "~/lib/mock-data";
import { useLanguage } from "~/hooks/useLanguage";

export const Route = createFileRoute("/map")({
  component: MapPage,
});

function MapPage() {
  const { language } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState<
    (typeof riskLocations)[0] | null
  >(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [MapComponent, setMapComponent] =
    useState<React.ComponentType<any> | null>(null);

  // Dynamically import Leaflet components (client-side only)
  useEffect(() => {
    import("react-leaflet").then((mod) => {
      const { MapContainer, TileLayer, CircleMarker, Popup } = mod;

      // Import Leaflet CSS
      import("leaflet/dist/leaflet.css");

      const MapWithMarkers = () => (
        <MapContainer
          center={[13.7563, 100.5018]}
          zoom={10}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredLocations.map((location) => (
            <CircleMarker
              key={location.id}
              center={[location.lat, location.lng]}
              radius={location.risk_score / 5}
              pathOptions={{
                color:
                  severityLabels[
                    location.severity as keyof typeof severityLabels
                  ].color,
                fillColor:
                  severityLabels[
                    location.severity as keyof typeof severityLabels
                  ].color,
                fillOpacity: 0.6,
              }}
              eventHandlers={{
                click: () => setSelectedLocation(location),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">
                    {language === "en" ? location.name_en : location.name_th}
                  </h3>
                  <p className="text-sm">Risk Score: {location.risk_score}%</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      );

      setMapComponent(() => MapWithMarkers);
    });
  }, [filterSeverity, language]);

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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r bg-card p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Severity Level
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      size="sm"
                      variant={filterSeverity === "all" ? "default" : "outline"}
                      onClick={() => setFilterSeverity("all")}
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      variant={filterSeverity === "low" ? "default" : "outline"}
                      onClick={() => setFilterSeverity("low")}
                      className="text-risk-low border-risk-low"
                    >
                      Low
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        filterSeverity === "medium" ? "default" : "outline"
                      }
                      onClick={() => setFilterSeverity("medium")}
                      className="text-risk-medium border-risk-medium"
                    >
                      Medium
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        filterSeverity === "high" ? "default" : "outline"
                      }
                      onClick={() => setFilterSeverity("high")}
                      className="text-risk-high border-risk-high"
                    >
                      High
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-risk-low" />
                  <span>
                    {language === "en" ? "Minor Injury" : "บาดเจ็บน้อย"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-risk-medium" />
                  <span>
                    {language === "en" ? "Serious Injury" : "บาดเจ็บสาหัส"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-risk-high" />
                  <span>{language === "en" ? "Fatal" : "เสียชีวิต"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Location List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  High Risk Areas ({filteredLocations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedLocation?.id === location.id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedLocation(location)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {language === "en"
                            ? location.name_en
                            : location.name_th}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Risk: {location.risk_score}%
                        </p>
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
        <div className="flex-1 relative">
          {/* Map */}
          <div className="absolute inset-0">
            {MapComponent ? (
              <MapComponent />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-10">
            <Button size="icon" variant="secondary" className="shadow-lg">
              <Locate className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected Location Panel */}
          {selectedLocation && (
            <div className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-10">
              <Card className="shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      {language === "en"
                        ? selectedLocation.name_en
                        : selectedLocation.name_th}
                    </CardTitle>
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
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Risk Score
                    </span>
                    <Badge
                      variant={
                        selectedLocation.severity === "high"
                          ? "danger"
                          : selectedLocation.severity === "medium"
                            ? "warning"
                            : "success"
                      }
                    >
                      {selectedLocation.risk_score}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Severity
                    </span>
                    <span className="text-sm font-medium">
                      {language === "en"
                        ? severityLabels[
                            selectedLocation.severity as keyof typeof severityLabels
                          ].en
                        : severityLabels[
                            selectedLocation.severity as keyof typeof severityLabels
                          ].th}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Accidents (30d)
                    </span>
                    <span className="text-sm font-medium">
                      {selectedLocation.accidents_30d}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Road Type
                    </span>
                    <span className="text-sm font-medium capitalize">
                      {selectedLocation.road_type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Speed Limit
                    </span>
                    <span className="text-sm font-medium">
                      {selectedLocation.speed_limit} km/h
                    </span>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Cloud className="h-3 w-3" />
                        <span>32°C, Clear</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Car className="h-3 w-3" />
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
