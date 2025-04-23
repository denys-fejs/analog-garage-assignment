import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  FC
} from "react";

import { config } from "@/config";
import { useThrottle } from "@/hooks/useThrottle";
import { DataPoint, Producer, Timeframe } from "@/types";
import { filterDataByTimeframe, normalizeTimestamp } from "@/utils";
import { websocketService, ConnectionStatus } from "@/services/websocket.service";

const PRODUCER_COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#8AC926",
  "#1982C4",
  "#6A4C93",
  "#F94144"
];

type ConnectionStatusMap = Record<string, ConnectionStatus>;

interface DataContextProps {
  isPaused: boolean;
  producers: Producer[];
  maxDataPoints: number;
  activeProducers: string[];
  availableTimeframes: Timeframe[];
  selectedTimeframe: Timeframe | null;
  connectionStatus: ConnectionStatusMap;
  filteredData: Record<string, DataPoint[]>;
  bufferedData: Record<string, DataPoint[]>;
  dataPoints: Record<string, DataPoint[]>;
  customTimeframe: { start: number; end: number } | null;

  clearData: () => void;
  togglePause: () => void;
  setMaxDataPoints: (count: number) => void;
  toggleProducer: (producerId: string) => void;
  setSelectedTimeframe: (timeframe: Timeframe | null) => void;
  setCustomTimeframe: (timeframe: { start: number; end: number } | null) => void;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

//DataProvider component for managing real-time data state

export const DataProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Create producer list with unique IDs and colors
  const [producers] = useState<Producer[]>(
    Array.from({ length: 10 }, (_, i) => ({
      id: `producer-${i + 1}`,
      name: `Producer ${i + 1}`,
      color: PRODUCER_COLORS[i],
      isActive: false
    }))
  );

  // State management
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeProducers, setActiveProducers] = useState<string[]>([]);
  const [dataPoints, setDataPoints] = useState<Record<string, DataPoint[]>>({});
  const [bufferedData, setBufferedData] = useState<Record<string, DataPoint[]>>({});
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe | null>(null);
  const [filteredData, setFilteredData] = useState<Record<string, DataPoint[]>>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusMap>({});
  const [maxDataPoints, setMaxDataPoints] = useState<number>(config.data.maxDataPoints || 10000);
  const [customTimeframe, setCustomTimeframe] = useState<{ start: number; end: number } | null>(
    null
  );
  const [availableTimeframes] = useState(config.data.availableTimeframes || []);

  // Track the last processed timestamp to avoid duplicates
  const lastProcessedTimestamp = useRef<Record<string, number>>({});

  // Performance measurements
  const dataProcessingTime = useRef<number[]>([]);

  // Register for connection status updates
  useEffect(() => {
    const handleConnectionStatus = (status: ConnectionStatus, producerId?: string) => {
      if (producerId) {
        setConnectionStatus(prev => ({
          ...prev,
          [producerId]: status
        }));
      }
    };

    websocketService.registerStatusCallback(handleConnectionStatus);

    return () => {
      websocketService.unregisterStatusCallback(handleConnectionStatus);
    };
  }, []);

  // Toggle pause/resume data collection
  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      const newPausedState = !prev;
      websocketService.setPaused(newPausedState);
      return newPausedState;
    });
  }, []);

  // Handle data received from WebSocket with deduplication
  const handleData = useCallback(
    (newData: DataPoint[]) => {
      if (isPaused) return;

      if (!newData || newData.length === 0) return;

      // Get the producer ID from the first data point
      const producerId = newData[0].producerId;

      // Filter out any duplicates or invalid data points
      const lastTimestamp = lastProcessedTimestamp.current[producerId] || 0;
      const validData = newData.filter(point => {
        // Normalize timestamp to ensure consistency
        point.timestamp = normalizeTimestamp(point.timestamp);

        // Make sure timestamp is valid
        if (!point.timestamp || isNaN(point.timestamp)) {
          console.warn(`Invalid timestamp in data point for ${producerId}:`, point);
          return false;
        }

        // Make sure value is valid
        if (typeof point.value !== "number" || isNaN(point.value)) {
          console.warn(`Invalid value in data point for ${producerId}:`, point);
          return false;
        }

        // Filter out duplicates
        return point.timestamp > lastTimestamp;
      });

      if (validData.length === 0) return;

      // Sort by timestamp to ensure chronological order
      validData.sort((a, b) => a.timestamp - b.timestamp);

      // Update the last processed timestamp
      const newestTimestamp = validData[validData.length - 1].timestamp;
      lastProcessedTimestamp.current[producerId] = newestTimestamp;

      // Limit the number of points we buffer at once to prevent overwhelming the UI
      const maxBufferSize = 1000;
      let dataToBuffer = validData;

      if (validData.length > maxBufferSize) {
        console.warn(
          `Received too many points (${validData.length}) for ${producerId}, downsampling to ${maxBufferSize}`
        );
        // Take evenly spaced samples if we have too many points
        const step = Math.ceil(validData.length / maxBufferSize);
        dataToBuffer = validData.filter((_, i) => i % step === 0);
      }

      setBufferedData(prev => {
        const currentBuffer = prev[producerId] || [];
        const updatedBuffer = [...currentBuffer, ...dataToBuffer];

        // Limit buffer size to prevent memory issues
        const limitedBuffer =
          updatedBuffer.length > maxBufferSize * 2
            ? updatedBuffer.slice(-maxBufferSize * 2)
            : updatedBuffer;

        return {
          ...prev,
          [producerId]: limitedBuffer
        };
      });
    },
    [isPaused]
  );

  // Process buffered data and update main data state
  useEffect(() => {
    const intervalId = setInterval(() => {
      const startTime = performance.now();

      setBufferedData(prevBuffer => {
        // Skip processing if no buffer data to avoid unnecessary rerenders
        if (Object.values(prevBuffer).every(buffer => buffer.length === 0)) {
          return prevBuffer;
        }

        setDataPoints(prevData => {
          const newData = { ...prevData };

          Object.entries(prevBuffer).forEach(([producerId, buffer]) => {
            if (buffer.length > 0) {
              const currentData = newData[producerId] || [];

              // Sort all data by timestamp
              const allData = [...currentData, ...buffer].sort((a, b) => a.timestamp - b.timestamp);

              // Limit data points to prevent memory issues
              if (allData.length > maxDataPoints) {
                newData[producerId] = allData.slice(-maxDataPoints);
              } else {
                newData[producerId] = allData;
              }
            }
          });

          return newData;
        });

        // Clear the buffer after processing
        return Object.keys(prevBuffer).reduce((acc, key) => {
          acc[key] = [];
          return acc;
        }, {} as Record<string, DataPoint[]>);
      });

      // Track processing time
      const endTime = performance.now();
      dataProcessingTime.current.push(endTime - startTime);

      // Keep only the last 20 measurements
      if (dataProcessingTime.current.length > 20) {
        dataProcessingTime.current.shift();
      }

      // Log average processing time in development
      if (process.env.NODE_ENV === "development" && dataProcessingTime.current.length % 10 === 0) {
        const avgTime =
          dataProcessingTime.current.reduce((sum, time) => sum + time, 0) /
          dataProcessingTime.current.length;
        console.debug(`Data processing avg time: ${avgTime.toFixed(2)}ms`);
      }
    }, 250); // Update visualization at 4 Hz (250ms intervals)

    return () => clearInterval(intervalId);
  }, [maxDataPoints]);

  // Use throttled data for better performance
  const throttledData = useThrottle(dataPoints, config.ui.throttleDelay || 100);

  // Filter data based on selected timeframe or custom timeframe
  useEffect(() => {
    // This will ensure filtering is applied less frequently during rapid timeframe changes
    const timeoutId = setTimeout(() => {
      const filterData = () => {
        // Skip filtering when timeframe is null
        if (!selectedTimeframe) {
          return throttledData;
        }

        const newFilteredData: Record<string, DataPoint[]> = {};

        Object.entries(throttledData).forEach(([producerId, data]) => {
          if (data.length > 0) {
            const filtered = filterDataByTimeframe(data, selectedTimeframe);

            // Ensure we always have some data to display
            if (filtered.length === 0 && data.length > 0) {
              // If filtering resulted in no data, show the most recent points
              newFilteredData[producerId] = data.slice(-Math.min(100, data.length));
            } else {
              newFilteredData[producerId] = filtered;
            }
          } else {
            newFilteredData[producerId] = [];
          }
        });

        return newFilteredData;
      };

      setFilteredData(filterData());
    }, 50); // Small delay to prevent too many updates

    return () => clearTimeout(timeoutId);
  }, [throttledData, selectedTimeframe]);

  // Connect/disconnect WebSocket based on active producers
  useEffect(() => {
    // Connect to newly activated producers
    activeProducers.forEach(producerId => {
      if (!dataPoints[producerId]) {
        setDataPoints(prev => ({ ...prev, [producerId]: [] }));
        setBufferedData(prev => ({ ...prev, [producerId]: [] }));
      }

      if (!websocketService.isConnected(producerId)) {
        websocketService.connect(producerId, handleData);
      }
    });

    // Disconnect from deactivated producers
    producers.forEach(producer => {
      if (!activeProducers.includes(producer.id) && websocketService.isConnected(producer.id)) {
        websocketService.disconnect(producer.id);
      }
    });

    // Clean up all connections when component unmounts
    return () => {
      websocketService.disconnectAll();
    };
  }, [activeProducers, producers, dataPoints, handleData]);

  const toggleProducer = useCallback((producerId: string) => {
    setActiveProducers(prev => {
      if (prev.includes(producerId)) {
        // When deselecting a producer, clear its data
        setDataPoints(prevData => {
          const newData = { ...prevData };
          delete newData[producerId];
          return newData;
        });
        setBufferedData(prevData => {
          const newData = { ...prevData };
          delete newData[producerId];
          return newData;
        });
        setFilteredData(prevData => {
          const newData = { ...prevData };
          delete newData[producerId];
          return newData;
        });
        // Reset the last processed timestamp
        lastProcessedTimestamp.current[producerId] = 0;
        return prev.filter(id => id !== producerId);
      } else {
        return [...prev, producerId];
      }
    });
  }, []);

  //Clear all data points
  const clearData = useCallback(() => {
    setDataPoints({});
    setBufferedData({});
    setFilteredData({});
    lastProcessedTimestamp.current = {};
  }, []);

  // Context value
  const value = {
    producers,
    dataPoints,
    activeProducers,
    selectedTimeframe,
    bufferedData,
    maxDataPoints,
    connectionStatus,
    toggleProducer,
    setSelectedTimeframe,
    setMaxDataPoints,
    clearData,
    filteredData,
    isPaused,
    togglePause,
    customTimeframe,
    setCustomTimeframe,
    availableTimeframes
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextProps => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
