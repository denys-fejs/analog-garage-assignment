import { FC } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush
} from "recharts";

import { Producer } from "@/types";
import { Card } from "@/components";
import { formatTimestamp } from "@/utils";
import { TimeframeSelector } from "@/modules";
import { useData } from "@/context/DataContext";
import TimeControlBar from "@/components/TimeControlBar";

// Dashboard component to visualize producer data with enhanced time controls
const Dashboard: FC = () => {
  const {
    producers,
    filteredData,
    activeProducers,

    setCustomTimeframe,
    setSelectedTimeframe
  } = useData();

  // Get active producer objects
  const activeProducerObjects = producers.filter(producer => activeProducers.includes(producer.id));

  // Prepare chart data from filteredData
  const prepareChartData = (producerIds = activeProducers) => {
    // Create data map by timestamp
    const dataMap = new Map();

    // Loop through specified producers
    producerIds.forEach(producerId => {
      // Use filteredData only, never rawData/dataPoints
      const producerData = filteredData[producerId] || [];

      if (producerData.length === 0) return;

      // Process data points
      producerData.forEach(point => {
        if (!dataMap.has(point.timestamp)) {
          dataMap.set(point.timestamp, {
            timestamp: point.timestamp,
            formattedTime: formatTimestamp(point.timestamp)
          });
        }

        const entry = dataMap.get(point.timestamp);
        entry[producerId] = point.value;
      });
    });

    // Convert map to array and sort by timestamp
    return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  };

  // Main chart data
  const mainChartData = prepareChartData();

  // Handle brush change to update custom timeframe
  const handleBrushChange = (brushData: { startIndex?: number; endIndex?: number }) => {
    if (!brushData || !brushData.startIndex || !brushData.endIndex || mainChartData.length === 0)
      return;

    // If brush is reset (covers all data), clear custom timeframe
    if (brushData.startIndex === 0 && brushData.endIndex === mainChartData.length - 1) {
      setCustomTimeframe(null);
      setSelectedTimeframe(null);
      return;
    }

    // Get start and end timestamps from the brushed range
    const startTime = mainChartData[brushData.startIndex].timestamp;
    const endTime = mainChartData[brushData.endIndex].timestamp;

    // Set custom timeframe from brush selection
    setCustomTimeframe({
      start: startTime,
      end: endTime
    });

    // Clear any preset timeframe
    setSelectedTimeframe(null);
  };

  // Render charts for each active producer
  const renderProducerChart = (producer: Producer) => {
    const producerData = prepareChartData([producer.id]);

    if (producerData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400">No data available</p>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={producerData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="formattedTime"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(value: number) => value.toFixed(2)}
            labelFormatter={label => `Time: ${label}`}
          />
          <Line
            type="monotone"
            dataKey={producer.id}
            stroke={producer.color}
            name={producer.name}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      {activeProducerObjects.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TimeframeSelector />
          </div>

          <TimeControlBar />
          <div className="gap-6">
            <div className="lg:col-span-3">
              <Card title={`Real-time Data`}>
                {mainChartData.length > 0 ? (
                  <div style={{ height: "350px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={mainChartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
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
                        <Brush
                          dataKey="formattedTime"
                          height={30}
                          stroke="#8884d8"
                          onChange={handleBrushChange}
                        />

                        {activeProducerObjects.map(producer => (
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
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400">No data available</p>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  Data points: {mainChartData.length}
                </div>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProducerObjects.map(producer => (
              <Card
                key={producer.id}
                title={producer.name}
                className="h-64"
                headerActions={
                  <span className="text-sm text-gray-500">
                    {(filteredData[producer.id]?.length || 0).toLocaleString()} points
                  </span>
                }
              >
                <div style={{ height: "180px" }}>{renderProducerChart(producer)}</div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl text-gray-400 mb-2">No Data Sources Selected</h3>
          <p className="text-gray-500">
            Select one or more data producers from the sidebar to visualize their data.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
