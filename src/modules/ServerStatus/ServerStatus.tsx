import { useState, useEffect, FC } from "react";

import { useData } from "@/context/DataContext";
import { websocketService, ConnectionStatus } from "@/services/websocket.service";

// ServerStatus component for monitoring connection status
const ServerStatus: FC = () => {
  const { activeProducers, isPaused } = useData();
  const [displayStatus, setDisplayStatus] = useState<ConnectionStatus>(
    ConnectionStatus.Disconnected
  );
  const [connectedCount, setConnectedCount] = useState<number>(0);
  const [connectionTime, setConnectionTime] = useState<number | null>(null);

  // Update display status based on backend activity
  useEffect(() => {
    let statusUpdateTimeout: number;
    let activityDetected = false;

    // Status callback handler - with debouncing to avoid flickering
    const handleStatusChange = (status: ConnectionStatus) => {
      // If paused, always show paused status
      if (status === ConnectionStatus.Paused) {
        setDisplayStatus(ConnectionStatus.Paused);
        return;
      }

      // If we got any data, we consider the connection active
      if (status === ConnectionStatus.Connected) {
        if (!activityDetected) {
          activityDetected = true;
          setDisplayStatus(ConnectionStatus.Connected);

          if (!connectionTime) {
            setConnectionTime(Date.now());
          }
        }

        // Clear any pending status update
        if (statusUpdateTimeout) {
          window.clearTimeout(statusUpdateTimeout);
        }
      }
      // For other statuses, debounce to avoid flickering with fast connect/disconnect cycles
      else if (status === ConnectionStatus.Disconnected || status === ConnectionStatus.Error) {
        // Only update if we've been disconnected for a while
        if (statusUpdateTimeout) {
          window.clearTimeout(statusUpdateTimeout);
        }

        // Wait for 3 seconds before showing disconnected status
        // This prevents flickering when the backend closes connections frequently
        statusUpdateTimeout = window.setTimeout(() => {
          setDisplayStatus(status);
          activityDetected = false;
          setConnectionTime(null);
        }, 3000);
      }

      // Update connected count
      const statuses = websocketService.getConnectionStatus();
      const connected = Object.values(statuses).filter(
        s => s === ConnectionStatus.Connected || s === ConnectionStatus.Paused
      ).length;
      setConnectedCount(connected);
    };

    // Register callback and initialize
    websocketService.registerStatusCallback(handleStatusChange);

    // Clean up on unmount
    return () => {
      window.clearTimeout(statusUpdateTimeout);
      websocketService.unregisterStatusCallback(handleStatusChange);
    };
  }, []);

  // Force paused status when paused
  useEffect(() => {
    if (isPaused) {
      setDisplayStatus(ConnectionStatus.Paused);
    } else if (displayStatus === ConnectionStatus.Paused) {
      // When unpausing, go back to connected if we have active producers
      if (activeProducers.length > 0) {
        setDisplayStatus(ConnectionStatus.Connected);
      } else {
        setDisplayStatus(ConnectionStatus.Disconnected);
      }
    }
  }, [isPaused, activeProducers, displayStatus]);

  // Track incoming data separately from connection status
  useEffect(() => {
    // Check if we have at least one active producer
    if (activeProducers.length === 0) {
      // Use a setTimeout to avoid React rendering issues
      setTimeout(() => {
        setDisplayStatus(ConnectionStatus.Disconnected);
        setConnectionTime(null);
      }, 0);
    } else {
      // Use setTimeout and functional update to avoid React rendering cycle
      setTimeout(() => {
        setDisplayStatus(prev => {
          if (prev === ConnectionStatus.Disconnected) {
            return ConnectionStatus.Connecting;
          }
          return prev;
        });
      }, 0);
    }
  }, [activeProducers]);

  // Format the connection time
  const formatConnectionTime = (): string => {
    if (!connectionTime) return "00:00:00";

    const seconds = Math.floor((Date.now() - connectionTime) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      remainingSeconds.toString().padStart(2, "0")
    ].join(":");
  };

  // Set up timer to update connection time display
  const [, setTimer] = useState<number>(0);

  useEffect(() => {
    if (
      (displayStatus === ConnectionStatus.Connected || displayStatus === ConnectionStatus.Paused) &&
      connectionTime
    ) {
      const intervalId = setInterval(() => {
        setTimer(prev => prev + 1); // Force re-render
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [displayStatus, connectionTime]);

  // Status indicator color
  const getStatusColor = () => {
    switch (displayStatus) {
      case ConnectionStatus.Connected:
        return "bg-green-500";
      case ConnectionStatus.Connecting:
        return "bg-yellow-500";
      case ConnectionStatus.Error:
        return "bg-red-500";
      case ConnectionStatus.Paused:
        return "bg-orange-500";
      case ConnectionStatus.Disconnected:
      default:
        return "bg-gray-400";
    }
  };

  // Status text
  const getStatusText = () => {
    switch (displayStatus) {
      case ConnectionStatus.Connected:
        return `Connected (${formatConnectionTime()})`;
      case ConnectionStatus.Connecting:
        return "Connecting...";
      case ConnectionStatus.Error:
        return "Connection Error";
      case ConnectionStatus.Paused:
        return "Data Paused";
      case ConnectionStatus.Disconnected:
      default:
        return "Disconnected";
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />

      <span className="text-sm font-medium">{getStatusText()}</span>

      {(displayStatus === ConnectionStatus.Connected ||
        displayStatus === ConnectionStatus.Paused) && (
        <span className="text-xs text-gray-500">{connectedCount} active</span>
      )}

      {websocketService.isMockData &&
        activeProducers.length > 0 &&
        websocketService.isMockData(activeProducers[0]) && (
          <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">MOCK</span>
        )}
    </div>
  );
};

export default ServerStatus;
