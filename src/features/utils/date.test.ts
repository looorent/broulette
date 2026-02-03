import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeMonthBounds, isOlderThanTwoMonths, sixtyDaysAgo } from "./date";

describe("sixtyDaysAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a date 60 days before the current date", () => {
    const now = new Date("2024-03-15T12:00:00Z");
    vi.setSystemTime(now);

    const result = sixtyDaysAgo();

    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(0);
    expect(result.getFullYear()).toBe(2024);
  });

  it("handles month boundaries correctly", () => {
    const now = new Date("2024-01-15T12:00:00Z");
    vi.setSystemTime(now);

    const result = sixtyDaysAgo();

    expect(result.getMonth()).toBe(10);
    expect(result.getFullYear()).toBe(2023);
  });
});

describe("isOlderThanTwoMonths", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for dates older than 60 days", () => {
    const now = new Date("2024-03-15T12:00:00Z");
    vi.setSystemTime(now);

    const oldDate = new Date("2024-01-02T12:00:00Z");
    expect(isOlderThanTwoMonths(oldDate)).toBe(true);
  });

  it("returns false for dates within 60 days", () => {
    const now = new Date("2024-03-15T12:00:00Z");
    vi.setSystemTime(now);

    const recentDate = new Date("2024-03-10T12:00:00Z");
    expect(isOlderThanTwoMonths(recentDate)).toBe(false);
  });

  it("returns false for exactly 60 days ago", () => {
    const now = new Date("2024-03-15T12:00:00Z");
    vi.setSystemTime(now);

    const exactlyThirtyDays = new Date("2024-02-14T12:00:00Z");
    expect(isOlderThanTwoMonths(exactlyThirtyDays)).toBe(false);
  });

  it("returns true for dates in the distant past", () => {
    const now = new Date("2024-03-15T12:00:00Z");
    vi.setSystemTime(now);

    const oldDate = new Date("2023-01-01T12:00:00Z");
    expect(isOlderThanTwoMonths(oldDate)).toBe(true);
  });
});

describe("computeMonthBounds", () => {
  it("returns correct bounds for a mid-month date", () => {
    const date = new Date("2024-03-15T12:00:00Z");
    const { start, end } = computeMonthBounds(date);

    expect(start.getFullYear()).toBe(2024);
    expect(start.getMonth()).toBe(2);
    expect(start.getDate()).toBe(1);

    expect(end.getFullYear()).toBe(2024);
    expect(end.getMonth()).toBe(3);
    expect(end.getDate()).toBe(1);
  });

  it("returns correct bounds for the first day of the month", () => {
    const date = new Date("2024-03-01T00:00:00Z");
    const { start, end } = computeMonthBounds(date);

    expect(start.getMonth()).toBe(2);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(3);
    expect(end.getDate()).toBe(1);
  });

  it("returns correct bounds for the last day of the month", () => {
    const date = new Date(2024, 2, 31, 12, 0, 0);
    const { start, end } = computeMonthBounds(date);

    expect(start.getMonth()).toBe(2);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(3);
    expect(end.getDate()).toBe(1);
  });

  it("handles December correctly (year boundary)", () => {
    const date = new Date("2024-12-15T12:00:00Z");
    const { start, end } = computeMonthBounds(date);

    expect(start.getFullYear()).toBe(2024);
    expect(start.getMonth()).toBe(11);
    expect(end.getFullYear()).toBe(2025);
    expect(end.getMonth()).toBe(0);
  });

  it("handles February in a leap year", () => {
    const date = new Date("2024-02-29T12:00:00Z");
    const { start, end } = computeMonthBounds(date);

    expect(start.getMonth()).toBe(1);
    expect(end.getMonth()).toBe(2);
  });
});
