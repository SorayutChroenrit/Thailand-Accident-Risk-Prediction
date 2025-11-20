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
import { useLanguage } from "~/contexts/LanguageContext";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/reports")({
  component: () => (
    <ProtectedRoute>
      <ReportsPage />
    </ProtectedRoute>
  ),
});

// Generate mock report data
const generateReportData = (
  reportType: string,
  dateRange: { start: string; end: string },
  provinceId: string,
) => {
  const selectedProvinceName =
    provinceId === "all"
      ? "All Provinces"
      : provinces.find((p) => p.id.toString() === provinceId)?.name_en ||
        "Unknown";

  // Mock data for reports
  const summaryData = [
    { province: "Bangkok", accidents: 245, risk_score: 78, predictions: 312 },
    { province: "Chiang Mai", accidents: 89, risk_score: 45, predictions: 156 },
    { province: "Phuket", accidents: 67, risk_score: 52, predictions: 98 },
    { province: "Khon Kaen", accidents: 54, risk_score: 38, predictions: 87 },
    { province: "Songkhla", accidents: 72, risk_score: 48, predictions: 112 },
  ];

  const detailedData = [
    {
      date: "2024-01-05",
      location: "Sukhumvit Road",
      type: "Collision",
      severity: "High",
      time: "18:30",
    },
    {
      date: "2024-01-08",
      location: "Rama IV",
      type: "Motorcycle",
      severity: "Medium",
      time: "08:15",
    },
    {
      date: "2024-01-12",
      location: "Sathorn",
      type: "Pedestrian",
      severity: "Low",
      time: "14:20",
    },
    {
      date: "2024-01-15",
      location: "Silom",
      type: "Collision",
      severity: "High",
      time: "17:45",
    },
    {
      date: "2024-01-20",
      location: "Ratchadaphisek",
      type: "Motorcycle",
      severity: "Medium",
      time: "09:00",
    },
  ];

  const trendsData = [
    { month: "October", accidents: 156, change: "+5%" },
    { month: "November", accidents: 189, change: "+21%" },
    { month: "December", accidents: 234, change: "+24%" },
    { month: "January", accidents: 198, change: "-15%" },
  ];

  const predictionsData = [
    { metric: "Accuracy", value: "87.5%" },
    { metric: "Precision", value: "82.3%" },
    { metric: "Recall", value: "89.1%" },
    { metric: "F1 Score", value: "85.6%" },
    { metric: "Total Predictions", value: "1,245" },
  ];

  return {
    reportType,
    dateRange,
    province: selectedProvinceName,
    generatedAt: new Date().toLocaleString(),
    summaryData,
    detailedData,
    trendsData,
    predictionsData,
  };
};

function ReportsPage() {
  const { language } = useLanguage();
  const [selectedReport, setSelectedReport] = useState("summary");
  const [dateRange, setDateRange] = useState({
    start: "2024-01-01",
    end: "2024-01-31",
  });
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");

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

  // Generate PDF Report
  const generatePDF = (data: ReturnType<typeof generateReportData>) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.text("Thailand Accident Risk Report", pageWidth / 2, 20, {
      align: "center",
    });

    // Report Info
    doc.setFontSize(10);
    doc.text(
      `Report Type: ${data.reportType.charAt(0).toUpperCase() + data.reportType.slice(1)}`,
      20,
      35,
    );
    doc.text(
      `Date Range: ${data.dateRange.start} to ${data.dateRange.end}`,
      20,
      42,
    );
    doc.text(`Province: ${data.province}`, 20, 49);
    doc.text(`Generated: ${data.generatedAt}`, 20, 56);

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 62, pageWidth - 20, 62);

    let yPosition = 75;

    // Content based on report type
    if (data.reportType === "summary") {
      doc.setFontSize(14);
      doc.text("Accident Summary by Province", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      // Table header
      doc.setFont(undefined, "bold");
      doc.text("Province", 20, yPosition);
      doc.text("Accidents", 70, yPosition);
      doc.text("Risk Score", 110, yPosition);
      doc.text("Predictions", 150, yPosition);
      doc.setFont(undefined, "normal");
      yPosition += 7;

      // Table data
      data.summaryData.forEach((row) => {
        doc.text(row.province, 20, yPosition);
        doc.text(row.accidents.toString(), 70, yPosition);
        doc.text(row.risk_score.toString(), 110, yPosition);
        doc.text(row.predictions.toString(), 150, yPosition);
        yPosition += 6;
      });
    } else if (data.reportType === "detailed") {
      doc.setFontSize(14);
      doc.text("Detailed Accident Analysis", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(8);
      doc.setFont(undefined, "bold");
      doc.text("Date", 20, yPosition);
      doc.text("Location", 45, yPosition);
      doc.text("Type", 95, yPosition);
      doc.text("Severity", 130, yPosition);
      doc.text("Time", 165, yPosition);
      doc.setFont(undefined, "normal");
      yPosition += 7;

      data.detailedData.forEach((row) => {
        doc.text(row.date, 20, yPosition);
        doc.text(row.location, 45, yPosition);
        doc.text(row.type, 95, yPosition);
        doc.text(row.severity, 130, yPosition);
        doc.text(row.time, 165, yPosition);
        yPosition += 6;
      });
    } else if (data.reportType === "trends") {
      doc.setFontSize(14);
      doc.text("Accident Trends", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text("Month", 20, yPosition);
      doc.text("Accidents", 70, yPosition);
      doc.text("Change", 120, yPosition);
      doc.setFont(undefined, "normal");
      yPosition += 7;

      data.trendsData.forEach((row) => {
        doc.text(row.month, 20, yPosition);
        doc.text(row.accidents.toString(), 70, yPosition);
        doc.text(row.change, 120, yPosition);
        yPosition += 6;
      });
    } else if (data.reportType === "predictions") {
      doc.setFontSize(14);
      doc.text("Prediction Model Performance", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text("Metric", 20, yPosition);
      doc.text("Value", 100, yPosition);
      doc.setFont(undefined, "normal");
      yPosition += 7;

      data.predictionsData.forEach((row) => {
        doc.text(row.metric, 20, yPosition);
        doc.text(row.value, 100, yPosition);
        yPosition += 6;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.text(
      "Generated by Thailand Accident Risk Prediction System",
      pageWidth / 2,
      280,
      { align: "center" },
    );

    // Save
    const fileName = `${data.reportType}_report_${data.dateRange.start}_${data.dateRange.end}.pdf`;
    doc.save(fileName);
  };

  // Generate Excel Report
  const generateExcel = (data: ReturnType<typeof generateReportData>) => {
    const workbook = XLSX.utils.book_new();

    // Info sheet
    const infoData = [
      ["Thailand Accident Risk Report"],
      [""],
      [
        "Report Type",
        data.reportType.charAt(0).toUpperCase() + data.reportType.slice(1),
      ],
      ["Date Range", `${data.dateRange.start} to ${data.dateRange.end}`],
      ["Province", data.province],
      ["Generated", data.generatedAt],
    ];
    const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
    XLSX.utils.book_append_sheet(workbook, infoSheet, "Info");

    // Data sheet based on report type
    let dataSheet;
    let sheetName;

    if (data.reportType === "summary") {
      const headers = ["Province", "Accidents", "Risk Score", "Predictions"];
      const rows = data.summaryData.map((row) => [
        row.province,
        row.accidents,
        row.risk_score,
        row.predictions,
      ]);
      dataSheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      sheetName = "Summary";
    } else if (data.reportType === "detailed") {
      const headers = ["Date", "Location", "Type", "Severity", "Time"];
      const rows = data.detailedData.map((row) => [
        row.date,
        row.location,
        row.type,
        row.severity,
        row.time,
      ]);
      dataSheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      sheetName = "Detailed";
    } else if (data.reportType === "trends") {
      const headers = ["Month", "Accidents", "Change"];
      const rows = data.trendsData.map((row) => [
        row.month,
        row.accidents,
        row.change,
      ]);
      dataSheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      sheetName = "Trends";
    } else {
      const headers = ["Metric", "Value"];
      const rows = data.predictionsData.map((row) => [row.metric, row.value]);
      dataSheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      sheetName = "Predictions";
    }

    XLSX.utils.book_append_sheet(workbook, dataSheet, sheetName);

    // Save
    const fileName = `${data.reportType}_report_${data.dateRange.start}_${data.dateRange.end}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const reportData = generateReportData(
      selectedReport,
      dateRange,
      selectedProvince,
    );

    if (exportFormat === "pdf") {
      generatePDF(reportData);
    } else {
      generateExcel(reportData);
    }

    setIsGenerating(false);
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
                    <Button
                      variant="outline"
                      size="sm"
                      className={`gap-2 ${exportFormat === "pdf" ? "bg-red-500 text-white border-red-500 hover:bg-red-600 hover:text-white" : "hover:bg-red-50 hover:text-red-600 hover:border-red-300"}`}
                      onClick={() => setExportFormat("pdf")}
                    >
                      <File className="h-4 w-4" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`gap-2 ${exportFormat === "excel" ? "bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white" : "hover:bg-green-50 hover:text-green-600 hover:border-green-300"}`}
                      onClick={() => setExportFormat("excel")}
                    >
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
