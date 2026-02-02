import { describe, expect, it } from "vitest";

import { formatOpeningHoursFor } from "./opening-hours";

describe("formatOpeningHoursFor", () => {
  describe("when opening hours string is empty or undefined", () => {
    it("returns unknown when osmOpeningHours is undefined", () => {
      const result = formatOpeningHoursFor(new Date(), undefined, "en-US");

      expect(result.unknown).toBe(true);
      expect(result.open).toBeUndefined();
      expect(result.hoursLabel).toBe("Unknown opening hours :(");
    });

    it("returns unknown when osmOpeningHours is null", () => {
      const result = formatOpeningHoursFor(new Date(), null, "en-US");

      expect(result.unknown).toBe(true);
      expect(result.open).toBeUndefined();
    });

    it("returns unknown when osmOpeningHours is empty string", () => {
      const result = formatOpeningHoursFor(new Date(), "", "en-US");

      expect(result.unknown).toBe(true);
      expect(result.open).toBeUndefined();
    });
  });

  describe("when opening hours string is valid", () => {
    it("returns open status for 24/7 opening hours", () => {
      const result = formatOpeningHoursFor(new Date(), "24/7", "en-US");

      expect(result.unknown).toBe(false);
      expect(result.open).toBe(true);
      expect(result.hoursLabel).toBe("Open 24 hours");
    });

    it("returns correct open status during open hours", () => {
      const monday9am = new Date(2024, 0, 1, 9, 0, 0);

      const result = formatOpeningHoursFor(monday9am, "Mo-Fr 08:00-22:00", "en-US");

      expect(result.unknown).toBe(false);
      expect(result.open).toBe(true);
    });

    it("returns closed status during closed hours", () => {
      const monday7am = new Date(2024, 0, 1, 7, 0, 0);

      const result = formatOpeningHoursFor(monday7am, "Mo-Fr 08:00-22:00", "en-US");

      expect(result.unknown).toBe(false);
      expect(result.open).toBe(false);
    });

    it("returns Closed label when restaurant is closed all day", () => {
      const sunday = new Date(2024, 0, 7, 12, 0, 0);

      const result = formatOpeningHoursFor(sunday, "Mo-Sa 08:00-22:00", "en-US");

      expect(result.unknown).toBe(false);
      expect(result.open).toBe(false);
      expect(result.hoursLabel).toBe("Closed");
    });

    it("formats time intervals correctly", () => {
      const monday = new Date(2024, 0, 1, 12, 0, 0);

      const result = formatOpeningHoursFor(monday, "Mo 09:00-14:00,18:00-22:00", "en-US");

      expect(result.unknown).toBe(false);
      expect(result.hoursLabel).toContain("09:00");
      expect(result.hoursLabel).toContain("14:00");
    });

    it("includes day label", () => {
      const monday = new Date(2024, 0, 1, 12, 0, 0);

      const result = formatOpeningHoursFor(monday, "Mo-Fr 08:00-22:00", "en-US");

      expect(result.dayLabel).toBeTruthy();
    });
  });

  describe("when opening hours string is invalid", () => {
    it("returns unknown for invalid opening hours format", () => {
      const result = formatOpeningHoursFor(new Date(), "invalid opening hours", "en-US");

      expect(result.unknown).toBe(true);
      expect(result.open).toBeUndefined();
      expect(result.hoursLabel).toBe("Unknown opening hours :(");
    });

    it("returns unknown for malformed time", () => {
      const result = formatOpeningHoursFor(new Date(), "Mo 25:00-30:00", "en-US");

      expect(result.unknown).toBe(true);
    });
  });

  describe("locale handling", () => {
    it("uses default locale when not provided", () => {
      const monday = new Date(2024, 0, 1, 12, 0, 0);

      const result = formatOpeningHoursFor(monday, "Mo 09:00-22:00");

      expect(result.unknown).toBe(false);
    });
  });
});
