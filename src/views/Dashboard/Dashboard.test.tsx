import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import Dashboard from "./Dashboard";
import { UIProvider } from "@/context/UIContext";
import { DataProvider } from "@/context/DataContext";

vi.mock("recharts", () => ({
  LineChart: vi
    .fn()
    .mockImplementation(({ children }) => <div data-testid="line-chart">{children}</div>),
  Line: vi.fn().mockImplementation(() => <div data-testid="chart-line" />),
  XAxis: vi.fn().mockImplementation(() => <div data-testid="x-axis" />),
  YAxis: vi.fn().mockImplementation(() => <div data-testid="y-axis" />),
  CartesianGrid: vi.fn().mockImplementation(() => <div data-testid="cartesian-grid" />),
  Tooltip: vi.fn().mockImplementation(() => <div data-testid="tooltip" />),
  ResponsiveContainer: vi
    .fn()
    .mockImplementation(({ children }) => <div data-testid="responsive-container">{children}</div>),
  Legend: vi.fn().mockImplementation(() => <div data-testid="legend" />),
  Brush: vi.fn().mockImplementation(() => <div data-testid="brush" />)
}));

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dashboard with no active producers", () => {
    render(
      <UIProvider>
        <DataProvider>
          <Dashboard />
        </DataProvider>
      </UIProvider>
    );

    expect(screen.getByText("No Data Sources Selected")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Select one or more data producers from the sidebar to visualize their data."
      )
    ).toBeInTheDocument();
  });
});
