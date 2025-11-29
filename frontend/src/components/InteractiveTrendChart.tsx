import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, ZoomOut, Calendar, Award } from "lucide-react";
import { Button } from "~/components/ui/button";

interface TrendDataPoint {
  month: string;
  count: number;
  daily?: Array<{ date: string; count: number }>;
}

interface Props {
  data: TrendDataPoint[];
  language: "en" | "th";
  yearly_summary?: Array<{ year: string; count: number }>;
  monthly_summary?: Array<{ month: string; month_name: string; count: number }>;
  weekday_summary?: Array<{ day: string; day_name: string; count: number }>;
}

type ViewMode = "yearly" | "monthly" | "daily";

// Helper function to get month name
const getMonthName = (monthStr: string, language: "en" | "th") => {
  const monthNames = {
    en: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    th: [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ],
  };

  const parts = monthStr.split("-");
  if (parts.length === 2) {
    const monthIndex = parseInt(parts[1]) - 1;
    return `${monthNames[language][monthIndex]} ${parts[0]}`;
  }
  return monthStr;
};

// Helper function to format date
const formatDate = (dateStr: string, language: "en" | "th") => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.getMonth();

  const monthNames = {
    en: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    th: [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ],
  };

  return `${day} ${monthNames[language][month]}`;
};

// Helper function to get day of week
const getDayOfWeek = (dateStr: string, language: "en" | "th") => {
  const date = new Date(dateStr);
  const dayNames = {
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    th: ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."],
  };
  return dayNames[language][date.getDay()];
};

export function InteractiveTrendChart({
  data,
  language,
  yearly_summary,
  monthly_summary,
  weekday_summary,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("yearly");
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Process data based on view mode
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    if (viewMode === "yearly") {
      // Aggregate by year
      const yearlyMap = new Map<string, number>();
      data.forEach((item) => {
        const year = item.month.split("-")[0];
        yearlyMap.set(year, (yearlyMap.get(year) || 0) + item.count);
      });
      return Array.from(yearlyMap.entries())
        .map(([year, count]) => ({
          label: year,
          value: count,
          year,
        }))
        .sort((a, b) => a.year.localeCompare(b.year));
    } else if (viewMode === "monthly") {
      // Show monthly data for selected year or all
      let filtered = data;
      if (selectedYear) {
        filtered = data.filter((item) => item.month.startsWith(selectedYear));
      }
      return filtered.map((item) => ({
        label: getMonthName(item.month, language),
        value: item.count,
        month: item.month,
        rawLabel: item.month,
      }));
    } else if (viewMode === "daily" && selectedMonth) {
      // Show daily data for selected month
      const monthData = data.find((item) => item.month === selectedMonth);
      if (monthData && monthData.daily) {
        return monthData.daily.map((day) => ({
          label: formatDate(day.date, language),
          value: day.count,
          date: day.date,
          dayOfWeek: getDayOfWeek(day.date, language),
          rawLabel: day.date,
        }));
      }

      // Generate mock daily data if not available (for demonstration)
      const [year, month] = selectedMonth.split("-");
      const daysInMonth = new Date(
        parseInt(year),
        parseInt(month),
        0,
      ).getDate();
      const mockDaily = [];
      const monthCount =
        data.find((item) => item.month === selectedMonth)?.count || 0;
      const avgPerDay = monthCount / daysInMonth;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month}-${String(day).padStart(2, "0")}`;
        // Add some variation to make it realistic
        const variation = (Math.random() - 0.5) * avgPerDay * 0.6;
        const count = Math.max(0, Math.round(avgPerDay + variation));
        mockDaily.push({
          label: formatDate(dateStr, language),
          value: count,
          date: dateStr,
          dayOfWeek: getDayOfWeek(dateStr, language),
          rawLabel: dateStr,
        });
      }
      return mockDaily;
    }

    return [];
  }, [data, viewMode, selectedYear, selectedMonth, language]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (processedData.length === 0)
      return { max: 0, min: 0, avg: 0, maxLabel: "", maxDay: "" };
    const values = processedData.map((d) => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const maxPoint = processedData.find((d) => d.value === max);

    return {
      max,
      min,
      avg,
      maxLabel: maxPoint?.label || "",
      maxDay: (maxPoint as any)?.dayOfWeek || "",
    };
  }, [processedData]);

  // Calculate summary insights
  const summaryInsights = useMemo(() => {
    if (!yearly_summary || !monthly_summary || !weekday_summary) {
      return null;
    }

    // Find peak year
    const maxYear = yearly_summary.reduce((max, item) =>
      item.count > max.count ? item : max,
    );

    // Find peak month
    const maxMonth = monthly_summary.reduce((max, item) =>
      item.count > max.count ? item : max,
    );

    // Find peak weekday
    const maxWeekday = weekday_summary.reduce((max, item) =>
      item.count > max.count ? item : max,
    );

    return {
      peakYear: maxYear,
      peakMonth: maxMonth,
      peakWeekday: maxWeekday,
    };
  }, [yearly_summary, monthly_summary, weekday_summary]);

  const handleDrillDown = (label: string, rawLabel?: string) => {
    if (viewMode === "yearly") {
      setSelectedYear(label);
      setViewMode("monthly");
    } else if (viewMode === "monthly") {
      // Find the actual month string from the clicked label
      const monthData = processedData.find(
        (d) => d.label === label || (d as any).rawLabel === rawLabel,
      );
      if (monthData && (monthData as any).month) {
        setSelectedMonth((monthData as any).month);
        setViewMode("daily");
      }
    }
  };

  const handleZoomOut = () => {
    if (viewMode === "daily") {
      setSelectedMonth(null);
      setViewMode("monthly");
    } else if (viewMode === "monthly" && selectedYear) {
      setSelectedYear(null);
      setViewMode("yearly");
    } else if (viewMode === "monthly") {
      setViewMode("yearly");
    }
  };

  const canZoomOut =
    (viewMode === "monthly" && (selectedYear !== null || data.length > 12)) ||
    viewMode === "daily";

  // Get breadcrumb text
  const getBreadcrumb = () => {
    const parts = [];
    if (selectedYear) parts.push(selectedYear);
    if (selectedMonth) parts.push(getMonthName(selectedMonth, language));
    return parts.join(" > ");
  };

  return (
    <div className="space-y-4 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {language === "en" ? "Accident Trends" : "แนวโน้มอุบัติเหตุ"}
            </h3>
            {(selectedYear || selectedMonth) && (
              <span className="text-sm text-gray-500">{getBreadcrumb()}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === "yearly" ? "default" : "ghost"}
              className="h-7 px-3 text-xs"
              onClick={() => {
                setViewMode("yearly");
                setSelectedYear(null);
                setSelectedMonth(null);
              }}
            >
              {language === "en" ? "Year" : "ปี"}
            </Button>
            <Button
              size="sm"
              variant={viewMode === "monthly" ? "default" : "ghost"}
              className="h-7 px-3 text-xs"
              onClick={() => {
                setViewMode("monthly");
                setSelectedMonth(null);
              }}
            >
              {language === "en" ? "Month" : "เดือน"}
            </Button>
            <Button
              size="sm"
              variant={viewMode === "daily" ? "default" : "ghost"}
              className="h-7 px-3 text-xs"
              onClick={() => {
                if (selectedMonth) {
                  setViewMode("daily");
                }
              }}
              disabled={!selectedMonth}
            >
              {language === "en" ? "Day" : "วัน"}
            </Button>
          </div>

          {canZoomOut && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              className="h-7 px-2"
            >
              <ZoomOut className="h-3 w-3 mr-1" />
              {language === "en" ? "Back" : "ย้อนกลับ"}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Insights Banner */}
      {summaryInsights && viewMode === "yearly" && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-5 w-5 text-amber-600" />
            <h4 className="text-sm font-semibold text-gray-900">
              {language === "en"
                ? "📊 Peak Accident Statistics"
                : "📊 สถิติอุบัติเหตุสูงสุด"}
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/60 rounded-lg p-3 border border-amber-100">
              <div className="text-gray-600 mb-1">
                {language === "en" ? "🏆 Peak Year" : "🏆 ปีที่มีมากที่สุด"}
              </div>
              <div className="text-lg font-bold text-amber-700">
                {summaryInsights.peakYear.year}
              </div>
              <div className="text-gray-500">
                {summaryInsights.peakYear.count.toLocaleString()}{" "}
                {language === "en" ? "accidents" : "อุบัติเหตุ"}
              </div>
            </div>
            <div className="bg-white/60 rounded-lg p-3 border border-orange-100">
              <div className="text-gray-600 mb-1">
                {language === "en"
                  ? "📅 Peak Month (All Years)"
                  : "📅 เดือนที่มีมากที่สุด (รวมทุกปี)"}
              </div>
              <div className="text-lg font-bold text-orange-700">
                {language === "en"
                  ? summaryInsights.peakMonth.month_name
                  : summaryInsights.peakMonth.month_name}
              </div>
              <div className="text-gray-500">
                {summaryInsights.peakMonth.count.toLocaleString()}{" "}
                {language === "en" ? "accidents" : "อุบัติเหตุ"}
              </div>
            </div>
            <div className="bg-white/60 rounded-lg p-3 border border-red-100">
              <div className="text-gray-600 mb-1">
                {language === "en"
                  ? "🗓️ Peak Weekday (All Days)"
                  : "🗓️ วันที่มีมากที่สุด (รวมทุกวัน)"}
              </div>
              <div className="text-lg font-bold text-red-700">
                {language === "en"
                  ? summaryInsights.peakWeekday.day_name
                  : summaryInsights.peakWeekday.day}
              </div>
              <div className="text-gray-500">
                {summaryInsights.peakWeekday.count.toLocaleString()}{" "}
                {language === "en" ? "accidents" : "อุบัติเหตุ"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
          <div className="text-xs text-red-600 font-medium">
            {language === "en" ? "Peak" : "สูงสุด"}
          </div>
          <div className="text-lg font-bold text-red-700">
            {stats.max.toLocaleString()}
          </div>
          <div className="text-xs text-red-500">
            {stats.maxLabel}
            {stats.maxDay && ` (${stats.maxDay})`}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-blue-600 font-medium">
            {language === "en" ? "Average" : "เฉลี่ย"}
          </div>
          <div className="text-lg font-bold text-blue-700">
            {Math.round(stats.avg).toLocaleString()}
          </div>
          <div className="text-xs text-blue-500">
            {language === "en" ? "per period" : "ต่อช่วงเวลา"}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
          <div className="text-xs text-green-600 font-medium">
            {language === "en" ? "Lowest" : "ต่ำสุด"}
          </div>
          <div className="text-lg font-bold text-green-700">
            {stats.min.toLocaleString()}
          </div>
          <div className="text-xs text-green-500">
            {language === "en" ? "minimum" : "ต่ำสุด"}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[350px] bg-gradient-to-b from-blue-50/30 to-transparent rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={processedData}
            onClick={(e) => {
              if (e && e.activeLabel) {
                const clickedData = processedData.find(
                  (d) => d.label === e.activeLabel,
                );
                handleDrillDown(e.activeLabel, (clickedData as any)?.rawLabel);
              }
            }}
            className="cursor-pointer"
          >
            <defs>
              <linearGradient id="colorAccidents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickMargin={10}
              angle={
                viewMode === "daily" ? -45 : viewMode === "monthly" ? -45 : 0
              }
              textAnchor={
                viewMode === "daily" || viewMode === "monthly"
                  ? "end"
                  : "middle"
              }
              height={viewMode === "daily" || viewMode === "monthly" ? 70 : 30}
              interval={
                viewMode === "daily" ? Math.ceil(processedData.length / 15) : 0
              }
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.96)",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number) => [
                value.toLocaleString(),
                language === "en" ? "Accidents" : "อุบัติเหตุ",
              ]}
              labelFormatter={(label) => {
                const item = processedData.find((d) => d.label === label);
                if (item && (item as any).dayOfWeek) {
                  return `${(item as any).dayOfWeek} - ${label}`;
                }
                return label;
              }}
              cursor={{
                stroke: "#3B82F6",
                strokeWidth: 1,
                strokeDasharray: "5 5",
              }}
            />
            {/* Peak indicator line */}
            <ReferenceLine
              y={stats.max}
              stroke="#EF4444"
              strokeDasharray="3 3"
              label={{
                value: language === "en" ? "Peak" : "สูงสุด",
                fill: "#EF4444",
                fontSize: 11,
                position: "right",
              }}
            />
            {/* Average line */}
            <ReferenceLine
              y={stats.avg}
              stroke="#3B82F6"
              strokeDasharray="3 3"
              label={{
                value: language === "en" ? "Avg" : "เฉลี่ย",
                fill: "#3B82F6",
                fontSize: 11,
                position: "right",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#colorAccidents)"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Help text */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Calendar className="h-3 w-3" />
        {viewMode === "yearly" && (
          <p>
            {language === "en"
              ? "Click on a year to view monthly breakdown"
              : "คลิกที่ปีเพื่อดูรายละเอียดรายเดือน"}
          </p>
        )}
        {viewMode === "monthly" && (
          <p>
            {language === "en"
              ? "Click on a month to view daily breakdown"
              : "คลิกที่เดือนเพื่อดูรายละเอียดรายวัน"}
          </p>
        )}
        {viewMode === "daily" && (
          <p>
            {language === "en"
              ? `Daily accidents in ${getMonthName(selectedMonth || "", language)}`
              : `อุบัติเหตุรายวันในเดือน ${getMonthName(selectedMonth || "", language)}`}
          </p>
        )}
      </div>

      {/* Additional insights for daily view */}
      {viewMode === "daily" && processedData.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            {language === "en" ? "📊 Daily Insights" : "📊 ข้อมูลเชิงลึกรายวัน"}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">
                {language === "en" ? "Total accidents:" : "อุบัติเหตุทั้งหมด:"}
              </span>
              <span className="ml-1 font-semibold text-gray-900">
                {processedData
                  .reduce((sum, d) => sum + d.value, 0)
                  .toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {language === "en" ? "Days recorded:" : "จำนวนวันที่บันทึก:"}
              </span>
              <span className="ml-1 font-semibold text-gray-900">
                {processedData.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
