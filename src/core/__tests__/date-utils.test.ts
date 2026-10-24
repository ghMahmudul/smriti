import { describe, expect, it } from "vitest";
import {
  formatLocalDate,
  getFutureLocalDateString,
  getTodayLocalDateString,
  parseDueDate,
} from "../date-utils";

describe("date-utils", () => {
  describe("formatLocalDate", () => {
    it("formats a Date to YYYY-MM-DD in local time", () => {
      const d = new Date(2026, 4, 9); // May 9, 2026
      expect(formatLocalDate(d)).toBe("2026-05-09");
    });
  });

  describe("getTodayLocalDateString and getFutureLocalDateString", () => {
    it("returns valid YYYY-MM-DD format for today and next week", () => {
      const today = getTodayLocalDateString();
      const in7Days = getFutureLocalDateString(7);

      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(in7Days).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(in7Days > today).toBe(true);
    });
  });

  describe("parseDueDate", () => {
    it("returns null fields for undefined or empty input", () => {
      expect(parseDueDate(undefined)).toEqual({
        localDateStr: null,
        timestamp: null,
        hasTime: false,
        timeMinutes: null,
      });

      expect(parseDueDate("   ")).toEqual({
        localDateStr: null,
        timestamp: null,
        hasTime: false,
        timeMinutes: null,
      });
    });

    it("parses date-only string accurately without timezone drift", () => {
      const result = parseDueDate("2026-10-04");
      expect(result.localDateStr).toBe("2026-10-04");
      expect(result.hasTime).toBe(false);
      expect(result.timeMinutes).toBeNull();
      expect(typeof result.timestamp).toBe("number");
      expect(Number.isNaN(result.timestamp)).toBe(false);
    });

    it("parses ISO timestamp with time and extracts local components", () => {
      const result = parseDueDate("2026-10-04T14:30:00Z");
      expect(result.hasTime).toBe(true);
      expect(typeof result.localDateStr).toBe("string");
      expect(typeof result.timeMinutes).toBe("number");
      expect(result.timeMinutes! >= 0 && result.timeMinutes! < 1440).toBe(true);
      expect(typeof result.timestamp).toBe("number");
    });

    it("gracefully handles invalid date strings without crashing or returning NaN", () => {
      const result = parseDueDate("not-a-valid-date");
      expect(result).toEqual({
        localDateStr: null,
        timestamp: null,
        hasTime: false,
        timeMinutes: null,
      });
    });
  });
});
