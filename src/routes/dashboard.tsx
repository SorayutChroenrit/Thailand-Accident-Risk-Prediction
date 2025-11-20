import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { Header } from "~/components/layout/Header";
import { Footer } from "~/components/layout/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Activity,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Car,
  Cloud,
  Clock,
  Calendar,
  BarChart3,
  RefreshCw,
  Filter,
  Undo2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  provinceAccidentData,
  generateProvinceDetailedData,
  generateThailandSummary,
  getProvinceColor,
  getTopProvinces,
  vehicleTypes,
  weatherTypes,
} from "~/lib/dashboard-data";
import { useLanguage } from "~/contexts/LanguageContext";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  ),
});

// Victim types
const victimTypes = [
  { id: "all", name_en: "All Types", name_th: "ทุกประเภท" },
  { id: "driver", name_en: "Driver", name_th: "ผู้ขับขี่" },
  { id: "passenger", name_en: "Passenger", name_th: "ผู้โดยสาร" },
  { id: "pedestrian", name_en: "Pedestrian", name_th: "คนเดินเท้า" },
];

// Date range options
const dateRanges = [
  {
    id: "all",
    name_en: "1 Jan 2019 - 31 Aug 2025",
    name_th: "1 ม.ค. 2019 - 31 ส.ค. 2025",
  },
  { id: "2025", name_en: "2025 (Jan-Aug)", name_th: "2568 (ม.ค.-ส.ค.)" },
  { id: "2024", name_en: "2024", name_th: "2567" },
  { id: "2023", name_en: "2023", name_th: "2566" },
  { id: "2022", name_en: "2022", name_th: "2565" },
  { id: "2021", name_en: "2021", name_th: "2564" },
  { id: "2020", name_en: "2020", name_th: "2563" },
  { id: "2019", name_en: "2019", name_th: "2562" },
];

// Province name mapping (GeoJSON name -> our data)
const provinceNameMapping: Record<string, string> = {
  "Mae Hong Son": "Mae Hong Son",
  "Chiang Mai": "Chiang Mai",
  "Chiang Rai": "Chiang Rai",
  Lamphun: "Lamphun",
  Lampang: "Lampang",
  Phrae: "Phrae",
  Nan: "Nan",
  Phayao: "Phayao",
  Uttaradit: "Uttaradit",
  Tak: "Tak",
  Sukhothai: "Sukhothai",
  Phitsanulok: "Phitsanulok",
  Phichit: "Phichit",
  "Kamphaeng Phet": "Kamphaeng Phet",
  "Nakhon Sawan": "Nakhon Sawan",
  "Uthai Thani": "Uthai Thani",
  "Chai Nat": "Chai Nat",
  "Sing Buri": "Sing Buri",
  "Lop Buri": "Lopburi",
  "Ang Thong": "Ang Thong",
  "Phra Nakhon Si Ayutthaya": "Phra Nakhon Si Ayutthaya",
  "Sara Buri": "Saraburi",
  "Nakhon Nayok": "Nakhon Nayok",
  "Prachin Buri": "Prachin Buri",
  "Sa Kaeo": "Sa Kaeo",
  Chachoengsao: "Chachoengsao",
  "Chon Buri": "Chonburi",
  Rayong: "Rayong",
  Chanthaburi: "Chanthaburi",
  Trat: "Trat",
  Bangkok: "Bangkok",
  "Krung Thep Maha Nakhon": "Bangkok",
  "Samut Prakan": "Samut Prakan",
  Nonthaburi: "Nonthaburi",
  "Pathum Thani": "Pathum Thani",
  "Nakhon Pathom": "Nakhon Pathom",
  "Samut Sakhon": "Samut Sakhon",
  "Samut Songkhram": "Samut Songkhram",
  Phetchaburi: "Phetchaburi",
  "Prachuap Khiri Khan": "Prachuap Khiri Khan",
  Ratchaburi: "Ratchaburi",
  Kanchanaburi: "Kanchanaburi",
  "Suphan Buri": "Suphan Buri",
  "Nakhon Ratchasima": "Nakhon Ratchasima",
  "Buri Ram": "Buri Ram",
  Surin: "Surin",
  "Si Sa Ket": "Si Sa Ket",
  "Ubon Ratchathani": "Ubon Ratchathani",
  Yasothon: "Yasothon",
  Chaiyaphum: "Chaiyaphum",
  "Amnat Charoen": "Amnat Charoen",
  "Nong Bua Lam Phu": "Nong Bua Lam Phu",
  "Khon Kaen": "Khon Kaen",
  "Udon Thani": "Udon Thani",
  Loei: "Loei",
  "Nong Khai": "Nong Khai",
  "Maha Sarakham": "Maha Sarakham",
  "Roi Et": "Roi Et",
  Kalasin: "Kalasin",
  "Sakon Nakhon": "Sakon Nakhon",
  "Nakhon Phanom": "Nakhon Phanom",
  Mukdahan: "Mukdahan",
  Chumphon: "Chumphon",
  Ranong: "Ranong",
  "Surat Thani": "Surat Thani",
  Phangnga: "Phang Nga",
  Phuket: "Phuket",
  Krabi: "Krabi",
  "Nakhon Si Thammarat": "Nakhon Si Thammarat",
  Trang: "Trang",
  Phatthalung: "Phatthalung",
  Satun: "Satun",
  Songkhla: "Songkhla",
  Pattani: "Pattani",
  Yala: "Yala",
  Narathiwat: "Narathiwat",
  "Bueng Kan": "Bueng Kan",
  Phetchabun: "Phetchabun",
};

function DashboardPage() {
  const { language } = useLanguage();

  // Filter states
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedVictimType, setSelectedVictimType] = useState<string>("all");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedWeather, setSelectedWeather] = useState<string>("all");
  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const provinceLayersRef = useRef<{ [key: string]: L.GeoJSON }>({});

  // Get province ID from selection
  const provinceId =
    selectedProvince === "all" ? null : parseInt(selectedProvince);

  // Get data based on selection and apply filters
  const dashboardData = useMemo(() => {
    let baseData;
    if (provinceId === null) {
      baseData = generateThailandSummary();
    } else {
      baseData = generateProvinceDetailedData(provinceId);
    }

    if (!baseData) return null;

    // Apply filter multipliers to simulate filtering
    let filterMultiplier = 1;

    // Victim type filter - each type represents roughly 1/3 of accidents
    if (selectedVictimType !== "all") {
      filterMultiplier *= 0.33;
    }

    // Vehicle type filter
    if (selectedVehicle !== "all") {
      const vehicleRatios: Record<string, number> = {
        motorcycle: 0.45,
        car: 0.2,
        pickup: 0.18,
        truck: 0.08,
        bus: 0.03,
        bicycle: 0.03,
        pedestrian: 0.03,
      };
      filterMultiplier *= vehicleRatios[selectedVehicle] || 0.1;
    }

    // Weather type filter
    if (selectedWeather !== "all") {
      const weatherRatios: Record<string, number> = {
        clear: 0.35,
        cloudy: 0.24,
        rain: 0.25,
        heavy_rain: 0.11,
        fog: 0.05,
      };
      filterMultiplier *= weatherRatios[selectedWeather] || 0.1;
    }

    // Date range filter - estimate based on year selection
    if (selectedDateRange !== "all") {
      filterMultiplier *= selectedDateRange === "2025" ? 0.11 : 0.14; // ~1/7 for each year
    }

    // Apply multiplier to all counts
    if (filterMultiplier < 1) {
      const applyMultiplier = (count: number) =>
        Math.round(count * filterMultiplier);

      return {
        ...baseData,
        province: {
          ...baseData.province,
          totalAccidents: applyMultiplier(baseData.province.totalAccidents),
          fatal: applyMultiplier(baseData.province.fatal),
          serious: applyMultiplier(baseData.province.serious),
          minor: applyMultiplier(baseData.province.minor),
        },
        weatherData: baseData.weatherData.map((item) => ({
          ...item,
          count: applyMultiplier(item.count),
        })),
        vehicleData: baseData.vehicleData.map((item) => ({
          ...item,
          count: applyMultiplier(item.count),
        })),
        hourlyData: baseData.hourlyData.map((item) => ({
          ...item,
          count: applyMultiplier(item.count),
        })),
        monthlyData: baseData.monthlyData.map((item) => ({
          ...item,
          count: applyMultiplier(item.count),
        })),
        yearlyData: baseData.yearlyData.map((item) => ({
          ...item,
          count: applyMultiplier(item.count),
        })),
        severityData: baseData.severityData.map((item) => ({
          ...item,
          count: applyMultiplier(item.count),
        })),
      };
    }

    return baseData;
  }, [
    provinceId,
    selectedVictimType,
    selectedVehicle,
    selectedWeather,
    selectedDateRange,
  ]);

  const topProvinces = useMemo(() => getTopProvinces(10), []);

  // Load GeoJSON
  useEffect(() => {
    fetch("/geojson/thailand-provinces.json")
      .then((res) => res.json())
      .then((data) => setGeoJsonData(data))
      .catch((err) => console.error("Failed to load GeoJSON:", err));
  }, []);

  // Get province data by name
  const getProvinceDataByName = (name: string) => {
    const mappedName = provinceNameMapping[name] || name;
    return provinceAccidentData.find(
      (p) =>
        p.name_en.toLowerCase() === mappedName.toLowerCase() ||
        p.name_en.toLowerCase().includes(mappedName.toLowerCase()) ||
        mappedName.toLowerCase().includes(p.name_en.toLowerCase()),
    );
  };

  // Initialize Leaflet Map with GeoJSON choropleth
  useEffect(() => {
    if (!mapContainerRef.current || !geoJsonData) return;

    if (mapRef.current) {
      mapRef.current.remove();
    }

    const map = L.map(mapContainerRef.current).setView([13.7, 100.5], 6);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      },
    ).addTo(map);

    mapRef.current = map;

    // Add GeoJSON layer
    if (geoJsonData && geoJsonData.features) {
      geoJsonData.features.forEach((feature: any) => {
        const provinceName = feature.properties.name;
        const provinceData = getProvinceDataByName(provinceName);

        if (!provinceData) return;

        const accidents = provinceData.totalAccidents;
        const isSelected = provinceData.id === provinceId;
        const hasSelection = provinceId !== null;

        // Determine colors
        let fillColor, fillOpacity, weight, color;
        if (hasSelection && !isSelected) {
          fillColor = "#d1d5db";
          fillOpacity = 0.6;
          color = "#9ca3af";
          weight = 1;
        } else {
          fillColor = getProvinceColor(accidents);
          fillOpacity = isSelected ? 0.9 : 0.7;
          color = isSelected ? "#374151" : "#ffffff";
          weight = isSelected ? 2 : 1;
        }

        const layer = L.geoJSON(feature, {
          style: {
            fillColor,
            fillOpacity,
            color,
            weight,
          },
          onEachFeature: (feature, layer) => {
            // Tooltip on hover
            layer.bindTooltip(
              `
              <div style="font-family: system-ui;">
                <strong>${language === "en" ? provinceData.name_en : provinceData.name_th}</strong><br/>
                <span style="color: #16A34A">${language === "en" ? "Minor" : "บาดเจ็บเล็กน้อย"}: ${provinceData.minor.toLocaleString()}</span><br/>
                <span style="color: #EA580C">${language === "en" ? "Serious" : "บาดเจ็บสาหัส"}: ${provinceData.serious.toLocaleString()}</span><br/>
                <span style="color: #DC2626">${language === "en" ? "Fatal" : "เสียชีวิต"}: ${provinceData.fatal.toLocaleString()}</span>
              </div>
            `,
              { sticky: true },
            );

            // Click handler
            layer.on("click", () => {
              setSelectedProvince(provinceData.id.toString());
            });
          },
        }).addTo(map);

        provinceLayersRef.current[provinceData.id] = layer;
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      provinceLayersRef.current = {};
    };
  }, [geoJsonData, language]);

  // Update map styles when province selection changes
  useEffect(() => {
    if (
      !mapRef.current ||
      !geoJsonData ||
      Object.keys(provinceLayersRef.current).length === 0
    )
      return;

    // Update styles for each layer
    Object.entries(provinceLayersRef.current).forEach(([id, layer]) => {
      const provinceData = provinceAccidentData.find(
        (p) => p.id === parseInt(id),
      );
      if (!provinceData) return;

      const accidents = provinceData.totalAccidents;
      const isSelected = provinceData.id === provinceId;
      const hasSelection = provinceId !== null;

      let fillColor, fillOpacity, weight, color;
      if (hasSelection && !isSelected) {
        fillColor = "#d1d5db";
        fillOpacity = 0.6;
        color = "#9ca3af";
        weight = 1;
      } else {
        fillColor = getProvinceColor(accidents);
        fillOpacity = isSelected ? 0.9 : 0.7;
        color = isSelected ? "#374151" : "#ffffff";
        weight = isSelected ? 2 : 1;
      }

      layer.setStyle({
        fillColor,
        fillOpacity,
        color,
        weight,
      });
    });
  }, [provinceId]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedDateRange("all");
    setSelectedProvince("all");
    setSelectedVictimType("all");
    setSelectedVehicle("all");
    setSelectedWeather("all");
    if (mapRef.current) {
      mapRef.current.setView([13.7, 100.5], 6);
    }
  };

  // Check if any filter is active
  const hasActiveFilters =
    selectedDateRange !== "all" ||
    selectedProvince !== "all" ||
    selectedVictimType !== "all" ||
    selectedVehicle !== "all" ||
    selectedWeather !== "all";

  if (!dashboardData) return null;

  const {
    province,
    weatherData,
    vehicleData,
    hourlyData,
    monthlyData,
    yearlyData,
    severityData,
  } = dashboardData;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            {language === "en" ? "Interactive Dashboard" : "แดชบอร์ดแบบโต้ตอบ"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {language === "en"
              ? "Analyze accident data with interactive filters"
              : "วิเคราะห์ข้อมูลอุบัติเหตุด้วยตัวกรองแบบโต้ตอบ"}
          </p>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {language === "en" ? "Filters" : "ตัวกรอง"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Date Range */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  {language === "en" ? "Date Range" : "ช่วงวันที่"}
                </label>
                <Select
                  value={selectedDateRange}
                  onValueChange={setSelectedDateRange}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRanges.map((range) => (
                      <SelectItem key={range.id} value={range.id}>
                        {language === "en" ? range.name_en : range.name_th}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Province */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  {language === "en" ? "Province" : "จังหวัด"}
                </label>
                <Select
                  value={selectedProvince}
                  onValueChange={setSelectedProvince}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {language === "en" ? "All Provinces" : "ทุกจังหวัด"}
                    </SelectItem>
                    {provinceAccidentData.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id.toString()}>
                        {language === "en" ? prov.name_en : prov.name_th}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Victim Type */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  {language === "en" ? "Victim Type" : "ประเภทผู้ประสบเหตุ"}
                </label>
                <Select
                  value={selectedVictimType}
                  onValueChange={setSelectedVictimType}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {victimTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {language === "en" ? type.name_en : type.name_th}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  {language === "en" ? "Vehicle Type" : "ประเภทรถ"}
                </label>
                <Select
                  value={selectedVehicle}
                  onValueChange={setSelectedVehicle}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {language === "en" ? "All Vehicles" : "ทุกประเภท"}
                    </SelectItem>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {language === "en" ? type.name_en : type.name_th}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Weather */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  {language === "en" ? "Weather" : "สภาพอากาศ"}
                </label>
                <Select
                  value={selectedWeather}
                  onValueChange={setSelectedWeather}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {language === "en" ? "All Weather" : "ทุกสภาพอากาศ"}
                    </SelectItem>
                    {weatherTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {language === "en" ? type.name_en : type.name_th}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  {language === "en"
                    ? "Reset All Filters"
                    : "รีเซ็ตตัวกรองทั้งหมด"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Info Banner */}
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <MapPin className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-lg md:text-xl font-bold">
                    {language === "en" ? province.name_en : province.name_th}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedProvince === "all"
                      ? language === "en"
                        ? "Showing all 77 provinces"
                        : "แสดงทั้ง 77 จังหวัด"
                      : language === "en"
                        ? "Selected province data"
                        : "ข้อมูลจังหวัดที่เลือก"}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  {province.totalAccidents.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "Total Accidents" : "อุบัติเหตุทั้งหมด"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
          <Card className="border-l-4 border-l-risk-high">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-risk-high" />
                {language === "en" ? "Fatal" : "เสียชีวิต"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-risk-high">
                {province.fatal.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {((province.fatal / province.totalAccidents) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-risk-medium">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                <Activity className="h-3 w-3 md:h-4 md:w-4 text-risk-medium" />
                <span className="hidden sm:inline">
                  {language === "en" ? "Serious" : "สาหัส"}
                </span>
                <span className="sm:hidden">
                  {language === "en" ? "Serious" : "สาหัส"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-risk-medium">
                {province.serious.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {((province.serious / province.totalAccidents) * 100).toFixed(
                  1,
                )}
                %
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-risk-low">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-risk-low" />
                {language === "en" ? "Minor" : "บาดเจ็บน้อย"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-risk-low">
                {province.minor.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {((province.minor / province.totalAccidents) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                {language === "en" ? "Avg/Year" : "เฉลี่ย/ปี"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-primary">
                {Math.round(province.totalAccidents / 7).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">2019-2025</p>
            </CardContent>
          </Card>
        </div>

        {/* Map and Top Provinces */}
        <div className="grid gap-4 lg:grid-cols-3 mb-6">
          {/* Heat Map */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {language === "en"
                      ? "Province Heat Map"
                      : "แผนที่ความร้อนจังหวัด"}
                  </CardTitle>
                  <CardDescription>
                    {language === "en"
                      ? "Click on a province to filter data"
                      : "คลิกที่จังหวัดเพื่อกรองข้อมูล"}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.setView([13.7, 100.5], 6);
                    }
                  }}
                  className="gap-1"
                >
                  <Undo2 className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    {language === "en" ? "Reset View" : "รีเซ็ตมุมมอง"}
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={mapContainerRef}
                className="h-[300px] md:h-[400px] rounded-lg overflow-hidden"
              />
              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                <div className="flex items-center gap-1 text-xs">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: "#fecaca" }}
                  />
                  <span>&lt;500</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: "#fca5a5" }}
                  />
                  <span>500-1k</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: "#f87171" }}
                  />
                  <span>1k-2k</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: "#ef4444" }}
                  />
                  <span>2k-3k</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: "#dc2626" }}
                  />
                  <span>3k-5k</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: "#b91c1c" }}
                  />
                  <span>5k-10k</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: "#991b1b" }}
                  />
                  <span>10k+</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Provinces List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {language === "en" ? "Top 10 Provinces" : "10 จังหวัดอันดับแรก"}
              </CardTitle>
              <CardDescription>
                {language === "en"
                  ? "By total accidents"
                  : "ตามจำนวนอุบัติเหตุ"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] md:max-h-[400px] overflow-y-auto">
                {topProvinces.map((prov, index) => (
                  <div
                    key={prov.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedProvince === prov.id.toString()
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedProvince(prov.id.toString())}
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {language === "en" ? prov.name_en : prov.name_th}
                      </p>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${(prov.totalAccidents / topProvinces[0].totalAccidents) * 100}%`,
                            backgroundColor: getProvinceColor(
                              prov.totalAccidents,
                            ),
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium">
                      {prov.totalAccidents.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1: Weather and Vehicle */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {/* Weather Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                {language === "en" ? "By Weather" : "ตามสภาพอากาศ"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weatherData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      horizontal={false}
                    />
                    <XAxis type="number" className="text-xs" />
                    <YAxis
                      dataKey={language === "en" ? "name_en" : "name_th"}
                      type="category"
                      className="text-xs"
                      width={70}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        language === "en" ? "Accidents" : "อุบัติเหตุ",
                      ]}
                    />
                    <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="h-4 w-4" />
                {language === "en" ? "By Vehicle" : "ตามประเภทรถ"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vehicleData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      horizontal={false}
                    />
                    <XAxis type="number" className="text-xs" />
                    <YAxis
                      dataKey={language === "en" ? "name_en" : "name_th"}
                      type="category"
                      className="text-xs"
                      width={80}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        language === "en" ? "Accidents" : "อุบัติเหตุ",
                      ]}
                    />
                    <Bar dataKey="count" fill="#EA580C" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Time and Severity */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {/* Hourly Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {language === "en" ? "By Hour" : "ตามชั่วโมง"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="hour" className="text-xs" interval={5} />
                    <YAxis className="text-xs" />
                    <Tooltip
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        language === "en" ? "Accidents" : "อุบัติเหตุ",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#2563EB"
                      fill="#2563EB"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Severity Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {language === "en" ? "Severity" : "ความรุนแรง"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[160px] md:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        "",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-3 mt-2">
                {severityData.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1 text-xs"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>
                      {language === "en" ? item.name_en : item.name_th}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 3: Monthly and Yearly Trends */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Monthly Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {language === "en" ? "By Month" : "ตามเดือน"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="monthName" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        language === "en" ? "Accidents" : "อุบัติเหตุ",
                      ]}
                    />
                    <Bar dataKey="count" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Yearly Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {language === "en" ? "Yearly Trend" : "แนวโน้มรายปี"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="year" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        language === "en" ? "Accidents" : "อุบัติเหตุ",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#DC2626"
                      strokeWidth={2}
                      dot={{ fill: "#DC2626", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
