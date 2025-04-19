vi.mock("../services/websocket.service", () => {
  // Define a simple mock in the factory function
  return {
    websocketService: {
      connect: vi.fn(),
      disconnect: vi.fn(),
      disconnectAll: vi.fn(),
      isConnected: vi.fn().mockReturnValue(false),
      isMockData: vi.fn().mockReturnValue(true),
      setMockDataMode: vi.fn(),
      setPaused: vi.fn(),
      getConnectionStatus: vi.fn().mockReturnValue({}),
      registerStatusCallback: vi.fn(),
      unregisterStatusCallback: vi.fn()
    },
    ConnectionStatus: {
      Connected: "connected",
      Disconnected: "disconnected",
      Connecting: "connecting",
      Error: "error",
      Paused: "paused"
    }
  };
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { DataProvider, useData } from "./DataContext";

// 3. Test component that uses the DataContext
const TestComponent = () => {
  const { activeProducers, toggleProducer, isPaused, togglePause } = useData();

  return (
    <div>
      <div data-testid="active-producers">{activeProducers.join(",")}</div>
      <button onClick={() => toggleProducer("producer-1")}>Toggle Producer</button>
      <div data-testid="paused-status">{isPaused ? "Paused" : "Active"}</div>
      <button onClick={togglePause}>Toggle Pause</button>
    </div>
  );
};

describe("DataProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provides the context values to children", () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId("active-producers")).toHaveTextContent("");
    expect(screen.getByTestId("paused-status")).toHaveTextContent("Active");
  });

  it("toggles producer state correctly", () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    const toggleButton = screen.getByRole("button", { name: /toggle producer/i });

    act(() => {
      toggleButton.click();
    });

    expect(screen.getByTestId("active-producers")).toHaveTextContent("producer-1");

    act(() => {
      toggleButton.click();
    });

    expect(screen.getByTestId("active-producers")).toHaveTextContent("");
  });

  it("toggles pause state correctly", () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    const toggleButton = screen.getByRole("button", { name: /toggle pause/i });

    act(() => {
      toggleButton.click();
    });

    expect(screen.getByTestId("paused-status")).toHaveTextContent("Paused");

    act(() => {
      toggleButton.click();
    });

    expect(screen.getByTestId("paused-status")).toHaveTextContent("Active");
  });
});
