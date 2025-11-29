import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface TrafficDataPoint {
  timestamp: number;
  datetime: string;
  index: number;
}

interface TrafficIndexData {
  current: number;
  average_24h: number;
  data: TrafficDataPoint[];
  total_records: number;
}

export function TrafficIndexChart() {
  const [trafficData, setTrafficData] = useState<TrafficIndexData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrafficIndex = async () => {
      try {
        const response = await fetch('http://localhost:10000/traffic/index');
        if (response.ok) {
          const data = await response.json();
          setTrafficData(data);
        }
      } catch (error) {
        console.error('Error fetching traffic index:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrafficIndex();
    // Refresh every 5 minutes
    const interval = setInterval(fetchTrafficIndex, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            ดัชนีจราจร Bangkok
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">กำลังโหลด...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trafficData || trafficData.total_records === 0) {
    return null;
  }

  const current = trafficData.current;
  const average = trafficData.average_24h;
  const trend = current > average ? 'up' : 'down';
  const trendPercent = Math.abs(((current - average) / average) * 100).toFixed(1);

  // Get status based on index value
  const getStatus = (index: number) => {
    if (index < 2.5) return { text: 'ว่าง', color: 'text-green-600', bg: 'bg-green-100' };
    if (index < 4) return { text: 'ปานกลาง', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (index < 5.5) return { text: 'ติดหนาแน่น', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: 'ติดมาก', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const status = getStatus(current);

  // Prepare data for mini chart (last 24 hours)
  const chartData = trafficData.data.slice(-48); // Last 4 hours (5min intervals)
  const maxIndex = Math.max(...chartData.map(d => d.index));
  const minIndex = Math.min(...chartData.map(d => d.index));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          ดัชนีจราจร Bangkok (Real-time)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Index */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ค่าปัจจุบัน</p>
              <p className="text-4xl font-bold">{current.toFixed(2)}</p>
              <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                {status.text}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">เฉลี่ย 24 ชม.</p>
              <p className="text-2xl font-semibold text-gray-700">{average}</p>
              <div className={`flex items-center gap-1 mt-1 ${trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-xs font-medium">{trendPercent}%</span>
              </div>
            </div>
          </div>

          {/* Mini Chart - SVG */}
          <div className="relative h-24 w-full bg-gray-50 rounded-lg p-2">
            <svg width="100%" height="100%" viewBox="0 0 400 80" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="20" x2="400" y2="20" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="40" x2="400" y2="40" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="60" x2="400" y2="60" stroke="#e5e7eb" strokeWidth="1" />

              {/* Line chart */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points={chartData.map((point, i) => {
                  const x = (i / (chartData.length - 1)) * 400;
                  const y = 80 - ((point.index - minIndex) / (maxIndex - minIndex)) * 70 - 5;
                  return `${x},${y}`;
                }).join(' ')}
              />

              {/* Fill area */}
              <polygon
                fill="rgba(59, 130, 246, 0.1)"
                points={[
                  ...chartData.map((point, i) => {
                    const x = (i / (chartData.length - 1)) * 400;
                    const y = 80 - ((point.index - minIndex) / (maxIndex - minIndex)) * 70 - 5;
                    return `${x},${y}`;
                  }),
                  `400,80`,
                  `0,80`
                ].join(' ')}
              />
            </svg>
            <div className="absolute bottom-1 left-2 text-xs text-gray-500">4 ชม.ที่ผ่านมา</div>
            <div className="absolute bottom-1 right-2 text-xs text-gray-500">ตอนนี้</div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="h-2 w-full bg-green-500 rounded mb-1"></div>
              <span className="text-gray-600">&lt; 2.5</span>
            </div>
            <div className="text-center">
              <div className="h-2 w-full bg-yellow-500 rounded mb-1"></div>
              <span className="text-gray-600">2.5-4</span>
            </div>
            <div className="text-center">
              <div className="h-2 w-full bg-orange-500 rounded mb-1"></div>
              <span className="text-gray-600">4-5.5</span>
            </div>
            <div className="text-center">
              <div className="h-2 w-full bg-red-500 rounded mb-1"></div>
              <span className="text-gray-600">&gt; 5.5</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
