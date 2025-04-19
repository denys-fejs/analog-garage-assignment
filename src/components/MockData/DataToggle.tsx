import React, { useState, useEffect } from "react";

import { websocketService } from "@/services/websocket.service";

interface DataToggleProps {
  className?: string;
}

const DataToggle: React.FC<DataToggleProps> = ({ className = "" }) => {
  const [useMockData, setUseMockData] = useState<boolean>(
    Boolean(localStorage.getItem("useMockData"))
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setUseMockData(Boolean(localStorage.getItem("useMockData")));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleMockData = () => {
    const newValue = !useMockData;
    websocketService.setMockDataMode(newValue);
    setUseMockData(newValue);
  };

  return (
    <div className={`flex items-center ${className}`}>
      <span className="mr-2 text-sm text-gray-600">Data Source:</span>
      <div className="flex items-center">
        <button
          type="button"
          onClick={toggleMockData}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
            !useMockData ? "bg-blue-600" : "bg-gray-200"
          }`}
          role="switch"
          aria-checked={!useMockData}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              !useMockData ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
        <span className="ml-3 text-sm font-medium text-gray-500">
          {useMockData ? "Mock Data" : "Real Backend"}
        </span>
      </div>
    </div>
  );
};

export default DataToggle;
