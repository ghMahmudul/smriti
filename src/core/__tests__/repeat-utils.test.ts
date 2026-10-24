import { describe, expect, it } from "vitest";
import {
  formatRepeatLabel,
  getInitialDueDate,
  getNextDueDate,
  parseRepeatRule,
} from "../repeat-utils";

describe("parseRepeatRule", () => {
  it("parses 'daily'", () => {
    expect(parseRepeatRule("daily")).toEqual({
      frequency: "daily",
      interval: 1,
    });
  });

  it("parses 'weekly'", () => {
    expect(parseRepeatRule("weekly")).toEqual({
      frequency: "weekly",
      interval: 1,
    });
  });

  it("parses 'monthly'", () => {
    expect(parseRepeatRule("monthly")).toEqual({
      frequency: "monthly",
      interval: 1,
    });
  });

  it("parses 'yearly'", () => {
    expect(parseRepeatRule("yearly")).toEqual({
      frequency: "yearly",
      interval: 1,
    });
  });

  it("parses 'weekdays'", () => {
    expect(parseRepeatRule("weekdays")).toEqual({
      frequency: "weekdays",
      interval: 1,
    });
  });

  it("parses 'every 3 days'", () => {
    expect(parseRepeatRule("every 3 days")).toEqual({
      frequency: "custom",
      interval: 3,
      unit: "days",
    });
  });

  it("parses 'every 2 weeks'", () => {
    expect(parseRepeatRule("every 2 weeks")).toEqual({
      frequency: "custom",
      interval: 2,
      unit: "weeks",
    });
  });

  it("parses 'every 6 months'", () => {
    expect(parseRepeatRule("every 6 months")).toEqual({
      frequency: "custom",
      interval: 6,
      unit: "months",
    });
  });

  it("parses singular units", () => {
    expect(parseRepeatRule("every 1 day")).toEqual({
      frequency: "custom",
      interval: 1,
      unit: "days",
    });
    expect(parseRepeatRule("every 1 week")).toEqual({
      frequency: "custom",
      interval: 1,
      unit: "weeks",
    });
    expect(parseRepeatRule("every 1 month")).toEqual({
      frequency: "custom",
      interval: 1,
      unit: "months",
    });
  });

  it("is case-insensitive", () => {
    expect(parseRepeatRule("Daily")).toEqual({
      frequency: "daily",
      interval: 1,
    });
    expect(parseRepeatRule("WEEKLY")).toEqual({
      frequency: "weekly",
      interval: 1,
    });
    expect(parseRepeatRule("Every 3 Days")).toEqual({
      frequency: "custom",
      interval: 3,
      unit: "days",
    });
  });

  it("trims whitespace", () => {
    expect(parseRepeatRule("  daily  ")).toEqual({
      frequency: "daily",
      interval: 1,
    });
  });

  it("returns null for invalid values", () => {
    expect(parseRepeatRule("")).toBeNull();
    expect(parseRepeatRule("biweekly")).toBeNull();
    expect(parseRepeatRule("every days")).toBeNull();
    expect(parseRepeatRule("every 0 days")).toBeNull();
    expect(parseRepeatRule("every -1 days")).toBeNull();
    expect(parseRepeatRule("every 3 hours")).toBeNull();
  });
});

describe("formatRepeatLabel", () => {
  it("formats preset values", () => {
    expect(formatRepeatLabel("daily")).toBe("Daily");
    expect(formatRepeatLabel("weekly")).toBe("Weekly");
    expect(formatRepeatLabel("monthly")).toBe("Monthly");
    expect(formatRepeatLabel("yearly")).toBe("Yearly");
    expect(formatRepeatLabel("weekdays")).toBe("Weekdays");
  });

  it("formats custom intervals", () => {
    expect(formatRepeatLabel("every 3 days")).toBe("Every 3 days");
    expect(formatRepeatLabel("every 2 weeks")).toBe("Every 2 weeks");
    expect(formatRepeatLabel("every 6 months")).toBe("Every 6 months");
  });

  it("normalizes 'every 1 X' to preset label", () => {
    expect(formatRepeatLabel("every 1 day")).toBe("Daily");
    expect(formatRepeatLabel("every 1 week")).toBe("Weekly");
    expect(formatRepeatLabel("every 1 month")).toBe("Monthly");
  });

  it("returns raw string for invalid values", () => {
    expect(formatRepeatLabel("invalid")).toBe("invalid");
  });
});

describe("getNextDueDate", () => {
  it("advances daily from a due date", () => {
    const next = getNextDueDate("2099-01-15", "daily");
    expect(next).toBe("2099-01-16");
  });

  it("advances weekly from a due date", () => {
    const next = getNextDueDate("2099-03-01", "weekly");
    expect(next).toBe("2099-03-08");
  });

  it("advances monthly from a due date", () => {
    const next = getNextDueDate("2099-01-31", "monthly");
    expect(next).toBe("2099-03-03");
  });

  it("advances yearly from a due date", () => {
    const next = getNextDueDate("2099-06-15", "yearly");
    expect(next).toBe("2100-06-15");
  });

  it("advances custom days", () => {
    const next = getNextDueDate("2099-01-10", "every 5 days");
    expect(next).toBe("2099-01-15");
  });

  it("advances custom weeks", () => {
    const next = getNextDueDate("2099-01-01", "every 2 weeks");
    expect(next).toBe("2099-01-15");
  });

  it("advances custom months", () => {
    const next = getNextDueDate("2099-01-15", "every 3 months");
    expect(next).toBe("2099-04-15");
  });

  it("skips weekends for weekdays rule", () => {
    // 2099-01-02 is a Friday
    const next = getNextDueDate("2099-01-02", "weekdays");
    // Should skip Sat+Sun and land on Monday 2099-01-05
    expect(next).toBe("2099-01-05");
  });

  it("keeps advancing past dates until reaching today or future", () => {
    const next = getNextDueDate("2020-01-01", "yearly");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(next);
    nextDate.setHours(0, 0, 0, 0);
    expect(nextDate >= today).toBe(true);
  });

  it("uses today as base when no due date", () => {
    const next = getNextDueDate(undefined, "daily");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrow.getDate()).padStart(2, "0");
    expect(next).toBe(`${y}-${m}-${d}`);
  });

  it("returns today for invalid repeat rule", () => {
    const next = getNextDueDate("2099-01-01", "invalid");
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    expect(next).toBe(`${y}-${m}-${d}`);
  });
});

describe("getInitialDueDate", () => {
  it("defaults to today for daily preset", () => {
    const today = new Date(2026, 9, 22); // Thursday
    expect(getInitialDueDate("daily", today)).toBe("2026-10-22");
  });

  it("defaults to today for weekly preset", () => {
    const today = new Date(2026, 9, 22);
    expect(getInitialDueDate("weekly", today)).toBe("2026-10-22");
  });

  it("defaults to today for monthly preset", () => {
    const today = new Date(2026, 9, 22);
    expect(getInitialDueDate("monthly", today)).toBe("2026-10-22");
  });

  it("defaults to today for custom intervals", () => {
    const today = new Date(2026, 9, 22);
    expect(getInitialDueDate("every 3 days", today)).toBe("2026-10-22");
    expect(getInitialDueDate("every 2 weeks", today)).toBe("2026-10-22");
  });

  it("keeps today for weekdays preset if today is a weekday", () => {
    const thursday = new Date(2026, 9, 22); // Thursday
    expect(getInitialDueDate("weekdays", thursday)).toBe("2026-10-22");
  });

  it("advances to Monday for weekdays preset if today is Saturday", () => {
    const saturday = new Date(2026, 9, 24); // Saturday
    expect(getInitialDueDate("weekdays", saturday)).toBe("2026-10-26");
  });

  it("advances to Monday for weekdays preset if today is Sunday", () => {
    const sunday = new Date(2026, 9, 25); // Sunday
    expect(getInitialDueDate("weekdays", sunday)).toBe("2026-10-26");
  });

  it("accepts string date as fromDate", () => {
    expect(getInitialDueDate("weekdays", "2026-10-24")).toBe("2026-10-26");
  });

  it("falls back to today if repeat rule is invalid or empty", () => {
    const today = new Date(2026, 9, 22);
    expect(getInitialDueDate("", today)).toBe("2026-10-22");
    expect(getInitialDueDate("invalid", today)).toBe("2026-10-22");
  });
});
