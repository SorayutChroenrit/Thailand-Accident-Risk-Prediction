
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { Header } from "~/components/layout/Header";
import { Footer } from "~/components/layout/Footer";
import { InteractiveTrendChart } from "~/components/InteractiveTrendChart";
import { VehicleByHourChart } from "~/components/VehicleByHourChart";
import { DashboardSkeleton } from "~/components/DashboardSkeleton";
// import { TrafficIndexChart } from "~/components/TrafficIndexChart"; // Moved to risk-map
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
  BarChart3,
  RefreshCw,
  Filter,
  Undo2,
  Heart,
  Calendar,
  X,
  ArrowLeft,
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
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";
import {
  provinceAccidentData,
  getProvinceColor,
  getTopProvinces,
} from "~/lib/dashboard-data";
import {
  vehicleTypes,
  weatherTypes,
  accidentCauseTypes,
  casualtyTypes,
} from "~/lib/filter-mappings";
import { useLanguage } from "~/contexts/LanguageContext";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import {
  fetchDashboardStats,
  type DashboardStats,
} from "~/lib/dashboard-service";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/dashboard")({
  loader: async () => {
    // Fetch initial dashboard data with default filters
    const data = await fetchDashboardStats("all", "all", "all", "all", "all", "all");
    return data;
  },
  // Cache configuration
  staleTime: 30 * 60 * 1000, // 30 minutes - data is considered fresh for 30 minutes
  gcTime: 60 * 60 * 1000, // 60 minutes - cached data is garbage collected after 60 minutes
  pendingComponent: DashboardSkeleton,
  component: () => (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  ),
});

// Vehicle pie chart colors
const VEHICLE_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#06B6D4", "#84CC16"
];



// Dashboard filter interface
interface DashboardFilters {
  vehicle: string | null;
  weather: string | null;
  cause: string | null;
  severity: 'fatal' | 'serious' | 'minor' | null;
  hour: number | null;
  weekday: number | null; // 0 = Sunday, 6 = Saturday
}

// Date range options
const dateRanges = [
  {
    id: "all",
    name_en: "All Time (2019-2025)",
    name_th: "ทั้งหมด (2019-2025)",
  },
  { id: "2025", name_en: "2025 (Jan-Aug)", name_th: "2568 (ม.ค.-ส.ค.)" },
  { id: "2024", name_en: "2024", name_th: "2567" },
  { id: "2023", name_en: "2023", name_th: "2566" },
  { id: "2022", name_en: "2022", name_th: "2565" },
  { id: "2021", name_en: "2021", name_th: "2564" },
  { id: "2020", name_en: "2020", name_th: "2563" },
  { id: "2019", name_en: "2019", name_th: "2562" },
];



// Province name mapping (GeoJSON English name -> Thai name for API)
const provinceNameMapping: Record<string, string> = {
  "Mae Hong Son": "แม่ฮ่องสอน",
  "Chiang Mai": "เชียงใหม่",
  "Chiang Rai": "เชียงราย",
  Lamphun: "ลำพูน",
  Lampang: "ลำปาง",
  Phrae: "แพร่",
  Nan: "น่าน",
  Phayao: "พะเยา",
  Uttaradit: "อุตรดิตถ์",
  Tak: "ตาก",
  Sukhothai: "สุโขทัย",
  Phitsanulok: "พิษณุโลก",
  Phichit: "พิจิตร",
  "Kamphaeng Phet": "กำแพงเพชร",
  "Nakhon Sawan": "นครสวรรค์",
  "Uthai Thani": "อุทัยธานี",
  "Chai Nat": "ชัยนาท",
  "Sing Buri": "สิงห์บุรี",
  "Lop Buri": "ลพบุรี",
  Lopburi: "ลพบุรี",
  "Ang Thong": "อ่างทอง",
  "Phra Nakhon Si Ayutthaya": "พระนครศรีอยุธยา",
  "Sara Buri": "สระบุรี",
  Saraburi: "สระบุรี",
  "Nakhon Nayok": "นครนายก",
  "Prachin Buri": "ปราจีนบุรี",
  "Sa Kaeo": "สระแก้ว",
  Chachoengsao: "ฉะเชิงเทรา",
  "Chon Buri": "ชลบุรี",
  Chonburi: "ชลบุรี",
  Rayong: "ระยอง",
  Chanthaburi: "จันทบุรี",
  Trat: "ตราด",
  Bangkok: "กรุงเทพมหานคร",
  "Bangkok Metropolis": "กรุงเทพมหานคร",
  "Krung Thep Maha Nakhon": "กรุงเทพมหานคร",
  "Samut Prakan": "สมุทรปราการ",
  Nonthaburi: "นนทบุรี",
  "Pathum Thani": "ปทุมธานี",
  "Nakhon Pathom": "นครปฐม",
  "Samut Sakhon": "สมุทรสาคร",
  "Samut Songkhram": "สมุทรสงคราม",
  Phetchaburi: "เพชรบุรี",
  "Prachuap Khiri Khan": "ประจวบคีรีขันธ์",
  Ratchaburi: "ราชบุรี",
  Kanchanaburi: "กาญจนบุรี",
  "Suphan Buri": "สุพรรณบุรี",
  "Nakhon Ratchasima": "นครราชสีมา",
  "Buri Ram": "บุรีรัมย์",
  Buriram: "บุรีรัมย์",
  Surin: "สุรินทร์",
  "Si Sa Ket": "ศรีสะเกษ",
  Sisaket: "ศรีสะเกษ",
  "Ubon Ratchathani": "อุบลราชธานี",
  Yasothon: "ยโสธร",
  Chaiyaphum: "ชัยภูมิ",
  "Amnat Charoen": "อำนาจเจริญ",
  "Nong Bua Lam Phu": "หนองบัวลำภู",
  "Nong Bua Lamphu": "หนองบัวลำภู",
  "Khon Kaen": "ขอนแก่น",
  "Udon Thani": "อุดรธานี",
  Loei: "เลย",
  "Nong Khai": "หนองคาย",
  "Maha Sarakham": "มหาสารคาม",
  "Roi Et": "ร้อยเอ็ด",
  Kalasin: "กาฬสินธุ์",
  "Sakon Nakhon": "สกลนคร",
  "Nakhon Phanom": "นครพนม",
  Mukdahan: "มุกดาหาร",
  Chumphon: "ชุมพร",
  Ranong: "ระนอง",
  "Surat Thani": "สุราษฎร์ธานี",
  Phangnga: "พังงา",
  "Phang Nga": "พังงา",
  Phuket: "ภูเก็ต",
  Krabi: "กระบี่",
  "Nakhon Si Thammarat": "นครศรีธรรมราช",
  Trang: "ตรัง",
  Phatthalung: "พัทลุง",
  Satun: "สตูล",
  Songkhla: "สงขลา",
  Pattani: "ปัตตานี",
  Yala: "ยะลา",
  Narathiwat: "นราธิวาส",
  "Bueng Kan": "บึงกาฬ",
  Phetchabun: "เพชรบูรณ์",
};

function DashboardPage() {
  const { language } = useLanguage();
  const initialData = useLoaderData({ from: "/dashboard" });
  
  // State
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    initialData
  );
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedCasualtyType, setSelectedCasualtyType] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [selectedWeather, setSelectedWeather] = useState("all");
  const [selectedAccidentCause, setSelectedAccidentCause] = useState("all");

  // Interactive filters from charts
  const [filters, setFilters] = useState<DashboardFilters>({
    vehicle: null,
    weather: null,
    cause: null,
    severity: null,
    hour: null,
    weekday: null,
  });

  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  // Filter helper functions
  const toggleFilter = (dimension: keyof DashboardFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [dimension]: prev[dimension] === value ? null : value
    }));
  };

  const clearFilter = (dimension: keyof DashboardFilters) => {
    setFilters(prev => ({ ...prev, [dimension]: null }));
  };

  const clearAllFilters = () => {
    setFilters({
      vehicle: null,
      weather: null,
      cause: null,
      severity: null,
      hour: null,
      weekday: null,
    });
  };

  const hasInteractiveFilters = Object.values(filters).some(f => f !== null);

  // Debug logging
  useEffect(() => {
    if (dashboardStats && dashboardStats.all_events && dashboardStats.all_events.length > 0) {
      console.log("First event sample:", (dashboardStats.all_events as any)[0]);
    }
  }, [dashboardStats]);

  useEffect(() => {
    console.log("Active filters:", filters);
  }, [filters]);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const provinceLayersRef = useRef<{ [key: string]: L.GeoJSON }>({});

  // Fetch dashboard data from API only when filters change from defaults
  useEffect(() => {
    // Skip if using default filters (use cached loader data)
    if (selectedDateRange === "all" && selectedProvince === "all") {
      return;
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardStats(
          selectedDateRange,
          selectedProvince,
          selectedCasualtyType,
          selectedVehicle,
          selectedWeather,
          selectedAccidentCause, // NEW!
        );

        // CRITICAL: Validate data structure before setting state
        if (
          data &&
          data.summary &&
          typeof data.summary.total_accidents === "number"
        ) {
          setDashboardStats(data);
        } else {
          console.error("Invalid dashboard data structure:", data);
          // Set empty data instead of null to prevent undefined errors
          setDashboardStats({
            summary: {
              total_accidents: 0,
              minor_injuries: 0,
              serious_injuries: 0,
              fatalities: 0,
              survivors: 0,
              high_risk_areas: 0,
            },
            severity_distribution: [],
            event_types: [],
            weather_data: [],
            accident_causes: [],
            top_provinces: [],
            all_provinces: [],
            monthly_trend: [],
            hourly_pattern: [],
            daily_pattern: [],
            yearly_summary: [],
            monthly_summary: [],
            weekday_summary: [],
            vehicle_by_hour: [],
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        // Set empty data on error
        setDashboardStats({
          summary: {
            total_accidents: 0,
            minor_injuries: 0,
            serious_injuries: 0,
            fatalities: 0,
            survivors: 0,
            high_risk_areas: 0,
          },
          severity_distribution: [],
          event_types: [],
          weather_data: [],
          accident_causes: [],
          top_provinces: [],
          all_provinces: [],
          monthly_trend: [],
          hourly_pattern: [],
          daily_pattern: [],
          yearly_summary: [],
          monthly_summary: [],
          weekday_summary: [],
          vehicle_by_hour: [],
        });
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [
    selectedDateRange,
    selectedProvince,
    // All other filters (casualty, vehicle, weather, cause) filtered on client-side (no refetch needed)
  ]);

  // Get province name from selection (now using Thai name)
  const provinceName = selectedProvince === "all" ? null : selectedProvince;

  // Find province data by Thai name for compatibility with map
  const provinceData = provinceName
    ? provinceAccidentData.find((p) => p.name_th === provinceName)
    : null;
  const provinceId = provinceData ? provinceData.id : null;

  // Use real API data instead of mock data
  const dashboardData = useMemo(() => {
    // Return null if still loading or no data
    if (loading || !dashboardStats) return null;

    // CLIENT-SIDE FILTERING for Vehicle/Weather/Cause
    // This allows fast filtering without re-fetching from server
    const allEvents = dashboardStats.all_events || [];

    const filteredEvents = allEvents.filter((event) => {
      // Casualty type filter
      const fatal = event.casualties_fatal || 0;
      const serious = event.casualties_serious || 0;
      const minor = event.casualties_minor || 0;

      if (selectedCasualtyType !== "all") {
        if (selectedCasualtyType === "fatal" && fatal === 0) {
          return false;
        } else if (selectedCasualtyType === "serious" && serious === 0) {
          return false;
        } else if (selectedCasualtyType === "minor" && minor === 0) {
          return false;
        } else if (selectedCasualtyType === "survivors" && fatal > 0) {
          return false;
        }
      }

      // Vehicle filter
      if (selectedVehicle !== "all" && event.vehicle_1 !== selectedVehicle) {
        return false;
      }

      // Weather filter
      if (
        selectedWeather !== "all" &&
        event.weather_condition !== selectedWeather
      ) {
        return false;
      }

      // Accident cause filter
      if (
        selectedAccidentCause !== "all" &&
        event.presumed_cause !== selectedAccidentCause
      ) {
        return false;
      }

      return true;
    });

    // Apply interactive filters (cross-chart filtering)
    const eventsForAggregation = filteredEvents.filter((event) => {
      // Vehicle filter
      if (filters.vehicle && event.vehicle_1 !== filters.vehicle) {
        return false;
      }

      // Weather filter
      if (filters.weather && event.weather_condition !== filters.weather) {
        return false;
      }

      // Cause filter
      if (filters.cause && event.presumed_cause !== filters.cause) {
        return false;
      }

      // Severity filter
      if (filters.severity) {
        const fatal = event.casualties_fatal || 0;
        const serious = event.casualties_serious || 0;
        const minor = event.casualties_minor || 0;
        
        if (filters.severity === 'fatal' && fatal === 0) return false;
        if (filters.severity === 'serious' && serious === 0) return false;
        if (filters.severity === 'minor' && minor === 0) return false;
      }

      // Hour filter
      if (filters.hour !== null && (event as any).hour != filters.hour) {
        return false;
      }

      // Weekday filter
      if (filters.weekday !== null && (event as any).day_of_week != filters.weekday) {
        return false;
      }

      return true;
    });

    // Re-aggregate filtered data
    const vehicleCount: Record<string, number> = {};
    const weatherCount: Record<string, number> = {};
    const causeCount: Record<string, number> = {};
    const accidentTypeCount: Record<string, number> = {};
    const hourlyCount: Record<number, number> = {};
    const weekdayCount: Record<number, number> = {};
    const provinceCount: Record<
      string,
      { count: number; fatal: number; serious: number; minor: number }
    > = {};
    let totalFatal = 0;
    let totalSerious = 0;
    let totalMinor = 0;

    eventsForAggregation.forEach((event) => {
      // Count by vehicle
      const vehicle = event.vehicle_1 || "ไม่ทราบ";
      vehicleCount[vehicle] = (vehicleCount[vehicle] || 0) + 1;

      // Count by weather
      const weather = event.weather_condition || "ไม่ทราบ";
      weatherCount[weather] = (weatherCount[weather] || 0) + 1;

      // Count by cause
      const cause = event.presumed_cause || "ไม่ทราบ";
      if (cause && cause.trim()) {
        causeCount[cause] = (causeCount[cause] || 0) + 1;
      }

      // Count by type
      const type = event.accident_type || "other";
      accidentTypeCount[type] = (accidentTypeCount[type] || 0) + 1;

      // Count by province (for top provinces)
      const prov = event.province || "ไม่ทราบ";
      if (!provinceCount[prov]) {
        provinceCount[prov] = { count: 0, fatal: 0, serious: 0, minor: 0 };
      }
      provinceCount[prov].count += 1;
      provinceCount[prov].fatal += event.casualties_fatal || 0;
      provinceCount[prov].serious += event.casualties_serious || 0;
      provinceCount[prov].minor += event.casualties_minor || 0;

      // Sum casualties
      totalFatal += event.casualties_fatal || 0;
      totalSerious += event.casualties_serious || 0;
      totalMinor += event.casualties_minor || 0;

      // Count by hour (if available)
      const hour = (event as any).hour;
      if (hour !== undefined && hour !== null) {
        hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
      }

      // Count by weekday (if available)
      const weekday = (event as any).day_of_week;
      if (weekday !== undefined && weekday !== null) {
        weekdayCount[weekday] = (weekdayCount[weekday] || 0) + 1;
      }
    });

    const totalAccidents = eventsForAggregation.length;
    const survivors = totalAccidents - totalFatal;

    // For compatibility with old dashboard components, create a structure
    // that matches what they expect, but use filtered data
    const baseData = {
      province: {
        id: provinceId || 0,
        name_en: "Thailand",
        name_th: "ประเทศไทย",
        totalAccidents: totalAccidents,
        fatal: totalFatal,
        serious: totalSerious,
        minor: totalMinor,
      },
      weatherData: Object.entries(weatherCount)
        .sort((a, b) => b[1] - a[1])
        .map(([weather, count]) => ({
          name_en: weather,
          name_th: weather,
          count: count,
        })),
      // Accident Types (keep for potential future use)
      accidentTypesData: Object.entries(accidentTypeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([type, count]) => ({
          name_en: type,
          name_th: type,
          count: count,
        })),
      // Vehicle Types (new pie chart data with translations)
      vehicleTypesData: Object.entries(vehicleCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([vehicle, count]) => {
          const vehicleMapping = vehicleTypes.find(v => v.id === vehicle);
          return {
            name_en: vehicleMapping?.name_en || vehicle,
            name_th: vehicleMapping?.name_th || vehicle,
            count: count,
          };
        }),
      accidentCausesData: Object.entries(causeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([cause, count]) => ({
          name_en: cause,
          name_th: cause,
          count: count,
        })),
      // Fix hourly data to include all 24 hours (from filtered data)
      hourlyData: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: hourlyCount[i] || 0
      })),
      // Weekday data (Sun-Sat)
      weekdayData: Array.from({ length: 7 }, (_, i) => {
        const dayNames = {
          en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          th: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
        };
        return {
          day: i,
          name_en: dayNames.en[i],
          name_th: dayNames.th[i],
          count: weekdayCount[i] || 0
        };
      }),
      // Default data
      monthlyData:
        dashboardStats?.monthly_trend?.length > 0
          ? dashboardStats.monthly_trend.map((item) => ({
              month: parseInt(item.month.split("-")[1]),
              monthName: item.month,
              count: item.count,
            }))
          : [{ month: 1, monthName: "2025-01", count: 0 }],
      yearlyData: [],
      severityData: [
        {
          id: "survivors",
          name_en: "Survivors",
          name_th: "ผู้รอดชีวิต",
          count: survivors,
          color: "#10b981",
        },
        {
          id: "minor",
          name_en: "Minor Injury",
          name_th: "ผู้บาดเจ็บเล็กน้อย",
          count: totalMinor,
          color: "#EAB308",
        },
        {
          id: "serious",
          name_en: "Serious Injury",
          name_th: "ผู้บาดเจ็บสาหัส",
          count: totalSerious,
          color: "#f59e0b",
        },
        {
          id: "fatal",
          name_en: "Fatalities",
          name_th: "ผู้เสียชีวิต",
          count: totalFatal,
          color: "#ef4444",
        },
      ],
      topProvincesData: Object.entries(provinceCount)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([province, data]: [string, any]) => ({
          name_en: province,
          name_th: province,
          count: data.count,
        })),
      // Add all provinces data for heat map (all 77 provinces with filtered counts)
      allProvincesData: Object.entries(provinceCount).map(
        ([province, data]: [string, any]) => ({
          province: province,
          count: data.count,
          fatal: data.fatal || 0,
          serious: data.serious || 0,
          minor: data.minor || 0,
        }),
      ),
    };

    if (!baseData) return null;

    // Data is filtered client-side for all filters (casualty, vehicle, weather, cause) for better performance
    return baseData;
  }, [
    loading,
    dashboardStats,
    provinceId,
    selectedCasualtyType,
    selectedVehicle,
    selectedWeather,
    selectedAccidentCause,
    filters,
  ]);

  // Use filtered top provinces data instead of static data
  const topProvinces = useMemo(() => {
    if (!dashboardData || !dashboardData.topProvincesData) {
      return getTopProvinces(10); // Fallback to static data
    }
    // Convert topProvincesData to match the expected format
    return dashboardData.topProvincesData.map((prov) => ({
      id: 0, // Will be looked up later
      name_en: prov.name_en,
      name_th: prov.name_th,
      totalAccidents: prov.count,
      fatal: 0,
      serious: 0,
      minor: 0,
    }));
  }, [dashboardData]);

  // Load GeoJSON
  useEffect(() => {
    fetch("/geojson/thailand-provinces.json")
      .then((res) => res.json())
      .then((data) => setGeoJsonData(data))
      .catch((err) => console.error("Failed to load GeoJSON:", err));
  }, []);

  // Get province data by name from filtered data
  const getProvinceDataByName = (name: string) => {
    if (!dashboardData || !dashboardData.allProvincesData) return null;

    const mappedName = provinceNameMapping[name] || name;

    // Find in allProvincesData (respects all filters, includes all 77 provinces!)
    const filteredProvince = dashboardData.allProvincesData.find(
      (p) =>
        p.province.toLowerCase() === mappedName.toLowerCase() ||
        p.province.toLowerCase().includes(mappedName.toLowerCase()) ||
        mappedName.toLowerCase().includes(p.province.toLowerCase()),
    );

    if (filteredProvince) {
      // Also find the static province data to get the ID
      const staticProvince = provinceAccidentData.find(
        (p) =>
          p.name_en.toLowerCase() === filteredProvince.province.toLowerCase() ||
          p.name_th.toLowerCase() === filteredProvince.province.toLowerCase(),
      );

      return {
        name_en: filteredProvince.province,
        name_th: filteredProvince.province,
        totalAccidents: filteredProvince.count,
        fatal: filteredProvince.fatal || 0,
        serious: filteredProvince.serious || 0,
        minor: filteredProvince.minor || 0,
        id: staticProvince?.id || 0,
      };
    }

    return null;
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
        const isSelected = provinceData.name_th === selectedProvince;

        // Determine colors - keep province colors, just highlight selected
        let fillColor, fillOpacity, weight, color;
        fillColor = getProvinceColor(accidents);
        fillOpacity = isSelected ? 0.9 : 0.7;
        color = isSelected ? "#374151" : "#ffffff";
        weight = isSelected ? 3 : 1;

        const layer = L.geoJSON(feature, {
          style: {
            fillColor,
            fillOpacity,
            color,
            weight,
          },
          onEachFeature: (_feature, layer) => {
            // Tooltip on hover
            layer.bindTooltip(
              `
              <div style="font-family: system-ui;">
                <strong>${language === "en" ? provinceData.name_en : provinceData.name_th}</strong><br/>
                <span style="color: #6B7280">${language === "en" ? "Total Accidents" : "อุบัติเหตุทั้งหมด"}: ${provinceData.totalAccidents.toLocaleString()}</span><br/>
                <span style="color: #10B981">${language === "en" ? "Survivors" : "ผู้รอดชีวิต"}: ${(provinceData.totalAccidents - provinceData.fatal).toLocaleString()}</span><br/>
                <span style="color: #EAB308">${language === "en" ? "Minor" : "บาดเจ็บเล็กน้อย"}: ${provinceData.minor.toLocaleString()}</span><br/>
                <span style="color: #EA580C">${language === "en" ? "Serious" : "บาดเจ็บสาหัส"}: ${provinceData.serious.toLocaleString()}</span><br/>
                <span style="color: #DC2626">${language === "en" ? "Fatal" : "เสียชีวิต"}: ${provinceData.fatal.toLocaleString()}</span>
              </div>
            `,
              { sticky: true },
            );

            // Click handler - use Thai name
            layer.on("click", () => {
              // Find matching province from static data
              const staticProvince = provinceAccidentData.find(
                (p) =>
                  p.name_en.toLowerCase() ===
                    provinceData.name_th.toLowerCase() ||
                  p.name_th.toLowerCase() ===
                    provinceData.name_th.toLowerCase(),
              );
              if (staticProvince) {
                setSelectedProvince(staticProvince.name_th);
              }
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
  }, [geoJsonData, dashboardData, selectedProvince, language]); // Added dashboardData to redraw map when filters change

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
      const isSelected = provinceData.name_th === selectedProvince;

      let fillColor, fillOpacity, weight, color;
      fillColor = getProvinceColor(accidents);
      fillOpacity = isSelected ? 0.9 : 0.7;
      color = isSelected ? "#374151" : "#ffffff";
      weight = isSelected ? 3 : 1;

      layer.setStyle({
        fillColor,
        fillOpacity,
        color,
        weight,
      });
    });
  }, [provinceId, selectedProvince]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedDateRange("all");
    setSelectedProvince("all");
    setSelectedCasualtyType("all");
    setSelectedVehicle("all");
    setSelectedWeather("all");
    setSelectedAccidentCause("all");
    clearAllFilters();
  };

  // Check if any filter is active
  const hasActiveFilters =
    selectedDateRange !== "all" ||
    selectedProvince !== "all" ||
    selectedCasualtyType !== "all" ||
    selectedVehicle !== "all" ||
    selectedWeather !== "all" ||
    selectedAccidentCause !== "all" ||
    hasInteractiveFilters;

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <DashboardSkeleton />
        <Footer />
      </div>
    );
  }

  // Show error state if no data
  if (!dashboardStats || !dashboardData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <Card className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">
                {language === "en" ? "No Data Available" : "ไม่มีข้อมูล"}
              </h2>
              <p className="text-gray-600 mb-4">
                {language === "en"
                  ? "Unable to load dashboard data. Please try again later."
                  : "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง"}
              </p>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {language === "en" ? "Reload" : "โหลดใหม่"}
              </Button>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const {
    province,
    weatherData = [],
    vehicleTypesData = [],
    accidentCausesData = [],
    hourlyData = [],
    weekdayData = [],
    severityData = [],
  } = dashboardData;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {language === "en" ? "Dashboard" : "แดชบอร์ด"}
              </h1>
            </div>
            <p className="text-gray-600 mt-1 text-sm md:text-base ml-16">
              {language === "en"
                ? "Analyze accident data with interactive filters and visualizations"
                : "วิเคราะห์ข้อมูลอุบัติเหตุด้วยตัวกรองแบบโต้ตอบและภาพแสดงข้อมูล"}
            </p>
          </div>

          {/* Filter Bar */}
          <Card className="mb-6 shadow-lg border border-gray-200 bg-white">
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">
                  {language === "en" ? "Filters" : "ตัวกรอง"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Date Range Filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    {language === "en" ? "Date Range" : "ช่วงเวลา"}
                  </label>
                  <Select
                    value={selectedDateRange}
                    onValueChange={setSelectedDateRange}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select year" />
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
                        <SelectItem key={prov.id} value={prov.name_th}>
                          {language === "en" ? prov.name_en : prov.name_th}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Victim Type */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    {language === "en"
                      ? "Casualty Severity"
                      : "ระดับความรุนแรง"}
                  </label>
                  <Select
                    value={selectedCasualtyType}
                    onValueChange={setSelectedCasualtyType}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {casualtyTypes.map((type) => (
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
                      {weatherTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {language === "en" ? type.name_en : type.name_th}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Accident Cause */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    {language === "en" ? "Accident Cause" : "สาเหตุ"}
                  </label>
                  <Select
                    value={selectedAccidentCause}
                    onValueChange={setSelectedAccidentCause}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accidentCauseTypes.map((type) => (
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
                    className="gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
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
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
            <CardContent className="py-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-lg shadow-md">
                    <MapPin className="h-6 w-6 text-white flex-shrink-0" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                      {language === "en"
                        ? province?.name_en || "Thailand"
                        : province?.name_th || "ประเทศไทย"}
                    </h2>
                    <p className="text-sm text-gray-600">
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
                  <p className="text-3xl md:text-4xl font-bold text-blue-700">
                    {loading ? (
                      <RefreshCw className="h-8 w-8 animate-spin inline-block" />
                    ) : (
                      (
                        dashboardStats?.summary?.total_accidents || 0
                      ).toLocaleString()
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {language === "en"
                      ? "Total Accidents"
                      : "อุบัติเหตุทั้งหมด"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Traffic Index moved to Risk Map page */}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : dashboardStats && dashboardStats.summary ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-6">
              <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    <span className="text-gray-700">
                      {language === "en"
                        ? "Total Accidents"
                        : "จำนวนอุบัติเหตุทั้งหมด"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-blue-600">
                    {(province.totalAccidents || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {language === "en"
                      ? "Total recorded cases"
                      : "กรณีที่บันทึกทั้งหมด"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-risk-high shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-risk-high" />
                    <span className="text-gray-700">
                      {language === "en" ? "Fatal" : "เสียชีวิต"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-risk-high">
                    {(province.fatal || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {province.totalAccidents > 0 ? (
                      <>
                        {(
                          ((province.fatal || 0) / province.totalAccidents) *
                          100
                        ).toFixed(1)}
                        % {language === "en" ? "of total" : "จากทั้งหมด"}
                      </>
                    ) : (
                      "0%"
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-risk-medium shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 md:h-5 md:w-5 text-risk-medium" />
                    <span className="text-gray-700">
                      {language === "en" ? "Serious" : "สาหัส"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-risk-medium">
                    {(province.serious || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {province.totalAccidents > 0 ? (
                      <>
                        {(
                          ((province.serious || 0) / province.totalAccidents) *
                          100
                        ).toFixed(1)}
                        % {language === "en" ? "of total" : "จากทั้งหมด"}
                      </>
                    ) : (
                      "0%"
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-yellow-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                    <span className="text-gray-700">
                      {language === "en" ? "Minor" : "บาดเจ็บน้อย"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-yellow-600">
                    {(province.minor || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {province.totalAccidents > 0 ? (
                      <>
                        {(
                          ((province.minor || 0) / province.totalAccidents) *
                          100
                        ).toFixed(1)}
                        % {language === "en" ? "of total" : "จากทั้งหมด"}
                      </>
                    ) : (
                      "0%"
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                    <span className="text-gray-700">
                      {language === "en" ? "Survivors" : "ผู้รอดชีวิต"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-green-600">
                    {(
                      (dashboardData?.province?.totalAccidents || 0) -
                      (dashboardData?.province?.fatal || 0)
                    ).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {(dashboardData?.province?.totalAccidents || 0) > 0 ? (
                      <>
                        {(
                          (((dashboardData?.province?.totalAccidents || 0) -
                            (dashboardData?.province?.fatal || 0)) /
                            (dashboardData?.province?.totalAccidents || 1)) *
                          100
                        ).toFixed(1)}
                        % {language === "en" ? "survival rate" : "อัตราการรอดชีวิต"}
                      </>
                    ) : (
                      "0%"
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Map and Top Provinces */}
          <div className="grid gap-4 lg:grid-cols-3 mb-6">
            {/* Heat Map */}
            <Card className="lg:col-span-2 shadow-lg border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <span className="text-lg font-semibold text-gray-900">
                        {language === "en"
                          ? "Province Heat Map"
                          : "แผนที่ความร้อนจังหวัด"}
                      </span>
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
                      if (selectedProvince === "all") {
                        // If already "all", just reset the view (user might have zoomed/panned manually)
                        mapRef.current?.setView([13.7, 100.5], 6);
                        mapRef.current?.closePopup();
                      } else {
                        // If a province is selected, clearing it will trigger the map re-initialization
                        setSelectedProvince("all");
                      }
                    }}
                    className="gap-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                  >
                    {selectedProvince === "all" ? (
                      <Undo2 className="h-3 w-3" />
                    ) : (
                      <ArrowLeft className="h-3 w-3" />
                    )}
                    <span className="hidden sm:inline">
                      {selectedProvince === "all"
                        ? language === "en"
                          ? "Reset Zoom"
                          : "รีเซ็ตมุมมอง"
                        : language === "en"
                          ? "Back to Overview"
                          : "กลับสู่ภาพรวม"}
                    </span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  key={selectedProvince} // Force remount on province change to ensure clean map initialization
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
            <Card className="shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-semibold text-gray-900">
                    {language === "en"
                      ? "Top 10 Provinces"
                      : "10 จังหวัดอันดับแรก"}
                  </span>
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
                        selectedProvince === prov.name_th
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedProvince(prov.name_th)}
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

          {/* Active Filters Banner */}
          {hasInteractiveFilters && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-wrap items-center gap-3 shadow-sm">
              <div className="flex items-center gap-2 text-blue-700 font-medium mr-2">
                <Filter className="h-4 w-4" />
                {language === "en" ? "Active Filters:" : "ตัวกรองที่ใช้งานอยู่:"}
              </div>
              
              {filters.vehicle && (
                <Badge variant="secondary" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100 gap-1 pl-2 pr-1 py-1">
                  {filters.vehicle}
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 rounded-full hover:bg-blue-200" onClick={() => clearFilter('vehicle')}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filters.weather && (
                <Badge variant="secondary" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100 gap-1 pl-2 pr-1 py-1">
                  {filters.weather}
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 rounded-full hover:bg-blue-200" onClick={() => clearFilter('weather')}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.cause && (
                <Badge variant="secondary" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100 gap-1 pl-2 pr-1 py-1">
                  {filters.cause}
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 rounded-full hover:bg-blue-200" onClick={() => clearFilter('cause')}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.severity && (
                <Badge variant="secondary" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100 gap-1 pl-2 pr-1 py-1">
                  {filters.severity === 'fatal' ? (language === 'en' ? 'Fatal' : 'เสียชีวิต') : 
                   filters.severity === 'serious' ? (language === 'en' ? 'Serious' : 'สาหัส') : 
                   (language === 'en' ? 'Minor' : 'บาดเจ็บเล็กน้อย')}
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 rounded-full hover:bg-blue-200" onClick={() => clearFilter('severity')}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.hour !== null && (
                <Badge variant="secondary" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100 gap-1 pl-2 pr-1 py-1">
                  {language === 'en' ? `Hour: ${filters.hour}:00` : `เวลา: ${filters.hour}:00`}
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 rounded-full hover:bg-blue-200" onClick={() => clearFilter('hour')}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.weekday !== null && (
                <Badge variant="secondary" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100 gap-1 pl-2 pr-1 py-1">
                  {language === 'en' ? 
                    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][filters.weekday] : 
                    ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'][filters.weekday]}
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 rounded-full hover:bg-blue-200" onClick={() => clearFilter('weekday')}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto">
                {language === "en" ? "Clear All" : "ล้างทั้งหมด"}
              </Button>
            </div>
          )}

          {/* Charts Row 1: 2x2 Grid - Weather, Accident Types, Accident Causes, Severity */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {/* Weather Chart */}
            <Card className="shadow-lg border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-semibold text-gray-900">
                    {language === "en" ? "Weather Conditions" : "สภาพอากาศ"}
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  {language === "en"
                    ? "Accident distribution by weather"
                    : "การกระจายอุบัติเหตุตามสภาพอากาศ"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {weatherData && weatherData.length > 0 ? (
                  <div className="h-[200px] md:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weatherData} layout="vertical">
                        <defs>
                          <linearGradient
                            id="weatherGradient"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop
                              offset="0%"
                              stopColor="#3B82F6"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="100%"
                              stopColor="#1D4ED8"
                              stopOpacity={1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#E5E7EB"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          className="text-xs"
                          tick={{ fill: "#6B7280" }}
                        />
                        <YAxis
                          dataKey={language === "en" ? "name_en" : "name_th"}
                          type="category"
                          className="text-xs"
                          tick={{ fill: "#374151" }}
                          width={100}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value: number) => [
                            `${value.toLocaleString()} ${language === "en" ? "accidents" : "อุบัติเหตุ"}`,
                            language === "en" ? "Total" : "ทั้งหมด",
                          ]}
                        />
                        <Bar
                          dataKey="count"
                          fill="url(#weatherGradient)"
                          radius={[0, 8, 8, 0]}
                          onClick={(data: any) => {
                            toggleFilter('weather', data.name_th);
                          }}
                          cursor="pointer"
                        >
                          {weatherData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              opacity={filters.weather && entry.name_th !== filters.weather ? 0.3 : 1}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] md:h-[280px] flex items-center justify-center text-gray-400">
                    {language === "en" ? "No data available" : "ไม่มีข้อมูล"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Types Pie Chart */}
            <Card className="shadow-lg border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="h-5 w-5 text-orange-600" />
                  <span className="text-lg font-semibold text-gray-900">
                    {language === "en" ? "Vehicle Types" : "ประเภทยานพาหนะ"}
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  {language === "en"
                    ? "Distribution by vehicle type"
                    : "การกระจายตามประเภทยานพาหนะ"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vehicleTypesData && vehicleTypesData.length > 0 ? (
                  <div className="h-[200px] md:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vehicleTypesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          labelLine={false}
                          label={(entry: any) => {
                            const name = language === "en" ? entry.name_en : entry.name_th;
                            const percentage = ((entry.count / vehicleTypesData.reduce((sum, v) => sum + v.count, 0)) * 100).toFixed(1);
                            return `${name.length > 15 ? name.substring(0, 12) + '...' : name}: ${percentage}%`;
                          }}
                          fill="#8884d8"
                          dataKey="count"
                          onClick={(data: any) => {
                            toggleFilter('vehicle', data.name_th);
                          }}
                          cursor="pointer"
                        >
                          {vehicleTypesData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={VEHICLE_COLORS[index % VEHICLE_COLORS.length]}
                              opacity={filters.vehicle && entry.name_th !== filters.vehicle ? 0.3 : 1}
                            />
                          ))}
                        </Pie>
                        <text 
                          x="50%" 
                          y="48%" 
                          textAnchor="middle" 
                          dominantBaseline="middle"
                          className="text-2xl font-bold fill-gray-700"
                        >
                          {vehicleTypesData.reduce((sum, v) => sum + v.count, 0).toLocaleString()}
                        </text>
                        <text 
                          x="50%" 
                          y="54%" 
                          textAnchor="middle" 
                          dominantBaseline="middle"
                          className="text-xs fill-gray-500"
                        >
                          {language === "en" ? "Total" : "ทั้งหมด"}
                        </text>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value: number, _name: string, props: any) => [
                            `${value.toLocaleString()} ${language === "en" ? "accidents" : "อุบัติเหตุ"}`,
                            language === "en" ? props.payload.name_en : props.payload.name_th
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] md:h-[280px] flex items-center justify-center text-gray-400">
                    {language === "en" ? "No data available" : "ไม่มีข้อมูล"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Accident Causes Chart */}
            <Card className="shadow-lg border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-lg font-semibold text-gray-900">
                    {language === "en" ? "Accident Causes" : "มูลเหตุสันนิฐาน"}
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  {language === "en"
                    ? "Top probable causes of accidents"
                    : "สาเหตุที่เป็นไปได้ของอุบัติเหตุ"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accidentCausesData && accidentCausesData.length > 0 ? (
                  <div className="h-[200px] md:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={accidentCausesData} layout="vertical">
                        <defs>
                          <linearGradient
                            id="causeGradient"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop
                              offset="0%"
                              stopColor="#EF4444"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="100%"
                              stopColor="#DC2626"
                              stopOpacity={1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#E5E7EB"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          className="text-xs"
                          tick={{ fill: "#6B7280" }}
                        />
                        <YAxis
                          dataKey={language === "en" ? "name_en" : "name_th"}
                          type="category"
                          className="text-xs"
                          tick={{ fill: "#374151" }}
                          width={150}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value: number) => [
                            `${value.toLocaleString()} ${language === "en" ? "accidents" : "ครั้ง"}`,
                            language === "en" ? "Total" : "ทั้งหมด",
                          ]}
                        />
                        <Bar
                          dataKey="count"
                          fill="url(#causeGradient)"
                          radius={[0, 8, 8, 0]}
                          onClick={(data: any) => {
                            toggleFilter('cause', data.name_th);
                          }}
                          cursor="pointer"
                        >
                          {accidentCausesData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              opacity={filters.cause && entry.name_th !== filters.cause ? 0.3 : 1}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] md:h-[280px] flex items-center justify-center text-gray-400">
                    {language === "en" ? "No data available" : "ไม่มีข้อมูล"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Severity Pie Chart */}
            <Card className="shadow-lg border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-lg font-semibold text-gray-900">
                    {language === "en"
                      ? "Casualty Severity Distribution"
                      : "การกระจายตามระดับความรุนแรง"}
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  {language === "en"
                    ? "Breakdown by injury severity level"
                    : "แยกตามระดับการบาดเจ็บ"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {severityData && severityData.length > 0 ? (
                  <>
                    <div className="h-[220px] md:h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={severityData}
                            cx="50%"
                            cy="50%"
                            labelLine={{
                              stroke: "#9CA3AF",
                              strokeWidth: 1,
                            }}
                            label={(entry: any) => {
                              const data = severityData[entry.index];
                              return `${language === "en" ? data.name_en : data.name_th}: ${(entry.percent * 100).toFixed(1)}%`;
                            }}
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="count"
                            onClick={(data: any) => {
                              if (data.id !== 'survivors') {
                                toggleFilter('severity', data.id);
                              }
                            }}
                            cursor="pointer"
                          >
                            {severityData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke="#FFFFFF"
                                strokeWidth={2}
                                opacity={filters.severity && entry.id !== filters.severity ? 0.3 : 1}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #E5E7EB",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                            formatter={(
                              value: number,
                              _name: string,
                              props: any,
                            ) => [
                              `${value.toLocaleString()} ${language === "en" ? "cases" : "ราย"}`,
                              language === "en"
                                ? props.payload.name_en
                                : props.payload.name_th,
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {severityData.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-gray-200 bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs font-medium text-gray-700">
                              {language === "en" ? item.name_en : item.name_th}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-gray-900">
                            {item.count.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[220px] md:h-[280px] flex items-center justify-center text-gray-400">
                    {language === "en" ? "No data available" : "ไม่มีข้อมูล"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2: Hourly Pattern and Weekday Pattern */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Hourly Chart */}
            <Card className="shadow-lg border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-lg font-semibold text-gray-900">
                        {language === "en"
                          ? "Hourly Pattern"
                          : "รูปแบบรายชั่วโมง"}
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {language === "en"
                        ? "Accidents by time of day"
                        : "อุบัติเหตุตามช่วงเวลา"}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.max(
                        ...hourlyData.map((d) => d.count),
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {language === "en" ? "Peak" : "สูงสุด"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {hourlyData && hourlyData.length > 0 ? (
                  <div className="h-[200px] md:h-[280px] cursor-pointer">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={hourlyData}
                        onClick={(data: any) => {
                          console.log("Hourly Chart Click:", data);
                          if (data) {
                            // Try activeLabel first (X-axis value), then activePayload
                            const hour = data.activeLabel ?? data.activePayload?.[0]?.payload?.hour;
                            
                            if (hour !== undefined && hour !== null) {
                              console.log("Toggling hour:", hour);
                              toggleFilter('hour', hour);
                            }
                          }
                        }}
                      >
                        <defs>
                          <linearGradient
                            id="hourlyGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#2563EB"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#2563EB"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#E5E7EB"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="hour"
                          className="text-xs"
                          tick={{ fill: "#6B7280" }}
                          tickFormatter={(hour) => `${hour}:00`}
                        />
                        <YAxis className="text-xs" tick={{ fill: "#6B7280" }} />
                        {filters.hour !== null && (
                          <ReferenceLine
                            x={filters.hour}
                            stroke="#2563EB"
                            strokeWidth={3}
                            label={{
                              value: `${filters.hour}:00`,
                              position: 'top',
                              fill: '#2563EB',
                              fontSize: 12,
                              fontWeight: 'bold'
                            }}
                          />
                        )}
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value: number) => [
                            value.toLocaleString(),
                            language === "en" ? "Accidents" : "อุบัติเหตุ",
                          ]}
                          labelFormatter={(hour) =>
                            `${language === "en" ? "Hour" : "เวลา"}: ${hour}:00`
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#2563EB"
                          strokeWidth={2}
                          fill="url(#hourlyGradient)"
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] md:h-[280px] flex items-center justify-center text-gray-400">
                    {language === "en" ? "No data available" : "ไม่มีข้อมูล"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekday Chart */}
            <Card className="shadow-lg border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <span className="text-lg font-semibold text-gray-900">
                        {language === "en"
                          ? "Weekday Pattern"
                          : "รูปแบบรายสัปดาห์"}
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {language === "en"
                        ? "Accidents by day of week"
                        : "อุบัติเหตุตามวันในสัปดาห์"}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.max(
                        ...weekdayData.map((d) => d.count),
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {language === "en" ? "Peak" : "สูงสุด"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {weekdayData && weekdayData.length > 0 ? (
                  <div className="h-[200px] md:h-[280px] cursor-pointer">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={weekdayData}
                      >
                        <defs>
                          <linearGradient
                            id="weekdayGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#9333EA"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="100%"
                              stopColor="#7E22CE"
                              stopOpacity={1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#E5E7EB"
                          vertical={false}
                        />
                        <XAxis
                          dataKey={language === "en" ? "name_en" : "name_th"}
                          className="text-xs"
                          tick={{ fill: "#6B7280" }}
                        />
                        <YAxis className="text-xs" tick={{ fill: "#6B7280" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value: number) => [
                            value.toLocaleString(),
                            language === "en" ? "Accidents" : "อุบัติเหตุ",
                          ]}
                          cursor={{ fill: "transparent" }}
                        />
                        <Bar
                          dataKey="count"
                          radius={[4, 4, 0, 0]}
                          onClick={(data: any) => {
                            console.log("Weekday Chart Click:", data);
                            toggleFilter('weekday', data.day);
                          }}
                          cursor="pointer"
                        >
                          {weekdayData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`url(#weekdayGradient)`}
                              opacity={filters.weekday !== null && entry.day !== filters.weekday ? 0.3 : 1}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] md:h-[280px] flex items-center justify-center text-gray-400">
                    {language === "en" ? "No data available" : "ไม่มีข้อมูล"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Interactive Time-Series Chart */}
          {dashboardStats && dashboardStats.monthly_trend && (
            <div className="mb-6">
              <InteractiveTrendChart
                data={dashboardStats.monthly_trend}
                language={language}
                yearly_summary={dashboardStats.yearly_summary}
                monthly_summary={dashboardStats.monthly_summary}
                weekday_summary={dashboardStats.weekday_summary}
              />
            </div>
          )}

          {/* Vehicle By Hour Chart */}
          {dashboardStats && dashboardStats.vehicle_by_hour && (
            <div className="mb-6">
              <VehicleByHourChart
                data={dashboardStats.vehicle_by_hour}
                language={language}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
