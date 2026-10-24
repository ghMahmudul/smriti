/**
 * Core date utilities for local-first calendar comparisons.
 *
 * Ensures consistent handling of floating local dates (YYYY-MM-DD)
 * and ISO timestamps across all timezones.
 */

export interface ParsedDueDate {
  localDateStr: string | null;
  timestamp: number | null;
  hasTime: boolean;
  timeMinutes: number | null;
}

/**
 * Returns a date formatted as YYYY-MM-DD in the user's local timezone.
 */
export function formatLocalDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD in the user's local timezone.
 */
export function getTodayLocalDateString(): string {
  return formatLocalDate(new Date());
}

/**
 * Returns the date N days from today as YYYY-MM-DD in local timezone.
 */
export function getFutureLocalDateString(daysAhead = 7): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return formatLocalDate(date);
}

/**
 * Safely parses a due date string into normalized local calendar components.
 * Handles both date-only ("YYYY-MM-DD") and ISO timestamps ("YYYY-MM-DDTHH:mm:ssZ").
 */
export function parseDueDate(due?: string): ParsedDueDate {
  if (!due || typeof due !== "string") {
    return {
      localDateStr: null,
      timestamp: null,
      hasTime: false,
      timeMinutes: null,
    };
  }

  const trimmed = due.trim();
  if (!trimmed) {
    return {
      localDateStr: null,
      timestamp: null,
      hasTime: false,
      timeMinutes: null,
    };
  }

  // Format 1: Date-only ("YYYY-MM-DD")
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);

    const localMidnight = new Date(year, month - 1, day, 0, 0, 0, 0);
    const time = localMidnight.getTime();

    if (Number.isNaN(time)) {
      return {
        localDateStr: null,
        timestamp: null,
        hasTime: false,
        timeMinutes: null,
      };
    }

    return {
      localDateStr: trimmed,
      timestamp: time,
      hasTime: false,
      timeMinutes: null,
    };
  }

  // Format 2: ISO timestamp or datetime with time
  const parsedTime = Date.parse(trimmed);
  if (Number.isNaN(parsedTime)) {
    return {
      localDateStr: null,
      timestamp: null,
      hasTime: false,
      timeMinutes: null,
    };
  }

  const d = new Date(parsedTime);
  const localDateStr = formatLocalDate(d);
  const timeMinutes = d.getHours() * 60 + d.getMinutes();

  return {
    localDateStr,
    timestamp: parsedTime,
    hasTime: true,
    timeMinutes,
  };
}

/**
 * Calculates day difference between target date string and today in local calendar days.
 * Works seamlessly with both date-only ("YYYY-MM-DD") and ISO timestamps.
 */
export function getDayDifference(dateStr?: string): number {
  const parsed = parseDueDate(dateStr);
  if (!parsed.localDateStr) return 0;

  const parts = parsed.localDateStr.split("-").map(Number);
  const targetYear = parts[0] ?? 0;
  const targetMonth = (parts[1] ?? 1) - 1;
  const targetDay = parts[2] ?? 1;

  const targetDate = new Date(targetYear, targetMonth, targetDay);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.round((targetDate.getTime() - today.getTime()) / 86400000);
}

export function getDueDateColor(dateStr?: string): string {
  if (!dateStr) return "text-muted-foreground";
  const diffDays = getDayDifference(dateStr);
  if (diffDays < 0) return "text-destructive";
  return "text-emerald-600 dark:text-emerald-400";
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const diffDays = getDayDifference(dateStr);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 7) return `${diffDays} days`;

  const parsed = parseDueDate(dateStr);
  if (!parsed.localDateStr) return dateStr;

  const parts = parsed.localDateStr.split("-").map(Number);
  const targetDate = new Date(
    parts[0] ?? 0,
    (parts[1] ?? 1) - 1,
    parts[2] ?? 1,
  );
  return targetDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
