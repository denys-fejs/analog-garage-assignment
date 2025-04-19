import React from "react";

import Button from "../Button";
import { useData } from "../../context/DataContext";

const TimeControlBar: React.FC = () => {
  const {
    isPaused,
    customTimeframe,
    selectedTimeframe,

    clearData,
    togglePause
  } = useData();

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h3 className="font-medium text-gray-800">Time Controls</h3>

        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <Button variant={isPaused ? "danger" : "primary"} onClick={togglePause} size="sm">
            {isPaused ? "Resume Live Data" : "Pause Data"}
          </Button>

          <Button variant="secondary" onClick={clearData} size="sm">
            Clear Data
          </Button>
        </div>
      </div>

      <div className="mt-3 text-sm border-t pt-3 border-gray-100">
        <span className="font-medium text-gray-700">Status: </span>
        {isPaused ? (
          <span className="text-red-500 font-medium">Paused - No new data being received</span>
        ) : customTimeframe ? (
          <span className="text-orange-500 font-medium">
            Viewing custom time range while receiving new data
          </span>
        ) : selectedTimeframe ? (
          <span className="text-blue-500 font-medium">
            Viewing last {selectedTimeframe.label} of data
          </span>
        ) : (
          <span className="text-green-500 font-medium">Live - Showing all data</span>
        )}
      </div>
    </div>
  );
};

export default TimeControlBar;
