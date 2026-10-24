import { nanoid } from "nanoid";
import type { Attachment, Metadata, TaskState, TodoItem } from "../types";

interface ParsedTask {
  item: TodoItem;
  children: ParsedTask[];
}

export function parseTodoFile(
  text: string,
  projectId: string,
): Map<string, TodoItem> {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const tasks: Map<string, TodoItem> = new Map();
  const rootTasks: ParsedTask[] = [];

  let i = 0;
  while (i < lines.length) {
    const result = parseTask(lines, i, projectId, 0);
    if (result) {
      rootTasks.push(result.parsed);
      i = result.nextLine;
    } else {
      i++;
    }
  }

  function flatten(
    parsed: ParsedTask,
    parentId: string | null,
    order: number,
  ): void {
    tasks.set(parsed.item.id, {
      ...parsed.item,
      parentId,
      order,
    });
    parsed.children.forEach((child, idx) => {
      flatten(child, parsed.item.id, idx);
    });
  }

  rootTasks.forEach((task, idx) => {
    flatten(task, null, idx);
  });

  return tasks;
}

function parseTask(
  lines: string[],
  startIndex: number,
  projectId: string,
  depth: number,
): { parsed: ParsedTask; nextLine: number } | null {
  const line = lines[startIndex];
  if (line === undefined) return null;
  const match = line.match(/^(\s*)- \[([ x~-])\](?: ?(.*))$/);

  if (!match) return null;

  const indent = (match[1] as string).length;
  if (indent !== depth * 2) return null;

  const state = parseState(match[2] as string);
  const title = (match[3] ?? "").trim();

  const fallbackId = nanoid();
  const now = new Date().toISOString();

  const metadata: Metadata = {
    id: fallbackId,
    created: now,
  };

  let body = "";
  const children: ParsedTask[] = [];
  let attachments: Attachment[] = [];
  let nextLine = startIndex + 1;
  let inMetadata = true;
  const baseIndent = depth * 2 + 2;

  while (nextLine < lines.length) {
    const currentLine = lines[nextLine];
    if (currentLine === undefined) break;
    const trimmed = currentLine.trim();

    const currentIndent = trimmed === "" ? -1 : currentLine.search(/\S/);

    if (currentIndent <= depth * 2 && trimmed !== "") {
      break;
    }

    if (inMetadata) {
      if (trimmed === "") {
        inMetadata = false;
        nextLine++;
        continue;
      }

      if (currentIndent === baseIndent) {
        const metaMatch = trimmed.match(/^([a-z][a-z0-9_-]*):(?:\s*(.*))?$/);
        if (metaMatch) {
          const key = metaMatch[1] as string;
          const val = (metaMatch[2] ?? "").trim();
          if (val) {
            setMetadata(metadata, key, val);
          }
          nextLine++;
          continue;
        }
      }

      inMetadata = false;
    }

    if (trimmed === "") {
      nextLine++;
      if (body && !body.endsWith("\n\n")) {
        body += "\n\n";
      }
      continue;
    }

    if (
      trimmed.startsWith("attachments:") &&
      !trimmed.includes(" ") &&
      currentIndent === baseIndent
    ) {
      const attachmentResult = parseAttachments(lines, nextLine, depth);
      if (attachmentResult && attachmentResult.attachments.length > 0) {
        attachments = attachmentResult.attachments;
        nextLine = attachmentResult.nextLine;
        continue;
      }
    }

    const childMatch = currentLine.match(/^(\s+)- \[([ x~-])\] (.+)$/);
    if (childMatch) {
      const childDepth = Math.floor((childMatch[1] as string).length / 2);
      if (childDepth === depth + 1) {
        const childResult = parseTask(lines, nextLine, projectId, childDepth);
        if (childResult) {
          children.push(childResult.parsed);
          nextLine = childResult.nextLine;
          continue;
        }
      }
    }

    if (currentIndent > depth * 2) {
      if (body) {
        if (!body.endsWith("\n\n") && !body.endsWith("\n")) {
          body += "\n";
        }
      }
      const lineContent =
        currentIndent >= baseIndent ? currentLine.slice(baseIndent) : trimmed;
      body += lineContent;
      nextLine++;
    } else {
      break;
    }
  }

  return {
    parsed: {
      item: {
        id: metadata.id,
        title,
        state,
        projectId,
        parentId: null,
        metadata,
        body: body.trim(),
        children: children.map((c) => c.item.id),
        order: 0,
        attachments,
      },
      children,
    },
    nextLine,
  };
}

function parseAttachments(
  lines: string[],
  startIndex: number,
  parentDepth: number,
): { attachments: Attachment[]; nextLine: number } | null {
  const firstLine = lines[startIndex];
  if (firstLine === undefined || !firstLine.trim().startsWith("attachments:"))
    return null;

  const attachments: Attachment[] = [];
  let nextLine = startIndex + 1;
  const itemIndent = (parentDepth + 2) * 2;

  while (nextLine < lines.length) {
    const currentLine = lines[nextLine];
    if (currentLine === undefined) break;
    const trimmed = currentLine.trim();

    if (trimmed === "") {
      nextLine++;
      continue;
    }

    const currentIndent = currentLine.search(/\S/);

    if (currentIndent < itemIndent) {
      break;
    }

    if (currentIndent === itemIndent && trimmed.startsWith("- ")) {
      const attachment: Attachment = { path: "" };
      const pathMatch = trimmed.match(/^- path: (.+)$/);
      if (pathMatch) {
        attachment.path = pathMatch[1] as string;
      }

      nextLine++;

      while (nextLine < lines.length) {
        const propLine = lines[nextLine];
        if (propLine === undefined) break;
        const propTrimmed = propLine.trim();
        const propIndent = propLine.search(/\S/);

        if (propIndent < itemIndent + 2 || propTrimmed === "") {
          break;
        }

        const propMatch = propTrimmed.match(/^([a-z]+): (.+)$/);
        if (propMatch) {
          const key = propMatch[1] as string;
          const value = propMatch[2] as string;

          if (key === "name") attachment.name = value;
          else if (key === "type") attachment.type = value;
          else if (key === "size") {
            const parsedSize = parseInt(value, 10);
            if (!Number.isNaN(parsedSize)) {
              attachment.size = parsedSize;
            }
          }
        }

        nextLine++;
      }

      if (attachment.path) {
        attachments.push(attachment);
      }
    } else {
      break;
    }
  }

  return { attachments, nextLine };
}

function parseState(char: string): TaskState {
  if (char === "x") return "done";
  return "open";
}

function setMetadata(metadata: Metadata, key: string, value: string): void {
  if (key === "__proto__" || key === "constructor" || key === "prototype") {
    return;
  }
  switch (key) {
    case "tags":
      metadata.tags = value.split(",").map((t) => t.trim());
      break;
    case "priority":
      if (["low", "medium", "high"].includes(value)) {
        metadata.priority = value as "low" | "medium" | "high";
      }
      break;
    default:
      metadata[key] = value;
  }
}
