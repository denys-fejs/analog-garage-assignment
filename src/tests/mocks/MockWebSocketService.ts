import { EventEmitter } from "events";

import { DataPoint } from "@/types";
import { ConnectionStatus } from "@/services/websocket.service";

// A mock implementation of the WebSocket service for testing
class MockWebSocketService {
  private emitter = new EventEmitter();
  private statusCallbacks: Array<(status: ConnectionStatus, producerId?: string) => void> = [];
  private activeConnections = new Set<string>();
  private isPaused = false;
  private useMockData = true;
  private mockIntervals: Record<string, NodeJS.Timeout> = {};

  constructor() {
    console.log("MockWebSocketService initialized");
  }

  // Register a callback function to receive connection status updates
  registerStatusCallback(callback: (status: ConnectionStatus, producerId?: string) => void): void {
    this.statusCallbacks.push(callback);
  }

  // Unregister a previously registered status callback
  unregisterStatusCallback(
    callback: (status: ConnectionStatus, producerId?: string) => void
  ): void {
    this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
  }

  // Notify all registered callbacks of a status change
  private notifyStatusCallbacks(status: ConnectionStatus, producerId?: string): void {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status, producerId);
      } catch (error) {
        console.error(`Error in status callback: ${error}`);
      }
    });
  }

  // Connect to a specific producer
  connect(producerId: string, onMessage: (data: DataPoint[]) => void): void {
    if (this.activeConnections.has(producerId)) {
      return;
    }

    this.activeConnections.add(producerId);

    // Generate initial historical data
    this.generateHistoricalData(producerId, onMessage);

    // Setup interval for mock data
    const intervalId = setInterval(() => {
      if (!this.isPaused) {
        const mockData = this.generateMockData(producerId);
        onMessage(mockData);
      }
    }, 500);

    this.mockIntervals[producerId] = intervalId;

    // Notify status change
    this.notifyStatusCallbacks(
      this.isPaused ? ConnectionStatus.Paused : ConnectionStatus.Connected,
      producerId
    );

    // Register listener for manual data injection (for tests)
    this.emitter.on(`data:${producerId}`, (data: DataPoint[]) => {
      onMessage(data);
    });
  }

  // Disconnect from a specific producer
  disconnect(producerId: string): void {
    if (!this.activeConnections.has(producerId)) {
      return;
    }

    this.activeConnections.delete(producerId);

    if (this.mockIntervals[producerId]) {
      clearInterval(this.mockIntervals[producerId]);
      delete this.mockIntervals[producerId];
    }

    this.emitter.removeAllListeners(`data:${producerId}`);

    this.notifyStatusCallbacks(ConnectionStatus.Disconnected, producerId);
  }

  // Disconnect from all producers
  disconnectAll(): void {
    const producers = [...this.activeConnections];
    producers.forEach(id => this.disconnect(id));
    this.activeConnections.clear();
    this.notifyStatusCallbacks(ConnectionStatus.Disconnected);
  }

  // Check if a connection exists for a specific producer
  isConnected(producerId: string): boolean {
    return this.activeConnections.has(producerId);
  }

  // Check if a producer is using mock data
  isMockData(): boolean {
    return true; // Always true for mock service
  }

  // Set mock data mode
  setMockDataMode(enable: boolean): void {
    this.useMockData = enable;
  }

  // Pause/resume data processing
  setPaused(paused: boolean): void {
    this.isPaused = paused;

    const status = paused ? ConnectionStatus.Paused : ConnectionStatus.Connected;

    this.activeConnections.forEach(producerId => {
      this.notifyStatusCallbacks(status, producerId);
    });

    this.notifyStatusCallbacks(status);
  }

  // Get connection status
  getConnectionStatus(): Record<string, ConnectionStatus> {
    const status: Record<string, ConnectionStatus> = {};

    this.activeConnections.forEach(producerId => {
      status[producerId] = this.isPaused ? ConnectionStatus.Paused : ConnectionStatus.Connected;
    });

    return status;
  }

  // Test helper: manually inject data for a producer
  injectData(producerId: string, data: DataPoint[]): void {
    if (this.activeConnections.has(producerId) && !this.isPaused) {
      this.emitter.emit(`data:${producerId}`, data);
    }
  }

  // Test helper: simulate connection error
  simulateError(producerId: string): void {
    if (this.activeConnections.has(producerId)) {
      this.notifyStatusCallbacks(ConnectionStatus.Error, producerId);
    }
  }

  // Private: Generate historical data for testing
  private generateHistoricalData(producerId: string, onMessage: (data: DataPoint[]) => void): void {
    const now = Date.now();
    const mockData: DataPoint[] = [];
    let lastValue = Math.random() * 10;

    // Generate 60 points across 1 minute (1 per second)
    for (let i = 0; i < 60; i++) {
      const timestamp = now - (60 - i) * 1000;
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

    onMessage(mockData);
  }

  // Private: Generate mock data points
  private generateMockData(producerId: string): DataPoint[] {
    const now = Date.now();
    const mockData: DataPoint[] = [];

    // Generate 3-5 data points
    const pointCount = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < pointCount; i++) {
      mockData.push({
        timestamp: now - Math.floor(Math.random() * 100),
        value: Math.random() * 20,
        producerId
      });
    }

    return mockData;
  }
}

export const mockWebSocketService = new MockWebSocketService();
