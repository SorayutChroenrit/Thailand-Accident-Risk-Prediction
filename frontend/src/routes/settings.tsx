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
import { Globe, Moon, Sun, Map, Save } from "lucide-react";
import { useLanguage } from "~/contexts/LanguageContext";

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
