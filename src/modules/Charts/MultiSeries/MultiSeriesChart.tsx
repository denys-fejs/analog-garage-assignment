import { FC, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

import { formatTimestamp } from "@/utils";

import { MultiSeriesChartProps } from "./types";

const SimpleMultiSeriesChart: FC<MultiSeriesChartProps> = ({
  dataSeries,
  producers,
  height = 400,
  className = ""
}) => {
  // Get active producers for rendering lines
  const activeProducers = producers.filter(p => p.isActive);

  const chartData = useMemo(() => {
    // Count total points for logging
    let totalPoints = 0;
    Object.values(dataSeries).forEach(points => {
      totalPoints += points.length;
    });

    if (totalPoints === 0 || activeProducers.length === 0) {
      return [];
    }

    const dataMap = new Map();

    activeProducers.forEach(producer => {
      const producerData = dataSeries[producer.id] || [];

      if (producerData.length === 0) return;

      const limitedData = producerData.slice(-500);

      limitedData.forEach(point => {
        if (!dataMap.has(point.timestamp)) {
          dataMap.set(point.timestamp, {
            timestamp: point.timestamp,
            formattedTime: formatTimestamp(point.timestamp)
          });
        }

        const entry = dataMap.get(point.timestamp);
        entry[producer.id] = point.value;
      });
    });

    return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [dataSeries, activeProducers]);

  if (chartData.length === 0 || activeProducers.length === 0) {
    return (
      <div
        className={`w-full flex items-center justify-center bg-gray-50 ${className}`}
        style={{ height }}
      >
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <div className="text-xs text-gray-500 mb-1">Chart data: {chartData.length} points</div>

      <ResponsiveContainer width="100%" height="95%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="formattedTime"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(value: number, name: string) => {
              const producer = producers.find(p => p.id === name);
              return [value.toFixed(2), producer?.name || name];
            }}
            labelFormatter={label => `Time: ${label}`}
          />
          <Legend />

          {activeProducers.map(producer => (
            <Line
              key={producer.id}
              type="monotone"
              dataKey={producer.id}
              stroke={producer.color}
              name={producer.name}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SimpleMultiSeriesChart;
