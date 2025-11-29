import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Car, AlertTriangle, Clock } from "lucide-react";

interface VehicleHourData {
  vehicle_type: string;
  hour: number;
  count: number;
}

interface Props {
  data: VehicleHourData[];
  language: "en" | "th";
}

// Vehicle type color palette
const VEHICLE_COLORS = [
  "#2563EB", // Blue
  "#DC2626", // Red
  "#16A34A", // Green
  "#EA580C", // Orange
  "#7C3AED", // Purple
  "#0891B2", // Cyan
  "#CA8A04", // Yellow
  "#DB2777", // Pink
  "#059669", // Emerald
  "#4F46E5", // Indigo
  "#9333EA", // Violet
  "#0D9488", // Teal
  "#F59E0B", // Amber
];

// Vehicle name translations
const vehicleNameMap: Record<string, { en: string; th: string }> = {
  "รถจักรยานยนต์": { en: "Motorcycle", th: "รถจักรยานยนต์" },
  "รถยนต์นั่งส่วนบุคคล/รถยนต์นั่งสาธารณะ": { en: "Private/Public Car", th: "รถยนต์นั่งส่วนบุคคล/รถยนต์นั่งสาธารณะ" },
  "รถปิคอัพโดยสาร": { en: "Passenger Pickup", th: "รถปิคอัพโดยสาร" },
  "รถปิคอัพบรรทุก 4 ล้อ": { en: "4-Wheel Pickup", th: "รถปิคอัพบรรทุก 4 ล้อ" },
  "รถตู้": { en: "Van", th: "รถตู้" },
  "รถบรรทุก 6 ล้อ": { en: "6-Wheel Truck", th: "รถบรรทุก 6 ล้อ" },
  "รถบรรทุกมากกว่า 6 ล้อ ไม่เกิน 10 ล้อ": { en: "6-10 Wheel Truck", th: "รถบรรทุกมากกว่า 6 ล้อ ไม่เกิน 10 ล้อ" },
  "รถบรรทุกมากกว่า 10 ล้อ (รถพ่วง)": { en: "10+ Wheel Truck", th: "รถบรรทุกมากกว่า 10 ล้อ (รถพ่วง)" },
  "รถโดยสารขนาดใหญ่": { en: "Large Bus", th: "รถโดยสารขนาดใหญ่" },
  "รถสามล้อเครื่อง": { en: "Tricycle", th: "รถสามล้อเครื่อง" },
  "รถอีแต๋น/เพื่อการเกษตร": { en: "E-taen/Agricultural", th: "รถอีแต๋น/เพื่อการเกษตร" },
  "รถจักรยาน": { en: "Bicycle", th: "รถจักรยาน" },
  "คนเดินเท้า": { en: "Pedestrian", th: "คนเดินเท้า" },
};

export function VehicleByHourChart({ data, language }: Props) {
  // Process data: aggregate by vehicle type across all hours
  const vehicleData = useMemo(() => {
    const aggregated: Record<string, number> = {};

    data.forEach((item) => {
      if (aggregated[item.vehicle_type]) {
        aggregated[item.vehicle_type] += item.count;
      } else {
        aggregated[item.vehicle_type] = item.count;
      }
    });

    return Object.entries(aggregated)
      .map(([vehicle, count]) => ({
        vehicle_type: vehicle,
        name: language === "en"
          ? vehicleNameMap[vehicle]?.en || vehicle
          : vehicleNameMap[vehicle]?.th || vehicle,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 vehicles
  }, [data, language]);

  // Find peak hour for each vehicle type
  const peakHours = useMemo(() => {
    const peaks: Record<string, { hour: number; count: number }> = {};

    data.forEach((item) => {
      if (!peaks[item.vehicle_type] || item.count > peaks[item.vehicle_type].count) {
        peaks[item.vehicle_type] = { hour: item.hour, count: item.count };
      }
    });

    return peaks;
  }, [data]);

  // Find top 3 most dangerous vehicle types
  const topDangerous = vehicleData.slice(0, 3);

  // Calculate statistics
  const totalAccidents = vehicleData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="shadow-lg border border-gray-200">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="text-base flex items-center gap-2">
          <Car className="h-5 w-5 text-blue-600" />
          <span className="text-lg font-semibold text-gray-900">
            {language === "en" ? "Accidents by Vehicle Type" : "อุบัติเหตุตามประเภทรถ"}
          </span>
        </CardTitle>
        <CardDescription>
          {language === "en"
            ? "Distribution of vehicle types involved in accidents"
            : "การกระจายของประเภทรถที่เกี่ยวข้องกับอุบัติเหตุ"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {topDangerous.map((item, index) => {
            const peak = peakHours[item.vehicle_type];
            const percentage = ((item.count / totalAccidents) * 100).toFixed(1);

            return (
              <div
                key={item.vehicle_type}
                className={`p-3 rounded-lg border-2 ${
                  index === 0
                    ? "bg-red-50 border-red-300"
                    : index === 1
                      ? "bg-orange-50 border-orange-300"
                      : "bg-yellow-50 border-yellow-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle
                    className={`h-4 w-4 ${
                      index === 0
                        ? "text-red-600"
                        : index === 1
                          ? "text-orange-600"
                          : "text-yellow-600"
                    }`}
                  />
                  <span className="text-xs font-semibold text-gray-700">
                    {language === "en"
                      ? `#${index + 1} Highest Risk`
                      : `#${index + 1} เสี่ยงสูงสุด`}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900 truncate" title={item.name}>
                  {item.name.length > 18 ? item.name.substring(0, 18) + "..." : item.name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600">
                    {language === "en" ? "Peak:" : "ช่วงเสี่ยง:"} {peak?.hour}:00
                  </span>
                </div>
                <div className="mt-2 flex justify-between items-end">
                  <span className="text-lg font-bold text-gray-900">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-gray-600">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pie Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={vehicleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                }
                outerRadius={100}
                innerRadius={60}
                paddingAngle={2}
                dataKey="count"
              >
                {vehicleData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={VEHICLE_COLORS[index % VEHICLE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: any) => [
                  `${value.toLocaleString()} ${language === "en" ? "accidents" : "อุบัติเหตุ"}`,
                  props.payload.name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto">
          {vehicleData.map((item, index) => (
            <div key={item.vehicle_type} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: VEHICLE_COLORS[index % VEHICLE_COLORS.length] }}
              />
              <span className="truncate" title={item.name}>
                {item.name}
              </span>
              <span className="text-gray-500 ml-auto">
                {((item.count / totalAccidents) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
