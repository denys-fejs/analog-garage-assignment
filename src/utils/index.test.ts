import { describe, it, expect } from "vitest";

import { TimeframeUnit } from "@/types";
import { normalizeTimestamp, timeframeToMs, calculateMetrics } from "./index";

describe("normalizeTimestamp", () => {
  it("should convert string timestamps to numbers", () => {
    expect(normalizeTimestamp("1627776000000")).toBe(1627776000000);
  });

  it("should convert seconds to milliseconds for small timestamps", () => {
    expect(normalizeTimestamp(1627776)).toBe(1627776000);
  });

  it("should not modify timestamps already in milliseconds", () => {
    expect(normalizeTimestamp(1627776000000)).toBe(1627776000000);
  });
});

describe("timeframeToMs", () => {
  it("should convert seconds to milliseconds", () => {
    expect(timeframeToMs({ value: 30, unit: TimeframeUnit.Seconds, label: "30 seconds" })).toBe(
      30000
    );
  });

  it("should convert minutes to milliseconds", () => {
    expect(timeframeToMs({ value: 5, unit: TimeframeUnit.Minutes, label: "5 minutes" })).toBe(
      300000
    );
  });

  it("should convert hours to milliseconds", () => {
    expect(timeframeToMs({ value: 1, unit: TimeframeUnit.Hours, label: "1 hour" })).toBe(3600000);
  });
});

describe("calculateMetrics", () => {
  it("should calculate correct metrics for a dataset", () => {
    const data = [
      { value: 5, timestamp: 1000, producerId: "test" },
      { value: 10, timestamp: 2000, producerId: "test" },
      { value: 15, timestamp: 3000, producerId: "test" }
    ];

    const metrics = calculateMetrics(data);

    expect(metrics.min).toBe(5);
    expect(metrics.max).toBe(15);
    expect(metrics.average).toBe(10);
    expect(metrics.count).toBe(3);
    expect(metrics.duration).toBe(2000);
  });

  it("should return default metrics for empty dataset", () => {
    const metrics = calculateMetrics([]);

    expect(metrics.min).toBe(0);
    expect(metrics.max).toBe(0);
    expect(metrics.average).toBe(0);
    expect(metrics.count).toBe(0);
    expect(metrics.duration).toBe(0);
  });
});
