import { describe, expect, it } from "vitest";
import type { TodoItem } from "../../types";
import { parseTodoFile } from "../index";
import { serializeTasks } from "../serializer";

function getFirstTask(tasks: Map<string, TodoItem>): TodoItem {
  const first = Array.from(tasks.values())[0];
  if (!first) throw new Error("No tasks found");
  return first;
}

describe("parseTodoFile", () => {
  it("parses a bare task", () => {
    const text = "- [ ] Buy milk";
    const tasks = parseTodoFile(text, "inbox");
    expect(tasks.size).toBe(1);

    const task = getFirstTask(tasks);
    expect(task.title).toBe("Buy milk");
    expect(task.state).toBe("open");
    expect(task.projectId).toBe("inbox");
    expect(task.parentId).toBeNull();
    expect(task.body).toBe("");
    expect(task.attachments).toEqual([]);
  });

  it("parses task with all states", () => {
    const text = `- [ ] Open task
- [x] Done task`;

    const tasks = parseTodoFile(text, "inbox");
    expect(tasks.size).toBe(2);

    const taskList = Array.from(tasks.values());
    expect(taskList[0]!.state).toBe("open");
    expect(taskList[1]!.state).toBe("done");
  });

  it("reads id and created from file", () => {
    const text = `- [ ] Task with metadata
  id: my-custom-id
  created: 2026-09-01T10:00:00Z`;

    const tasks = parseTodoFile(text, "inbox");
    const task = getFirstTask(tasks);

    expect(task.id).toBe("my-custom-id");
    expect(task.metadata.created).toBe("2026-09-01T10:00:00Z");
  });

  it("parses metadata block", () => {
    const text = `- [ ] Launch website
  id: 01hq3z9k2p
  created: 2026-09-02T10:00:00Z
  due: 2026-09-15
  priority: high
  tags: business,website
  estimate: 3d`;

    const tasks = parseTodoFile(text, "inbox");
    const task = getFirstTask(tasks);

    expect(task.id).toBe("01hq3z9k2p");
    expect(task.metadata.due).toBe("2026-09-15");
    expect(task.metadata.priority).toBe("high");
    expect(task.metadata.tags).toEqual(["business", "website"]);
    expect(task.metadata.estimate).toBe("3d");
  });

  it("terminates metadata block at blank line", () => {
    const text = `- [ ] Task with metadata
  id: test-id
  created: 2026-09-01T10:00:00Z

  This is body text.`;

    const tasks = parseTodoFile(text, "inbox");
    const task = getFirstTask(tasks);

    expect(task.id).toBe("test-id");
    expect(task.body).toBe("This is body text.");
  });

  it("parses body text", () => {
    const text = `- [ ] Task with body

  First paragraph.

  Second paragraph.`;

    const tasks = parseTodoFile(text, "inbox");
    const task = getFirstTask(tasks);

    expect(task.body).toBe("First paragraph.\n\nSecond paragraph.");
  });

  it("parses nested subtasks", () => {
    const text = `- [ ] Parent task

  - [x] Child task 1
  - [ ] Child task 2`;

    const tasks = parseTodoFile(text, "inbox");
    expect(tasks.size).toBe(3);

    const parent = Array.from(tasks.values()).find((t) => t.parentId === null);
    expect(parent).toBeDefined();
    expect(parent!.title).toBe("Parent task");
    expect(parent!.children.length).toBe(2);

    const children = Array.from(tasks.values()).filter(
      (t) => t.parentId === parent!.id,
    );
    expect(children.length).toBe(2);
    expect(children[0]!.title).toBe("Child task 1");
    expect(children[0]!.state).toBe("done");
    expect(children[1]!.title).toBe("Child task 2");
    expect(children[1]!.state).toBe("open");
  });

  it("parses deeply nested subtasks", () => {
    const text = `- [ ] Level 0

  - [ ] Level 1

    - [ ] Level 2

      - [ ] Level 3`;

    const tasks = parseTodoFile(text, "inbox");
    expect(tasks.size).toBe(4);
  });

  it("parses attachments block", () => {
    const text = `- [ ] Task with attachments

  attachments:
    - path: .todo/files/report.pdf
      name: Report
      type: application/pdf
      size: 245760
    - path: .todo/images/mockup.png`;

    const tasks = parseTodoFile(text, "inbox");
    const task = getFirstTask(tasks);

    expect(task.attachments.length).toBe(2);
    expect(task.attachments[0]).toEqual({
      path: ".todo/files/report.pdf",
      name: "Report",
      type: "application/pdf",
      size: 245760,
    });
    expect(task.attachments[1]).toEqual({
      path: ".todo/images/mockup.png",
      name: undefined,
      type: undefined,
      size: undefined,
    });
  });

  it("preserves unknown metadata keys", () => {
    const text = `- [ ] Task with unknown keys
  id: test-id
  created: 2026-09-01T10:00:00Z
  custom-field: custom-value
  another-field: another-value`;

    const tasks = parseTodoFile(text, "inbox");
    const task = getFirstTask(tasks);

    expect(task.metadata["custom-field"]).toBe("custom-value");
    expect(task.metadata["another-field"]).toBe("another-value");
  });

  it("parses full spec example", () => {
    const text = `- [ ] Buy milk

- [ ] Pay office rent
  repeat: every 1 month

- [x] Old Q1 planning notes
  completed: 2026-01-15T00:00:00Z
  archived: 2026-02-01T09:00:00Z

- [ ] Duplicate task, added by mistake
  trashed: 2026-09-03T08:00:00Z

- [ ] Launch company website
  id: 01hq3z9k2p
  created: 2026-09-02T10:00:00Z
  due: 2026-09-15
  remind: 2026-09-09T09:00:00Z
  priority: high
  tags: business,website,launch
  estimate: 3d

  Prepare and launch the company website.

  The site should be tested on staging before deployment.

  - [x] Register domain
    completed: 2026-09-02T09:30:00Z

  - [ ] Design homepage
    estimate: 1d

  - [ ] Use the old hosting provider

    Switched to a different host instead.

  attachments:
    - path: .todo/files/website-requirements.pdf
      name: Website Requirements
      type: application/pdf
      size: 245760
    - path: .todo/images/homepage-mockup.png`;

    const tasks = parseTodoFile(text, "inbox");
    expect(tasks.size).toBe(8);

    const launchTask = Array.from(tasks.values()).find(
      (t) => t.id === "01hq3z9k2p",
    );
    expect(launchTask).toBeDefined();
    expect(launchTask!.title).toBe("Launch company website");
    expect(launchTask!.state).toBe("open");
    expect(launchTask!.metadata.priority).toBe("high");
    expect(launchTask!.metadata.tags).toEqual([
      "business",
      "website",
      "launch",
    ]);
    expect(launchTask!.attachments.length).toBe(2);
  });
});

describe("serializeTasks", () => {
  it("serializes a bare task", () => {
    const text = "- [ ] Buy milk";
    const tasks = parseTodoFile(text, "inbox");
    const serialized = serializeTasks(tasks);
    expect(serialized).toContain("- [ ] Buy milk");
  });

  it("round-trips metadata", () => {
    const text = `- [ ] Task with metadata
  id: test-id
  created: 2026-09-01T10:00:00Z
  due: 2026-09-15
  priority: high
  tags: business,website`;

    const tasks = parseTodoFile(text, "inbox");
    const serialized = serializeTasks(tasks);
    const reparsed = parseTodoFile(serialized, "inbox");

    expect(reparsed.size).toBe(1);
    const task = getFirstTask(reparsed);
    expect(task.id).toBe("test-id");
    expect(task.metadata.due).toBe("2026-09-15");
    expect(task.metadata.priority).toBe("high");
    expect(task.metadata.tags).toEqual(["business", "website"]);
  });

  it("round-trips nested subtasks", () => {
    const text = `- [ ] Parent task

  - [x] Child task 1
  - [ ] Child task 2`;

    const tasks = parseTodoFile(text, "inbox");
    const serialized = serializeTasks(tasks);
    const reparsed = parseTodoFile(serialized, "inbox");

    expect(reparsed.size).toBe(3);
    const parent = Array.from(reparsed.values()).find(
      (t) => t.parentId === null,
    );
    expect(parent).toBeDefined();
    expect(parent!.children.length).toBe(2);
  });

  it("round-trips attachments", () => {
    const text = `- [ ] Task with attachments

  attachments:
    - path: .todo/files/report.pdf
      name: Report
      type: application/pdf
      size: 245760`;

    const tasks = parseTodoFile(text, "inbox");
    const serialized = serializeTasks(tasks);
    const reparsed = parseTodoFile(serialized, "inbox");

    const task = getFirstTask(reparsed);
    expect(task.attachments.length).toBe(1);
    expect(task.attachments[0]!.path).toBe(".todo/files/report.pdf");
    expect(task.attachments[0]!.name).toBe("Report");
  });

  it("preserves body paragraphs", () => {
    const text = `- [ ] Task with body

  First paragraph.

  Second paragraph.`;

    const tasks = parseTodoFile(text, "inbox");
    const task = getFirstTask(tasks);
    expect(task.body).toBe("First paragraph.\n\nSecond paragraph.");

    const serialized = serializeTasks(tasks);
    expect(serialized).toContain("First paragraph.");
    expect(serialized).toContain("Second paragraph.");

    const reparsed = parseTodoFile(serialized, "inbox");
    const reparsedTask = getFirstTask(reparsed);
    expect(reparsedTask.body).toBe("First paragraph.\n\nSecond paragraph.");
  });

  it("serializes multiple root tasks with blank line separation", () => {
    const text = `- [ ] Task 1

- [ ] Task 2

- [ ] Task 3`;

    const tasks = parseTodoFile(text, "inbox");
    const serialized = serializeTasks(tasks);

    expect(serialized).toContain("- [ ] Task 1");
    expect(serialized).toContain("- [ ] Task 2");
    expect(serialized).toContain("- [ ] Task 3");

    const task1Index = serialized.indexOf("- [ ] Task 1");
    const task2Index = serialized.indexOf("- [ ] Task 2");
    const task3Index = serialized.indexOf("- [ ] Task 3");

    expect(task1Index).toBeLessThan(task2Index);
    expect(task2Index).toBeLessThan(task3Index);
  });

  it("handles Windows CRLF line endings cleanly", () => {
    const text =
      "- [ ] Windows task\r\n  id: win-1\r\n  priority: high\r\n\r\n  Windows body text.\r\n";
    const tasks = parseTodoFile(text, "inbox");
    expect(tasks.size).toBe(1);

    const task = getFirstTask(tasks);
    expect(task.title).toBe("Windows task");
    expect(task.id).toBe("win-1");
    expect(task.metadata.priority).toBe("high");
    expect(task.body).toBe("Windows body text.");
  });

  it("preserves relative indentation in body code blocks", () => {
    const text = `- [ ] Task with code block

  function hello() {
    console.log("world");
    return true;
  }`;

    const tasks = parseTodoFile(text, "inbox");
    const task = getFirstTask(tasks);
    expect(task.body).toBe(
      'function hello() {\n  console.log("world");\n  return true;\n}',
    );

    const serialized = serializeTasks(tasks);
    expect(serialized).toContain('    console.log("world");');

    const reparsed = parseTodoFile(serialized, "inbox");
    const reparsedTask = getFirstTask(reparsed);
    expect(reparsedTask.body).toBe(
      'function hello() {\n  console.log("world");\n  return true;\n}',
    );
  });

  it("handles custom array metadata in serializer", () => {
    const text = `- [ ] Task with custom array
  id: arr-1
  custom-list: a,b,c`;

    const tasks = parseTodoFile(text, "inbox");
    const task = getFirstTask(tasks);
    task.metadata["custom-list"] = ["item1", "item2"];

    const serialized = serializeTasks(tasks);
    expect(serialized).toContain("custom-list: item1,item2");
  });

  it("ignores invalid non-numeric attachment size gracefully", () => {
    const text = `- [ ] Task with bad attachment size

  attachments:
    - path: .todo/files/doc.txt
      size: invalid-number`;

    const tasks = parseTodoFile(text, "inbox");
    const task = getFirstTask(tasks);
    expect(task.attachments.length).toBe(1);
    expect(task.attachments[0]!.size).toBeUndefined();
  });

  it("prevents prototype pollution in metadata", () => {
    const text = `- [ ] Evil task
  __proto__: polluted
  constructor: polluted`;

    const tasks = parseTodoFile(text, "inbox");
    const task = getFirstTask(tasks);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(task.metadata.constructor).not.toBe("polluted");
  });

  it("does not treat 4-space indented body text as metadata", () => {
    const text = `- [ ] Task with indented note

    note: this is indented body, not metadata`;

    const tasks = parseTodoFile(text, "inbox");
    const task = getFirstTask(tasks);
    expect(task.metadata.note).toBeUndefined();
    expect(task.body).toContain("note: this is indented body, not metadata");
  });

  it("parses and round-trips a task with an empty title and a description", () => {
    const text = `- [ ]
  id: no-title-task
  created: 2026-10-05T10:00:00Z

  Only description here`;

    const tasks = parseTodoFile(text, "inbox");
    expect(tasks.size).toBe(1);
    const task = getFirstTask(tasks);
    expect(task.title).toBe("");
    expect(task.body).toBe("Only description here");

    const serialized = serializeTasks(tasks);
    expect(serialized).toContain("- [ ]\n  id: no-title-task");
    expect(serialized).toContain("Only description here");

    const reparsed = parseTodoFile(serialized, "inbox");
    const reparsedTask = getFirstTask(reparsed);
    expect(reparsedTask.title).toBe("");
    expect(reparsedTask.body).toBe("Only description here");
  });
});
