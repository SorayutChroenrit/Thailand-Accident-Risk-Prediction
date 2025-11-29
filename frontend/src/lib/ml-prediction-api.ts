/**
 * ML Prediction API Client
 * เชื่อมต่อกับ FastAPI backend สำหรับทำนายความเสี่ยงอุบัติเหตุ
 */

const ML_API_BASE_URL =
  import.meta.env.VITE_ML_API_URL || "http://localhost:10000";

export interface MLPredictionRequest {
  latitude: number;
  longitude: number;
  hour: number; // 0-23
  day_of_week: number; // 0=Monday, 6=Sunday
  month: number; // 1-12
  temperature?: number;
  rainfall?: number;
  weather_condition?: "clear" | "rain" | "fog";
  traffic_density?: number; // 0-1
  average_speed?: number; // km/h
  road_type?: "highway" | "city" | "rural" | "local";
  num_lanes?: number;
  has_street_light?: boolean;
  vehicle_type?: string;
}

export interface MLPredictionResponse {
  prediction: string; // บาดเจ็บเล็กน้อย, บาดเจ็บสาหัส, เสียชีวิต
  probabilities: Record<string, number>;
  risk_score: number; // 0-100
  risk_level: "low" | "medium" | "high" | "very_high";
  confidence: number; // 0-1
}

export interface RouteRiskPrediction {
  route_risk_score: number;
  start_point: {
    risk_score: number;
    prediction: string;
    risk_level: string;
  };
  mid_point: {
    risk_score: number;
    prediction: string;
    risk_level: string;
  };
  end_point: {
    risk_score: number;
    prediction: string;
    risk_level: string;
  };
}

/**
 * ทำนายความเสี่ยงอุบัติเหตุจากโมเดล ML
 */
export async function predictAccidentRisk(
  request: MLPredictionRequest,
): Promise<MLPredictionResponse> {
  try {
    const response = await fetch(`${ML_API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`ML API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ ML Prediction error:", error);
    throw error;
  }
}

/**
 * ทำนายความเสี่ยงสำหรับเส้นทาง
 */
export async function predictRouteRisk(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  departureTime: Date,
  vehicleType: string = "car",
): Promise<RouteRiskPrediction> {
  try {
    const params = new URLSearchParams({
      from_lat: fromLat.toString(),
      from_lng: fromLng.toString(),
      to_lat: toLat.toString(),
      to_lng: toLng.toString(),
      departure_time: departureTime.toISOString(),
      vehicle_type: vehicleType,
    });

    const response = await fetch(`${ML_API_BASE_URL}/predict/route?${params}`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`ML API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Route Risk Prediction error:", error);
    throw error;
  }
}

/**
 * ตรวจสอบว่า ML API พร้อมใช้งานหรือไม่
 */
export async function checkMLApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ML_API_BASE_URL}/`, {
      method: "GET",
    });
    return response.ok;
  } catch (error) {
    console.warn("⚠️  ML API not available:", error);
    return false;
  }
}

/**
 * แปลง risk level เป็นสี
 */
export function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case "low":
      return "#22C55E"; // green
    case "medium":
      return "#F59E0B"; // orange
    case "high":
      return "#DC2626"; // red
    case "very_high":
      return "#7F1D1D"; // dark red
    default:
      return "#6B7280"; // gray
  }
}

/**
 * แปลง risk level เป็นข้อความภาษาไทย
 */
export function getRiskLabelTH(riskLevel: string): string {
  switch (riskLevel) {
    case "low":
      return "ต่ำ";
    case "medium":
      return "ปานกลาง";
    case "high":
      return "สูง";
    case "very_high":
      return "สูงมาก";
    default:
      return "ไม่ทราบ";
  }
}

/**
 * แปลง severity class เป็นข้อความภาษาอังกฤษ
 */
export function getSeverityLabelEN(severity: string): string {
  switch (severity) {
    case "บาดเจ็บเล็กน้อย":
      return "Slight Injury";
    case "บาดเจ็บสาหัส":
      return "Serious Injury";
    case "เสียชีวิต":
      return "Fatal";
    default:
      return severity;
  }
}

/**
 * แปลง severity class เป็นสี
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "เสียชีวิต":
      return "#7f1d1d"; // dark red
    case "บาดเจ็บสาหัส":
      return "#dc2626"; // red
    case "บาดเจ็บเล็กน้อย":
      return "#f59e0b"; // orange
    default:
      return "#22c55e"; // green
  }
}

/**
 * แปลง severity class เป็นไอคอน emoji
 */
export function getSeverityIcon(severity: string): string {
  switch (severity) {
    case "เสียชีวิต":
      return "💀"; // Fatal
    case "บาดเจ็บสาหัส":
      return "⚠️"; // Serious
    case "บาดเจ็บเล็กน้อย":
      return "🟡"; // Slight
    default:
      return "✅"; // Safe
  }
}
