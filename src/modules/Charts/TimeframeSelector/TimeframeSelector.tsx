import { FC, useEffect, useRef, useState } from "react";

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

  // Track which button was last clicked to prevent double-clicks
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  const clickTimeout = useRef<number | null>(null);

  // Force timeframe selection with debouncing and protection against double-clicks
  const selectTimeframe = (
    timeframe: { value: number; unit: TimeframeUnit; label: string } | null
  ) => {
    const buttonId = timeframe?.label || "all";

    if (
      buttonId === lastClicked &&
      ((timeframe === null && selectedTimeframe === null) ||
        timeframe?.label === selectedTimeframe?.label)
    ) {
      return;
    }

    // Update the last clicked button
    setLastClicked(buttonId);

    // Prevent multiple clicks within a short time period
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }

    // Apply the timeframe after a short delay
    clickTimeout.current = window.setTimeout(() => {
      setSelectedTimeframe(timeframe);
      clickTimeout.current = null;
    }, 100);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }
    };
  }, []);

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
            disabled={lastClicked === "all" && clickTimeout.current !== null}
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
              disabled={lastClicked === tf.label && clickTimeout.current !== null}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        {Object.keys(dataPoints).length > 0 && (
          <div>
            <div>
              Total data points:{" "}
              {Object.values(dataPoints).reduce((sum, arr) => sum + arr.length, 0)}
            </div>
            <div>
              Filtered data points:{" "}
              {Object.values(filteredData).reduce((sum, arr) => sum + arr.length, 0)}
            </div>
            <div>Current timeframe: {selectedTimeframe?.label || "All data"}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeframeSelector;
