'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area
} from 'recharts';

interface WeatherPoint {
  timestamp: string;
  timestamp_date: string;
  temperature: number;
  pressure: number;
  wind_speed: number;
  station_id: string;
  station_name: string;
}

export interface ChartData {
  temperature: WeatherPoint[];
  pressure: WeatherPoint[];
  wind: WeatherPoint[];
  summary: {
    totalPoints: number;
    stations: number;
    timeRange: {
      start: string;
      end: string;
    } | null;
  };
} interface WeatherChartsProps {
  data: ChartData;
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
];

export default function WeatherCharts({ data }: WeatherChartsProps) {
  // Performance logging
  const renderStart = performance.now();
  console.log('📊 [PERF] WeatherCharts render started');
  console.log(`📊 [PERF] Chart data points: ${data?.temperature?.length || 0}`);

  if (!data || data.temperature.length === 0) {
    console.log('📊 [PERF] WeatherCharts - no data, returning empty state');
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:bg-gray-800/60 hover:border-gray-600 transition-all duration-500 ease-out animate-in slide-in-from-left-8 duration-700">
        <p className="text-gray-400">No chart data available</p>
      </div>
    );
  }

  // Group data by station for multi-line charts
  const stationGroups = data.temperature.reduce((acc, point) => {
    if (!acc[point.station_id]) {
      acc[point.station_id] = {
        name: point.station_name,
        id: point.station_id,
        data: []
      };
    }
    acc[point.station_id].data.push(point);
    return acc;
  }, {} as Record<string, { name: string; id: string; data: WeatherPoint[] }>);

  const stations = Object.values(stationGroups);

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Prepare data for combined timeline chart
  const timelineData = data.temperature
    .slice(0, 100) // Limit points to avoid overcrowding
    .map(point => ({
      time: formatTime(point.timestamp),
      timestamp: point.timestamp,
      [`temp_${point.station_id}`]: point.temperature,
      [`pressure_${point.station_id}`]: point.pressure,
      [`wind_${point.station_id}`]: point.wind_speed,
      station: point.station_name
    }));

  // Log render completion
  setTimeout(() => {
    console.log(`📊 [PERF] WeatherCharts render completed in ${performance.now() - renderStart}ms`);
  }, 0);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 delay-200">
      {/* Summary Stats */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:bg-gray-800/60 hover:border-gray-600 transition-all duration-500 ease-out">
        <h3 className="text-xl font-semibold mb-4">Data Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="animate-in fade-in duration-700 delay-300 transition-transform duration-300">
            <div className="text-2xl font-bold text-blue-400">{data.summary.totalPoints}</div>
            <div className="text-gray-400">Total Readings</div>
          </div>
          <div className="animate-in fade-in duration-700 delay-400 transition-transform duration-300">
            <div className="text-2xl font-bold text-green-400">{data.summary.stations}</div>
            <div className="text-gray-400">Weather Stations</div>
          </div>
          <div className="animate-in fade-in duration-700 delay-500 transition-transform duration-300">
            <div className="text-2xl font-bold text-yellow-400">
              {data.summary.timeRange ?
                `${Math.round((new Date(data.summary.timeRange.end).getTime() - new Date(data.summary.timeRange.start).getTime()) / (1000 * 60 * 60))}h` :
                'N/A'}
            </div>
            <div className="text-gray-400">Time Span</div>
          </div>
        </div>
      </div>

      {/* Temperature Chart */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:bg-gray-800/60 hover:border-gray-600 transition-all duration-500 ease-out animate-in slide-in-from-left-8 duration-700">
        <h3 className="text-xl font-semibold mb-4">Temperature Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#9CA3AF"
              label={{ value: 'Temperature (°F)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#F3F4F6' }}
            />
            <Legend />
            {stations.map((station, index) => (
              <Line
                key={station.id}
                type="monotone"
                dataKey={`temp_${station.id}`}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
                name={station.name}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pressure Chart */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:bg-gray-800/60 hover:border-gray-600 transition-all duration-500 ease-out animate-in slide-in-from-left-8 duration-700">
        <h3 className="text-xl font-semibold mb-4">Atmospheric Pressure</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#9CA3AF"
              label={{ value: 'Pressure (mb)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#F3F4F6' }}
            />
            <Legend />
            {stations.map((station, index) => (
              <Area
                key={station.id}
                type="monotone"
                dataKey={`pressure_${station.id}`}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.3}
                name={station.name}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Wind Speed Chart */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:bg-gray-800/60 hover:border-gray-600 transition-all duration-500 ease-out animate-in slide-in-from-left-8 duration-700">
        <h3 className="text-xl font-semibold mb-4">Wind Speed</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#9CA3AF"
              label={{ value: 'Wind Speed (m/s)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#F3F4F6' }}
            />
            <Legend />
            {stations.map((station, index) => (
              <Line
                key={station.id}
                type="monotone"
                dataKey={`wind_${station.id}`}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 1 }}
                name={station.name}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Temperature vs Pressure Scatter */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:bg-gray-800/60 hover:border-gray-600 transition-all duration-500 ease-out animate-in slide-in-from-left-8 duration-700">
        <h3 className="text-xl font-semibold mb-4">Temperature vs Pressure Correlation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              type="number"
              dataKey="temperature"
              stroke="#9CA3AF"
              label={{ value: 'Temperature (°F)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="pressure"
              stroke="#9CA3AF"
              label={{ value: 'Pressure (mb)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value, name) => [value, name === 'pressure' ? 'Pressure (mb)' : 'Temperature (°F)']}
            />
            <Legend />
            {stations.map((station, index) => (
              <Scatter
                key={station.id}
                name={station.name}
                data={station.data.map(point => ({
                  temperature: point.temperature,
                  pressure: point.pressure,
                  station: point.station_name
                }))}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}