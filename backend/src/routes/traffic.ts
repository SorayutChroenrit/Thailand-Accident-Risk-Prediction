import express from "express";

const router = express.Router();

// Get traffic density at location
router.get("/density", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Missing lat or lon parameter" });
    }

    // TODO: Integrate with real traffic API (Longdo, Google, etc.)
    // For now, return mock data based on time and location
    const hour = new Date().getHours();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);

    // Mock traffic density (0-1 scale)
    let density = 0.4; // base
    if (isRushHour) density += 0.3;
    density += Math.random() * 0.2; // variability
    density = Math.min(1, density);

    // Average speed (km/h)
    const baseSpeed = 60;
    const speed = baseSpeed * (1 - density * 0.7);

    // Congestion level
    let congestionLevel = "light";
    if (density > 0.7) congestionLevel = "heavy";
    else if (density > 0.5) congestionLevel = "moderate";

    res.json({
      density: Math.round(density * 100) / 100,
      average_speed: Math.round(speed),
      congestion_level: congestionLevel,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting traffic density:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get traffic index (Longdo-style)
router.get("/index", async (req, res) => {
  try {
    // Mock traffic index (0-10 scale, similar to Longdo)
    const hour = new Date().getHours();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);

    let index = 3; // base
    if (isRushHour) index += 3;
    index += Math.random() * 2;
    index = Math.min(10, Math.max(0, index));

    res.json({
      current: Math.round(index * 10) / 10,
      status: index < 3 ? "clear" : index < 5 ? "moderate" : index < 7 ? "busy" : "congested",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting traffic index:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
