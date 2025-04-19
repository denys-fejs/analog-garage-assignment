import React, { useMemo } from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

import { DataPoint } from "@/types";
import { formatTimestamp } from "@/utils";

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  name?: string;
  showLegend?: boolean;
  className?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  color = "#3B82F6",
  height = 300,
  name = "Value",
  showLegend = false,
  className = ""
}) => {
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      formattedTime: formatTimestamp(point.timestamp)
    }));
  }, [data]);

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="formattedTime"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), name]}
            labelFormatter={label => `Time: ${label}`}
          />
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            name={name}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
