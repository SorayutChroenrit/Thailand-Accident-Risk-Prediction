import express from "express";

const router = express.Router();

// Get road condition at location
router.get("/condition", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Missing lat or lon parameter" });
    }

    // TODO: Integrate with real road data API
    // For now, return mock data based on location

    // Mock road quality (varies by location)
    const qualities = ["excellent", "good", "fair", "poor"];
    const quality = qualities[Math.floor(Math.random() * qualities.length)];

    // Mock data
    const roadData = {
      surface_type: "asphalt",
      quality: quality,
      lane_count: Math.floor(Math.random() * 3) + 2, // 2-4 lanes
      speed_limit: [60, 80, 90, 100, 120][Math.floor(Math.random() * 5)],
      has_shoulder: Math.random() > 0.3,
      lighting: Math.random() > 0.4 ? "good" : "poor",
      last_maintenance: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    res.json(roadData);
  } catch (error) {
    console.error("Error getting road condition:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get nearby road hazards
router.get("/hazards", async (req, res) => {
  try {
    const { lat, lon, radius = 5 } = req.query; // radius in km

    if (!lat || !lon) {
      return res.status(400).json({ error: "Missing lat or lon parameter" });
    }

    // TODO: Integrate with real hazard reporting system
    // Mock hazards
    const hazardTypes = [
      "pothole",
      "debris",
      "construction",
      "flooding",
      "animal_crossing",
      "poor_visibility",
    ];

    const hazardCount = Math.floor(Math.random() * 3);
    const hazards = Array.from({ length: hazardCount }, (_, i) => ({
      id: `hazard_${i}`,
      type: hazardTypes[Math.floor(Math.random() * hazardTypes.length)],
      lat: parseFloat(lat as string) + (Math.random() - 0.5) * 0.01,
      lon: parseFloat(lon as string) + (Math.random() - 0.5) * 0.01,
      severity: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
      reported_at: new Date(
        Date.now() - Math.random() * 24 * 60 * 60 * 1000
      ).toISOString(),
    }));

    res.json({
      hazards,
      count: hazards.length,
      radius: parseFloat(radius as string),
    });
  } catch (error) {
    console.error("Error getting road hazards:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
