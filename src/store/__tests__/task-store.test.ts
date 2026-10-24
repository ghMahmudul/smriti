import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTodayLocalDateString } from "../../core/date-utils";
import type { TodoFile, TodoItem } from "../../core/types";
import { useTaskStore } from "../task-store";
import { useWorkspaceStore } from "../workspace-store";

function createMockTask(
  overrides: Partial<Omit<TodoItem, "metadata">> & {
    metadata?: Partial<TodoItem["metadata"]>;
  },
): TodoItem {
  const id = overrides.id ?? "task-default";
  return {
    id,
    title: "Default Task",
    state: "open",
    projectId: "inbox",
    parentId: null,
    body: "",
    children: [],
    order: 0,
    attachments: [],
    ...overrides,
    metadata: {
      id,
      created: "2026-03-20T00:00:00.000Z",
      ...overrides.metadata,
    },
  };
}

describe("task-store getTasksByView", () => {
  beforeEach(() => {
    const todayStr = getTodayLocalDateString();
    const futureDate = "2099-12-31";

    const inboxTasks = new Map<string, TodoItem>([
      [
        "task-inbox-active",
        createMockTask({ id: "task-inbox-active", projectId: "inbox" }),
      ],
      [
        "task-inbox-archived",
        createMockTask({
          id: "task-inbox-archived",
          projectId: "inbox",
          metadata: { id: "task-inbox-archived", archived: "2026-03-20" },
        }),
      ],
      [
        "task-inbox-done",
        createMockTask({
          id: "task-inbox-done",
          projectId: "inbox",
          state: "done",
        }),
      ],
      [
        "task-inbox-trashed",
        createMockTask({
          id: "task-inbox-trashed",
          projectId: "inbox",
          metadata: { id: "task-inbox-trashed", trashed: "2026-03-20" },
        }),
      ],
    ]);

    const workTasks = new Map<string, TodoItem>([
      [
        "task-work-active",
        createMockTask({
          id: "task-work-active",
          projectId: "work",
          metadata: { id: "task-work-active", due: todayStr, tags: ["urgent"] },
        }),
      ],
      [
        "task-work-archived",
        createMockTask({
          id: "task-work-archived",
          projectId: "work",
          metadata: { id: "task-work-archived", archived: "2026-03-20" },
        }),
      ],
      [
        "task-work-upcoming",
        createMockTask({
          id: "task-work-upcoming",
          projectId: "work",
          metadata: { id: "task-work-upcoming", due: futureDate },
        }),
      ],
      [
        "task-work-done",
        createMockTask({
          id: "task-work-done",
          projectId: "work",
          state: "done",
        }),
      ],
      [
        "task-work-archived-done",
        createMockTask({
          id: "task-work-archived-done",
          projectId: "work",
          state: "done",
          metadata: { id: "task-work-archived-done", archived: "2026-03-20" },
        }),
      ],
    ]);

    const mockFiles = new Map<string, TodoFile>([
      [
        "Inbox",
        {
          name: "Inbox",
          isSystem: true,
          tasks: inboxTasks,
        },
      ],
      [
        "work",
        {
          name: "work",
          isSystem: false,
          tasks: workTasks,
        },
      ],
    ]);

    const taskIndex = new Map<string, string>();
    for (const [fileName, file] of mockFiles) {
      for (const taskId of file.tasks.keys()) {
        taskIndex.set(taskId, fileName);
      }
    }

    useTaskStore.setState({ files: mockFiles, taskIndex, isLoaded: true });
  });

  it("excludes archived, trashed, and done tasks from inbox view", () => {
    const tasks = useTaskStore.getState().getTasksByView("inbox");
    const ids = tasks.map((t) => t.id);
    expect(ids).toEqual(["task-inbox-active"]);
  });

  it("excludes archived, trashed, and done tasks from project view", () => {
    const tasks = useTaskStore.getState().getTasksByView("project:work");
    const ids = tasks.map((t) => t.id);
    expect(ids).toEqual(["task-work-active", "task-work-upcoming"]);
    expect(ids).not.toContain("task-work-archived");
  });

  it("excludes archived tasks from all, today, upcoming, and tag views", () => {
    const store = useTaskStore.getState();

    const all = store.getTasksByView("all").map((t) => t.id);
    expect(all).not.toContain("task-inbox-archived");
    expect(all).not.toContain("task-work-archived");

    const today = store.getTasksByView("today").map((t) => t.id);
    expect(today).toEqual(["task-work-active"]);

    const upcoming = store.getTasksByView("upcoming").map((t) => t.id);
    expect(upcoming).toEqual(["task-work-upcoming"]);

    const tag = store.getTasksByView("tag:urgent").map((t) => t.id);
    expect(tag).toEqual(["task-work-active"]);
  });

  it("includes overdue tasks in the today view alongside tasks due today", () => {
    const store = useTaskStore.getState();
    const overdueTask = createMockTask({
      id: "task-work-overdue",
      projectId: "work",
      metadata: { id: "task-work-overdue", due: "2020-01-01" },
    });
    store.addTask(overdueTask, "work");

    const todayIds = store.getTasksByView("today").map((t) => t.id);
    expect(todayIds).toContain("task-work-overdue");
    expect(todayIds).toContain("task-work-active");
    expect(todayIds).not.toContain("task-work-upcoming");

    // Upcoming should still not include overdue tasks
    const upcomingIds = store.getTasksByView("upcoming").map((t) => t.id);
    expect(upcomingIds).not.toContain("task-work-overdue");
  });

  it("includes all non-trashed archived tasks in archived view", () => {
    const archived = useTaskStore
      .getState()
      .getTasksByView("archived")
      .map((t) => t.id);
    expect(archived).toContain("task-inbox-archived");
    expect(archived).toContain("task-work-archived");
    expect(archived).toContain("task-work-archived-done");
    expect(archived).not.toContain("task-inbox-active");
  });

  it("excludes archived tasks from completed view", () => {
    const completed = useTaskStore
      .getState()
      .getTasksByView("completed")
      .map((t) => t.id);
    expect(completed).toContain("task-inbox-done");
    expect(completed).toContain("task-work-done");
    expect(completed).not.toContain("task-work-archived-done");
  });

  it("sorts completed tasks with most recently completed first", () => {
    const taskOld = createMockTask({
      id: "task-completed-old",
      state: "done",
      metadata: {
        id: "task-completed-old",
        completed: "2026-10-01T10:00:00.000Z",
      },
    });
    const taskNew = createMockTask({
      id: "task-completed-new",
      state: "done",
      metadata: {
        id: "task-completed-new",
        completed: "2026-10-03T12:00:00.000Z",
      },
    });
    const taskMid = createMockTask({
      id: "task-completed-mid",
      state: "done",
      metadata: {
        id: "task-completed-mid",
        completed: "2026-10-02T15:00:00.000Z",
      },
    });

    const file = new Map<string, TodoItem>([
      ["task-completed-old", taskOld],
      ["task-completed-new", taskNew],
      ["task-completed-mid", taskMid],
    ]);

    useTaskStore.setState({
      files: new Map([
        ["Inbox", { name: "Inbox", isSystem: true, tasks: file }],
      ]),
    });

    const result = useTaskStore
      .getState()
      .getTasksByView("completed")
      .map((t) => t.id);

    expect(result).toEqual([
      "task-completed-new",
      "task-completed-mid",
      "task-completed-old",
    ]);
  });

  it("sorts archived tasks with most recently archived first", () => {
    const taskOld = createMockTask({
      id: "task-archived-old",
      metadata: {
        id: "task-archived-old",
        archived: "2026-10-01T08:00:00.000Z",
      },
    });
    const taskNew = createMockTask({
      id: "task-archived-new",
      metadata: {
        id: "task-archived-new",
        archived: "2026-10-03T14:30:00.000Z",
      },
    });

    const file = new Map<string, TodoItem>([
      ["task-archived-old", taskOld],
      ["task-archived-new", taskNew],
    ]);

    useTaskStore.setState({
      files: new Map([
        ["Inbox", { name: "Inbox", isSystem: true, tasks: file }],
      ]),
    });

    const result = useTaskStore
      .getState()
      .getTasksByView("archived")
      .map((t) => t.id);

    expect(result).toEqual(["task-archived-new", "task-archived-old"]);
  });

  it("sorts trash tasks with most recently trashed first", () => {
    const taskOld = createMockTask({
      id: "task-trash-old",
      metadata: {
        id: "task-trash-old",
        trashed: "2026-09-30T10:00:00.000Z",
      },
    });
    const taskNew = createMockTask({
      id: "task-trash-new",
      metadata: {
        id: "task-trash-new",
        trashed: "2026-10-03T09:00:00.000Z",
      },
    });

    const file = new Map<string, TodoItem>([
      ["task-trash-old", taskOld],
      ["task-trash-new", taskNew],
    ]);

    useTaskStore.setState({
      files: new Map([
        ["Inbox", { name: "Inbox", isSystem: true, tasks: file }],
      ]),
    });

    const result = useTaskStore
      .getState()
      .getTasksByView("trash")
      .map((t) => t.id);

    expect(result).toEqual(["task-trash-new", "task-trash-old"]);
  });

  it("handles missing settings.tags gracefully without throwing", () => {
    useWorkspaceStore.setState({
      settings: {
        ...useWorkspaceStore.getState().settings,
        tags: undefined as unknown as string[],
      },
    });

    expect(() => useTaskStore.getState().getAllTags()).not.toThrow();
    const tags = useTaskStore.getState().getAllTags();
    expect(tags).toContain("urgent");
  });

  it("handles tasks with string tags gracefully", () => {
    const corruptedTask = createMockTask({
      id: "task-corrupted-tags",
      projectId: "work",
      metadata: {
        id: "task-corrupted-tags",
        tags: "backend,frontend" as unknown as string[],
      },
    });

    const workFile = useTaskStore.getState().files.get("work");
    if (workFile) {
      workFile.tasks.set("task-corrupted-tags", corruptedTask);
    }

    expect(() => useTaskStore.getState().getAllTags()).not.toThrow();
    const tags = useTaskStore.getState().getAllTags();
    expect(tags).toContain("backend");
    expect(tags).toContain("frontend");
  });

  it("normalizes legacy inbox.todo and Inbox.todo to Inbox file name in loadFiles", async () => {
    const mockAdapter = {
      listFiles: vi.fn().mockResolvedValue(["inbox.todo", "work.todo"]),
      readFile: vi.fn().mockImplementation(async (file: string) => {
        if (file === "inbox.todo") return "- [ ] Legacy Task\n  id: t1";
        return "- [ ] Work Task\n  id: t2";
      }),
      writeFile: vi.fn().mockResolvedValue(undefined),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      renameFile: vi.fn().mockResolvedValue(undefined),
      ensureInbox: vi.fn().mockResolvedValue(undefined),
      readSettings: vi.fn().mockResolvedValue({}),
      writeSettings: vi.fn().mockResolvedValue(undefined),
      createProject: vi.fn().mockResolvedValue(undefined),
      deleteProject: vi.fn().mockResolvedValue(undefined),
      renameProject: vi.fn().mockResolvedValue(undefined),
    };

    await useTaskStore
      .getState()
      .loadFiles(
        mockAdapter as unknown as import("../../services/workspace").StorageAdapter,
        null,
      );

    const files = useTaskStore.getState().files;
    expect(files.has("Inbox")).toBe(true);
    expect(files.get("Inbox")?.name).toBe("Inbox");
    expect(files.get("Inbox")?.isSystem).toBe(true);
    const task = files.get("Inbox")?.tasks.get("t1");
    expect(task?.projectId).toBe("Inbox");
  });

  it("normalizes task.projectId to Inbox when adding or updating a task with inbox", async () => {
    const mockAdapter = {
      listFiles: vi.fn().mockResolvedValue([]),
      readFile: vi.fn().mockResolvedValue(""),
      writeFile: vi.fn().mockResolvedValue(undefined),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      renameFile: vi.fn().mockResolvedValue(undefined),
      ensureInbox: vi.fn().mockResolvedValue(undefined),
      readSettings: vi.fn().mockResolvedValue({}),
      writeSettings: vi.fn().mockResolvedValue(undefined),
      createProject: vi.fn().mockResolvedValue(undefined),
      deleteProject: vi.fn().mockResolvedValue(undefined),
      renameProject: vi.fn().mockResolvedValue(undefined),
    };

    useTaskStore.setState({
      files: new Map([
        [
          "Inbox",
          {
            name: "Inbox",
            isSystem: true,
            tasks: new Map(),
          },
        ],
      ]),
      adapter:
        mockAdapter as unknown as import("../../services/workspace").StorageAdapter,
    });

    const newTask = createMockTask({ id: "task-new", projectId: "inbox" });
    await useTaskStore.getState().addTask(newTask, "inbox");

    const added = useTaskStore.getState().getTask("task-new");
    expect(added).toBeDefined();
    expect(added?.projectId).toBe("Inbox");
  });

  it("appends newly created tasks to the bottom of the file (order incrementing) and preserves relative order", async () => {
    const mockAdapter = {
      writeFile: vi.fn().mockResolvedValue(undefined),
    };

    useTaskStore.setState({
      files: new Map([
        [
          "Inbox",
          {
            name: "Inbox",
            isSystem: true,
            tasks: new Map(),
          },
        ],
      ]),
      adapter:
        mockAdapter as unknown as import("../../services/workspace").StorageAdapter,
    });

    const task1 = createMockTask({
      id: "t1",
      title: "First task",
      projectId: "Inbox",
    });
    const task2 = createMockTask({
      id: "t2",
      title: "Second task",
      projectId: "Inbox",
    });
    const task3 = createMockTask({
      id: "t3",
      title: "Third task",
      projectId: "Inbox",
    });

    await useTaskStore.getState().addTask(task1, "Inbox");
    await useTaskStore.getState().addTask(task2, "Inbox");
    await useTaskStore.getState().addTask(task3, "Inbox");

    const inboxTasks = useTaskStore.getState().getTasksByView("inbox");
    // Newest task (task3) is at index 2, appended after task1 and task2
    expect(inboxTasks.map((t) => t.id)).toEqual(["t1", "t2", "t3"]);
    expect(useTaskStore.getState().getTask("t1")?.order).toBe(0);
    expect(useTaskStore.getState().getTask("t2")?.order).toBe(1);
    expect(useTaskStore.getState().getTask("t3")?.order).toBe(2);
  });

  it("strictly preserves task order when updating task state, metadata, or body", async () => {
    const mockAdapter = {
      writeFile: vi.fn().mockResolvedValue(undefined),
    };

    const task1 = createMockTask({
      id: "t1",
      title: "First task",
      projectId: "Inbox",
      order: 0,
    });
    const task2 = createMockTask({
      id: "t2",
      title: "Second task",
      projectId: "Inbox",
      order: 1,
    });

    useTaskStore.setState({
      files: new Map([
        [
          "Inbox",
          {
            name: "Inbox",
            isSystem: true,
            tasks: new Map([
              ["t1", task1],
              ["t2", task2],
            ]),
          },
        ],
      ]),
      adapter:
        mockAdapter as unknown as import("../../services/workspace").StorageAdapter,
      taskIndex: new Map([
        ["t1", "Inbox"],
        ["t2", "Inbox"],
      ]),
    });

    // Mark task1 completed
    await useTaskStore.getState().updateTask("t1", {
      state: "done",
      metadata: { ...task1.metadata, completed: "2026-10-03T12:00:00Z" },
    });

    // Its order must remain 0 and task2 must remain 1
    expect(useTaskStore.getState().getTask("t1")?.order).toBe(0);
    expect(useTaskStore.getState().getTask("t2")?.order).toBe(1);

    // Modify task2 priority and date
    await useTaskStore.getState().updateTask("t2", {
      metadata: { ...task2.metadata, priority: "high", due: "2026-10-05" },
    });

    expect(useTaskStore.getState().getTask("t1")?.order).toBe(0);
    expect(useTaskStore.getState().getTask("t2")?.order).toBe(1);
  });

  it("prevents creating or renaming projects to Inbox or inbox", async () => {
    const mockAdapter = {
      listFiles: vi.fn().mockResolvedValue([]),
      readFile: vi.fn().mockResolvedValue(""),
      writeFile: vi.fn().mockResolvedValue(undefined),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      renameFile: vi.fn().mockResolvedValue(undefined),
      ensureInbox: vi.fn().mockResolvedValue(undefined),
      readSettings: vi.fn().mockResolvedValue({}),
      writeSettings: vi.fn().mockResolvedValue(undefined),
      createProject: vi.fn().mockResolvedValue(undefined),
      deleteProject: vi.fn().mockResolvedValue(undefined),
      renameProject: vi.fn().mockResolvedValue(undefined),
    };

    useTaskStore.setState({
      files: new Map([
        [
          "work",
          {
            name: "work",
            isSystem: false,
            tasks: new Map(),
          },
        ],
      ]),
      adapter:
        mockAdapter as unknown as import("../../services/workspace").StorageAdapter,
    });

    await expect(
      useTaskStore.getState().createProject("Inbox"),
    ).rejects.toThrow(/reserved/i);
    await expect(
      useTaskStore.getState().createProject("inbox"),
    ).rejects.toThrow(/reserved/i);
    await expect(
      useTaskStore.getState().renameProject("work", "Inbox"),
    ).rejects.toThrow(/reserved/i);
    await expect(
      useTaskStore.getState().renameProject("work", "inbox"),
    ).rejects.toThrow(/reserved/i);
  });

  it("maintains alphabetical order in getProjects and when renaming a project", async () => {
    const mockAdapter = {
      listFiles: vi.fn().mockResolvedValue([]),
      readFile: vi.fn().mockResolvedValue(""),
      writeFile: vi.fn().mockResolvedValue(undefined),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      renameFile: vi.fn().mockResolvedValue(undefined),
      ensureInbox: vi.fn().mockResolvedValue(undefined),
      readSettings: vi.fn().mockResolvedValue({}),
      writeSettings: vi.fn().mockResolvedValue(undefined),
      createProject: vi.fn().mockResolvedValue(undefined),
      deleteProject: vi.fn().mockResolvedValue(undefined),
      renameProject: vi.fn().mockResolvedValue(undefined),
    };

    useTaskStore.setState({
      files: new Map([
        ["Inbox", { name: "Inbox", isSystem: true, tasks: new Map() }],
        ["Alpha", { name: "Alpha", isSystem: false, tasks: new Map() }],
        ["Beta", { name: "Beta", isSystem: false, tasks: new Map() }],
        ["Gamma", { name: "Gamma", isSystem: false, tasks: new Map() }],
      ]),
      adapter:
        mockAdapter as unknown as import("../../services/workspace").StorageAdapter,
    });

    expect(useTaskStore.getState().getProjects()).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);

    await useTaskStore.getState().renameProject("Beta", "Beta 2");
    expect(useTaskStore.getState().getProjects()).toEqual([
      "Alpha",
      "Beta 2",
      "Gamma",
    ]);
  });

  it("resets files and isLoaded when switching to an uncached workspace during loadFiles", async () => {
    let resolveRead: (val: string) => void = () => {};
    const readPromise = new Promise<string>((resolve) => {
      resolveRead = resolve;
    });

    const mockAdapter = {
      listFiles: vi.fn().mockResolvedValue(["inbox.todo"]),
      readFile: vi.fn().mockReturnValue(readPromise),
      writeFile: vi.fn(),
      deleteFile: vi.fn(),
      renameFile: vi.fn(),
      ensureInbox: vi.fn(),
      readSettings: vi.fn().mockResolvedValue({}),
      writeSettings: vi.fn(),
      createProject: vi.fn(),
      deleteProject: vi.fn(),
      renameProject: vi.fn(),
    };

    useTaskStore.setState({
      currentWorkspaceId: "ws-old",
      isLoaded: true,
      files: new Map([
        [
          "Inbox",
          {
            name: "Inbox",
            isSystem: true,
            tasks: new Map([
              [
                "old-task",
                createMockTask({ id: "old-task", title: "Old Task" }),
              ],
            ]),
          },
        ],
      ]),
    });

    const loadPromise = useTaskStore
      .getState()
      .loadFiles(
        mockAdapter as unknown as import("../../services/workspace").StorageAdapter,
        "ws-new",
      );

    // Synchronously after calling loadFiles, state for the new uncached workspace should be reset
    expect(useTaskStore.getState().currentWorkspaceId).toBe("ws-new");
    expect(useTaskStore.getState().isLoaded).toBe(false);
    expect(useTaskStore.getState().files.size).toBe(0);

    resolveRead("- [ ] New Task\n  id: new-task");
    await loadPromise;

    expect(useTaskStore.getState().isLoaded).toBe(true);
    expect(
      useTaskStore.getState().files.get("Inbox")?.tasks.has("new-task"),
    ).toBe(true);
  });

  describe("task hierarchy, cascade deletion, and validation", () => {
    const mockAdapter = {
      listFiles: vi.fn().mockResolvedValue([]),
      readFile: vi.fn().mockResolvedValue(""),
      writeFile: vi.fn().mockResolvedValue(undefined),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      renameFile: vi.fn().mockResolvedValue(undefined),
      ensureInbox: vi.fn().mockResolvedValue(undefined),
      readSettings: vi.fn().mockResolvedValue({}),
      writeSettings: vi.fn().mockResolvedValue(undefined),
      createProject: vi.fn().mockResolvedValue(undefined),
      deleteProject: vi.fn().mockResolvedValue(undefined),
      renameProject: vi.fn().mockResolvedValue(undefined),
    };

    beforeEach(() => {
      vi.clearAllMocks();
      useTaskStore.setState({
        adapter:
          mockAdapter as unknown as import("../../services/workspace").StorageAdapter,
        currentWorkspaceId: "ws-test",
        isLoaded: true,
        files: new Map([
          [
            "Inbox",
            {
              name: "Inbox",
              isSystem: true,
              tasks: new Map(),
            },
          ],
          [
            "Work",
            {
              name: "Work",
              isSystem: false,
              tasks: new Map(),
            },
          ],
        ]),
        taskIndex: new Map(),
      });
    });

    it("adds a subtask and updates parent children array", async () => {
      const parentTask = createMockTask({
        id: "p1",
        title: "Parent",
        projectId: "Work",
        parentId: null,
      });
      await useTaskStore.getState().addTask(parentTask, "Work");

      const childTask = createMockTask({
        id: "c1",
        title: "Child",
        projectId: "Work",
        parentId: "p1",
      });
      await useTaskStore.getState().addTask(childTask, "Work");

      const store = useTaskStore.getState();
      const updatedParent = store.getTask("p1");
      const updatedChild = store.getTask("c1");

      expect(updatedParent?.children).toContain("c1");
      expect(updatedChild?.parentId).toBe("p1");
    });

    it("cascades deletion to descendant subtasks and unlinks from parent", async () => {
      const p1 = createMockTask({
        id: "p1",
        title: "Grandparent",
        projectId: "Work",
        parentId: null,
        children: ["c1"],
      });
      const c1 = createMockTask({
        id: "c1",
        title: "Parent Subtask",
        projectId: "Work",
        parentId: "p1",
        children: ["g1"],
      });
      const g1 = createMockTask({
        id: "g1",
        title: "Grandchild Subtask",
        projectId: "Work",
        parentId: "c1",
        children: [],
      });

      const workTasks = new Map<string, TodoItem>([
        ["p1", p1],
        ["c1", c1],
        ["g1", g1],
      ]);

      useTaskStore.setState({
        files: new Map([
          ["Work", { name: "Work", isSystem: false, tasks: workTasks }],
        ]),
        taskIndex: new Map([
          ["p1", "Work"],
          ["c1", "Work"],
          ["g1", "Work"],
        ]),
      });

      // Delete the middle subtask c1 -> should delete c1, g1, and unlink from p1
      await useTaskStore.getState().deleteTask("c1");

      const store = useTaskStore.getState();
      expect(store.getTask("c1")).toBeUndefined();
      expect(store.getTask("g1")).toBeUndefined();
      expect(store.getTask("p1")).toBeDefined();
      expect(store.getTask("p1")?.children).not.toContain("c1");
    });

    it("moves descendant subtasks when parent task is moved to another project", async () => {
      const p1 = createMockTask({
        id: "p1",
        title: "Parent",
        projectId: "Work",
        parentId: null,
        children: ["c1"],
      });
      const c1 = createMockTask({
        id: "c1",
        title: "Child",
        projectId: "Work",
        parentId: "p1",
      });

      useTaskStore.setState({
        files: new Map([
          [
            "Work",
            {
              name: "Work",
              isSystem: false,
              tasks: new Map([
                ["p1", p1],
                ["c1", c1],
              ]),
            },
          ],
          ["Inbox", { name: "Inbox", isSystem: true, tasks: new Map() }],
        ]),
        taskIndex: new Map([
          ["p1", "Work"],
          ["c1", "Work"],
        ]),
      });

      await useTaskStore.getState().updateTask("p1", { projectId: "Inbox" });

      const store = useTaskStore.getState();
      const movedParent = store.getTask("p1");
      const movedChild = store.getTask("c1");

      expect(movedParent?.projectId).toBe("Inbox");
      expect(movedChild?.projectId).toBe("Inbox");
      expect(store.taskIndex.get("p1")).toBe("Inbox");
      expect(store.taskIndex.get("c1")).toBe("Inbox");
    });

    it("validates project name for unsafe characters and length", async () => {
      await expect(
        useTaskStore.getState().createProject("   "),
      ).rejects.toThrow("Project name is required.");

      await expect(
        useTaskStore.getState().createProject("Invalid/Slash"),
      ).rejects.toThrow();

      await expect(
        useTaskStore.getState().createProject("A".repeat(101)),
      ).rejects.toThrow("Project name cannot exceed 100 characters.");
    });

    it("returns tasks in natural tree order with subtasks nested under their parents", () => {
      const p1 = createMockTask({
        id: "p1",
        title: "Parent 1",
        projectId: "Work",
        parentId: null,
        order: 0,
        children: ["c1_1", "c1_2"],
      });
      const c1_1 = createMockTask({
        id: "c1_1",
        title: "Child 1.1",
        projectId: "Work",
        parentId: "p1",
        order: 0,
      });
      const c1_2 = createMockTask({
        id: "c1_2",
        title: "Child 1.2",
        projectId: "Work",
        parentId: "p1",
        order: 1,
      });
      const p2 = createMockTask({
        id: "p2",
        title: "Parent 2",
        projectId: "Work",
        parentId: null,
        order: 1,
        children: ["c2_1"],
      });
      const c2_1 = createMockTask({
        id: "c2_1",
        title: "Child 2.1",
        projectId: "Work",
        parentId: "p2",
        order: 0,
      });

      // Insert into map in arbitrary order
      const workTasks = new Map<string, TodoItem>([
        ["c2_1", c2_1],
        ["p2", p2],
        ["c1_2", c1_2],
        ["p1", p1],
        ["c1_1", c1_1],
      ]);

      useTaskStore.setState({
        files: new Map([
          ["Work", { name: "Work", isSystem: false, tasks: workTasks }],
        ]),
      });

      const tasks = useTaskStore.getState().getTasksByView("project:Work");
      expect(tasks.map((t) => t.id)).toEqual([
        "p1",
        "c1_1",
        "c1_2",
        "p2",
        "c2_1",
      ]);
    });
  });
});
