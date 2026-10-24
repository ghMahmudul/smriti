import { describe, expect, it } from "vitest";
import {
  formatLocalDate,
  getFutureLocalDateString,
  getTodayLocalDateString,
} from "../date-utils";
import { SORT_CONFIG, SORT_OPTIONS, sortTasks } from "../task-sort";
import type { TodoItem } from "../types";

function makeTask(
  id: string,
  title: string,
  metadata?: Partial<TodoItem["metadata"]>,
): TodoItem {
  return {
    id,
    title,
    state: "open",
    projectId: "Inbox",
    parentId: null,
    metadata: {
      id,
      created: "2026-10-01T10:00:00.000Z",
      ...metadata,
    },
    body: "",
    children: [],
    order: 0,
    attachments: [],
  };
}

describe("sortTasks", () => {
  describe("default sort", () => {
    it("returns original order when sortOrder is normal", () => {
      const tasks = [
        makeTask("3", "Task 3"),
        makeTask("1", "Task 1"),
        makeTask("2", "Task 2"),
      ];
      const sorted = sortTasks(tasks, "default", "normal");
      expect(sorted.map((t) => t.id)).toEqual(["3", "1", "2"]);
    });

    it("applies multi-tier smart sorting when sortOrder is smart", () => {
      const today = getTodayLocalDateString();
      const yesterday = formatLocalDate(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
      );
      const in3Days = getFutureLocalDateString(3);
      const in5Days = getFutureLocalDateString(5);
      const in10Days = getFutureLocalDateString(10);

      const tasks = [
        makeTask("J", "Undated none"),
        makeTask("D", "Due in 3 days", { due: in3Days }),
        makeTask("A", "Overdue", { due: yesterday }),
        makeTask("B", "Today low", { due: today, priority: "low" }),
        makeTask("G", "Undated medium", { priority: "medium" }),
        makeTask("C", "Today high", { due: today, priority: "high" }),
        makeTask("H", "Future 10 days", { due: in10Days }),
        makeTask("F", "Undated high", { priority: "high" }),
        makeTask("E", "Due in 5 days", { due: in5Days }),
        makeTask("I", "Undated low", { priority: "low" }),
      ];

      const sorted = sortTasks(tasks, "default", "smart");
      expect(sorted.map((t) => t.id)).toEqual([
        "A", // 1. Overdue
        "C", // 2. Today (high priority)
        "B", // 2. Today (low priority)
        "D", // 3. Due soon (3 days)
        "E", // 3. Due soon (5 days)
        "F", // 4. Undated high priority
        "G", // 5. Undated medium priority
        "H", // 6. Future scheduled (> 7 days)
        "I", // 7. Undated low priority
        "J", // 7. Undated no priority
      ]);
    });

    it("orders timed tasks chronologically within the same day and priority", () => {
      const today = getTodayLocalDateString();
      const tasks = [
        makeTask("2", "Afternoon", {
          due: `${today}T15:00:00`,
          priority: "high",
        }),
        makeTask("1", "Morning", {
          due: `${today}T09:00:00`,
          priority: "high",
        }),
        makeTask("3", "All-day", {
          due: today,
          priority: "high",
        }),
      ];

      const sorted = sortTasks(tasks, "default", "smart");
      expect(sorted.map((t) => t.id)).toEqual(["1", "2", "3"]);
    });

    it("safely handles malformed due dates by treating them as undated", () => {
      const today = getTodayLocalDateString();
      const tasks = [
        makeTask("1", "Malformed due", { due: "not-a-date", priority: "low" }),
        makeTask("2", "Valid today", { due: today, priority: "low" }),
      ];

      const sorted = sortTasks(tasks, "default", "smart");
      expect(sorted.map((t) => t.id)).toEqual(["2", "1"]);
    });
  });

  describe("priority sort", () => {
    const tasks = [
      makeTask("1", "No priority", { id: "1", created: "2026-10-01" }),
      makeTask("2", "Low priority", {
        id: "2",
        created: "2026-10-01",
        priority: "low",
      }),
      makeTask("3", "High priority", {
        id: "3",
        created: "2026-10-01",
        priority: "high",
      }),
      makeTask("4", "Medium priority", {
        id: "4",
        created: "2026-10-01",
        priority: "medium",
      }),
    ];

    it("sorts highest first (desc) with none at bottom", () => {
      const sorted = sortTasks(tasks, "priority", "desc");
      expect(sorted.map((t) => t.id)).toEqual(["3", "4", "2", "1"]);
    });

    it("sorts lowest first (asc) with none as lowest priority at top", () => {
      const sorted = sortTasks(tasks, "priority", "asc");
      expect(sorted.map((t) => t.id)).toEqual(["1", "2", "4", "3"]);
    });
  });

  describe("date sort", () => {
    const tasks = [
      makeTask("1", "No due", { id: "1", created: "2026-10-01" }),
      makeTask("2", "Due later", {
        id: "2",
        created: "2026-10-01",
        due: "2026-10-15",
      }),
      makeTask("3", "Due sooner", {
        id: "3",
        created: "2026-10-01",
        due: "2026-10-05",
      }),
    ];

    it("sorts earliest first (asc) with undated tasks at bottom", () => {
      const sorted = sortTasks(tasks, "due", "asc");
      expect(sorted.map((t) => t.id)).toEqual(["3", "2", "1"]);
    });

    it("sorts latest first (desc) with undated tasks at bottom", () => {
      const sorted = sortTasks(tasks, "due", "desc");
      expect(sorted.map((t) => t.id)).toEqual(["2", "3", "1"]);
    });

    it("correctly handles ISO timestamps with timezones", () => {
      const tzTasks = [
        makeTask("1", "Earlier in UTC", { due: "2026-10-05T09:00:00+06:00" }), // 03:00 UTC
        makeTask("2", "Later in UTC", { due: "2026-10-05T05:00:00Z" }), // 05:00 UTC
      ];
      const sortedAsc = sortTasks(tzTasks, "due", "asc");
      expect(sortedAsc.map((t) => t.id)).toEqual(["1", "2"]);

      const sortedDesc = sortTasks(tzTasks, "due", "desc");
      expect(sortedDesc.map((t) => t.id)).toEqual(["2", "1"]);
    });
  });

  describe("title sort", () => {
    const tasks = [
      makeTask("1", "Banana"),
      makeTask("2", "Apple"),
      makeTask("3", "Cherry"),
    ];

    it("sorts A to Z (asc)", () => {
      const sorted = sortTasks(tasks, "title", "asc");
      expect(sorted.map((t) => t.title)).toEqual(["Apple", "Banana", "Cherry"]);
    });

    it("sorts Z to A (desc)", () => {
      const sorted = sortTasks(tasks, "title", "desc");
      expect(sorted.map((t) => t.title)).toEqual(["Cherry", "Banana", "Apple"]);
    });
  });

  describe("created date sort", () => {
    const tasks = [
      makeTask("1", "Oldest", { id: "1", created: "2026-09-01T10:00:00.000Z" }),
      makeTask("2", "Newest", { id: "2", created: "2026-10-03T12:00:00.000Z" }),
      makeTask("3", "Middle", { id: "3", created: "2026-09-15T08:00:00.000Z" }),
    ];

    it("sorts newest first (desc)", () => {
      const sorted = sortTasks(tasks, "created", "desc");
      expect(sorted.map((t) => t.id)).toEqual(["2", "3", "1"]);
    });

    it("sorts oldest first (asc)", () => {
      const sorted = sortTasks(tasks, "created", "asc");
      expect(sorted.map((t) => t.id)).toEqual(["1", "3", "2"]);
    });
  });
});

describe("SORT_CONFIG", () => {
  it("provides matching defaultOrder and contextual order options for each sort field", () => {
    expect(SORT_CONFIG.default.label).toBe("Default");
    expect(SORT_CONFIG.default.defaultOrder).toBe("smart");
    expect(SORT_CONFIG.default.orderOptions).toEqual([
      { value: "smart", label: "Smart" },
      { value: "normal", label: "Normal" },
    ]);

    expect(SORT_CONFIG.due.label).toBe("Date");
    expect(SORT_CONFIG.due.defaultOrder).toBe("asc");
    expect(SORT_CONFIG.due.orderOptions).toEqual([
      { value: "asc", label: "Earliest first" },
      { value: "desc", label: "Latest first" },
    ]);

    expect(SORT_CONFIG.priority.defaultOrder).toBe("desc");
    expect(SORT_CONFIG.priority.orderOptions).toEqual([
      { value: "desc", label: "Highest first" },
      { value: "asc", label: "Lowest first" },
    ]);

    expect(SORT_CONFIG.title.defaultOrder).toBe("asc");
    expect(SORT_CONFIG.title.orderOptions).toEqual([
      { value: "asc", label: "A to Z" },
      { value: "desc", label: "Z to A" },
    ]);

    expect(SORT_CONFIG.created.label).toBe("Created");
    expect(SORT_CONFIG.created.defaultOrder).toBe("desc");
    expect(SORT_CONFIG.created.orderOptions).toEqual([
      { value: "desc", label: "Newest first" },
      { value: "asc", label: "Oldest first" },
    ]);
  });
});

describe("SORT_OPTIONS", () => {
  it("orders sort options by Default, Date, Created, Priority, Title", () => {
    expect(SORT_OPTIONS.map((o) => o.label)).toEqual([
      "Default",
      "Date",
      "Created",
      "Priority",
      "Title",
    ]);
  });
});
