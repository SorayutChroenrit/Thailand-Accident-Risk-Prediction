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
export async function getTrafficDensity(lat: number, lon: number) {
  // Return default values to avoid fetch errors
  return {
    density: 0.5,
    speed: 40,
    congestionLevel: "moderate",
  };
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
