import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "~/components/layout/Header";
import { Footer } from "~/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
} from "lucide-react";
import { accidents, riskLocations, severityLabels } from "~/lib/mock-data";
import { useLanguage } from "~/contexts/LanguageContext";
import { ProtectedRoute } from "~/components/ProtectedRoute";

export const Route = createFileRoute("/history")({
  component: () => (
    <ProtectedRoute>
      <HistoryPage />
    </ProtectedRoute>
  ),
});

function HistoryPage() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Combine accidents with location data
  const accidentHistory = accidents.map((accident) => {
    const location = riskLocations.find(
      (loc) => loc.id === accident.location_id,
    );
    return {
      ...accident,
      location_name_en: location?.name_en || "Unknown",
      location_name_th: location?.name_th || "ไม่ทราบ",
    };
  });

  // Filter data
  const filteredData = accidentHistory.filter((item) => {
    const matchesSearch =
      item.location_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location_name_th.includes(searchTerm);
    const matchesSeverity =
      filterSeverity === "all" || item.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "en" ? "en-US" : "th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalCasualties = (accident: (typeof accidents)[0]) => {
    return (
      accident.casualties_minor +
      accident.casualties_serious +
      accident.casualties_fatal
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {language === "en" ? "Historical Data" : "ข้อมูลประวัติ"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "en"
              ? "Browse and analyze past accident records"
              : "เรียกดูและวิเคราะห์ข้อมูลอุบัติเหตุในอดีต"}
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={
                    language === "en"
                      ? "Search by location..."
                      : "ค้นหาตามสถานที่..."
                  }
                  className="w-full pl-9 pr-4 py-2 rounded-md border bg-background text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  className="px-3 py-2 rounded-md border bg-background text-sm"
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <option value="all">
                    {language === "en" ? "All Severity" : "ทุกระดับ"}
                  </option>
                  <option value="low">
                    {language === "en" ? "Low" : "น้อย"}
                  </option>
                  <option value="medium">
                    {language === "en" ? "Medium" : "ปานกลาง"}
                  </option>
                  <option value="high">
                    {language === "en" ? "High" : "สูง"}
                  </option>
                </select>
              </div>

              {/* Export Button */}
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                {language === "en" ? "Export" : "ส่งออก"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {language === "en" ? "Accident Records" : "บันทึกอุบัติเหตุ"}
              <span className="text-muted-foreground font-normal ml-2">
                ({filteredData.length}{" "}
                {language === "en" ? "records" : "รายการ"})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {language === "en" ? "Location" : "สถานที่"}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {language === "en" ? "Date & Time" : "วันที่และเวลา"}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {language === "en" ? "Severity" : "ความรุนแรง"}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {language === "en" ? "Weather" : "สภาพอากาศ"}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {language === "en" ? "Casualties" : "ผู้บาดเจ็บ"}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {language === "en" ? "Factors" : "ปัจจัย"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((accident) => (
                    <tr
                      key={accident.id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {language === "en"
                              ? accident.location_name_en
                              : accident.location_name_th}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(accident.occurred_at)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            accident.severity === "high"
                              ? "danger"
                              : accident.severity === "medium"
                                ? "warning"
                                : "success"
                          }
                        >
                          {language === "en"
                            ? severityLabels[
                                accident.severity as keyof typeof severityLabels
                              ].en
                            : severityLabels[
                                accident.severity as keyof typeof severityLabels
                              ].th}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm capitalize">
                          {accident.weather}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <span className="font-medium">
                            {getTotalCasualties(accident)}
                          </span>
                          <span className="text-muted-foreground text-xs ml-1">
                            ({accident.casualties_minor}m,{" "}
                            {accident.casualties_serious}s,{" "}
                            {accident.casualties_fatal}f)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {accident.factors.slice(0, 2).map((factor) => (
                            <Badge
                              key={factor}
                              variant="secondary"
                              className="text-xs"
                            >
                              {factor.replace(/_/g, " ")}
                            </Badge>
                          ))}
                          {accident.factors.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{accident.factors.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "Page" : "หน้า"} {currentPage}{" "}
                  {language === "en" ? "of" : "จาก"} {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
