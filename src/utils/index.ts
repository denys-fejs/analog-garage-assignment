import { DataPoint, DataMetrics, Timeframe, TimeframeUnit } from "@/types";

export const normalizeTimestamp = (timestamp: number | string): number => {
  // Convert string timestamps to numbers
  const numericTimestamp = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;

  // If timestamp is too small (likely in seconds), convert to milliseconds
  if (numericTimestamp < 946684800000) {
    // Year 2000 in milliseconds
    return numericTimestamp * 1000;
  }

  return numericTimestamp;
};

// Converts a timeframe to milliseconds
export const timeframeToMs = (timeframe: Timeframe): number => {
  // Validate timeframe
  if (!timeframe || !timeframe.value || !timeframe.unit) {
    console.error("Invalid timeframe:", timeframe);
    return 0;
  }

  // Fixed unit conversion
  switch (timeframe.unit) {
    case TimeframeUnit.Seconds:
      return timeframe.value * 1000;
    case TimeframeUnit.Minutes:
      return timeframe.value * 60 * 1000;
    case TimeframeUnit.Hours:
      return timeframe.value * 60 * 60 * 1000;
    default:
      console.error("Unknown timeframe unit:", timeframe.unit);
      return 0;
  }
};

// Filters data points based on a specified timeframe
export const filterDataByTimeframe = (data: DataPoint[], timeframe: Timeframe): DataPoint[] => {
  // If no data or timeframe, return original data
  if (!data || data.length === 0 || !timeframe) {
    return data;
  }

  // Calculate timeframe in milliseconds
  const timeframeMs = timeframeToMs(timeframe);

  // Sort data by timestamp (descending)
  const sortedData = [...data].sort((a, b) => b.timestamp - a.timestamp);

  // Use the most recent timestamp as our reference point
  const latestTimestamp = sortedData[0].timestamp;
  const cutoffTime = latestTimestamp - timeframeMs;

  // Filter data based on the calculated cutoff
  const filtered = data.filter(point => point.timestamp >= cutoffTime);

  // For shorter timeframes, enforce some maximum point limits to prevent overwhelming the UI
  if (timeframe.unit === "seconds" && timeframe.value <= 10) {
    // For 10-second timeframe, limit to ~20% of points
    const maxPoints = Math.max(50, Math.floor(data.length * 0.2));
    if (filtered.length > maxPoints) {
      return sortedData.slice(0, maxPoints);
    }
  } else if (timeframe.unit === "seconds" && timeframe.value <= 30) {
    // For 30-second timeframe, limit to ~30% of points
    const maxPoints = Math.max(75, Math.floor(data.length * 0.3));
    if (filtered.length > maxPoints) {
      return sortedData.slice(0, maxPoints);
    }
  } else if (timeframe.unit === "minutes" && timeframe.value <= 1) {
    // For 1-minute timeframe, limit to ~40% of points
    const maxPoints = Math.max(100, Math.floor(data.length * 0.4));
    if (filtered.length > maxPoints) {
      return sortedData.slice(0, maxPoints);
    }
  }

  return filtered;
};

// Filters data points based on a custom time range
export const filterByCustomTimeframe = (
  data: DataPoint[],
  timeframe: { start: number; end: number }
): DataPoint[] => {
  if (!timeframe || !data || data.length === 0) {
    console.log("No custom timeframe or data to filter");
    return data;
  }

  // Filter data points within the custom timeframe
  const filtered = data.filter(
    point => point.timestamp >= timeframe.start && point.timestamp <= timeframe.end
  );

  return filtered;
};

// Calculate metrics for a dataset
export const calculateMetrics = (data: DataPoint[]): DataMetrics => {
  if (!data.length) {
    return {
      min: 0,
      max: 0,
      average: 0,
      standardDeviation: 0,
      count: 0,
      duration: 0
    };
  }

  // Extract values and timestamps
  const values = data.map(point => point.value);
  const timestamps = data.map(point => point.timestamp);

  // Sort timestamps to find duration
  const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
  const firstTimestamp = sortedTimestamps[0];
  const lastTimestamp = sortedTimestamps[sortedTimestamps.length - 1];
  const duration = lastTimestamp - firstTimestamp;

  // Calculate basic statistics
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;

  // Calculate standard deviation
  const squaredDifferences = values.map(value => Math.pow(value - average, 2));
  const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / values.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    min,
    max,
    average,
    standardDeviation,
    count: values.length,
    duration
  };
};

// Format a timestamp as a readable time string
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString();
};

// Format a date for input fields
export const formatDateForInput = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
};

// Format a duration in milliseconds to a readable string
export const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    return `${(ms / 60000).toFixed(2)}m`;
  }
};

// Format a full date for display
export const formatDate = (date: Date): string => {
  return date.toLocaleString();
};

export function debugFilterByTimeframe(
  data: DataPoint[],
  timeframe: Timeframe | null
): DataPoint[] {
  // If no timeframe, return all data
  if (!timeframe) {
    console.log("No timeframe set, returning all data points:", data.length);
    return data;
  }

  // Get the current time
  const now = Date.now();

  // Calculate cutoff time based on timeframe
  let cutoffMs = 0;
  switch (timeframe.unit) {
    case "seconds":
      cutoffMs = timeframe.value * 1000;
      break;
    case "minutes":
      cutoffMs = timeframe.value * 60 * 1000;
      break;
    case "hours":
      cutoffMs = timeframe.value * 60 * 60 * 1000;
      break;
    default:
      console.error("Unknown timeframe unit:", timeframe.unit);
      return data;
  }

  const cutoffTime = now - cutoffMs;

  // Filter the data
  const filteredData = data.filter(point => {
    // Ensure timestamp is a number
    const timestamp =
      typeof point.timestamp === "string" ? parseInt(point.timestamp, 10) : point.timestamp;

    // Filter based on cutoff time
    return timestamp >= cutoffTime;
  });

  return filteredData;
}
