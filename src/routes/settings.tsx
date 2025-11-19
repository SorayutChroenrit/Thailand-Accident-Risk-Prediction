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
import { Button } from "~/components/ui/button";
import { Globe, Moon, Sun, Bell, Map, Database, Save } from "lucide-react";
import { useLanguage } from "~/hooks/useLanguage";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {language === "en" ? "Settings" : "ตั้งค่า"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "en"
              ? "Customize your experience"
              : "ปรับแต่งประสบการณ์ของคุณ"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {language === "en" ? "Language" : "ภาษา"}
              </CardTitle>
              <CardDescription>
                {language === "en"
                  ? "Select your preferred language"
                  : "เลือกภาษาที่คุณต้องการ"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  onClick={() => setLanguage("en")}
                  className="flex-1"
                >
                  English
                </Button>
                <Button
                  variant={language === "th" ? "default" : "outline"}
                  onClick={() => setLanguage("th")}
                  className="flex-1"
                >
                  ไทย
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="h-4 w-4" />
                {language === "en" ? "Theme" : "ธีม"}
              </CardTitle>
              <CardDescription>
                {language === "en"
                  ? "Choose light or dark mode"
                  : "เลือกโหมดสว่างหรือมืด"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button variant="default" className="flex-1 gap-2">
                  <Sun className="h-4 w-4" />
                  {language === "en" ? "Light" : "สว่าง"}
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Moon className="h-4 w-4" />
                  {language === "en" ? "Dark" : "มืด"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Map Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Map className="h-4 w-4" />
                {language === "en" ? "Map Preferences" : "การตั้งค่าแผนที่"}
              </CardTitle>
              <CardDescription>
                {language === "en"
                  ? "Configure default map view"
                  : "กำหนดค่าเริ่มต้นของแผนที่"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {language === "en"
                    ? "Default Zoom Level"
                    : "ระดับซูมเริ่มต้น"}
                </label>
                <select className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm">
                  <option value="8">
                    {language === "en" ? "Country" : "ประเทศ"}
                  </option>
                  <option value="10">
                    {language === "en" ? "Region" : "ภูมิภาค"}
                  </option>
                  <option value="12">
                    {language === "en" ? "City" : "เมือง"}
                  </option>
                  <option value="14">
                    {language === "en" ? "District" : "เขต"}
                  </option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {language === "en"
                    ? "Default Center"
                    : "จุดศูนย์กลางเริ่มต้น"}
                </label>
                <select className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm">
                  <option value="bangkok">
                    {language === "en" ? "Bangkok" : "กรุงเทพมหานคร"}
                  </option>
                  <option value="chiangmai">
                    {language === "en" ? "Chiang Mai" : "เชียงใหม่"}
                  </option>
                  <option value="phuket">
                    {language === "en" ? "Phuket" : "ภูเก็ต"}
                  </option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {language === "en" ? "Notifications" : "การแจ้งเตือน"}
              </CardTitle>
              <CardDescription>
                {language === "en"
                  ? "Manage alert preferences"
                  : "จัดการการตั้งค่าการแจ้งเตือน"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {language === "en"
                      ? "High Risk Alerts"
                      : "การแจ้งเตือนความเสี่ยงสูง"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "en"
                      ? "Get notified when risk exceeds 80%"
                      : "รับการแจ้งเตือนเมื่อความเสี่ยงเกิน 80%"}
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {language === "en"
                      ? "Weather Warnings"
                      : "การแจ้งเตือนสภาพอากาศ"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "en"
                      ? "Alerts for severe weather conditions"
                      : "การแจ้งเตือนสภาพอากาศรุนแรง"}
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {language === "en" ? "Daily Summary" : "สรุปรายวัน"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "en"
                      ? "Receive daily risk summary"
                      : "รับสรุปความเสี่ยงรายวัน"}
                  </p>
                </div>
                <input type="checkbox" className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          {/* Data Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                {language === "en" ? "Data Preferences" : "การตั้งค่าข้อมูล"}
              </CardTitle>
              <CardDescription>
                {language === "en"
                  ? "Configure data display options"
                  : "กำหนดค่าตัวเลือกการแสดงข้อมูล"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {language === "en"
                    ? "Default Time Range"
                    : "ช่วงเวลาเริ่มต้น"}
                </label>
                <select className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm">
                  <option value="7">
                    {language === "en" ? "Last 7 days" : "7 วันที่ผ่านมา"}
                  </option>
                  <option value="30">
                    {language === "en" ? "Last 30 days" : "30 วันที่ผ่านมา"}
                  </option>
                  <option value="90">
                    {language === "en" ? "Last 90 days" : "90 วันที่ผ่านมา"}
                  </option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {language === "en"
                    ? "Data Refresh Interval"
                    : "ช่วงเวลาอัปเดตข้อมูล"}
                </label>
                <select className="w-full mt-1.5 px-3 py-2 rounded-md border bg-background text-sm">
                  <option value="5">
                    {language === "en" ? "Every 5 minutes" : "ทุก 5 นาที"}
                  </option>
                  <option value="15">
                    {language === "en" ? "Every 15 minutes" : "ทุก 15 นาที"}
                  </option>
                  <option value="30">
                    {language === "en" ? "Every 30 minutes" : "ทุก 30 นาที"}
                  </option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button className="w-full" size="lg">
            <Save className="h-4 w-4 mr-2" />
            {language === "en" ? "Save Settings" : "บันทึกการตั้งค่า"}
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
