import { DataPoint, DataMetrics, Timeframe, TimeframeUnit } from "../types";

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
  // If we have the real backend (detected by timestamp clustering)
  if (data.length > 100) {
    // Check if data has tight timestamp clustering
    const firstPoint = data[0]?.timestamp || 0;
    const lastPoint = data[data.length - 1]?.timestamp || 0;
    const timeSpan = lastPoint - firstPoint;

    // If data spans less than 3 seconds, it's likely from real backend
    if (timeSpan < 3000 && timeSpan > 0) {
      // For real backend, use percentage-based filtering instead
      const timeframeMs = timeframeToMs(timeframe);
      let percentage = 100;

      // Convert timeframe to approximate percentages
      if (timeframeMs <= 10000) percentage = 20;
      else if (timeframeMs <= 30000) percentage = 40;
      else if (timeframeMs <= 60000) percentage = 60;
      else if (timeframeMs <= 300000) percentage = 80;

      const count = Math.ceil(data.length * (percentage / 100));
      return data.slice(-count); // Take the most recent points
    }
  }

  // Original timestamp-based filtering for mock data
  const now = Date.now();
  const cutoffTime = now - timeframeToMs(timeframe);
  return data.filter(point => point.timestamp >= cutoffTime);
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
