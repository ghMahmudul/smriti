import { describe, expect, it } from "vitest";
import {
  filterCompletedTasks,
  formatFilterDateRange,
  getThisMonthRange,
  getThisWeekRange,
  getTodayRange,
  isRangeEqual,
  normalizeRange,
} from "../task-filter";
import type { TodoItem } from "../types";

function makeCompletedTask(
  id: string,
  projectId: string,
  completedDate?: string,
): TodoItem {
  return {
    id,
    title: `Task ${id}`,
    state: "done",
    projectId,
    parentId: null,
    metadata: {
      id,
      created: "2026-01-01T00:00:00Z",
      completed: completedDate,
    },
    body: "",
    children: [],
    order: 0,
    attachments: [],
  };
}

describe("task-filter utilities", () => {
  describe("getTodayRange", () => {
    it("returns start and end on today", () => {
      const { from, to } = getTodayRange();
      expect(from.toDateString()).toBe(to.toDateString());
      expect(from.toDateString()).toBe(new Date().toDateString());
    });
  });

  describe("getThisWeekRange", () => {
    it("calculates Monday through Sunday for a Wednesday", () => {
      // 2026-10-07 is a Wednesday
      const wednesday = new Date(2026, 9, 7);
      const { from, to } = getThisWeekRange(wednesday);
      expect(from.getFullYear()).toBe(2026);
      expect(from.getMonth()).toBe(9);
      expect(from.getDate()).toBe(5); // Monday Oct 5
      expect(to.getDate()).toBe(11); // Sunday Oct 11
    });

    it("calculates Monday through Sunday when reference date is Sunday", () => {
      // 2026-10-11 is a Sunday
      const sunday = new Date(2026, 9, 11);
      const { from, to } = getThisWeekRange(sunday);
      expect(from.getDate()).toBe(5); // Monday Oct 5
      expect(to.getDate()).toBe(11); // Sunday Oct 11
    });

    it("calculates Monday through Sunday when reference date is Monday", () => {
      // 2026-10-05 is a Monday
      const monday = new Date(2026, 9, 5);
      const { from, to } = getThisWeekRange(monday);
      expect(from.getDate()).toBe(5);
      expect(to.getDate()).toBe(11);
    });
  });

  describe("getThisMonthRange", () => {
    it("returns first day to last day of month", () => {
      // October 2026 has 31 days
      const oct = new Date(2026, 9, 15);
      const { from, to } = getThisMonthRange(oct);
      expect(from.getDate()).toBe(1);
      expect(from.getMonth()).toBe(9);
      expect(to.getDate()).toBe(31);
      expect(to.getMonth()).toBe(9);
    });

    it("handles February in leap year", () => {
      // 2024 is a leap year (29 days in Feb)
      const feb2024 = new Date(2024, 1, 10);
      const { from, to } = getThisMonthRange(feb2024);
      expect(from.getDate()).toBe(1);
      expect(to.getDate()).toBe(29);
    });
  });

  describe("normalizeRange", () => {
    it("returns null for undefined or missing from", () => {
      expect(normalizeRange(undefined)).toBeNull();
      expect(normalizeRange({ from: undefined as unknown as Date })).toBeNull();
    });

    it("normalizes single day range", () => {
      const d = new Date(2026, 9, 4);
      const res = normalizeRange({ from: d })!;
      expect(res.start).toBe(d);
      expect(res.end).toBe(d);
    });

    it("orders chronological range", () => {
      const d1 = new Date(2026, 9, 1);
      const d2 = new Date(2026, 9, 5);
      const res = normalizeRange({ from: d1, to: d2 })!;
      expect(res.start).toBe(d1);
      expect(res.end).toBe(d2);
    });

    it("swaps reversed range", () => {
      const d1 = new Date(2026, 9, 5);
      const d2 = new Date(2026, 9, 1);
      const res = normalizeRange({ from: d1, to: d2 })!;
      expect(res.start).toBe(d2);
      expect(res.end).toBe(d1);
    });
  });

  describe("isRangeEqual", () => {
    it("compares ranges correctly regardless of order", () => {
      const d1 = new Date(2026, 9, 1);
      const d2 = new Date(2026, 9, 5);
      expect(isRangeEqual({ from: d1, to: d2 }, { from: d1, to: d2 })).toBe(
        true,
      );
      expect(isRangeEqual({ from: d1, to: d2 }, { from: d2, to: d1 })).toBe(
        true,
      );
      expect(isRangeEqual({ from: d1 }, { from: d1, to: d1 })).toBe(true);
      expect(isRangeEqual(undefined, undefined)).toBe(true);
      expect(isRangeEqual({ from: d1 }, undefined)).toBe(false);
    });
  });

  describe("formatFilterDateRange", () => {
    it("returns null for undefined range or missing from date", () => {
      expect(formatFilterDateRange(undefined)).toBeNull();
      expect(
        formatFilterDateRange({ from: undefined as unknown as Date }),
      ).toBeNull();
    });

    it("returns 'Today' for today range", () => {
      expect(formatFilterDateRange(getTodayRange())).toBe("Today");
    });

    it("returns 'This Week' for this week range", () => {
      expect(formatFilterDateRange(getThisWeekRange())).toBe("This Week");
    });

    it("returns 'This Month' for this month range", () => {
      expect(formatFilterDateRange(getThisMonthRange())).toBe("This Month");
    });

    it("returns single date string for single day range", () => {
      const date = new Date(2025, 0, 15);
      const expected = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      expect(formatFilterDateRange({ from: date })).toBe(expected);
      expect(formatFilterDateRange({ from: date, to: date })).toBe(expected);
    });

    it("returns formatted range string for multi-day range", () => {
      const from = new Date(2025, 0, 10);
      const to = new Date(2025, 0, 20);
      const fromStr = from.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const toStr = to.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      expect(formatFilterDateRange({ from, to })).toBe(`${fromStr} – ${toStr}`);
    });
  });

  describe("filterCompletedTasks", () => {
    const task1 = makeCompletedTask("t1", "Inbox", "2026-10-04T10:00:00Z");
    const task2 = makeCompletedTask("t2", "work", "2026-10-03T15:00:00Z");
    const task3 = makeCompletedTask("t3", "work", "2026-09-15T08:00:00Z");
    const task4 = makeCompletedTask("t4", "personal", "2026-10-04T12:00:00Z");
    const taskNoDate = makeCompletedTask("t5", "work", undefined);
    const allTasks = [task1, task2, task3, task4, taskNoDate];

    it("returns all tasks when no filters are set", () => {
      expect(filterCompletedTasks(allTasks, "all", undefined)).toEqual(
        allTasks,
      );
      expect(filterCompletedTasks(allTasks, "", undefined)).toEqual(allTasks);
    });

    it("filters by project Inbox (case-insensitive)", () => {
      const filtered = filterCompletedTasks(allTasks, "inbox");
      expect(filtered.map((t) => t.id)).toEqual(["t1"]);
    });

    it("filters by user project", () => {
      const filtered = filterCompletedTasks(allTasks, "work");
      expect(filtered.map((t) => t.id)).toEqual(["t2", "t3", "t5"]);
    });

    it("filters by date range (inclusive)", () => {
      const range = {
        from: new Date(2026, 9, 3), // Oct 3, 2026
        to: new Date(2026, 9, 4), // Oct 4, 2026
      };
      const filtered = filterCompletedTasks(allTasks, "all", range);
      expect(filtered.map((t) => t.id)).toEqual(["t1", "t2", "t4"]);
    });

    it("filters by single date selection", () => {
      const singleDay = {
        from: new Date(2026, 9, 3),
      };
      const filtered = filterCompletedTasks(allTasks, "all", singleDay);
      expect(filtered.map((t) => t.id)).toEqual(["t2"]);
    });

    it("combines project and date filters", () => {
      const range = {
        from: new Date(2026, 9, 3),
        to: new Date(2026, 9, 4),
      };
      const filtered = filterCompletedTasks(allTasks, "work", range);
      expect(filtered.map((t) => t.id)).toEqual(["t2"]);
    });

    it("excludes tasks without completed date when date filter is active", () => {
      const range = {
        from: new Date(2026, 8, 1),
        to: new Date(2026, 9, 31),
      };
      const filtered = filterCompletedTasks(allTasks, "all", range);
      expect(filtered.find((t) => t.id === "t5")).toBeUndefined();
    });

    it("handles reverse range selection (from > to)", () => {
      const reverseRange = {
        from: new Date(2026, 9, 4),
        to: new Date(2026, 9, 3),
      };
      const filtered = filterCompletedTasks(allTasks, "all", reverseRange);
      expect(filtered.map((t) => t.id)).toEqual(["t1", "t2", "t4"]);
    });
  });
});
