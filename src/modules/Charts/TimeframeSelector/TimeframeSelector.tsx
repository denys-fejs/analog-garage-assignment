import { FC, useEffect } from "react";

import { TimeframeUnit } from "@/types";
import { useData } from "@/context/DataContext";

const TimeframeSelector: FC = () => {
  const {
    dataPoints,
    filteredData,
    selectedTimeframe,
    availableTimeframes,

    setSelectedTimeframe
  } = useData();

  // Update debug info when relevant state changes
  useEffect(() => {
    // Count data points for each producer
    const dataPointCounts: { [key: string]: number } = {};
    const filteredPointCounts: { [key: string]: number } = {};
    let minTimestamp = Number.MAX_SAFE_INTEGER;
    let maxTimestamp = 0;

    // Analyze raw data points
    Object.entries(dataPoints).forEach(([producerId, points]) => {
      dataPointCounts[producerId] = points.length;

      // Find min/max timestamps across all data
      if (points.length > 0) {
        const timestamps = points.map(p => p.timestamp);
        const localMin = Math.min(...timestamps);
        const localMax = Math.max(...timestamps);

        if (localMin < minTimestamp) minTimestamp = localMin;
        if (localMax > maxTimestamp) maxTimestamp = localMax;
      }
    });

    // Analyze filtered data points
    Object.entries(filteredData).forEach(([producerId, points]) => {
      filteredPointCounts[producerId] = points.length;
    });
  }, [dataPoints, filteredData, selectedTimeframe]);

  // Force timeframe selection
  const selectTimeframe = (
    timeframe: { value: number; unit: TimeframeUnit; label: string } | null
  ) => {
    setSelectedTimeframe(timeframe);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Select Timeframe:</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedTimeframe === null
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
            onClick={() => selectTimeframe(null)}
          >
            All Data
          </button>

          {availableTimeframes.map(tf => (
            <button
              key={tf.label}
              className={`px-2 py-1 text-xs rounded ${
                selectedTimeframe?.label === tf.label
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() => selectTimeframe(tf)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeframeSelector;
