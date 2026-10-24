import { beforeEach, describe, expect, it } from "vitest";
import type { TodoFile, TodoItem } from "../../core/types";
import {
  clearCachedFiles,
  getCachedFiles,
  getInitialWorkspaceId,
  setCachedFiles,
} from "../task-cache";

describe("task-cache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty map when workspaceId is null", () => {
    const files = getCachedFiles(null);
    expect(files.size).toBe(0);
  });

  it("returns empty map when nothing in localStorage", () => {
    const files = getCachedFiles("ws-123");
    expect(files.size).toBe(0);
  });

  it("caches and retrieves todo files correctly", () => {
    const task: TodoItem = {
      id: "task-1",
      title: "Test Task",
      state: "open",
      projectId: "Inbox",
      parentId: null,
      metadata: { id: "task-1", created: "2026-09-20T12:00:00Z" },
      body: "",
      children: [],
      order: 0,
      attachments: [],
    };

    const files = new Map<string, TodoFile>();
    files.set("Inbox", {
      name: "Inbox",
      isSystem: true,
      tasks: new Map([["task-1", task]]),
    });

    setCachedFiles("ws-1", files);

    const retrieved = getCachedFiles("ws-1");
    expect(retrieved.has("Inbox")).toBe(true);
    const inbox = retrieved.get("Inbox");
    expect(inbox?.tasks.has("task-1")).toBe(true);
    expect(inbox?.tasks.get("task-1")?.title).toBe("Test Task");
  });

  it("migrates legacy lowercase inbox to Inbox", () => {
    const task: TodoItem = {
      id: "task-1",
      title: "Test Task",
      state: "open",
      projectId: "inbox",
      parentId: null,
      metadata: { id: "task-1", created: "2026-09-20T12:00:00Z" },
      body: "",
      children: [],
      order: 0,
      attachments: [],
    };

    const files = new Map<string, TodoFile>();
    files.set("inbox", {
      name: "inbox",
      isSystem: true,
      tasks: new Map([["task-1", task]]),
    });

    setCachedFiles("ws-legacy", files);
    const retrieved = getCachedFiles("ws-legacy");
    expect(retrieved.has("Inbox")).toBe(true);
    expect(retrieved.get("Inbox")?.name).toBe("Inbox");
  });

  it("clears cached files for a workspace", () => {
    const files = new Map<string, TodoFile>();
    files.set("Inbox", {
      name: "Inbox",
      isSystem: true,
      tasks: new Map(),
    });

    setCachedFiles("ws-1", files);
    expect(getCachedFiles("ws-1").has("Inbox")).toBe(true);

    clearCachedFiles("ws-1");
    expect(getCachedFiles("ws-1").size).toBe(0);
  });

  it("gets initial workspace id from localStorage", () => {
    expect(getInitialWorkspaceId()).toBeNull();

    localStorage.setItem(
      "smriti-workspace",
      JSON.stringify({
        state: {
          currentWorkspaceId: "ws-abc",
        },
      }),
    );

    expect(getInitialWorkspaceId()).toBe("ws-abc");
  });
});
