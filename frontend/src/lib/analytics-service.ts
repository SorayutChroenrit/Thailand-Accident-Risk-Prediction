/**
 * Analytics Service - 4 Levels of Analytics API Client
 */

const API_BASE = import.meta.env.VITE_ML_API_URL || 'http://localhost:10000'

export interface AnalyticsFilters {
  dateRangeStart: string  // YYYY-MM-DD
  dateRangeEnd: string
  provinceId?: number | null
  vehicleTypes?: string[]
  weatherConditions?: string[]
  victimType?: string
}

// ============================================================================
// L1: Descriptive Analytics
// ============================================================================

export interface DescriptiveAnalytics {
  summary: {
    totalAccidents: number
    dailyAverage: number
    peakHour: number
    peakDay: string
    yoyChange: number
  }
  timeSeries: {
    hourly: Array<{hour: string, count: number}>
    daily: Array<{date: string, count: number}>
    monthly: Array<{month: string, count: number, [key: string]: any}>
    yearly: Array<{year: number, count: number}>
  }
  geographic: {
    byProvince: Array<{location: string, count: number, avg_severity: number}>
    heatmapData: Array<{lat: number, lng: number, intensity: number}>
  }
  categorical: {
    byVehicle: Array<{vehicle: string, count: number, percentage: number}>
    byWeather: Array<{weather: string, count: number}>
    bySeverity: Array<{severity: string, count: number, percentage: number, color: string}>
  }
}

export async function fetchDescriptiveAnalytics(
  filters: AnalyticsFilters
): Promise<DescriptiveAnalytics> {
  const response = await fetch(`${API_BASE}/analytics/descriptive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date_range_start: filters.dateRangeStart,
      date_range_end: filters.dateRangeEnd,
      province_id: filters.provinceId,
      vehicle_types: filters.vehicleTypes,
      weather_conditions: filters.weatherConditions,
      victim_type: filters.victimType,
    }),
  })

  if (!response.ok) {
    throw new Error(`Descriptive analytics failed: ${response.statusText}`)
  }

  const data = await response.json()

  // Transform snake_case to camelCase
  return {
    summary: {
      totalAccidents: data.summary.total_accidents,
      dailyAverage: data.summary.daily_average,
      peakHour: data.summary.peak_hour,
      peakDay: data.summary.peak_day,
      yoyChange: data.summary.yoy_change,
    },
    timeSeries: {
      hourly: data.time_series.hourly,
      daily: data.time_series.daily,
      monthly: data.time_series.monthly,
      yearly: data.time_series.yearly,
    },
    geographic: {
      byProvince: data.geographic.by_province,
      heatmapData: data.geographic.heatmap_data,
    },
    categorical: {
      byVehicle: data.categorical.by_vehicle,
      byWeather: data.categorical.by_weather,
      bySeverity: data.categorical.by_severity,
    },
  }
}

// ============================================================================
// L2: Diagnostic Analytics
// ============================================================================

export interface DiagnosticAnalytics {
  correlations: {
    pearson: Record<string, number>
    matrix: number[][]
  }
  comparativeAnalysis: {
    weatherImpact: Record<string, { avgSeverity: number, fatalRate: number }>
    timeImpact: Record<string, { fatalRate: number }>
  }
  riskFactors: Array<{
    factor: string
    importance: number
    impact: string
  }>
  interactionEffects: Array<{
    combo: string
    severityMultiplier: number
  }>
  statisticalTests: {
    weatherChi2: { chi2Statistic: number, pValue: number, significant: boolean }
  }
}

export async function fetchDiagnosticAnalytics(
  filters: AnalyticsFilters
): Promise<DiagnosticAnalytics> {
  const response = await fetch(`${API_BASE}/analytics/diagnostic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date_range_start: filters.dateRangeStart,
      date_range_end: filters.dateRangeEnd,
      province_id: filters.provinceId,
      vehicle_types: filters.vehicleTypes,
      weather_conditions: filters.weatherConditions,
      victim_type: filters.victimType,
    }),
  })

  if (!response.ok) {
    throw new Error(`Diagnostic analytics failed: ${response.statusText}`)
  }

  return await response.json()
}

// ============================================================================
// L3: Predictive Analytics
// ============================================================================

export interface PredictiveAnalytics {
  modelPerformance: {
    accuracy: number
    precision: Record<string, number>
    recall: Record<string, number>
    f1Score: Record<string, number>
    confusionMatrix: number[][]
    rocCurves: Record<string, { fpr: number[], tpr: number[], auc: number }>
  }
  featureImportance: Array<{
    feature: string
    importance: number
  }>
  shapValues: {
    summaryData: Array<{
      feature: string
      meanAbsShap: number
      shapValues: number[]
    }>
  }
  predictions: {
    hotspotsNextWeek: Array<{
      location: string
      latitude: number
      longitude: number
      predictedRisk: number
      severity: string | null
      confidence: number
      date: string
      hour: number
    }>
  }
  modelComparison: Record<string, { accuracy: number, f1: number }>
}

export async function fetchPredictiveAnalytics(
  filters: AnalyticsFilters
): Promise<PredictiveAnalytics> {
  const response = await fetch(`${API_BASE}/analytics/predictive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date_range_start: filters.dateRangeStart,
      date_range_end: filters.dateRangeEnd,
      province_id: filters.provinceId,
      vehicle_types: filters.vehicleTypes,
      weather_conditions: filters.weatherConditions,
      victim_type: filters.victimType,
    }),
  })

  if (!response.ok) {
    throw new Error(`Predictive analytics failed: ${response.statusText}`)
  }

  return await response.json()
}

// ============================================================================
// L4: Prescriptive Analytics
// ============================================================================

export interface PrescriptiveAnalytics {
  recommendations: Array<{
    id: string
    category: 'infrastructure' | 'enforcement' | 'warning_system' | 'education'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    location?: { lat: number, lng: number, name: string }
    targetLocations?: string[]
    impact: {
      estimatedReduction: number
      livesSavedPerYear?: number
      injuriesPrevented?: number
      accidentsPrevented?: number
    }
    cost: {
      initial?: number
      annual: number
      roi: number
    }
    timeline: string
    implementationSteps?: string[]
    stakeholders?: string[]
    priorityScore?: number
  }>
  resourceAllocation: {
    emergencyServices: Array<{
      stationId: number
      location: { lat: number, lng: number }
      coverageRadius: number
      accidentsInCoverage: number
      estimatedResponseImprovement: string
    }>
    optimizationMethod: string
  }
  monitoringPlan: {
    kpis: Array<{
      recommendationId: string
      metric: string
      baseline: number
      target: number
      timeframe: string
      measurement: string
    }>
    reviewFrequency: string
    dashboardUpdate: string
    stakeholderReporting: string
  }
  summary: {
    totalRecommendations: number
    highPriority: number
    totalEstimatedCost: number
    totalEstimatedImpact: number
  }
}

export async function fetchPrescriptiveAnalytics(
  filters: AnalyticsFilters
): Promise<PrescriptiveAnalytics> {
  const response = await fetch(`${API_BASE}/analytics/prescriptive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date_range_start: filters.dateRangeStart,
      date_range_end: filters.dateRangeEnd,
      province_id: filters.provinceId,
      vehicle_types: filters.vehicleTypes,
      weather_conditions: filters.weatherConditions,
      victim_type: filters.victimType,
    }),
  })

  if (!response.ok) {
    throw new Error(`Prescriptive analytics failed: ${response.statusText}`)
  }

  return await response.json()
}

// ============================================================================
// Utility Functions
// ============================================================================

export function convertFiltersToAnalyticsFilters(
  selectedDateRange: string,
  selectedProvince: string,
  selectedVictimType: string,
  selectedVehicle: string,
  selectedWeather: string
): AnalyticsFilters {
  // Convert dashboard filter state to API format
  const dateRanges: Record<string, { start: string, end: string }> = {
    'all': { start: '2019-01-01', end: '2025-12-31' },
    '2025': { start: '2025-01-01', end: '2025-12-31' },
    '2024': { start: '2024-01-01', end: '2024-12-31' },
    '2023': { start: '2023-01-01', end: '2023-12-31' },
    '2022': { start: '2022-01-01', end: '2022-12-31' },
    '2021': { start: '2021-01-01', end: '2021-12-31' },
    '2020': { start: '2020-01-01', end: '2020-12-31' },
    '2019': { start: '2019-01-01', end: '2019-12-31' },
  }

  const range = dateRanges[selectedDateRange] || dateRanges['all']

  return {
    dateRangeStart: range.start,
    dateRangeEnd: range.end,
    provinceId: selectedProvince === 'all' ? null : parseInt(selectedProvince),
    vehicleTypes: selectedVehicle === 'all' ? undefined : [selectedVehicle],
    weatherConditions: selectedWeather === 'all' ? undefined : [selectedWeather],
    victimType: selectedVictimType === 'all' ? undefined : selectedVictimType,
  }
}
