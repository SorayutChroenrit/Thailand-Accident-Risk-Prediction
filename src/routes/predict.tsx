import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "~/components/layout/Header";
import { Footer } from "~/components/layout/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  MapPin,
  Cloud,
  Car,
  Clock,
  AlertTriangle,
  Shield,
  Skull,
  TrendingUp,
  Zap,
  CheckCircle,
  Info,
} from "lucide-react";
import { weatherConditions, roadTypes, severityLabels } from "~/lib/mock-data";
import { useLanguage } from "~/hooks/useLanguage";

export const Route = createFileRoute("/predict")({
  component: PredictPage,
});

function PredictPage() {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<{
    risk_score: number;
    severity: string;
    confidence: number;
    factors: { name: string; value: number; impact: string }[];
    recommendations: string[];
  } | null>(null);

  const [formData, setFormData] = useState({
    location: "",
    lat: 13.7563,
    lng: 100.5018,
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    weather: "clear",
    road_type: "urban",
    traffic_density: "medium",
  });

  const handlePredict = async () => {
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock prediction result
    const mockPrediction = {
      risk_score: 72,
      severity: "medium",
      confidence: 89,
      factors: [
        { name: "Traffic Congestion", value: 30, impact: "high" },
        { name: "Time of Day", value: 25, impact: "high" },
        { name: "Historical Patterns", value: 20, impact: "medium" },
        { name: "Weather Conditions", value: 15, impact: "medium" },
        { name: "Road Type", value: 10, impact: "low" },
      ],
      recommendations: [
        "Avoid this area during peak hours (17:00-19:00)",
        "Use alternative routes via Sukhumvit Road",
        "Increase following distance due to traffic density",
        "Stay alert for sudden stops",
      ],
    };

    setPrediction(mockPrediction);
    setIsLoading(false);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "low":
        return <Shield className="h-6 w-6 text-risk-low" />;
      case "medium":
        return <AlertTriangle className="h-6 w-6 text-risk-medium" />;
      case "high":
        return <Skull className="h-6 w-6 text-risk-high" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {language === "en" ? "Risk Prediction" : "การทำนายความเสี่ยง"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "en"
              ? "Get instant risk assessment for any location"
              : "รับการประเมินความเสี่ยงทันทีสำหรับทุกพื้นที่"}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {language === "en" ? "Location" : "พื้นที่"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    {language === "en" ? "Search Location" : "ค้นหาพื้นที่"}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      language === "en"
                        ? "Enter address or place name..."
                        : "กรอกที่อยู่หรือชื่อสถานที่..."
                    }
                    className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm"
                      value={formData.lat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lat: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm"
                      value={formData.lng}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lng: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {language === "en" ? "Date & Time" : "วันที่และเวลา"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">
                      {language === "en" ? "Date" : "วันที่"}
                    </label>
                    <input
                      type="date"
                      className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {language === "en" ? "Time" : "เวลา"}
                    </label>
                    <input
                      type="time"
                      className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  {language === "en" ? "Conditions" : "สภาพแวดล้อม"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    {language === "en" ? "Weather" : "สภาพอากาศ"}
                  </label>
                  <select
                    className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm"
                    value={formData.weather}
                    onChange={(e) =>
                      setFormData({ ...formData, weather: e.target.value })
                    }
                  >
                    {weatherConditions.map((condition) => (
                      <option key={condition.value} value={condition.value}>
                        {language === "en"
                          ? condition.label_en
                          : condition.label_th}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {language === "en" ? "Road Type" : "ประเภทถนน"}
                  </label>
                  <select
                    className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm"
                    value={formData.road_type}
                    onChange={(e) =>
                      setFormData({ ...formData, road_type: e.target.value })
                    }
                  >
                    {roadTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {language === "en" ? type.label_en : type.label_th}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {language === "en" ? "Traffic Density" : "ความหนาแน่นจราจร"}
                  </label>
                  <select
                    className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm"
                    value={formData.traffic_density}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        traffic_density: e.target.value,
                      })
                    }
                  >
                    <option value="low">
                      {language === "en" ? "Low" : "น้อย"}
                    </option>
                    <option value="medium">
                      {language === "en" ? "Medium" : "ปานกลาง"}
                    </option>
                    <option value="high">
                      {language === "en" ? "High" : "หนาแน่น"}
                    </option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePredict}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  {language === "en" ? "Analyzing..." : "กำลังวิเคราะห์..."}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  {language === "en" ? "Predict Risk" : "ทำนายความเสี่ยง"}
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {prediction ? (
              <>
                {/* Risk Score Card */}
                <Card
                  className={`border-2 ${
                    prediction.severity === "high"
                      ? "border-risk-high bg-risk-high/5"
                      : prediction.severity === "medium"
                        ? "border-risk-medium bg-risk-medium/5"
                        : "border-risk-low bg-risk-low/5"
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="flex justify-center mb-4">
                        {getSeverityIcon(prediction.severity)}
                      </div>
                      <div
                        className="text-5xl font-bold mb-2"
                        style={{
                          color:
                            severityLabels[
                              prediction.severity as keyof typeof severityLabels
                            ].color,
                        }}
                      >
                        {prediction.risk_score}%
                      </div>
                      <Badge
                        variant={
                          prediction.severity === "high"
                            ? "danger"
                            : prediction.severity === "medium"
                              ? "warning"
                              : "success"
                        }
                        className="text-sm"
                      >
                        {language === "en"
                          ? severityLabels[
                              prediction.severity as keyof typeof severityLabels
                            ].en
                          : severityLabels[
                              prediction.severity as keyof typeof severityLabels
                            ].th}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        Confidence: {prediction.confidence}%
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Contributing Factors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {language === "en"
                        ? "Contributing Factors"
                        : "ปัจจัยที่ส่งผล"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {prediction.factors.map((factor) => (
                      <div key={factor.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{factor.name}</span>
                          <span className="text-sm font-medium">
                            {factor.value}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${factor.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      {language === "en" ? "Recommendations" : "คำแนะนำ"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {prediction.recommendations.map((rec, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {language === "en"
                      ? "No Prediction Yet"
                      : "ยังไม่มีการทำนาย"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {language === "en"
                      ? 'Fill in the form and click "Predict Risk" to get your risk assessment'
                      : 'กรอกแบบฟอร์มและคลิก "ทำนายความเสี่ยง" เพื่อรับการประเมิน'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
