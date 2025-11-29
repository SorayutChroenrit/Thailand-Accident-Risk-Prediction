const API_BASE_URL = "http://localhost:10000";

export interface DashboardStats {
  summary: {
    total_accidents: number;
    minor_injuries: number;
    serious_injuries: number;
    fatalities: number;
    survivors?: number;
    high_risk_areas: number;
  };
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
    survivors?: number;
  }>;
  all_events?: Array<{
    vehicle_1: string;
    weather_condition: string;
    presumed_cause: string;
    accident_type: string;
    province?: string;
    casualties_fatal: number;
    casualties_serious: number;
    casualties_minor: number;
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
  vehicle_by_hour: Array<{
    vehicle_type: string;
    hour: number;
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
}

export async function fetchDashboardStats(
  dateRange: string = "all",
  province: string = "all",
  casualtyType: string = "all",
  vehicleType: string = "all",
  weather: string = "all",
  accidentCause: string = "all",
): Promise<DashboardStats> {
  const params = new URLSearchParams({
    date_range: dateRange,
    province: province,
    casualty_type: casualtyType,
    vehicle_type: vehicleType,
    weather: weather,
    accident_cause: accidentCause,
  });

  const response = await fetch(`${API_BASE_URL}/dashboard/stats?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard statistics");
  }

  return await response.json();
}
