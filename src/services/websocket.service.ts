import { config } from "@/config";
import { BackendDataEntry, DataPoint } from "@/types";

// Type definition for WebSocket message callback function
type WebSocketMessageCallback = (data: DataPoint[]) => void;

//Type definition for WebSocket status callback function
type WebSocketStatusCallback = (status: ConnectionStatus, producerId?: string) => void;

export enum ConnectionStatus {
  Connected = "connected",
  Disconnected = "disconnected",
  Connecting = "connecting",
  Error = "error",
  Paused = "paused" // New status
}

// Service for managing WebSocket connections to data producers
class WebSocketService {
  private isPaused: boolean = false;
  private readonly baseUrl: string;
  private readonly useMockData: boolean;
  private readonly pollingRate: number = 500;
  private logLevel: "verbose" | "quiet" = "quiet";
  private isPolling: Map<string, boolean> = new Map();
  private mockIntervals: Map<string, number> = new Map();
  private statusCallbacks: WebSocketStatusCallback[] = [];
  private pollingIntervals: Map<string, number> = new Map();
  private suppressedWarnings = new Map<string, number>();
  private initialDataLoadComplete = new Map<string, boolean>();
  private connectionStatus: Map<string, ConnectionStatus> = new Map();
  private dataCallbacks: Map<string, WebSocketMessageCallback> = new Map();

  constructor() {
    // Get base URL from config
    this.baseUrl = config.websocket.baseUrl || "ws://127.0.0.1:4000/producer";

    // Determine if we should use mock data
    this.useMockData =
      (process.env.NODE_ENV === "development" && Boolean(localStorage.getItem("useMockData"))) ||
      false;

    // Log initialization - only essential info
    this.log(`WebSocket service initialized with base URL: ${this.baseUrl}`);
    this.log(`Using ${this.useMockData ? "mock data" : "polling mode"}`);
  }

  private formatProducerIdForBackend(producerId: string): string {
    return producerId.replace("-", "_");
  }

  // Controlled logging to reduce console spam
  private log(message: string, level: "info" | "warn" | "error" = "info"): void {
    if (this.logLevel === "quiet" && level === "info") {
      return; // Skip info logs in quiet mode
    }

    switch (level) {
      case "info":
        console.log(message);
        break;
      case "warn":
        console.warn(message);
        break;
      case "error":
        console.error(message);
        break;
    }
  }

  // Register a callback function to receive connection status updates
  registerStatusCallback(callback: WebSocketStatusCallback): void {
    this.statusCallbacks.push(callback);
  }

  // Unregister a previously registered status callback
  unregisterStatusCallback(callback: WebSocketStatusCallback): void {
    this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
  }

  // Notify all registered callbacks of a status change
  private notifyStatusCallbacks(status: ConnectionStatus, producerId?: string): void {
    // Update our internal status tracking
    if (producerId) {
      this.connectionStatus.set(producerId, status);
    }

    // Notify all registered callbacks
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status, producerId);
      } catch (error) {
        this.log(`Error in status callback: ${error}`, "error");
      }
    });
  }

  // Connect to a specific producer
  connect(producerId: string, onMessage: WebSocketMessageCallback): void {
    // If already polling, don't start again
    if (this.isPolling.get(producerId)) {
      return;
    }

    // Store the callback
    this.dataCallbacks.set(producerId, onMessage);

    // Use mock data if enabled
    if (this.useMockData) {
      // Generate historical data first
      this.generateHistoricalData(producerId, onMessage);

      // Then setup the interval for real-time data
      this.setupMockDataInterval(producerId, onMessage);

      // Explicitly notify connection is established - add this line
      this.notifyStatusCallbacks(ConnectionStatus.Connected, producerId);

      return;
    }

    // Start polling
    this.startPolling(producerId);
  }

  // Map to track timestamp ranges per producer
  private producerTimestamps = new Map<string, number[]>();

  // Track a timestamp for a producer
  private trackTimestampForProducer(producerId: string, timestamp: number): void {
    if (!this.producerTimestamps.has(producerId)) {
      this.producerTimestamps.set(producerId, []);
    }

    const timestamps = this.producerTimestamps.get(producerId)!;
    timestamps.push(timestamp);

    // Keep only the last 1000 timestamps to avoid memory issues
    if (timestamps.length > 1000) {
      this.producerTimestamps.set(producerId, timestamps.slice(timestamps.length - 1000));
    }
  }

  // Start polling for data from a producer
  private startPolling(producerId: string): void {
    // Set producer as polling mode
    this.isPolling.set(producerId, true);

    // Initial connection status notification
    this.notifyStatusCallbacks(
      this.isPaused ? ConnectionStatus.Paused : ConnectionStatus.Connected,
      producerId
    );

    // Function to poll for data
    const pollOnce = () => {
      // Skip if we've been disconnected
      if (!this.isPolling.get(producerId)) {
        return;
      }

      // Get callback
      const onMessage = this.dataCallbacks.get(producerId);
      if (!onMessage) {
        this.log(`No callback registered for producer ${producerId}`, "error");
        return;
      }

      // Create a WebSocket just for this one poll
      try {
        const backendProducerId = this.formatProducerIdForBackend(producerId);
        const ws = new WebSocket(`${this.baseUrl}/${backendProducerId}`);

        ws.onopen = () => {
          // Keep the Connected status while polling works
          if (
            this.connectionStatus.get(producerId) !== ConnectionStatus.Connected &&
            this.connectionStatus.get(producerId) !== ConnectionStatus.Paused
          ) {
            this.notifyStatusCallbacks(
              this.isPaused ? ConnectionStatus.Paused : ConnectionStatus.Connected,
              producerId
            );
          }
        };

        ws.onmessage = event => {
          try {
            // Skip processing if paused
            if (this.isPaused) return;

            // Parse the received JSON data
            const rawData: BackendDataEntry[] = JSON.parse(event.data);

            // Suppress excessive warnings
            const warningKey = `timestamp_variation_${producerId}`;
            const warningCount = this.suppressedWarnings.get(warningKey) || 0;
            if (warningCount < 3) {
              this.log(`Applying artificial timestamp distribution for ${producerId}`, "info");
              this.suppressedWarnings.set(warningKey, warningCount + 1);
            }

            // Current time as reference
            const receiveTime = Date.now();

            // ** For this backend, need to apply VERY AGGRESSIVE timestamp distribution
            const processedData: DataPoint[] = rawData.map((entry, index, array) => {
              const value =
                typeof entry.value === "number" ? entry.value : parseFloat(String(entry.value));

              // Determine if this is initial load or real-time update
              const isInitialLoad = !this.initialDataLoadComplete.has(producerId);

              let effectiveTimestamp: number;

              if (isInitialLoad) {
                // Initial data is distributed over 20 minutes
                // This ensures very clear differences between timeframes
                const initialTimeSpan = 20 * 60 * 1000; // 20 minutes

                // Use exponential distribution to cluster newer points more densely
                const position = (array.length - index - 1) / Math.max(1, array.length - 1);
                const expFactor = 2.0;
                const adjustedPosition = Math.pow(position, expFactor);

                effectiveTimestamp = receiveTime - initialTimeSpan * adjustedPosition;

                if (index === array.length - 1) {
                  this.initialDataLoadComplete.set(producerId, true);
                  this.log(
                    `Initial load complete for ${producerId}, distributed over 20 minutes with exponential distribution`,
                    "info"
                  );
                }
              } else {
                // Ensure new batches are spaced with larger gaps
                const batchStartTime = receiveTime - 5000;

                // Space points within batch over 5 seconds
                const pointPosition = (array.length - index - 1) / Math.max(1, array.length - 1);
                effectiveTimestamp = batchStartTime + 5000 * pointPosition;

                // Update tracking of points for this producer
                this.trackTimestampForProducer(producerId, effectiveTimestamp);
              }

              return {
                value,
                timestamp: effectiveTimestamp,
                producerId
              };
            });

            // Send processed data to callback
            onMessage(processedData);
          } catch (error) {
            this.log(`Error processing message from producer ${producerId}: ${error}`, "error");
          }
        };

        ws.onerror = () => {
          this.log(`WebSocket error for producer ${producerId} during polling`, "error");

          // Only notify if multiple consecutive errors
          if (this.connectionStatus.get(producerId) !== ConnectionStatus.Error) {
            this.notifyStatusCallbacks(ConnectionStatus.Error, producerId);
          }
        };

        ws.onclose = () => {
          // This is expected behavior, no need to do anything
        };
      } catch (error) {
        this.log(`Failed to create WebSocket for ${producerId}: ${error}`, "error");

        // Only notify if persistent errors
        if (this.connectionStatus.get(producerId) !== ConnectionStatus.Error) {
          this.notifyStatusCallbacks(ConnectionStatus.Error, producerId);
        }
      }
    };

    // Initial poll
    pollOnce();

    // Set up interval for future polls
    const intervalId = window.setInterval(pollOnce, this.pollingRate);
    this.pollingIntervals.set(producerId, intervalId);
  }

  // Generate historical data for testing timeframes
  private generateHistoricalData(producerId: string, onMessage: WebSocketMessageCallback): void {
    // Create data spanning the last 5 minutes
    const now = Date.now();
    const mockData: DataPoint[] = [];
    let lastValue = Math.random() * 10;

    // Generate 300 points across 5 minutes (1 per second)
    for (let i = 0; i < 300; i++) {
      const timestamp = now - (300 - i) * 1000;
      const randomChange = (Math.random() - 0.5) * 0.5;
      lastValue = lastValue + randomChange;

      // Keep values within reasonable bounds
      if (lastValue < 0) lastValue = 0;
      if (lastValue > 20) lastValue = 20;

      mockData.push({
        timestamp,
        value: lastValue,
        producerId
      });
    }

    // Send the historical data batch
    onMessage(mockData);
  }

  private setupMockDataInterval(producerId: string, onMessage: WebSocketMessageCallback): void {
    // Initialize the last value for this producer
    let lastValue = Math.random() * 10; // Starting value between 0 and 10

    const intervalId = window.setInterval(() => {
      // Skip generating data if paused
      if (this.isPaused) {
        return;
      }

      const now = Date.now();
      const pointCount = Math.floor(Math.random() * 5) + 5;
      const mockData: DataPoint[] = [];

      for (let i = 0; i < pointCount; i++) {
        // Random walk calculation
        const randomChange = (Math.random() - 0.5) * 0.5;
        lastValue = lastValue + randomChange;

        // Keep values within reasonable bounds
        if (lastValue < 0) lastValue = 0;
        if (lastValue > 20) lastValue = 20;

        mockData.push({
          timestamp: now - Math.floor(Math.random() * 100),
          value: lastValue,
          producerId
        });
      }

      // Send the mock data
      onMessage(mockData);
    }, 500);

    // Store the interval ID for cleanup
    this.mockIntervals.set(producerId, intervalId);
  }

  // Disconnect from a specific producer
  disconnect(producerId: string): void {
    // Stop polling
    this.isPolling.set(producerId, false);

    // Clear polling interval if any
    if (this.pollingIntervals.has(producerId)) {
      window.clearInterval(this.pollingIntervals.get(producerId));
      this.pollingIntervals.delete(producerId);
    }

    // Clear mock interval if any
    if (this.mockIntervals.has(producerId)) {
      window.clearInterval(this.mockIntervals.get(producerId));
      this.mockIntervals.delete(producerId);
    }

    // Clear data callback
    this.dataCallbacks.delete(producerId);

    // Update status
    this.log(`Disconnected from producer ${producerId}`);
    this.notifyStatusCallbacks(ConnectionStatus.Disconnected, producerId);
  }

  // Disconnect from all producers
  disconnectAll(): void {
    // Get all producer IDs that are polling
    const activeProducers = Array.from(this.isPolling.keys()).filter(id => this.isPolling.get(id));

    // Disconnect each one
    activeProducers.forEach(id => {
      this.disconnect(id);
    });

    // Clear all state
    this.isPolling.clear();
    this.dataCallbacks.clear();
    this.connectionStatus.clear();

    // Notify global disconnect
    this.notifyStatusCallbacks(ConnectionStatus.Disconnected);
  }

  // Check if a connection exists for a specific producer
  isConnected(producerId: string): boolean {
    return (
      this.connectionStatus.get(producerId) === ConnectionStatus.Connected ||
      this.connectionStatus.get(producerId) === ConnectionStatus.Paused
    );
  }

  // Check if a producer is using mock data
  isMockData(producerId: string): boolean {
    return this.mockIntervals.has(producerId);
  }

  // Toggle mock data mode for testing
  setMockDataMode(enable: boolean): void {
    localStorage.setItem("useMockData", enable ? "true" : "");
    window.location.reload();
  }

  // Pause/resume data processing
  setPaused(paused: boolean): void {
    this.isPaused = paused;

    // Update status for all active producers
    const status = paused ? ConnectionStatus.Paused : ConnectionStatus.Connected;

    // Notify all connected producers about the status change
    Array.from(this.connectionStatus.keys()).forEach(producerId => {
      const currentStatus = this.connectionStatus.get(producerId);
      if (
        currentStatus === ConnectionStatus.Connected ||
        currentStatus === ConnectionStatus.Paused
      ) {
        this.notifyStatusCallbacks(status, producerId);
      }
    });

    // Also notify global status change
    this.notifyStatusCallbacks(status);
  }

  // Get the current connection status of all producers
  getConnectionStatus(): Record<string, ConnectionStatus> {
    const status: Record<string, ConnectionStatus> = {};

    // Convert our internal map to a simple object
    this.connectionStatus.forEach((connectionStatus, producerId) => {
      status[producerId] = connectionStatus;
    });

    return status;
  }
}

// Export a singleton instance
export const websocketService = new WebSocketService();
