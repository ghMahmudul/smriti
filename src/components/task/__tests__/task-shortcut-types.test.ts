import { describe, expect, it } from "vitest";
import {
  detectShortcutToken,
  removeTokenFromText,
} from "../task-shortcut-types";

describe("detectShortcutToken", () => {
  it("detects '/' at start of text", () => {
    const result = detectShortcutToken("/", 1);
    expect(result).toEqual({
      trigger: "/",
      query: "",
      startIndex: 0,
      endIndex: 1,
      text: "/",
    });
  });

  it("detects '/' after space with query", () => {
    const result = detectShortcutToken("Fix bug /pri", 12);
    expect(result).toEqual({
      trigger: "/",
      query: "pri",
      startIndex: 8,
      endIndex: 12,
      text: "Fix bug /pri",
    });
  });

  it("detects '!' for priority", () => {
    const result = detectShortcutToken("Buy milk !high", 14);
    expect(result).toEqual({
      trigger: "!",
      query: "high",
      startIndex: 9,
      endIndex: 14,
      text: "Buy milk !high",
    });
  });

  it("detects '*' for date", () => {
    const result = detectShortcutToken("Call mom *today", 15);
    expect(result).toEqual({
      trigger: "*",
      query: "today",
      startIndex: 9,
      endIndex: 15,
      text: "Call mom *today",
    });
  });

  it("detects '+' for project", () => {
    const result = detectShortcutToken("Write tests +client", 19);
    expect(result).toEqual({
      trigger: "+",
      query: "client",
      startIndex: 12,
      endIndex: 19,
      text: "Write tests +client",
    });
  });

  it("detects '#' for tags", () => {
    const result = detectShortcutToken("Setup database #urgent", 22);
    expect(result).toEqual({
      trigger: "#",
      query: "urgent",
      startIndex: 15,
      endIndex: 22,
      text: "Setup database #urgent",
    });
  });

  it("does not detect trigger attached to previous word without space", () => {
    expect(detectShortcutToken("Hello!", 6)).toBeNull();
    expect(detectShortcutToken("word#tag", 8)).toBeNull();
    expect(detectShortcutToken("1+1", 3)).toBeNull();
  });

  it("does not detect trigger if trailing space exists", () => {
    expect(detectShortcutToken("Fix bug ! ", 10)).toBeNull();
  });

  it("handles out of bounds cursorPos", () => {
    expect(detectShortcutToken("test", -1)).toBeNull();
    expect(detectShortcutToken("test", 100)).toBeNull();
  });
});

describe("removeTokenFromText", () => {
  it("removes token at end of text", () => {
    const { newText, newCursorPos } = removeTokenFromText(
      "Buy milk !high",
      9,
      14,
    );
    expect(newText).toBe("Buy milk ");
    expect(newCursorPos).toBe(9);
  });

  it("removes token in middle and merges adjacent spaces", () => {
    const { newText, newCursorPos } = removeTokenFromText(
      "Buy milk !high today",
      9,
      14,
    );
    expect(newText).toBe("Buy milk today");
    expect(newCursorPos).toBe(9);
  });

  it("removes token at start of text and trims leading space", () => {
    const { newText, newCursorPos } = removeTokenFromText(
      "!high Buy milk",
      0,
      5,
    );
    expect(newText).toBe("Buy milk");
    expect(newCursorPos).toBe(0);
  });

  it("removes single trigger character when text is only the trigger", () => {
    const { newText, newCursorPos } = removeTokenFromText("!", 0, 1);
    expect(newText).toBe("");
    expect(newCursorPos).toBe(0);
  });
});
