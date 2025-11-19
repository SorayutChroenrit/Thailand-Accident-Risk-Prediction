import { createFileRoute } from "@tanstack/react-router";
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
import {
  Activity,
  AlertTriangle,
  MapPin,
  TrendingUp,
  TrendingDown,
  Car,
  Cloud,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  dashboardStats,
  riskDistribution,
  accidentsOverTime,
  riskByHour,
  topHighRiskAreas,
  riskByWeather,
} from "~/lib/mock-data";
import { useLanguage } from "~/hooks/useLanguage";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { language } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {language === "en" ? "Dashboard" : "แดชบอร์ด"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "en"
              ? "Real-time analytics and insights"
              : "การวิเคราะห์และข้อมูลเชิงลึกแบบเรียลไทม์"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "en" ? "Predictions Today" : "การทำนายวันนี้"}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats.predictionsToday}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-risk-low" />
                +12% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "en" ? "High Risk Areas" : "พื้นที่เสี่ยงสูง"}
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-risk-high" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats.highRiskAreas}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-risk-low" />
                -2 from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "en" ? "Active Alerts" : "การแจ้งเตือนที่ใช้งาน"}
              </CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats.activeAlerts}
              </div>
              <p className="text-xs text-muted-foreground">
                Weather warnings active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "en" ? "Traffic Incidents" : "อุบัติการณ์จราจร"}
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats.trafficIncidents}
              </div>
              <p className="text-xs text-muted-foreground">
                In monitored areas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Risk Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {language === "en"
                  ? "Risk Distribution"
                  : "การกระจายความเสี่ยง"}
              </CardTitle>
              <CardDescription>
                {language === "en" ? "By severity level" : "ตามระดับความรุนแรง"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {riskDistribution.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-1 text-xs"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Accidents Over Time Line Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                {language === "en"
                  ? "Accidents vs Predictions"
                  : "อุบัติเหตุ vs การทำนาย"}
              </CardTitle>
              <CardDescription>
                {language === "en" ? "Last 7 days" : "7 วันที่ผ่านมา"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accidentsOverTime}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="accidents"
                      stroke="#DC2626"
                      strokeWidth={2}
                      dot={{ fill: "#DC2626" }}
                      name="Accidents"
                    />
                    <Line
                      type="monotone"
                      dataKey="predictions"
                      stroke="#2563EB"
                      strokeWidth={2}
                      dot={{ fill: "#2563EB" }}
                      name="Predictions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {/* Risk by Hour */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {language === "en"
                  ? "Risk by Time of Day"
                  : "ความเสี่ยงตามช่วงเวลา"}
              </CardTitle>
              <CardDescription>
                {language === "en"
                  ? "Average risk score"
                  : "คะแนนความเสี่ยงเฉลี่ย"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskByHour}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="hour" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="risk"
                      stroke="#2563EB"
                      fill="#2563EB"
                      fillOpacity={0.3}
                      name="Risk %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Risk by Weather */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {language === "en"
                  ? "Risk by Weather"
                  : "ความเสี่ยงตามสภาพอากาศ"}
              </CardTitle>
              <CardDescription>
                {language === "en"
                  ? "Correlation analysis"
                  : "การวิเคราะห์ความสัมพันธ์"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskByWeather}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="condition" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar
                      dataKey="risk"
                      fill="#2563EB"
                      name="Risk %"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top High Risk Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {language === "en"
                ? "Top High Risk Areas"
                : "พื้นที่เสี่ยงสูงสุด"}
            </CardTitle>
            <CardDescription>
              {language === "en"
                ? "Based on risk score and accident history"
                : "ตามคะแนนความเสี่ยงและประวัติอุบัติเหตุ"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topHighRiskAreas.map((area, index) => (
                <div key={area.name} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{area.name}</span>
                      <Badge
                        variant={
                          area.risk >= 75
                            ? "danger"
                            : area.risk >= 50
                              ? "warning"
                              : "success"
                        }
                      >
                        {area.risk}%
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${area.risk}%`,
                          backgroundColor:
                            area.risk >= 75
                              ? "#DC2626"
                              : area.risk >= 50
                                ? "#EA580C"
                                : "#16A34A",
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {area.accidents} accidents in last 30 days
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
