// Risk Calculator Service - Integrates ML predictions with real-time data

import { fetchTrafficIndex, getBangkokTrafficIndex } from './traffic-service';

export interface RiskFactors {
  trafficIndex: number; // 0-10
  historicalAccidents: number; // count in area
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6 (0=Sunday)
  weather: 'clear' | 'cloudy' | 'rain' | 'heavy_rain' | 'fog';
  roadType: 'highway' | 'main_road' | 'secondary_road' | 'local_road';
  speedLimit: number;
  lighting: 'day' | 'night' | 'dusk_dawn';
}

export interface RiskScore {
  overall: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'severe';
  color: string;
  factors: {
    traffic: number; // 0-100
    historical: number; // 0-100
    temporal: number; // 0-100
    environmental: number; // 0-100
  };
  recommendations: string[];
}

export interface LocationRisk {
  location: {
    lat: number;
    lng: number;
  };
  riskScore: RiskScore;
  nearbyAccidents: number;
  radius: number; // in km
}

/**
 * Calculate comprehensive risk score for a location
 * This integrates multiple data sources:
 * 1. Real-time traffic data
 * 2. Historical accident data
 * 3. Time/temporal factors
 * 4. Environmental conditions
 * 5. ML model predictions (simulated)
 */
export const calculateRiskScore = async (
  location: { lat: number; lng: number },
  factors?: Partial<RiskFactors>
): Promise<RiskScore> => {
  // Get current time factors
  const now = new Date();
  const timeOfDay = now.getHours();
  const dayOfWeek = now.getDay();

  // Get traffic index
  const trafficIndex = await getBangkokTrafficIndex();

  // Build complete factors
  const completeFactors: RiskFactors = {
    trafficIndex,
    historicalAccidents: factors?.historicalAccidents || 0,
    timeOfDay,
    dayOfWeek,
    weather: factors?.weather || getCurrentWeather(),
    roadType: factors?.roadType || 'main_road',
    speedLimit: factors?.speedLimit || 80,
    lighting: getLighting(timeOfDay),
  };

  // Calculate individual risk components
  const trafficRisk = calculateTrafficRisk(completeFactors);
  const historicalRisk = calculateHistoricalRisk(completeFactors);
  const temporalRisk = calculateTemporalRisk(completeFactors);
  const environmentalRisk = calculateEnvironmentalRisk(completeFactors);

  // Weighted average (can be tuned)
  const overall = Math.round(
    trafficRisk * 0.3 +
    historicalRisk * 0.3 +
    temporalRisk * 0.2 +
    environmentalRisk * 0.2
  );

  // Determine level and color
  const level = getRiskLevel(overall);
  const color = getRiskColor(overall);

  // Generate recommendations
  const recommendations = generateRecommendations(overall, completeFactors);

  return {
    overall,
    level,
    color,
    factors: {
      traffic: trafficRisk,
      historical: historicalRisk,
      temporal: temporalRisk,
      environmental: environmentalRisk,
    },
    recommendations,
  };
};

/**
 * Calculate traffic-based risk (0-100)
 * Higher traffic index = higher risk
 */
const calculateTrafficRisk = (factors: RiskFactors): number => {
  // Traffic index is 0-10, convert to 0-100
  let risk = factors.trafficIndex * 10;

  // Adjust based on road type
  const roadTypeMultiplier = {
    highway: 1.2, // Higher speeds = higher risk
    main_road: 1.0,
    secondary_road: 0.9,
    local_road: 0.7,
  };

  risk *= roadTypeMultiplier[factors.roadType];

  return Math.min(100, Math.round(risk));
};

/**
 * Calculate historical accident risk (0-100)
 * Based on historical accident density in area
 */
const calculateHistoricalRisk = (factors: RiskFactors): number => {
  const accidentCount = factors.historicalAccidents;

  // Scale: 0-10 accidents = low, 10-30 = medium, 30+ = high
  let risk = 0;

  if (accidentCount === 0) risk = 10;
  else if (accidentCount < 5) risk = 25;
  else if (accidentCount < 10) risk = 40;
  else if (accidentCount < 20) risk = 60;
  else if (accidentCount < 30) risk = 75;
  else risk = 90;

  return risk;
};

/**
 * Calculate temporal risk (0-100)
 * Based on time of day, day of week, etc.
 */
const calculateTemporalRisk = (factors: RiskFactors): number => {
  let risk = 30; // Base risk

  // High-risk hours (rush hours and late night)
  if (
    (factors.timeOfDay >= 7 && factors.timeOfDay <= 9) || // Morning rush
    (factors.timeOfDay >= 17 && factors.timeOfDay <= 19) // Evening rush
  ) {
    risk += 25;
  } else if (factors.timeOfDay >= 22 || factors.timeOfDay <= 4) {
    // Late night/early morning
    risk += 30; // Fatigue, reduced visibility
  }

  // Weekend vs weekday
  if (factors.dayOfWeek === 0 || factors.dayOfWeek === 6) {
    // Weekend - slightly higher risk due to leisure travel
    risk += 5;
  }

  // Lighting conditions
  if (factors.lighting === 'night') {
    risk += 15;
  } else if (factors.lighting === 'dusk_dawn') {
    risk += 10;
  }

  return Math.min(100, risk);
};

/**
 * Calculate environmental risk (0-100)
 * Based on weather and road conditions
 */
const calculateEnvironmentalRisk = (factors: RiskFactors): number => {
  let risk = 20; // Base risk

  // Weather impact
  const weatherRisk = {
    clear: 0,
    cloudy: 5,
    rain: 25,
    heavy_rain: 45,
    fog: 35,
  };

  risk += weatherRisk[factors.weather];

  // Speed limit factor (higher speed = higher risk)
  if (factors.speedLimit >= 120) risk += 15;
  else if (factors.speedLimit >= 90) risk += 10;
  else if (factors.speedLimit >= 60) risk += 5;

  return Math.min(100, risk);
};

/**
 * Get risk level from score
 */
const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'severe' => {
  if (score < 30) return 'low';
  if (score < 50) return 'medium';
  if (score < 70) return 'high';
  return 'severe';
};

/**
 * Get color for risk score
 */
const getRiskColor = (score: number): string => {
  if (score < 30) return '#22C55E'; // Green
  if (score < 50) return '#F59E0B'; // Yellow
  if (score < 70) return '#EA580C'; // Orange
  return '#DC2626'; // Red
};

/**
 * Generate safety recommendations based on risk factors
 */
const generateRecommendations = (score: number, factors: RiskFactors): string[] => {
  const recs: string[] = [];

  // High overall risk
  if (score >= 70) {
    recs.push('Consider delaying your trip if possible');
    recs.push('Use alternative routes with lower traffic');
  }

  // Traffic-related
  if (factors.trafficIndex >= 7) {
    recs.push('Heavy traffic detected - expect delays');
    recs.push('Maintain safe following distance');
  }

  // Time-related
  if (factors.timeOfDay >= 22 || factors.timeOfDay <= 4) {
    recs.push('Late night driving - stay alert for fatigue');
    recs.push('Watch for reduced visibility');
  }

  if (
    (factors.timeOfDay >= 7 && factors.timeOfDay <= 9) ||
    (factors.timeOfDay >= 17 && factors.timeOfDay <= 19)
  ) {
    recs.push('Rush hour period - exercise extra caution');
  }

  // Weather-related
  if (factors.weather === 'heavy_rain' || factors.weather === 'fog') {
    recs.push('Poor weather conditions - reduce speed');
    recs.push('Turn on headlights and use fog lights if available');
  } else if (factors.weather === 'rain') {
    recs.push('Wet road conditions - drive carefully');
  }

  // Historical accidents
  if (factors.historicalAccidents >= 20) {
    recs.push('High accident zone - stay extra vigilant');
  }

  // Lighting
  if (factors.lighting === 'night' || factors.lighting === 'dusk_dawn') {
    recs.push('Reduced visibility - use headlights');
  }

  // Speed-related
  if (factors.speedLimit >= 90) {
    recs.push('High-speed area - maintain safe speeds');
  }

  // If no specific recommendations, add general ones
  if (recs.length === 0) {
    recs.push('Area is relatively safe');
    recs.push('Continue to drive defensively');
  }

  return recs;
};

/**
 * Get current weather (simplified)
 * In production, this would call a weather API
 */
const getCurrentWeather = (): RiskFactors['weather'] => {
  // Random for now, would be from API
  const hour = new Date().getHours();

  // Afternoon rain is common in Thailand
  if (hour >= 14 && hour <= 17 && Math.random() > 0.6) {
    return 'rain';
  }

  return 'clear';
};

/**
 * Get lighting condition based on time
 */
const getLighting = (hour: number): RiskFactors['lighting'] => {
  if (hour >= 6 && hour < 7) return 'dusk_dawn';
  if (hour >= 7 && hour < 18) return 'day';
  if (hour >= 18 && hour < 19) return 'dusk_dawn';
  return 'night';
};

/**
 * Calculate risk for multiple locations (heatmap generation)
 */
export const calculateAreaRisk = async (
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  gridSize: number = 20
): Promise<LocationRisk[]> => {
  const locations: LocationRisk[] = [];

  const latStep = (bounds.north - bounds.south) / gridSize;
  const lngStep = (bounds.east - bounds.west) / gridSize;

  // Generate grid points
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = bounds.south + i * latStep;
      const lng = bounds.west + j * lngStep;

      // Simulate accident count based on location
      const nearbyAccidents = Math.floor(Math.random() * 40);

      const riskScore = await calculateRiskScore(
        { lat, lng },
        { historicalAccidents: nearbyAccidents }
      );

      locations.push({
        location: { lat, lng },
        riskScore,
        nearbyAccidents,
        radius: 1, // 1 km radius
      });
    }
  }

  return locations;
};

/**
 * Get risk index (0-10 scale like traffic index)
 */
export const getRiskIndex = (riskScore: number): number => {
  return Math.round((riskScore / 100) * 10);
};

/**
 * Predict accident severity using ML model simulation
 * In production, this would call the actual XGBoost model
 */
export const predictAccidentSeverity = (
  factors: RiskFactors
): {
  severity: 'minor' | 'serious' | 'fatal';
  probability: number;
  confidence: number;
} => {
  // Simulate ML model prediction
  // The actual model would use XGBoost with features like:
  // - time of day, day of week
  // - weather conditions
  // - road type, speed limit
  // - traffic density
  // - historical accident data

  let minorProb = 0.6;
  let seriousProb = 0.3;
  let fatalProb = 0.1;

  // Adjust probabilities based on factors
  if (factors.weather === 'heavy_rain' || factors.weather === 'fog') {
    seriousProb += 0.1;
    fatalProb += 0.05;
    minorProb -= 0.15;
  }

  if (factors.speedLimit >= 90) {
    seriousProb += 0.15;
    fatalProb += 0.1;
    minorProb -= 0.25;
  }

  if (factors.lighting === 'night') {
    seriousProb += 0.1;
    fatalProb += 0.05;
    minorProb -= 0.15;
  }

  if (factors.timeOfDay >= 22 || factors.timeOfDay <= 4) {
    fatalProb += 0.1;
    seriousProb += 0.05;
    minorProb -= 0.15;
  }

  // Normalize
  const total = minorProb + seriousProb + fatalProb;
  minorProb /= total;
  seriousProb /= total;
  fatalProb /= total;

  // Determine most likely severity
  const maxProb = Math.max(minorProb, seriousProb, fatalProb);
  let severity: 'minor' | 'serious' | 'fatal' = 'minor';
  let probability = minorProb;

  if (maxProb === seriousProb) {
    severity = 'serious';
    probability = seriousProb;
  } else if (maxProb === fatalProb) {
    severity = 'fatal';
    probability = fatalProb;
  }

  return {
    severity,
    probability,
    confidence: 0.75 + Math.random() * 0.2, // 75-95% confidence
  };
};
