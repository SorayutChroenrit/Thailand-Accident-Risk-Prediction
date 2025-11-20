import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/layout/Header";
import { Footer } from "~/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Info,
  Target,
  Database,
  Brain,
  Cloud,
  Car,
  BarChart3,
  Shield,
  Users,
  Mail,
  Github,
  ExternalLink,
} from "lucide-react";
import { useLanguage } from "~/contexts/LanguageContext";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const { language } = useLanguage();

  const features = [
    {
      icon: Brain,
      title_en: "Machine Learning",
      title_th: "การเรียนรู้ของเครื่อง",
      desc_en:
        "XGBoost model trained on historical accident data with 94% accuracy",
      desc_th: "โมเดล XGBoost เรียนรู้จากข้อมูลอุบัติเหตุในอดีต ความแม่นยำ 94%",
    },
    {
      icon: Cloud,
      title_en: "Weather Integration",
      title_th: "การรวมข้อมูลสภาพอากาศ",
      desc_en: "Real-time weather data from OpenWeatherMap API",
      desc_th: "ข้อมูลสภาพอากาศแบบเรียลไทม์จาก OpenWeatherMap API",
    },
    {
      icon: Car,
      title_en: "Traffic Analysis",
      title_th: "การวิเคราะห์จราจร",
      desc_en: "Live traffic conditions from TomTom Traffic API",
      desc_th: "สภาพจราจรแบบสดจาก TomTom Traffic API",
    },
    {
      icon: Database,
      title_en: "Historical Data",
      title_th: "ข้อมูลประวัติ",
      desc_en: "Comprehensive database of past accidents in Thailand",
      desc_th: "ฐานข้อมูลอุบัติเหตุในอดีตที่ครอบคลุมในประเทศไทย",
    },
  ];

  const team = [
    {
      name: "Development Team",
      role_en: "Software Engineering",
      role_th: "วิศวกรรมซอฟต์แวร์",
    },
    {
      name: "Data Science Team",
      role_en: "ML & Analytics",
      role_th: "ML และการวิเคราะห์",
    },
    {
      name: "UX/UI Team",
      role_en: "Design & Experience",
      role_th: "ออกแบบและประสบการณ์",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {language === "en"
              ? "About SafeRoute Thailand"
              : "เกี่ยวกับ SafeRoute Thailand"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "en"
              ? "AI-powered accident risk prediction system"
              : "ระบบทำนายความเสี่ยงอุบัติเหตุด้วย AI"}
          </p>
        </div>

        <div className="space-y-8">
          {/* Mission */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                {language === "en" ? "Our Mission" : "พันธกิจของเรา"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {language === "en"
                  ? "To reduce road accidents in Thailand by providing accurate, real-time risk predictions that help drivers, authorities, and city planners make informed decisions. Our goal is to save lives through data-driven insights and proactive safety measures."
                  : "เพื่อลดอุบัติเหตุบนท้องถนนในประเทศไทยโดยการให้การทำนายความเสี่ยงที่แม่นยำและเรียลไทม์ ช่วยให้ผู้ขับขี่ เจ้าหน้าที่ และผู้วางแผนเมืองตัดสินใจได้อย่างมีข้อมูล เป้าหมายของเราคือการช่วยชีวิตผ่านข้อมูลเชิงลึกและมาตรการความปลอดภัยเชิงรุก"}
              </p>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                {language === "en" ? "How It Works" : "วิธีการทำงาน"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium">
                      {language === "en"
                        ? "Data Collection"
                        : "การรวบรวมข้อมูล"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "en"
                        ? "We collect real-time weather, traffic, and historical accident data from multiple sources."
                        : "เรารวบรวมข้อมูลสภาพอากาศ การจราจร และประวัติอุบัติเหตุแบบเรียลไทม์จากหลายแหล่ง"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium">
                      {language === "en" ? "ML Processing" : "การประมวลผล ML"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "en"
                        ? "Our XGBoost model analyzes the data considering time, location, weather, and traffic patterns."
                        : "โมเดล XGBoost ของเราวิเคราะห์ข้อมูลโดยพิจารณาเวลา สถานที่ สภาพอากาศ และรูปแบบการจราจร"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium">
                      {language === "en"
                        ? "Risk Prediction"
                        : "การทำนายความเสี่ยง"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "en"
                        ? "The system outputs a risk score (0-100%) and severity level with recommendations."
                        : "ระบบแสดงคะแนนความเสี่ยง (0-100%) และระดับความรุนแรงพร้อมคำแนะนำ"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                {language === "en" ? "Key Features" : "คุณสมบัติหลัก"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <div key={feature.title_en} className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {language === "en"
                          ? feature.title_en
                          : feature.title_th}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {language === "en" ? feature.desc_en : feature.desc_th}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Severity Levels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                {language === "en" ? "Severity Levels" : "ระดับความรุนแรง"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-risk-low/10">
                  <Badge variant="success">
                    {language === "en" ? "Low" : "ต่ำ"}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">
                      {language === "en"
                        ? "Minor Injury (บาดเจ็บน้อย)"
                        : "บาดเจ็บน้อย (Minor Injury)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === "en"
                        ? "Risk Score: 0-33%"
                        : "คะแนนความเสี่ยง: 0-33%"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-risk-medium/10">
                  <Badge variant="warning">
                    {language === "en" ? "Medium" : "ปานกลาง"}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">
                      {language === "en"
                        ? "Serious Injury (บาดเจ็บสาหัส)"
                        : "บาดเจ็บสาหัส (Serious Injury)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === "en"
                        ? "Risk Score: 34-66%"
                        : "คะแนนความเสี่ยง: 34-66%"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-risk-high/10">
                  <Badge variant="danger">
                    {language === "en" ? "High" : "สูง"}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">
                      {language === "en"
                        ? "Fatal (เสียชีวิต)"
                        : "เสียชีวิต (Fatal)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === "en"
                        ? "Risk Score: 67-100%"
                        : "คะแนนความเสี่ยง: 67-100%"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {language === "en" ? "Our Team" : "ทีมของเรา"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {team.map((member) => (
                  <div
                    key={member.name}
                    className="text-center p-4 rounded-lg bg-muted/50"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {language === "en" ? member.role_en : member.role_th}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                {language === "en" ? "Contact Us" : "ติดต่อเรา"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a
                  href="mailto:contact@saferoute.th"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  contact@saferoute.th
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-4 w-4" />
                  GitHub Repository
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                {language === "en" ? "Data Sources" : "แหล่งข้อมูล"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  OpenWeatherMap API - Weather data
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  TomTom Traffic API - Traffic conditions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Thailand Road Safety Data - Historical accidents
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  OpenStreetMap - Map tiles and geodata
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
