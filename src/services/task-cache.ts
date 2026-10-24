import { parseTodoFile } from "../core/parser";
import { serializeTasks } from "../core/parser/serializer";
import type { TodoFile } from "../core/types";

const CACHE_PREFIX = "smriti-cache:";

export function getCachedFiles(
  workspaceId: string | null,
): Map<string, TodoFile> {
  if (!workspaceId) return new Map();
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + workspaceId);
    if (!raw) return new Map();
    const data: Record<
      string,
      { isSystem?: boolean; rawText: string } | string
    > = JSON.parse(raw);
    const files = new Map<string, TodoFile>();
    for (const [name, entry] of Object.entries(data)) {
      const rawText = typeof entry === "string" ? entry : entry.rawText;
      const isSystem =
        typeof entry === "string"
          ? name.toLowerCase() === "inbox"
          : (entry.isSystem ?? name.toLowerCase() === "inbox");
      const canonicalName = isSystem ? "Inbox" : name;
      const tasks = parseTodoFile(rawText, canonicalName);
      files.set(canonicalName, {
        name: canonicalName,
        isSystem,
        tasks,
      });
    }
    if (!files.has("Inbox")) {
      files.set("Inbox", {
        name: "Inbox",
        isSystem: true,
        tasks: new Map(),
      });
    }
    return files;
  } catch (e) {
    console.warn("Failed to read task cache:", e);
    return new Map();
  }
}

export function setCachedFiles(
  workspaceId: string | null,
  files: Map<string, TodoFile>,
): void {
  if (!workspaceId || files.size === 0) return;
  try {
    const data: Record<string, { isSystem: boolean; rawText: string }> = {};
    for (const [name, file] of files.entries()) {
      data[name] = {
        isSystem: file.isSystem,
        rawText: serializeTasks(file.tasks),
      };
    }
    localStorage.setItem(CACHE_PREFIX + workspaceId, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to write task cache:", e);
  }
}

export function clearCachedFiles(workspaceId: string | null): void {
  if (!workspaceId) return;
  try {
    localStorage.removeItem(CACHE_PREFIX + workspaceId);
  } catch (e) {
    console.warn("Failed to clear task cache:", e);
  }
}

export function getInitialWorkspaceId(): string | null {
  try {
    const raw = localStorage.getItem("smriti-workspace");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.currentWorkspaceId ?? null;
  } catch {
    return null;
  }
}
