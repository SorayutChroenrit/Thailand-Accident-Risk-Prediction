/**
 * ML Risk Scanner
 * Uses backend ML model to scan areas and predict high-risk zones
 * Two-stage model: Temporal Hotspot Detection + Severity Prediction
 */

export interface MLRiskZone {
  id: string;
  location: { lat: number; lng: number };
  riskScore: number; // 0-100
  hotspotProbability: number; // 0-1
  severity: "low" | "medium" | "high";
  severityClass?: string; // บาดเจ็บเล็กน้อย, บาดเจ็บสาหัส, เสียชีวิต
  confidence: number;
  factors: {
    isHotspot: boolean;
    isRushHour: boolean;
    isNight: boolean;
    isWeekend: boolean;
    rainfall: number;
    trafficDensity: number;
  };
  timestamp: Date;
}

const ML_API_URL = "http://localhost:10000"; // Backend ML API

/**
 * Predict risk for a specific location using ML backend
 */
export async function predictLocationRisk(
  lat: number,
  lng: number,
  options?: {
    hour?: number;
    day_of_week?: number;
    month?: number;
    rainfall?: number;
    traffic_density?: number;
  },
): Promise<MLRiskZone | null> {
  try {
    const now = new Date();
    const hour = options?.hour ?? now.getHours();
    const day_of_week = options?.day_of_week ?? now.getDay();
    const month = options?.month ?? now.getMonth() + 1;

    // Default environmental conditions
    const rainfall = options?.rainfall ?? 0;
    const traffic_density = options?.traffic_density ?? 0.5;

    const response = await fetch(`${ML_API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
        hour,
        day_of_week,
        month,
        rainfall,
        traffic_density,
      }),
    });

    if (!response.ok) {
      console.warn(
        `ML API returned status ${response.status} for ${lat},${lng}`,
      );
      return null;
    }

    const data = await response.json();

    // Map severity to our format (adjusted for model's conservative scoring)
    let severity: "low" | "medium" | "high";
    if (data.risk_score >= 50 || data.is_hotspot) {
      severity = "high";
    } else if (data.risk_score >= 23) {
      severity = "medium";
    } else {
      severity = "low";
    }

    return {
      id: `ml-risk-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      location: { lat, lng },
      riskScore: data.risk_score,
      hotspotProbability: data.hotspot_probability || 0,
      severity,
      severityClass: data.predicted_severity,
      confidence: data.confidence || 0.8,
      factors: {
        isHotspot: data.is_hotspot || false,
        isRushHour: (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19),
        isNight: hour >= 22 || hour < 6,
        isWeekend: day_of_week === 0 || day_of_week === 6,
        rainfall,
        trafficDensity: traffic_density,
      },
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`Error predicting risk for ${lat},${lng}:`, error);
    return null;
  }
}

/**
 * Scan an area using grid sampling and ML predictions
 * Returns high-risk zones only (risk_score >= threshold)
 */
export async function scanAreaForMLRiskZones(
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  options?: {
    gridSize?: number; // Number of points per dimension
    threshold?: number; // Minimum risk score to include (default: 40)
    maxZones?: number; // Maximum zones to return (default: 20)
  },
): Promise<MLRiskZone[]> {
  const gridSize = options?.gridSize ?? 6; // 6x6 = 36 points
  const threshold = options?.threshold ?? 40; // Medium risk and above
  const maxZones = options?.maxZones ?? 20;

  console.log(
    `🤖 Scanning area with ML model (${gridSize}x${gridSize} grid)...`,
  );

  const zones: MLRiskZone[] = [];
  const latStep = (bounds.north - bounds.south) / gridSize;
  const lngStep = (bounds.east - bounds.west) / gridSize;

  // Sample grid points
  const predictions: Promise<MLRiskZone | null>[] = [];

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = bounds.south + latStep * (i + 0.5);
      const lng = bounds.west + lngStep * (j + 0.5);

      predictions.push(predictLocationRisk(lat, lng));
    }
  }

  // Execute all predictions in parallel
  const results = await Promise.all(predictions);

  // Log all predictions to see the distribution
  const allScores = results
    .filter((z) => z !== null)
    .map((z) => z!.riskScore)
    .sort((a, b) => b - a);

  if (allScores.length > 0) {
    console.log(
      `📊 Risk scores: Max: ${allScores[0]}, Min: ${allScores[allScores.length - 1]}, Avg: ${Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)}`,
    );
  }

  // Filter high-risk zones
  for (const zone of results) {
    if (zone && zone.riskScore >= threshold) {
      zones.push(zone);
    }
  }

  // Sort by risk score (highest first) and limit
  zones.sort((a, b) => b.riskScore - a.riskScore);
  const topZones = zones.slice(0, maxZones);

  console.log(
    `✅ Found ${topZones.length} high-risk zones (threshold: ${threshold})`,
  );

  if (topZones.length > 0) {
    console.log(
      `📊 Risk distribution: High: ${topZones.filter((z) => z.severity === "high").length}, Medium: ${topZones.filter((z) => z.severity === "medium").length}`,
    );
  } else if (allScores.length > 0) {
    console.log(
      `💡 Suggestion: Lower threshold to ${Math.round(allScores[0] * 0.8)} to show ${results.filter((z) => z && z.riskScore >= allScores[0] * 0.8).length} zones`,
    );
  }

  return topZones;
}

/**
 * Scan major city points (for quick initial load)
 */
export async function scanMajorCityPoints(
  cityName: string = "bangkok",
): Promise<MLRiskZone[]> {
  // Major points in Bangkok
  const majorPoints: Record<
    string,
    Array<{ lat: number; lng: number; name: string }>
  > = {
    bangkok: [
      { lat: 13.7563, lng: 100.5018, name: "Victory Monument" },
      { lat: 13.7465, lng: 100.5356, name: "Ratchaprasong" },
      { lat: 13.7245, lng: 100.5674, name: "Asoke" },
      { lat: 13.7278, lng: 100.5241, name: "Silom" },
      { lat: 13.765, lng: 100.57, name: "Ratchada" },
      { lat: 13.7307, lng: 100.5838, name: "Ekkamai" },
      { lat: 13.759, lng: 100.5644, name: "Rama 9" },
      { lat: 13.7095, lng: 100.5357, name: "Sathorn" },
      { lat: 13.8078, lng: 100.5608, name: "Don Mueang" },
      { lat: 13.6904, lng: 100.5998, name: "Bearing" },
    ],
  };

  const points = majorPoints[cityName.toLowerCase()] || majorPoints.bangkok;

  console.log(`🤖 Scanning ${points.length} major points in ${cityName}...`);

  const predictions = await Promise.all(
    points.map((point) => predictLocationRisk(point.lat, point.lng)),
  );

  const zones = predictions.filter((zone) => zone !== null) as MLRiskZone[];

  // Filter medium and high risk only
  const riskZones = zones.filter((zone) => zone.riskScore >= 30);

  console.log(
    `✅ Found ${riskZones.length} risk zones in major ${cityName} areas`,
  );

  return riskZones;
}

/**
 * Get risk zone color based on severity
 */
export function getRiskZoneColor(severity: "low" | "medium" | "high"): string {
  const colors = {
    low: "#F59E0B", // Yellow
    medium: "#EA580C", // Orange
    high: "#DC2626", // Red
  };
  return colors[severity];
}

/**
 * Get risk zone icon
 */
export function getRiskZoneIcon(zone: MLRiskZone): string {
  if (zone.factors.isHotspot) {
    return "🔥"; // Temporal hotspot
  }
  if (zone.severity === "high") {
    return "⚠️"; // High risk
  }
  if (zone.severity === "medium") {
    return "⚡"; // Medium risk
  }
  return "📍"; // Low risk
}

/**
 * Format risk zone title
 */
export function getRiskZoneTitle(
  zone: MLRiskZone,
  language: "en" | "th",
): string {
  if (zone.factors.isHotspot) {
    return language === "en" ? "High Risk Area" : "พื้นที่เสี่ยงสูง";
  }

  if (zone.severity === "high") {
    return language === "en" ? "Accident Risk Zone" : "พื้นที่เสี่ยงอุบัติเหตุ";
  }

  if (zone.severity === "medium") {
    return language === "en" ? "Moderate Risk Area" : "พื้นที่เสี่ยงปานกลาง";
  }

  return language === "en" ? "Risk Area" : "พื้นที่เสี่ยง";
}

/**
 * Format risk zone description
 */
export function getRiskZoneDescription(
  zone: MLRiskZone,
  language: "en" | "th",
): string {
  const factors = [];

  if (zone.factors.isHotspot) {
    factors.push(
      language === "en" ? "Temporal hotspot" : "จุดเสี่ยงตามช่วงเวลา",
    );
  }

  if (zone.factors.isRushHour) {
    factors.push(language === "en" ? "Rush hour" : "ช่วงเร่งด่วน");
  }

  if (zone.factors.isNight) {
    factors.push(language === "en" ? "Night time" : "เวลากลางคืน");
  }

  if (zone.factors.rainfall > 5) {
    factors.push(language === "en" ? "Heavy rain" : "ฝนตกหนัก");
  }

  if (zone.factors.trafficDensity > 0.7) {
    factors.push(language === "en" ? "High traffic" : "จราจรหนาแน่น");
  }

  if (zone.severityClass) {
    factors.push(zone.severityClass);
  }

  const riskText =
    language === "en"
      ? `Risk Score: ${Math.round(zone.riskScore)}/100`
      : `คะแนนความเสี่ยง: ${Math.round(zone.riskScore)}/100`;

  if (factors.length > 0) {
    return `${riskText} • ${factors.join(", ")}`;
  }

  return riskText;
}
