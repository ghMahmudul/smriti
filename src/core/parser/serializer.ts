import { RESERVED_METADATA_KEYS } from "../constants";
import type { TaskState, TodoItem } from "../types";

export function serializeTasks(tasks: Map<string, TodoItem>): string {
  const rootTasks = Array.from(tasks.values())
    .filter((t) => t.parentId === null)
    .sort((a, b) => a.order - b.order);

  return rootTasks.map((task) => serializeTask(task, tasks, 0)).join("\n\n");
}

function serializeTask(
  task: TodoItem,
  allTasks: Map<string, TodoItem>,
  depth: number,
): string {
  const indent = "  ".repeat(depth);
  const stateChar = stateToChar(task.state);
  const titlePart = task.title ? ` ${task.title}` : "";
  const lines = [`${indent}- [${stateChar}]${titlePart}`];

  const metaLines = serializeMetadata(task);
  metaLines.forEach((line) => {
    lines.push(`${indent}  ${line}`);
  });

  if (task.body) {
    lines.push("");
    const paragraphs = task.body.split("\n");
    paragraphs.forEach((paragraph) => {
      if (paragraph.trim() === "") {
        lines.push("");
      } else {
        lines.push(`${indent}  ${paragraph}`);
      }
    });
  }

  const children = Array.from(allTasks.values())
    .filter((t) => t.parentId === task.id)
    .sort((a, b) => a.order - b.order);

  if (children.length > 0) {
    lines.push("");
    children.forEach((child) => {
      lines.push(serializeTask(child, allTasks, depth + 1));
    });
  }

  if (task.attachments && task.attachments.length > 0) {
    lines.push("");
    lines.push(`${indent}  attachments:`);
    task.attachments.forEach((att) => {
      const itemIndent = `${indent}    `;
      lines.push(`${itemIndent}- path: ${att.path}`);
      if (att.name) lines.push(`${itemIndent}  name: ${att.name}`);
      if (att.type) lines.push(`${itemIndent}  type: ${att.type}`);
      if (att.size !== undefined)
        lines.push(`${itemIndent}  size: ${att.size}`);
    });
  }

  return lines.join("\n");
}

function stateToChar(state: TaskState): string {
  return state === "done" ? "x" : " ";
}

function serializeMetadata(task: TodoItem): string[] {
  const lines: string[] = [];
  const meta = task.metadata;

  if (meta.id) lines.push(`id: ${meta.id}`);
  if (meta.created) lines.push(`created: ${meta.created}`);
  if (meta.modified) lines.push(`modified: ${meta.modified}`);
  if (meta.completed) lines.push(`completed: ${meta.completed}`);
  if (meta.due) lines.push(`due: ${meta.due}`);
  if (meta.remind) lines.push(`remind: ${meta.remind}`);
  if (meta.priority) lines.push(`priority: ${meta.priority}`);
  if (meta.tags && meta.tags.length > 0)
    lines.push(`tags: ${meta.tags.join(",")}`);
  if (meta.estimate) lines.push(`estimate: ${meta.estimate}`);
  if (meta.repeat) lines.push(`repeat: ${meta.repeat}`);
  if (meta.archived) lines.push(`archived: ${meta.archived}`);
  if (meta.trashed) lines.push(`trashed: ${meta.trashed}`);

  Object.entries(meta).forEach(([key, value]) => {
    if (!isReservedKey(key) && value !== undefined) {
      if (Array.isArray(value)) {
        lines.push(`${key}: ${value.join(",")}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
  });

  return lines;
}

function isReservedKey(key: string): boolean {
  return (RESERVED_METADATA_KEYS as readonly string[]).includes(key);
}
