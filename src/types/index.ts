// Represents a single data point received from a producer
export interface DataPoint {
  value: number;
  timestamp: number;
  producerId: string;
}

// Represents a data producer
export interface Producer {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

// Defines analytics calculated for a dataset
export interface DataMetrics {
  min: number;
  max: number;
  average: number;
  standardDeviation: number;
  count: number;
  duration: number;
}

// Defines available timeframe options for filtering data
export enum TimeframeUnit {
  Seconds = "seconds",
  Minutes = "minutes",
  Hours = "hours"
}

// Represents a standard timeframe for filtering data
export interface Timeframe {
  value: number;
  unit: TimeframeUnit;
  label: string;
}

// Custom timeframe for specific date ranges
export interface CustomTimeframe {
  start: number;
  end: number;
  label?: string;
}

// Interface matching the backend's data format
export interface BackendDataEntry {
  timestamp: string;
  value: number;
}
