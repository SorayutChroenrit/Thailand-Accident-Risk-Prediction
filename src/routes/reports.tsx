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
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  FileText,
  Download,
  Calendar,
  MapPin,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  File,
  Clock,
  CheckCircle,
} from "lucide-react";
import { provinces } from "~/lib/mock-data";
import { useLanguage } from "~/hooks/useLanguage";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { language } = useLanguage();
  const [selectedReport, setSelectedReport] = useState("summary");
  const [dateRange, setDateRange] = useState({
    start: "2024-01-01",
    end: "2024-01-31",
  });
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    {
      id: "summary",
      icon: BarChart3,
      name_en: "Summary Report",
      name_th: "รายงานสรุป",
      desc_en: "Overview of accidents and predictions",
      desc_th: "ภาพรวมอุบัติเหตุและการทำนาย",
    },
    {
      id: "detailed",
      icon: FileText,
      name_en: "Detailed Analysis",
      name_th: "การวิเคราะห์โดยละเอียด",
      desc_en: "In-depth breakdown by location and time",
      desc_th: "วิเคราะห์เจาะลึกตามสถานที่และเวลา",
    },
    {
      id: "trends",
      icon: PieChart,
      name_en: "Trend Report",
      name_th: "รายงานแนวโน้ม",
      desc_en: "Historical trends and patterns",
      desc_th: "แนวโน้มและรูปแบบในอดีต",
    },
    {
      id: "predictions",
      icon: BarChart3,
      name_en: "Prediction Accuracy",
      name_th: "ความแม่นยำการทำนาย",
      desc_en: "Model performance and accuracy metrics",
      desc_th: "ประสิทธิภาพและความแม่นยำของโมเดล",
    },
  ];

  const recentReports = [
    {
      id: 1,
      name: "Monthly Summary - January 2024",
      type: "PDF",
      size: "2.4 MB",
      date: "2024-01-31",
      status: "completed",
    },
    {
      id: 2,
      name: "Bangkok Risk Analysis",
      type: "Excel",
      size: "1.8 MB",
      date: "2024-01-28",
      status: "completed",
    },
    {
      id: 3,
      name: "Weekly Trend Report",
      type: "PDF",
      size: "1.2 MB",
      date: "2024-01-25",
      status: "completed",
    },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
    alert(
      language === "en"
        ? "Report generated successfully!"
        : "สร้างรายงานสำเร็จ!",
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {language === "en" ? "Reports" : "รายงาน"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "en"
              ? "Generate and download custom reports"
              : "สร้างและดาวน์โหลดรายงานที่กำหนดเอง"}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Report Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {language === "en" ? "Report Type" : "ประเภทรายงาน"}
                </CardTitle>
                <CardDescription>
                  {language === "en"
                    ? "Select the type of report to generate"
                    : "เลือกประเภทรายงานที่ต้องการสร้าง"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {reportTypes.map((report) => (
                    <div
                      key={report.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedReport === report.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedReport(report.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-md ${
                            selectedReport === report.id
                              ? "bg-primary/10"
                              : "bg-muted"
                          }`}
                        >
                          <report.icon
                            className={`h-4 w-4 ${
                              selectedReport === report.id
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {language === "en"
                              ? report.name_en
                              : report.name_th}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {language === "en"
                              ? report.desc_en
                              : report.desc_th}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {language === "en"
                    ? "Report Parameters"
                    : "พารามิเตอร์รายงาน"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Range */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {language === "en" ? "Date Range" : "ช่วงวันที่"}
                  </label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <input
                      type="date"
                      className="px-3 py-2 rounded-md border bg-background text-sm"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, start: e.target.value })
                      }
                    />
                    <input
                      type="date"
                      className="px-3 py-2 rounded-md border bg-background text-sm"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, end: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Province */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {language === "en" ? "Province" : "จังหวัด"}
                  </label>
                  <select
                    className="w-full mt-2 px-3 py-2 rounded-md border bg-background text-sm"
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                  >
                    <option value="all">
                      {language === "en" ? "All Provinces" : "ทุกจังหวัด"}
                    </option>
                    {provinces.map((province) => (
                      <option key={province.id} value={province.id}>
                        {language === "en"
                          ? province.name_en
                          : province.name_th}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Export Format */}
                <div>
                  <label className="text-sm font-medium">
                    {language === "en" ? "Export Format" : "รูปแบบไฟล์"}
                  </label>
                  <div className="flex gap-3 mt-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <File className="h-4 w-4" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  {language === "en" ? "Generating..." : "กำลังสร้าง..."}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  {language === "en" ? "Generate Report" : "สร้างรายงาน"}
                </>
              )}
            </Button>
          </div>

          {/* Recent Reports */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {language === "en" ? "Recent Reports" : "รายงานล่าสุด"}
                </CardTitle>
                <CardDescription>
                  {language === "en"
                    ? "Previously generated reports"
                    : "รายงานที่สร้างก่อนหน้า"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {report.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {report.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {report.size}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(report.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      {report.status === "completed" && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-risk-low">
                          <CheckCircle className="h-3 w-3" />
                          {language === "en" ? "Completed" : "เสร็จสิ้น"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
