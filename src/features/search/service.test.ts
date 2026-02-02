import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createNextServices,
  createServiceDatetime,
  createServiceEnd,
  SERVICE_DEFAULTS
} from "./service";

describe("createServiceDatetime", () => {
  it("returns middle of lunch time for Lunch timeslot", () => {
    const day = new Date(2024, 2, 15, 0, 0, 0);

    const result = createServiceDatetime(day, "Lunch");

    expect(result.getHours()).toBe(SERVICE_DEFAULTS.Lunch.middle.hour);
    expect(result.getMinutes()).toBe(SERVICE_DEFAULTS.Lunch.middle.minute);
  });

  it("returns middle of dinner time for Dinner timeslot", () => {
    const day = new Date(2024, 2, 15, 0, 0, 0);

    const result = createServiceDatetime(day, "Dinner");

    expect(result.getHours()).toBe(SERVICE_DEFAULTS.Dinner.middle.hour);
    expect(result.getMinutes()).toBe(SERVICE_DEFAULTS.Dinner.middle.minute);
  });

  it("returns current time for RightNow timeslot", () => {
    vi.useFakeTimers();
    const now = new Date(2024, 2, 15, 14, 30, 0);
    vi.setSystemTime(now);

    const day = new Date(2024, 2, 15, 0, 0, 0);
    const result = createServiceDatetime(day, "RightNow");

    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);

    vi.useRealTimers();
  });

  it("returns the date unchanged for Custom timeslot", () => {
    const day = new Date(2024, 2, 15, 18, 45, 0);

    const result = createServiceDatetime(day, "Custom");

    expect(result.getHours()).toBe(18);
    expect(result.getMinutes()).toBe(45);
  });

  it("returns current time for null timeslot", () => {
    vi.useFakeTimers();
    const now = new Date(2024, 2, 15, 14, 30, 0);
    vi.setSystemTime(now);

    const day = new Date(2024, 2, 15, 0, 0, 0);
    const result = createServiceDatetime(day, null);

    expect(result.getTime()).toBe(now.getTime());

    vi.useRealTimers();
  });
});

describe("createServiceEnd", () => {
  it("returns end of lunch time for Lunch timeslot", () => {
    const day = new Date(2024, 2, 15, 0, 0, 0);

    const result = createServiceEnd(day, "Lunch");

    expect(result.getHours()).toBe(SERVICE_DEFAULTS.Lunch.end.hour);
    expect(result.getMinutes()).toBe(SERVICE_DEFAULTS.Lunch.end.minute);
  });

  it("returns end of dinner time for Dinner timeslot", () => {
    const day = new Date(2024, 2, 15, 0, 0, 0);

    const result = createServiceEnd(day, "Dinner");

    expect(result.getHours()).toBe(SERVICE_DEFAULTS.Dinner.end.hour);
    expect(result.getMinutes()).toBe(SERVICE_DEFAULTS.Dinner.end.minute);
  });

  it("returns midnight of next day for RightNow timeslot", () => {
    const day = new Date(2024, 2, 15, 14, 30, 0);

    const result = createServiceEnd(day, "RightNow");

    expect(result.getDate()).toBe(16);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it("returns 1 hour after the date for Custom timeslot", () => {
    const day = new Date(2024, 2, 15, 18, 45, 0);

    const result = createServiceEnd(day, "Custom");

    expect(result.getTime()).toBe(day.getTime() + 60 * 60 * 1000);
  });

  it("returns 1 hour after the date for null timeslot", () => {
    const day = new Date(2024, 2, 15, 18, 45, 0);

    const result = createServiceEnd(day, null);

    expect(result.getTime()).toBe(day.getTime() + 60 * 60 * 1000);
  });
});

describe("createNextServices", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns RightNow when outside lunch and dinner hours", () => {
    const now = new Date(2024, 2, 15, 9, 0, 0);
    vi.setSystemTime(now);

    const services = createNextServices(now);

    expect(services[0].timeslot).toBe("RightNow");
    expect(services[0].label.compact).toBe("Now");
  });

  it("returns Today lunch when during lunch hours", () => {
    const now = new Date(2024, 2, 15, 12, 30, 0);
    vi.setSystemTime(now);

    const services = createNextServices(now);

    expect(services[0].timeslot).toBe("Lunch");
    expect(services[0].label.display).toBe("Today lunch");
  });

  it("returns Today dinner when during dinner hours", () => {
    const now = new Date(2024, 2, 15, 19, 30, 0);
    vi.setSystemTime(now);

    const services = createNextServices(now);

    expect(services[0].timeslot).toBe("Dinner");
    expect(services[0].label.display).toBe("Today dinner");
  });

  it("includes today lunch option when before lunch start", () => {
    const now = new Date(2024, 2, 15, 9, 0, 0);
    vi.setSystemTime(now);

    const services = createNextServices(now);
    const lunchOption = services.find(s => s.timeslot === "Lunch" && s.label.display === "Today lunch");

    expect(lunchOption).toBeDefined();
  });

  it("includes today dinner option when before dinner start", () => {
    const now = new Date(2024, 2, 15, 12, 0, 0);
    vi.setSystemTime(now);

    const services = createNextServices(now);
    const dinnerOption = services.find(s => s.timeslot === "Dinner" && s.label.display === "Today dinner");

    expect(dinnerOption).toBeDefined();
  });

  it("does not include today lunch when after lunch start", () => {
    const now = new Date(2024, 2, 15, 15, 0, 0);
    vi.setSystemTime(now);

    const services = createNextServices(now);
    const todayLunch = services.filter(s => s.timeslot === "Lunch" && s.label.display === "Today lunch");

    expect(todayLunch).toHaveLength(0);
  });

  it("always includes tomorrow options", () => {
    const now = new Date(2024, 2, 15, 20, 0, 0);
    vi.setSystemTime(now);

    const services = createNextServices(now);

    const tomorrowLunch = services.find(s => s.label.compact === "Tmw lunch");
    const tomorrowDinner = services.find(s => s.label.compact === "Tmw dinner");

    expect(tomorrowLunch).toBeDefined();
    expect(tomorrowDinner).toBeDefined();
  });

  it("includes pick a date option at the end", () => {
    const now = new Date(2024, 2, 15, 12, 0, 0);
    vi.setSystemTime(now);

    const services = createNextServices(now);
    const lastOption = services[services.length - 1];

    expect(lastOption.label.display).toBe("Pick a date");
    expect(lastOption.isAvailable).toBe(false);
  });

  it("sets correct icon names", () => {
    const now = new Date(2024, 2, 15, 9, 0, 0);
    vi.setSystemTime(now);

    const services = createNextServices(now);

    expect(services.find(s => s.timeslot === "RightNow")?.iconName).toBe("clock");
    expect(services.find(s => s.timeslot === "Lunch")?.iconName).toBe("sun");
    expect(services.find(s => s.timeslot === "Dinner")?.iconName).toBe("moon");
    expect(services.find(s => s.timeslot === null)?.iconName).toBe("calendar");
  });
});
