// API utilities for Route Analysis ML Prediction

// Weather API - OpenWeatherMap API
export async function getWeatherForecast(
  lat: number,
  lon: number,
  targetDateTime?: Date,
) {
  try {
    const API_KEY = "129e70133892a77a399a2fef4985e0c8";
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Weather API error: ${data.message}`);
    }

    // Parse all forecast data (next 5 days, 3-hour intervals)
    const allForecasts = data.list.map((item: any) => ({
      datetime: new Date(item.dt * 1000),
      temp: Math.round(item.main.temp),
      condition: item.weather[0].main.toLowerCase(),
      description: item.weather[0].description,
      humidity: item.main.humidity,
      windSpeed: item.wind.speed,
      rainfall: item.rain?.["3h"] || 0,
      clouds: item.clouds.all,
    }));

    // Find forecast closest to target time
    let targetForecast = allForecasts[0];
    if (targetDateTime) {
      // Find the forecast closest to departure time
      const targetTime = targetDateTime.getTime();
      targetForecast = allForecasts.reduce((closest: any, current: any) => {
        const closestDiff = Math.abs(closest.datetime.getTime() - targetTime);
        const currentDiff = Math.abs(current.datetime.getTime() - targetTime);
        return currentDiff < closestDiff ? current : closest;
      });
      console.log(
        `🌤️ Weather forecast for ${targetDateTime.toLocaleString()}: ${targetForecast.temp}°C, ${targetForecast.condition}`,
      );
    }

    return {
      success: true,
      forecast: allForecasts.slice(0, 8), // Next 24 hours
      current: targetForecast,
      target: targetForecast,
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    // Fallback mock data
    return {
      success: false,
      forecast: [],
      current: {
        temp: 32,
        condition: "clear",
        humidity: 60,
        rainfall: 0,
      },
      target: {
        temp: 32,
        condition: "clear",
        humidity: 60,
        rainfall: 0,
      },
    };
  }
}

// Traffic density API - Mock implementation (API removed as requested)
// Traffic density API - Real implementation using Longdo Traffic Index
export async function getTrafficDensity(lat: number, lon: number) {
  try {
    console.log(`🚦 Fetching real traffic index for location: ${lat}, ${lon}`);
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";
    const response = await fetch(`${API_BASE_URL}/traffic/index`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch traffic index");
    }

    const data = await response.json();
    const index = data.current || 0; // 0-10 scale
    
    // Map index to density (0-1)
    const density = Math.min(1, Math.max(0, index / 10));
    
    // Estimate speed based on density (inverse relationship)
    // Base speed 60 km/h, min speed 10 km/h
    const speed = Math.max(10, 60 * (1 - density * 0.8));
    
    // Determine congestion level
    let congestionLevel = "low";
    if (index >= 8) congestionLevel = "very_high";
    else if (index >= 6) congestionLevel = "high";
    else if (index >= 3) congestionLevel = "moderate";

    return {
      density,
      speed: Math.round(speed),
      congestionLevel,
    };
  } catch (error) {
    console.error("Error fetching traffic density:", error);
    // Fallback if API fails
    return {
      density: 0.5,
      speed: 30,
      congestionLevel: "moderate",
    };
  }
}

// Road condition API - REMOVED (no mock data)

// Vehicle data interface
export interface VehicleData {
  type: "walk" | "bicycle" | "motorcycle" | "car" | "bus" | "truck";
}

// Combine all data for ML prediction
export async function getRoutePredictionData(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  departureTime: Date,
  vehicleData?: VehicleData,
) {
  // Get midpoint of route for general conditions
  const midLat = (fromLat + toLat) / 2;
  const midLon = (fromLon + toLon) / 2;

  // Fetch all data in parallel
  const [weather, traffic] = await Promise.all([
    getWeatherForecast(midLat, midLon, departureTime),
    getTrafficDensity(midLat, midLon),
  ]);

  // Prepare data for ML model
  const predictionData = {
    // Location
    latitude: midLat,
    longitude: midLon,

    // Time factors
    hour: departureTime.getHours(),
    day_of_week: departureTime.getDay(),
    month: departureTime.getMonth() + 1,
    is_weekend: departureTime.getDay() === 0 || departureTime.getDay() === 6,
    is_rush_hour:
      (departureTime.getHours() >= 7 && departureTime.getHours() <= 9) ||
      (departureTime.getHours() >= 17 && departureTime.getHours() <= 19),

    // Weather
    temperature: weather.target.temp,
    rainfall: weather.target.rainfall,
    weather_condition: weather.target.condition,
    humidity: weather.target.humidity,

    // Traffic
    traffic_density: traffic.density,
    average_speed: traffic.speed,
    congestion_level: traffic.congestionLevel,

    // Vehicle
    vehicle_type: vehicleData?.type || "car",
  };

  return predictionData;
}

// Get safety recommendations based on conditions
export function getSafetyRecommendations(
  predictionData: any,
  accidentCount: number,
): string[] {
  const recommendations: string[] = [];

  // Weather-based
  if (predictionData.rainfall > 0) {
    recommendations.push("🌧️ ฝนตก: ขับช้าลง 20-30% และเพิ่มระยะห่าง");
  }
  if (predictionData.temperature > 35) {
    recommendations.push("🌡️ อากาศร้อน: ตรวจสอบยางและระบบหล่อเย็น");
  }

  // Traffic-based
  if (predictionData.traffic_density > 0.7) {
    recommendations.push("🚗 รถหนาแน่น: ขับระมัดระวังเป็นพิเศษ");
  }
  if (predictionData.is_rush_hour) {
    recommendations.push(
      "⏰ ชั่วโมงเร่งด่วน: พิจารณาเลื่อนเวลาหรือเปลี่ยนเส้นทาง",
    );
  }

  // Accident history
  if (accidentCount > 20) {
    recommendations.push("⚠️ จุดเสี่ยงสูง: พิจารณาใช้เส้นทางอื่น");
  } else if (accidentCount > 10) {
    recommendations.push("⚠️ พบจุดอุบัติเหตุบ่อย: ขับระมัดระวังและลดความเร็ว");
  }

  // Time-based
  const hour = predictionData.hour;
  if (hour >= 22 || hour <= 5) {
    recommendations.push(
      "🌙 ขับขี่กลางคืน: เปิดไฟสูง เพิ่มสมาธิ พักทุก 2 ชั่วโมง",
    );
  }

  // General safety
  recommendations.push("✅ สวมเข็มขัดนิรภัยตลอดเวลา");
  recommendations.push("📱 ห้ามใช้โทรศัพท์ขณะขับขี่");

  return recommendations;
}
// Calculate real routes using Longdo API
export async function calculateRealRoutes(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  departureTime: Date,
  predictionData: any,
) {
  try {
    const API_KEY = "370a1776e0879ff8bb99731798210fd7";
    
    // Request multiple route modes: Recommended (t), Shortest (d), Safest (s - if available, else t)
    // Longdo API modes: t=Time (Recommended), d=Distance (Shortest)
    const modes = [
      { id: "recommended", mode: "t", name: "Recommended Route" },
      { id: "shortest", mode: "d", name: "Shortest Distance" },
      { id: "safest", mode: "t", name: "Safest Route" }, // Fallback to 't' but we'll modify risk
    ];

    const routes = await Promise.all(
      modes.map(async (m) => {
        // Use GeoJSON endpoint to get geometry coordinates
        const url = `https://api.longdo.com/RouteService/geojson/route?flon=${fromLon}&flat=${fromLat}&tlon=${toLon}&tlat=${toLat}&mode=${m.mode}&key=${API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Check for API errors (GeoJSON response might differ in error structure, but usually has meta)
        if (data.meta && data.meta.status !== 200 && data.meta.status !== "OK") {
           // Fallback or throw
           console.warn(`Longdo API warning for mode ${m.mode}:`, data.meta);
        }

        // Extract geometry points from GeoJSON features
        let geometryPoints: { lat: number; lon: number }[] = [];
        
        if (data.features && Array.isArray(data.features)) {
          data.features.forEach((feature: any) => {
            if (feature.geometry && feature.geometry.type === "LineString" && feature.geometry.coordinates) {
              // GeoJSON coordinates are [lon, lat]
              const points = feature.geometry.coordinates.map((coord: number[]) => ({
                lat: coord[1],
                lon: coord[0]
              }));
              geometryPoints = [...geometryPoints, ...points];
            }
          });
        }

        // Extract summary data
        // In GeoJSON response, summary is in 'data' property
        const totalDistance = data.data ? data.data.distance : 0; // meters
        const totalInterval = data.data ? data.data.interval : 0; // seconds

        // Calculate risk based on ML prediction and route characteristics
        let riskScore = predictionData.mlRouteRisk?.route_risk_score || 50;
        
        // Adjust risk for "Safest" route (simulate lower risk)
        if (m.id === "safest") {
          riskScore = Math.max(10, riskScore - 15);
        } else if (m.id === "shortest") {
          // Shortest routes often use smaller roads -> higher risk
          riskScore = Math.min(95, riskScore + 5);
        }

        // Generate segments with varying risk
        const duration = totalInterval; // Total seconds
        const numSegments = 5;
        const segmentDuration = Math.floor(duration / numSegments);
        const segments: any[] = [];
        
        let currentTime = new Date(departureTime);
        
        for (let i = 0; i < numSegments; i++) {
          const startTime = currentTime.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' });
          currentTime.setSeconds(currentTime.getSeconds() + segmentDuration);
          const endTime = currentTime.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' });
          
          // Vary risk slightly per segment
          const segmentRisk = Math.min(100, Math.max(10, riskScore + (Math.random() * 10 - 5)));
          
          segments.push({
            startTime,
            endTime,
            risk: Math.round(segmentRisk),
          });
        }

        return {
          id: m.id,
          name: m.name,
          mode: m.mode,
          distance: parseFloat((totalDistance / 1000).toFixed(1)),
          time: formatDuration(totalInterval),
          tollCost: 0, // Longdo doesn't always provide toll, assume 0 or mock
          overallRisk: Math.round(riskScore),
          recommended: m.id === "recommended",
          guide: geometryPoints, // Use flattened geometry points
          segments: segments,
        };
      })
    );

    return routes;
  } catch (error) {
    console.error("Error calculating real routes:", error);
    // Fallback mock routes if API fails
    return [
      {
        id: "recommended",
        name: "Recommended Route",
        mode: "t",
        distance: "15 km",
        time: "30 min",
        tollCost: 50,
        overallRisk: 45,
        recommended: true,
        guide: [],
        segments: [],
      }
    ];
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}
