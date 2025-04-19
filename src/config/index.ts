import { TimeframeUnit } from "../types";

export const config = {
  //WebSocket connection settings
  websocket: {
    baseUrl: "ws://127.0.0.1:4000/producer",

    // Reconnection attempt delay in milliseconds
    reconnectDelay: 2000
  },

  data: {
    // Maximum number of data points to store per producer
    maxDataPoints: 10000,

    // Data update frequency for UI in milliseconds
    updateFrequency: 100,

    // Default timeframe for filtering data
    defaultTimeframe: {
      value: 30,
      unit: TimeframeUnit.Seconds,
      label: "30 seconds"
    },

    // Available timeframe options
    availableTimeframes: [
      { value: 10, unit: TimeframeUnit.Seconds, label: "10 seconds" },
      { value: 30, unit: TimeframeUnit.Seconds, label: "30 seconds" },
      { value: 1, unit: TimeframeUnit.Minutes, label: "1 minute" },
      { value: 5, unit: TimeframeUnit.Minutes, label: "5 minutes" },
      { value: 15, unit: TimeframeUnit.Minutes, label: "15 minutes" },
      { value: 30, unit: TimeframeUnit.Minutes, label: "30 minutes" }
    ]
  },

  ui: {
    // Throttle delay for UI updates in milliseconds
    throttleDelay: 100,

    // Default chart height in pixels
    defaultChartHeight: 300
  }
};
