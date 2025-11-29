import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Header } from "~/components/layout/Header";
import { Footer } from "~/components/layout/Footer";
import { Button } from "~/components/ui/button";
import {
  FileSpreadsheet,
  AlertTriangle,
  Search,
  Calendar as CalendarIcon,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  FileDown,
} from "lucide-react";
import { useLanguage } from "~/contexts/LanguageContext";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { RecordsSkeleton } from "~/components/RecordsSkeleton";

export const Route = createFileRoute("/records")({
  component: () => (
    <ProtectedRoute>
      <ReportsPage />
    </ProtectedRoute>
  ),
});

const EVENT_CATEGORIES = [
  { id: "accident", label: "อุบัติเหตุ", color: "#dc2626" },
  { id: "construction", label: "ก่อสร้าง", color: "#f59e0b" },
  { id: "congestion", label: "รถติด", color: "#eab308" },
  { id: "flooding", label: "น้ำท่วม", color: "#3b82f6" },
  { id: "fire", label: "เพลิงไหม้", color: "#dc2626" },
  { id: "breakdown", label: "รถเสีย", color: "#f97316" },
  { id: "road_closed", label: "ถนนปิด", color: "#ef4444" },
  { id: "diversion", label: "เบี่ยงจราจร", color: "#8b5cf6" },
  { id: "roadwork", label: "ซ่อมถนน", color: "#fb923c" },
  { id: "other", label: "อื่นๆ", color: "#6b7280" },
];

interface TrafficEvent {
  id: string;
  title: string;
  description: string;
  lat: number;
  lon: number;
  category: string;
  severity: number;
  pubDate: string;
  location?: string;
  source: string;
  year?: number;
}

function ReportsPage() {
  const { t } = useLanguage();

  // Event search states
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCSV, setLoadingCSV] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  // Set default date range to 1 month
  const getDefaultDates = () => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    return {
      start: oneMonthAgo,
      end: today,
    };
  };

  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState<Date>(defaultDates.start);
  const [endDate, setEndDate] = useState<Date>(defaultDates.end);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [perPage, setPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load events on initial mount
  useEffect(() => {
    if (isInitialLoad) {
      handleSearch();
      setIsInitialLoad(false);
    }
  }, []);

  // Reload data when perPage changes (reset to page 1)
  useEffect(() => {
    if (hasSearched && !isInitialLoad) {
      loadPage(1);
    }
  }, [perPage]);

  // Helper function to format date for API
  const formatDateForAPI = (date: Date) => {
    return format(date, "yyyy-MM-dd");
  };

  // Function to load events - called when search button is clicked or initial load
  const handleSearch = async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      setCurrentPage(1);
      setHasSearched(true);

      // Use server-side filtering with date range
      await loadPage(1);

      setLoading(false);
    } catch (error) {
      console.error("Error loading events:", error);
      setLoading(false);
    }
  };

  // Load specific page with server-side pagination
  const loadPage = async (page: number) => {
    if (!startDate || !endDate) return;

    const totalPages = Math.ceil(totalEvents / perPage);
    if (totalPages > 0 && (page < 1 || page > totalPages)) return;

    try {
      setLoading(true);

      // Build query parameters for server-side filtering
      const params = new URLSearchParams({
        start_date: formatDateForAPI(startDate),
        end_date: formatDateForAPI(endDate),
        limit: perPage.toString(),
        offset: ((page - 1) * perPage).toString(),
      });

      // Add category filter if not "all"
      if (selectedCategory !== "all") {
        params.append("event_types", selectedCategory);
      }

      const response = await fetch(
        `http://localhost:10000/events/database?${params}`,
      );
      const data = await response.json();

      if (data.events) {
        setEvents(data.events);
        setTotalEvents(data.total || data.events.length);
        setCurrentPage(page);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading page:", error);
      setLoading(false);
    }
  };

  // Export all filtered events to CSV using Backend endpoint
  const handleExportCSV = async () => {
    if (totalEvents === 0) return;

    try {
      setLoadingCSV(true);

      // Build URL for backend CSV export endpoint
      const params = new URLSearchParams({
        start_date: formatDateForAPI(startDate),
        end_date: formatDateForAPI(endDate),
      });

      if (selectedCategory !== "all") {
        params.append("event_types", selectedCategory);
      }

      // Trigger download via backend endpoint (no limit!)
      const url = `http://localhost:10000/events/export-csv?${params}`;

      // Create hidden link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `traffic_events_${formatDateForAPI(startDate)}_${formatDateForAPI(endDate)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Add a small delay to show loading state
      setTimeout(() => {
        setLoadingCSV(false);
      }, 1000);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      setLoadingCSV(false);
    }
  };

  // Export all filtered events to XLSX using Backend endpoint
  const handleExportXLSX = async () => {
    if (totalEvents === 0) return;

    try {
      setLoadingExcel(true);

      // Build URL for backend Excel export endpoint
      const params = new URLSearchParams({
        start_date: formatDateForAPI(startDate),
        end_date: formatDateForAPI(endDate),
      });

      if (selectedCategory !== "all") {
        params.append("event_types", selectedCategory);
      }

      // Trigger download via backend endpoint (no limit!)
      const url = `http://localhost:10000/events/export-excel?${params}`;

      // Create hidden link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `traffic_events_${formatDateForAPI(startDate)}_${formatDateForAPI(endDate)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Add a small delay to show loading state
      setTimeout(() => {
        setLoadingExcel(false);
      }, 1000);
    } catch (error) {
      console.error("Error exporting XLSX:", error);
      setLoadingExcel(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show skeleton on initial load
  if (isInitialLoad && loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
          <RecordsSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Search className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t("reports.title")}
                </h1>
                <p className="text-gray-600 mt-1">{t("reports.subtitle")}</p>
              </div>
            </div>
          </div>

          {/* Event Search View */}
          <div className="space-y-6">
            {/* Search Filters */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("reports.filters")}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Date Range with Manual Input + Calendar */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                    {t("reports.reportedDate")}
                  </label>
                  <div className="flex gap-3 items-center flex-wrap">
                    {/* Start Date */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 items-center">
                        <input
                          type="number"
                          value={startDate.getDate()}
                          onChange={(e) => {
                            const newDate = new Date(startDate);
                            newDate.setDate(Number(e.target.value) || 1);
                            setStartDate(newDate);
                          }}
                          placeholder="วัน"
                          className="w-14 px-2 py-2 text-sm border border-gray-300 rounded-md text-center hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          min="1"
                          max="31"
                        />
                        <select
                          value={startDate.getMonth()}
                          onChange={(e) => {
                            const newDate = new Date(startDate);
                            newDate.setMonth(Number(e.target.value));
                            setStartDate(newDate);
                          }}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>
                              {new Date(2024, i).toLocaleDateString("th-TH", {
                                month: "short",
                              })}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={startDate.getFullYear() + 543}
                          onChange={(e) => {
                            const newDate = new Date(startDate);
                            newDate.setFullYear(
                              Number(e.target.value) - 543 || 2024,
                            );
                            setStartDate(newDate);
                          }}
                          placeholder="ปี"
                          className="w-20 px-2 py-2 text-sm border border-gray-300 rounded-md text-center hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 hover:bg-blue-50 hover:border-blue-400 transition-all"
                          >
                            <CalendarIcon className="h-4 w-4 text-blue-600" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => date && setStartDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <span className="text-gray-500 font-medium">
                      {t("reports.to")}
                    </span>

                    {/* End Date */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 items-center">
                        <input
                          type="number"
                          value={endDate.getDate()}
                          onChange={(e) => {
                            const newDate = new Date(endDate);
                            newDate.setDate(Number(e.target.value) || 1);
                            setEndDate(newDate);
                          }}
                          placeholder="วัน"
                          className="w-14 px-2 py-2 text-sm border border-gray-300 rounded-md text-center hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          min="1"
                          max="31"
                        />
                        <select
                          value={endDate.getMonth()}
                          onChange={(e) => {
                            const newDate = new Date(endDate);
                            newDate.setMonth(Number(e.target.value));
                            setEndDate(newDate);
                          }}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>
                              {new Date(2024, i).toLocaleDateString("th-TH", {
                                month: "short",
                              })}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={endDate.getFullYear() + 543}
                          onChange={(e) => {
                            const newDate = new Date(endDate);
                            newDate.setFullYear(
                              Number(e.target.value) - 543 || 2024,
                            );
                            setEndDate(newDate);
                          }}
                          placeholder="ปี"
                          className="w-20 px-2 py-2 text-sm border border-gray-300 rounded-md text-center hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 hover:bg-blue-50 hover:border-blue-400 transition-all"
                          >
                            <CalendarIcon className="h-4 w-4 text-blue-600" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => date && setEndDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Other Filters in Second Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("reports.eventType")}
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="all">{t("reports.allTypes")}</option>
                      {EVENT_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Per Page */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("reports.perPage")}
                    </label>
                    <select
                      value={perPage}
                      onChange={(e) => setPerPage(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={500}>500</option>
                      <option value={1000}>1,000</option>
                    </select>
                  </div>

                  {/* Search Button */}
                  <div className="flex items-end">
                    <button
                      onClick={handleSearch}
                      disabled={loading}
                      className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {t("reports.searching")}
                        </>
                      ) : (
                        <>
                          <Search className="h-5 w-5" />
                          {t("reports.search")}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Summary and Export */}
            {hasSearched && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  {/* Results Summary */}
                  <div className="flex items-center gap-5">
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                      <FileSpreadsheet className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                        {t("reports.searchResults") || "ผลการค้นหา"}
                      </p>
                      <p className="text-4xl font-bold text-gray-900">
                        {totalEvents.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(startDate, "d MMM yyyy", { locale: th })} -{" "}
                        {format(endDate, "d MMM yyyy", { locale: th })}
                      </p>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  {totalEvents > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        {t("reports.exportData")} (
                        {totalEvents.toLocaleString()} {t("common.records")})
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {/* CSV Button */}
                        <button
                          onClick={handleExportCSV}
                          disabled={loadingCSV}
                          className="group relative px-6 py-3.5 bg-white border-2 border-emerald-500 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 hover:border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                              {loadingCSV ? (
                                <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
                              ) : (
                                <Download className="h-5 w-5 text-emerald-600" />
                              )}
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-bold text-emerald-700">
                                {t("reports.exportCSV")}
                              </div>
                              <div className="text-xs text-emerald-600">
                                {t("reports.csvFormat")}
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* XLSX Button */}
                        <button
                          onClick={handleExportXLSX}
                          disabled={loadingExcel}
                          className="group relative px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                              {loadingExcel ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <FileDown className="h-5 w-5" />
                              )}
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-bold">
                                {t("reports.exportExcel")}
                              </div>
                              <div className="text-xs opacity-90">
                                {t("reports.excelFormat")}
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Events Table */}
            {hasSearched && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        {t("reports.index")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        {t("reports.reportedAt")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        {t("reports.type")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        {t("reports.eventTitle")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        {t("reports.reporter")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-gray-600">
                              {t("reports.loading")}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : events.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="p-4 bg-gray-100 rounded-full">
                              <Search className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium">
                              {t("reports.noResults")}
                            </p>
                            <p className="text-sm text-gray-500">
                              {t("reports.noResultsDesc")}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      events.map((event, index) => {
                        const category = EVENT_CATEGORIES.find(
                          (c) => c.id === event.category,
                        );
                        const globalIndex =
                          (currentPage - 1) * perPage + index + 1;
                        return (
                          <tr
                            key={event.id}
                            className="hover:bg-blue-50 transition-colors duration-150"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                                {globalIndex}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {formatDateTime(event.pubDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                                style={{
                                  backgroundColor: `${category?.color}20`,
                                  color: category?.color,
                                  border: `1px solid ${category?.color}40`,
                                }}
                              >
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {category?.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="font-semibold text-gray-900">
                                {event.title}
                              </div>
                              {event.location && (
                                <div className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  {event.location}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                                {event.source}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {!loading && totalEvents > 0 && (
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-600 font-medium">
                        {t("reports.showing")}{" "}
                        <span className="text-blue-600 font-semibold">
                          {(currentPage - 1) * perPage + 1}
                        </span>{" "}
                        -{" "}
                        <span className="text-blue-600 font-semibold">
                          {Math.min(currentPage * perPage, totalEvents)}
                        </span>{" "}
                        {t("reports.from")}{" "}
                        <span className="text-blue-600 font-semibold">
                          {totalEvents.toLocaleString()}
                        </span>{" "}
                        {t("reports.results")}
                      </div>
                      <div className="flex gap-1">
                        {/* First Page Button */}
                        <button
                          onClick={() => loadPage(1)}
                          disabled={currentPage === 1}
                          className="p-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="หน้าแรก"
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </button>

                        {/* Previous Button */}
                        <button
                          onClick={() => loadPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="p-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="ก่อนหน้า"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        {/* Page Numbers */}
                        {(() => {
                          const totalPages = Math.ceil(totalEvents / perPage);
                          const pages = [];
                          const maxVisible = 5;

                          let startPage = Math.max(
                            1,
                            currentPage - Math.floor(maxVisible / 2),
                          );
                          let endPage = Math.min(
                            totalPages,
                            startPage + maxVisible - 1,
                          );

                          if (endPage - startPage < maxVisible - 1) {
                            startPage = Math.max(1, endPage - maxVisible + 1);
                          }

                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => loadPage(i)}
                                className={`min-w-[2.5rem] px-3 py-2 border rounded-lg text-sm font-semibold transition-all ${
                                  i === currentPage
                                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-md"
                                    : "border-gray-300 text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-300"
                                }`}
                              >
                                {i}
                              </button>,
                            );
                          }

                          return pages;
                        })()}

                        {/* Next Button */}
                        <button
                          onClick={() => loadPage(currentPage + 1)}
                          disabled={
                            currentPage === Math.ceil(totalEvents / perPage)
                          }
                          className="p-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="ถัดไป"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        {/* Last Page Button */}
                        <button
                          onClick={() =>
                            loadPage(Math.ceil(totalEvents / perPage))
                          }
                          disabled={
                            currentPage === Math.ceil(totalEvents / perPage)
                          }
                          className="p-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="หน้าสุดท้าย"
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
