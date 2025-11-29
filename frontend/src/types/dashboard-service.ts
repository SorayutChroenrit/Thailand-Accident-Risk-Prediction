// dashboard-service.ts - Updated to support accident_cause filter

export interface DashboardStats {
  summary: {
    total_accidents: number;
    minor_injuries: number;
    serious_injuries: number;
    fatalities: number;
    survivors: number;
    high_risk_areas: number;
  };
  // Raw event data for client-side filtering
  all_events: Array<{
    vehicle_1: string;
    weather_condition: string;
    presumed_cause: string;
    accident_type: string;
    casualties_fatal: number;
    casualties_serious: number;
    casualties_minor: number;
  }>;
  severity_distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  event_types: Array<{
    type: string;
    count: number;
  }>;
  weather_data: Array<{
    weather: string;
    count: number;
  }>;
  accident_causes: Array<{
    cause: string;
    count: number;
  }>;
  top_provinces: Array<{
    province: string;
    count: number;
  }>;
  all_provinces: Array<{
    province: string;
    count: number;
    fatal?: number;
    serious?: number;
    minor?: number;
  }>;
  monthly_trend: Array<{
    month: string;
    count: number;
    daily?: Array<{
      date: string;
      count: number;
    }>;
  }>;
  hourly_pattern: Array<{
    hour: number;
    count: number;
  }>;
  daily_pattern: Array<{
    day: string;
    count: number;
  }>;
  yearly_summary: Array<{
    year: string;
    count: number;
  }>;
  monthly_summary: Array<{
    month: string;
    month_name: string;
    count: number;
  }>;
  weekday_summary: Array<{
    day: string;
    day_name: string;
    count: number;
  }>;
  vehicle_by_hour?: Array<{
    hour: number;
    vehicle_type: string;
    count: number;
  }>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

export async function fetchDashboardStats(
  dateRange: string = "all",
  province: string = "all",
  casualtyType: string = "all",
  vehicleType: string = "all",
  weather: string = "all",
  accidentCause: string = "all",
): Promise<DashboardStats> {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      date_range: dateRange,
      province: province,
      casualty_type: casualtyType,
      vehicle_type: vehicleType,
      weather: weather,
      accident_cause: accidentCause,
    });

    console.log(`🔍 Fetching dashboard stats with filters:`, {
      dateRange,
      province,
      casualtyType,
      vehicleType,
      weather,
      accidentCause,
    });

    const response = await fetch(
      `${API_BASE_URL}/dashboard/stats?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Validate response data
    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format");
    }

    // Provide default values for missing data
    const validatedData: DashboardStats = {
      summary: {
        total_accidents: data.summary?.total_accidents || 0,
        minor_injuries: data.summary?.minor_injuries || 0,
        serious_injuries: data.summary?.serious_injuries || 0,
        fatalities: data.summary?.fatalities || 0,
        survivors: data.summary?.survivors || 0,
        high_risk_areas: data.summary?.high_risk_areas || 0,
      },
      all_events: data.all_events || [], // Raw events for client-side filtering
      severity_distribution: data.severity_distribution || [],
      event_types: data.event_types || [],
      weather_data: data.weather_data || [],
      accident_causes: data.accident_causes || [],
      top_provinces: data.top_provinces || [],
      all_provinces: data.all_provinces || [],
      monthly_trend: data.monthly_trend || [],
      hourly_pattern: data.hourly_pattern || [],
      daily_pattern: data.daily_pattern || [],
      yearly_summary: data.yearly_summary || [],
      monthly_summary: data.monthly_summary || [],
      weekday_summary: data.weekday_summary || [],
      vehicle_by_hour: data.vehicle_by_hour || undefined,
    };

    console.log(`✅ Dashboard stats loaded:`, {
      total_accidents: validatedData.summary.total_accidents,
      fatalities: validatedData.summary.fatalities,
      provinces: validatedData.all_provinces?.length || 0,
      raw_events: validatedData.all_events?.length || 0, // Log raw events count
    });

    return validatedData;
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);

    // Return empty/default data instead of throwing
    // This prevents the entire page from crashing
    return {
      summary: {
        total_accidents: 0,
        minor_injuries: 0,
        serious_injuries: 0,
        fatalities: 0,
        survivors: 0,
        high_risk_areas: 0,
      },
      all_events: [], // Empty array for raw events
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
    };
  }
}
