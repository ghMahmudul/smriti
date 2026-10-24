import type React from "react";

export type ShortcutTrigger = "/" | "*" | "!" | "#" | "+";

export interface ActiveShortcut {
  trigger: ShortcutTrigger;
  subMode?: "repeat";
  query: string;
  startIndex: number;
  endIndex: number;
  text: string;
}

export interface ShortcutItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  action: () => void;
}

export function detectShortcutToken(
  text: string,
  cursorPos: number,
): ActiveShortcut | null {
  if (cursorPos < 0 || cursorPos > text.length) return null;
  const textBeforeCursor = text.slice(0, cursorPos);

  const match = /(?:^|\s)([/!*#+])([^\s]*)$/.exec(textBeforeCursor);
  if (!match || match.index === undefined) return null;

  const fullMatch = match[0];
  const trigger = match[1] as ShortcutTrigger;
  const query = match[2] ?? "";

  const hasLeadingWhitespace =
    fullMatch.startsWith(" ") ||
    fullMatch.startsWith("\t") ||
    fullMatch.startsWith("\n");

  const triggerStartIndex = match.index + (hasLeadingWhitespace ? 1 : 0);

  return {
    trigger,
    query,
    startIndex: triggerStartIndex,
    endIndex: cursorPos,
    text,
  };
}

export function removeTokenFromText(
  text: string,
  startIndex: number,
  endIndex: number,
): { newText: string; newCursorPos: number } {
  const before = text.slice(0, startIndex);
  const after = text.slice(endIndex);

  if (before.endsWith(" ") && after.startsWith(" ")) {
    const newText = before + after.slice(1);
    return { newText, newCursorPos: before.length };
  }

  if (startIndex === 0 && after.startsWith(" ")) {
    const newText = after.slice(1);
    return { newText, newCursorPos: 0 };
  }

  const newText = before + after;
  return { newText, newCursorPos: before.length };
}
