import { useMemo } from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { getTodayLocalDateString, parseDueDate } from "../core/date-utils";
import { parseTodoFile } from "../core/parser";
import { serializeTasks } from "../core/parser/serializer";
import {
  RESERVED_PROJECT_NAMES,
  SAFE_NAME_MESSAGE,
  SAFE_NAME_REGEX,
} from "../core/schemas";
import type { TodoFile, TodoItem } from "../core/types";
import {
  getCachedFiles,
  getInitialWorkspaceId,
  setCachedFiles,
} from "../services/task-cache";
import type { StorageAdapter } from "../services/workspace";

const saveQueues = new Map<string, Promise<void>>();

const syncChannel =
  typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("smriti-sync")
    : null;

function broadcastFileChange(workspaceId: string | null, fileName: string) {
  if (!syncChannel || !workspaceId) return;
  try {
    syncChannel.postMessage({
      type: "FILE_SAVED",
      workspaceId,
      fileName,
    });
  } catch {}
}

const initialWorkspaceId = getInitialWorkspaceId();
const initialFiles = getCachedFiles(initialWorkspaceId);

function buildTaskIndex(files: Map<string, TodoFile>): Map<string, string> {
  const index = new Map<string, string>();
  for (const [fileName, file] of files) {
    for (const taskId of file.tasks.keys()) {
      index.set(taskId, fileName);
    }
  }
  return index;
}

function collectDescendantIds(
  taskId: string,
  tasks: Map<string, TodoItem>,
): string[] {
  const descendants: string[] = [];
  for (const t of tasks.values()) {
    if (t.parentId === taskId) {
      descendants.push(t.id);
      descendants.push(...collectDescendantIds(t.id, tasks));
    }
  }
  return descendants;
}

interface TaskState {
  files: Map<string, TodoFile>;
  taskIndex: Map<string, string>;
  adapter: StorageAdapter | null;
  isLoaded: boolean;
  currentWorkspaceId: string | null;

  loadFiles: (
    adapter: StorageAdapter,
    workspaceId: string | null,
  ) => Promise<void>;
  saveFile: (fileName: string) => Promise<void>;
  getTask: (id: string) => TodoItem | undefined;
  addTask: (task: TodoItem, fileName: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTasksByView: (view: string) => TodoItem[];
  getProjects: () => string[];
  createProject: (name: string) => Promise<void>;
  renameProject: (oldName: string, newName: string) => Promise<void>;
  deleteProject: (name: string) => Promise<void>;
  getAllTags: (workspaceTags?: string[]) => string[];
  renameTagInAllTasks: (oldName: string, newName: string) => Promise<void>;
  removeTagFromAllTasks: (tagName: string) => Promise<void>;
  bulkDeleteTasks: (ids: string[]) => Promise<void>;
  bulkUpdateTasks: (
    ids: string[],
    getUpdates: (task: TodoItem) => Partial<TodoItem>,
  ) => Promise<void>;
  saveError: string | null;
  clearSaveError: () => void;
}

function sortByDateDesc(dateA?: string, dateB?: string): number {
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  const timeA = Date.parse(dateA);
  const timeB = Date.parse(dateB);
  if (Number.isNaN(timeA) && Number.isNaN(timeB))
    return dateB.localeCompare(dateA);
  if (Number.isNaN(timeA)) return 1;
  if (Number.isNaN(timeB)) return -1;
  return timeB - timeA;
}

function getTasksInFileOrder(tasks: Map<string, TodoItem>): TodoItem[] {
  const result: TodoItem[] = [];
  const visited = new Set<string>();

  const rootTasks = Array.from(tasks.values())
    .filter((t) => t.parentId === null)
    .sort((a, b) => a.order - b.order);

  function appendTaskAndChildren(task: TodoItem) {
    result.push(task);
    visited.add(task.id);
    const children = Array.from(tasks.values())
      .filter((t) => t.parentId === task.id)
      .sort((a, b) => a.order - b.order);
    for (const child of children) {
      appendTaskAndChildren(child);
    }
  }

  for (const root of rootTasks) {
    appendTaskAndChildren(root);
  }

  for (const task of tasks.values()) {
    if (!visited.has(task.id)) {
      result.push(task);
      visited.add(task.id);
    }
  }

  return result;
}

function filterTasksByView(
  files: Map<string, TodoFile>,
  view: string,
): TodoItem[] {
  if (view === "inbox") {
    const inboxFile = files.get("Inbox") ?? files.get("inbox");
    return inboxFile
      ? getTasksInFileOrder(inboxFile.tasks).filter(
          (t) =>
            t.state !== "done" && !t.metadata.trashed && !t.metadata.archived,
        )
      : [];
  }

  if (view.startsWith("project:")) {
    const projectName = view.slice(8);
    const projectFile =
      files.get(projectName) ??
      (projectName.toLowerCase() === "inbox"
        ? (files.get("Inbox") ?? files.get("inbox"))
        : undefined);
    return projectFile
      ? getTasksInFileOrder(projectFile.tasks).filter(
          (t) =>
            !t.metadata.trashed && !t.metadata.archived && t.state !== "done",
        )
      : [];
  }

  const allTasks: TodoItem[] = [];
  for (const file of files.values()) {
    const fileTasks = getTasksInFileOrder(file.tasks);
    for (const task of fileTasks) {
      allTasks.push(task);
    }
  }

  const today = getTodayLocalDateString();

  switch (view) {
    case "all":
      return allTasks.filter(
        (t) =>
          !t.metadata.archived && !t.metadata.trashed && t.state !== "done",
      );
    case "today":
      return allTasks.filter((t) => {
        if (t.metadata.archived || t.metadata.trashed || t.state === "done") {
          return false;
        }
        const parsed = parseDueDate(t.metadata.due);
        return parsed.localDateStr !== null && parsed.localDateStr <= today;
      });
    case "upcoming":
      return allTasks.filter((t) => {
        if (t.metadata.archived || t.metadata.trashed || t.state === "done") {
          return false;
        }
        const parsed = parseDueDate(t.metadata.due);
        return parsed.localDateStr !== null && parsed.localDateStr > today;
      });
    case "archived":
      return allTasks
        .filter((t) => t.metadata.archived && !t.metadata.trashed)
        .sort((a, b) =>
          sortByDateDesc(a.metadata.archived, b.metadata.archived),
        );
    case "completed":
      return allTasks
        .filter(
          (t) =>
            t.state === "done" && !t.metadata.trashed && !t.metadata.archived,
        )
        .sort((a, b) =>
          sortByDateDesc(a.metadata.completed, b.metadata.completed),
        );
    case "trash":
      return allTasks
        .filter((t) => t.metadata.trashed)
        .sort((a, b) => sortByDateDesc(a.metadata.trashed, b.metadata.trashed));
    default:
      if (view.startsWith("tag:")) {
        const tagName = view.slice(4);
        return allTasks.filter(
          (t) =>
            Array.isArray(t.metadata.tags) &&
            t.metadata.tags.includes(tagName) &&
            !t.metadata.trashed &&
            !t.metadata.archived &&
            t.state !== "done",
        );
      }
      return allTasks.filter(
        (t) =>
          !t.metadata.archived && !t.metadata.trashed && t.state !== "done",
      );
  }
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  files: initialFiles,
  taskIndex: buildTaskIndex(initialFiles),
  adapter: null,
  isLoaded: initialFiles.size > 0,
  currentWorkspaceId: initialWorkspaceId,
  saveError: null,
  clearSaveError: () => set({ saveError: null }),

  loadFiles: async (adapter, workspaceId) => {
    const isWorkspaceSwitch =
      workspaceId !== null &&
      get().currentWorkspaceId !== null &&
      workspaceId !== get().currentWorkspaceId;

    if (workspaceId) {
      const cached = getCachedFiles(workspaceId);
      if (cached.size > 0) {
        set({
          files: cached,
          taskIndex: buildTaskIndex(cached),
          adapter,
          isLoaded: true,
          currentWorkspaceId: workspaceId,
        });
      } else if (isWorkspaceSwitch) {
        set({
          files: new Map(),
          taskIndex: new Map(),
          adapter,
          isLoaded: false,
          currentWorkspaceId: workspaceId,
        });
      } else {
        set({ currentWorkspaceId: workspaceId });
      }
    } else {
      set({ currentWorkspaceId: workspaceId });
    }

    const files = new Map<string, TodoFile>();
    const fileNames = await adapter.listFiles();

    if (workspaceId !== null && get().currentWorkspaceId !== workspaceId)
      return;

    for (const fileName of fileNames) {
      const content = await adapter.readFile(fileName);
      const isSystem = fileName.toLowerCase() === "inbox.todo";
      const name = isSystem ? "Inbox" : fileName.replace(".todo", "");
      const tasks = parseTodoFile(content, name);

      files.set(name, {
        name,
        isSystem,
        tasks,
      });
    }

    if (workspaceId !== null && get().currentWorkspaceId !== workspaceId)
      return;

    if (!files.has("Inbox")) {
      files.set("Inbox", {
        name: "Inbox",
        isSystem: true,
        tasks: new Map(),
      });
    }

    setCachedFiles(workspaceId, files);
    set({
      files,
      taskIndex: buildTaskIndex(files),
      adapter,
      isLoaded: true,
      currentWorkspaceId: workspaceId,
    });
  },

  saveFile: async (fileName) => {
    const canonicalName =
      fileName.toLowerCase() === "inbox" ? "Inbox" : fileName;
    const previous = saveQueues.get(canonicalName) ?? Promise.resolve();
    const current = previous
      .then(async () => {
        const { files, adapter, currentWorkspaceId } = get();
        const file =
          files.get(canonicalName) ??
          (canonicalName === "Inbox" ? files.get("inbox") : undefined);
        if (!file || !adapter) return;

        const content = serializeTasks(file.tasks);

        let lastError: unknown = null;
        const maxRetries = 2;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            await adapter.writeFile(`${canonicalName}.todo`, content);
            lastError = null;
            break;
          } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
              await new Promise((resolve) =>
                setTimeout(resolve, 300 * (attempt + 1)),
              );
            }
          }
        }

        // Always save rescue snapshot to local IndexedDB cache so user data is never lost
        setCachedFiles(currentWorkspaceId, get().files);

        if (lastError) {
          const errMsg = `Failed to save changes to "${canonicalName}.todo".`;
          console.error(errMsg, lastError);
          set({ saveError: errMsg });
          toast.error(errMsg, {
            id: `save-error-${canonicalName}`,
            description:
              "Your changes are preserved in local cache. Click retry to write to disk.",
            action: {
              label: "Retry",
              onClick: () => {
                void get().saveFile(canonicalName);
              },
            },
          });
          return;
        }

        if (get().saveError) {
          set({ saveError: null });
        }
        broadcastFileChange(currentWorkspaceId, canonicalName);
      })
      .catch((error: unknown) => {
        console.error(
          `Unexpected error in saveFile queue for "${canonicalName}":`,
          error,
        );
      });
    saveQueues.set(canonicalName, current);
    try {
      await current;
    } finally {
      if (saveQueues.get(canonicalName) === current) {
        saveQueues.delete(canonicalName);
      }
    }
  },

  getTask: (id) => {
    const { files, taskIndex } = get();
    const fileName = taskIndex.get(id);
    if (!fileName) return undefined;
    return files.get(fileName)?.tasks.get(id);
  },

  addTask: async (task, fileName) => {
    const canonicalName =
      fileName.toLowerCase() === "inbox" ? "Inbox" : fileName;
    const { files } = get();
    const file =
      files.get(canonicalName) ??
      (canonicalName === "Inbox" ? files.get("inbox") : undefined);
    if (!file) return;

    const normalizedTask: TodoItem = {
      ...task,
      projectId:
        task.projectId.toLowerCase() === "inbox" ? "Inbox" : task.projectId,
      attachments: task.attachments ?? [],
      children: task.children ?? [],
    };

    const newTasks = new Map(file.tasks);

    if (normalizedTask.parentId === null) {
      // Root task: append to end of root tasks in file
      const rootTasks = Array.from(file.tasks.values()).filter(
        (t) => t.parentId === null,
      );
      const maxOrder =
        rootTasks.length > 0 ? Math.max(...rootTasks.map((t) => t.order)) : -1;
      const taskWithOrder: TodoItem = {
        ...normalizedTask,
        order: maxOrder + 1,
      };
      newTasks.set(taskWithOrder.id, taskWithOrder);
    } else {
      // Subtask: append to end of parent's subtasks
      const siblings = Array.from(file.tasks.values()).filter(
        (t) => t.parentId === normalizedTask.parentId,
      );
      const maxSiblingOrder =
        siblings.length > 0 ? Math.max(...siblings.map((t) => t.order)) : -1;
      const subtaskWithOrder: TodoItem = {
        ...normalizedTask,
        order: maxSiblingOrder + 1,
      };
      newTasks.set(subtaskWithOrder.id, subtaskWithOrder);

      const parentTask = newTasks.get(normalizedTask.parentId);
      if (parentTask && !parentTask.children.includes(normalizedTask.id)) {
        newTasks.set(normalizedTask.parentId, {
          ...parentTask,
          children: [...parentTask.children, normalizedTask.id],
        });
      }
    }

    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.set(canonicalName, { ...file, tasks: newTasks });
      const newIndex = new Map(state.taskIndex);
      newIndex.set(normalizedTask.id, canonicalName);
      return { files: newFiles, taskIndex: newIndex };
    });

    await get().saveFile(canonicalName);
  },

  updateTask: async (id, updates) => {
    const { files, taskIndex } = get();
    const sourceFile = taskIndex.get(id) ?? null;

    if (!sourceFile) return;

    const file = files.get(sourceFile);
    if (!file) return;
    const task = file.tasks.get(id);
    if (!task) return;

    const isProjectChange =
      "projectId" in updates && updates.projectId !== task.projectId;

    if (isProjectChange) {
      const rawNewProjectId = updates.projectId;
      if (typeof rawNewProjectId !== "string") return;
      const newProjectId =
        rawNewProjectId.toLowerCase() === "inbox" ? "Inbox" : rawNewProjectId;
      const targetFile =
        files.get(newProjectId) ??
        (newProjectId === "Inbox" ? files.get("inbox") : undefined);

      if (!targetFile) return;

      const descendantIds = collectDescendantIds(id, file.tasks);
      const movingIds = [id, ...descendantIds];

      const oldTasks = new Map(file.tasks);
      const newTasks = new Map(targetFile.tasks);

      // If moved task was a subtask, unlink it from parent
      if (task.parentId) {
        const oldParent = oldTasks.get(task.parentId);
        if (oldParent?.children.includes(id)) {
          oldTasks.set(task.parentId, {
            ...oldParent,
            children: oldParent.children.filter((cid) => cid !== id),
          });
        }
      }

      // Append to bottom of target project as a root task
      const targetRootTasks = Array.from(targetFile.tasks.values()).filter(
        (t) => t.parentId === null,
      );
      const maxOrder =
        targetRootTasks.length > 0
          ? Math.max(...targetRootTasks.map((t) => t.order))
          : -1;
      const movedTask: TodoItem = {
        ...task,
        ...updates,
        parentId: null,
        projectId: newProjectId,
        order: maxOrder + 1,
      };
      oldTasks.delete(id);
      newTasks.set(id, movedTask);

      for (const descId of descendantIds) {
        const descTask = oldTasks.get(descId);
        if (descTask) {
          oldTasks.delete(descId);
          newTasks.set(descId, { ...descTask, projectId: newProjectId });
        }
      }

      set((state) => {
        const newFiles = new Map(state.files);
        newFiles.set(sourceFile, { ...file, tasks: oldTasks });
        newFiles.set(newProjectId, { ...targetFile, tasks: newTasks });
        const newIndex = new Map(state.taskIndex);
        for (const movingId of movingIds) {
          newIndex.set(movingId, newProjectId);
        }
        return { files: newFiles, taskIndex: newIndex };
      });

      await get().saveFile(sourceFile);
      await get().saveFile(newProjectId);
    } else {
      const normalizedUpdates = { ...updates };
      if (
        "projectId" in normalizedUpdates &&
        typeof normalizedUpdates.projectId === "string" &&
        normalizedUpdates.projectId.toLowerCase() === "inbox"
      ) {
        normalizedUpdates.projectId = "Inbox";
      }
      // Never allow updates to change order. Tasks remain pinned at their line position.
      delete normalizedUpdates.order;

      const newTasks = new Map(file.tasks);
      newTasks.set(id, { ...task, ...normalizedUpdates });

      set((state) => {
        const newFiles = new Map(state.files);
        newFiles.set(sourceFile, { ...file, tasks: newTasks });
        return { files: newFiles };
      });

      await get().saveFile(sourceFile);
    }
  },

  deleteTask: async (id) => {
    const { files, taskIndex } = get();
    const targetFile = taskIndex.get(id) ?? null;

    if (!targetFile) return;

    const file = files.get(targetFile);
    if (!file) return;

    const descendantIds = collectDescendantIds(id, file.tasks);
    const allIdsToDelete = [id, ...descendantIds];

    const newTasks = new Map(file.tasks);
    const targetTask = file.tasks.get(id);
    if (targetTask?.parentId) {
      const parent = newTasks.get(targetTask.parentId);
      if (parent?.children.includes(id)) {
        newTasks.set(targetTask.parentId, {
          ...parent,
          children: parent.children.filter((cid) => cid !== id),
        });
      }
    }

    const newIndex = new Map(taskIndex);
    for (const deleteId of allIdsToDelete) {
      newTasks.delete(deleteId);
      newIndex.delete(deleteId);
    }

    const newFiles = new Map(files);
    newFiles.set(targetFile, { ...file, tasks: newTasks });

    set({ files: newFiles, taskIndex: newIndex });

    await get().saveFile(targetFile);
  },

  bulkDeleteTasks: async (ids) => {
    const { files, taskIndex } = get();
    const affectedFiles = new Set<string>();
    const newFiles = new Map(files);
    const newIndex = new Map(taskIndex);

    const idsToDelete = new Set(ids);
    for (const id of ids) {
      const fileName = newIndex.get(id);
      if (!fileName) continue;
      const file = newFiles.get(fileName);
      if (!file) continue;
      const descendants = collectDescendantIds(id, file.tasks);
      for (const descId of descendants) {
        idsToDelete.add(descId);
      }
    }

    for (const id of idsToDelete) {
      const fileName = newIndex.get(id);
      if (!fileName) continue;
      const file = newFiles.get(fileName);
      if (!file) continue;
      if (!affectedFiles.has(fileName)) {
        newFiles.set(fileName, { ...file, tasks: new Map(file.tasks) });
      }
      const updatedFile = newFiles.get(fileName);
      if (updatedFile) {
        const taskToDelete = updatedFile.tasks.get(id);
        if (taskToDelete?.parentId) {
          const parent = updatedFile.tasks.get(taskToDelete.parentId);
          if (parent?.children.includes(id)) {
            updatedFile.tasks.set(taskToDelete.parentId, {
              ...parent,
              children: parent.children.filter((cid) => cid !== id),
            });
          }
        }
        updatedFile.tasks.delete(id);
      }
      newIndex.delete(id);
      affectedFiles.add(fileName);
    }

    set({ files: newFiles, taskIndex: newIndex });

    for (const fileName of affectedFiles) {
      await get().saveFile(fileName);
    }
  },

  bulkUpdateTasks: async (ids, getUpdates) => {
    const { files, taskIndex } = get();
    const affectedFiles = new Set<string>();
    const newFiles = new Map(files);
    const newIndex = new Map(taskIndex);

    for (const id of ids) {
      const fileName = newIndex.get(id);
      if (!fileName) continue;
      const file = newFiles.get(fileName);
      if (!file) continue;
      const task = file.tasks.get(id);
      if (!task) continue;

      const updates = getUpdates(task);
      const isProjectChange =
        "projectId" in updates &&
        typeof updates.projectId === "string" &&
        updates.projectId !== task.projectId;

      if (isProjectChange) {
        const rawNewProjectId = updates.projectId as string;
        const newProjectId =
          rawNewProjectId.toLowerCase() === "inbox" ? "Inbox" : rawNewProjectId;
        const targetFile =
          newFiles.get(newProjectId) ??
          (newProjectId === "Inbox" ? newFiles.get("inbox") : undefined);

        if (targetFile) {
          if (!affectedFiles.has(fileName)) {
            newFiles.set(fileName, { ...file, tasks: new Map(file.tasks) });
          }
          if (!affectedFiles.has(newProjectId)) {
            newFiles.set(newProjectId, {
              ...targetFile,
              tasks: new Map(targetFile.tasks),
            });
          }

          const currentSourceFile = newFiles.get(fileName);
          const currentTargetFile = newFiles.get(newProjectId);

          if (currentSourceFile && currentTargetFile) {
            currentSourceFile.tasks.delete(id);
            currentTargetFile.tasks.set(id, {
              ...task,
              ...updates,
              projectId: newProjectId,
            });
            newIndex.set(id, newProjectId);
            affectedFiles.add(fileName);
            affectedFiles.add(newProjectId);
          }
          continue;
        }
      }

      if (!affectedFiles.has(fileName)) {
        newFiles.set(fileName, { ...file, tasks: new Map(file.tasks) });
      }
      const updatedFile = newFiles.get(fileName);
      if (updatedFile) {
        updatedFile.tasks.set(id, { ...task, ...updates });
      }
      affectedFiles.add(fileName);
    }

    set({ files: newFiles, taskIndex: newIndex });

    for (const fileName of affectedFiles) {
      await get().saveFile(fileName);
    }
  },

  getTasksByView: (view) => filterTasksByView(get().files, view),

  getProjects: () => {
    const { files } = get();
    return Array.from(files.values())
      .filter((f) => !f.isSystem)
      .map((f) => f.name)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  },

  createProject: async (name) => {
    const { adapter, files, currentWorkspaceId } = get();
    if (!adapter) return;

    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Project name is required.");
    }
    if (trimmed.length > 100) {
      throw new Error("Project name cannot exceed 100 characters.");
    }
    if (!SAFE_NAME_REGEX.test(trimmed)) {
      throw new Error(SAFE_NAME_MESSAGE);
    }

    const lowerName = trimmed.toLowerCase();
    if (RESERVED_PROJECT_NAMES.some((r) => r.toLowerCase() === lowerName)) {
      throw new Error(`"${trimmed}" is a reserved name and cannot be used.`);
    }

    const existing = Array.from(files.keys()).find(
      (k) => k.toLowerCase() === lowerName,
    );
    if (existing) {
      throw new Error(`A project named "${existing}" already exists.`);
    }

    await adapter.createProject(trimmed);

    if (
      currentWorkspaceId !== null &&
      get().currentWorkspaceId !== currentWorkspaceId
    ) {
      return;
    }

    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.set(trimmed, {
        name: trimmed,
        isSystem: false,
        tasks: new Map(),
      });
      setCachedFiles(currentWorkspaceId, newFiles);
      return { files: newFiles };
    });
  },

  renameProject: async (oldName, newName) => {
    const { adapter, files, currentWorkspaceId } = get();
    if (!adapter) return;

    const file = files.get(oldName);
    if (!file || file.isSystem) return;

    const trimmed = newName.trim();
    if (!trimmed) {
      throw new Error("Project name is required.");
    }
    if (trimmed.length > 100) {
      throw new Error("Project name cannot exceed 100 characters.");
    }
    if (!SAFE_NAME_REGEX.test(trimmed)) {
      throw new Error(SAFE_NAME_MESSAGE);
    }

    const lowerName = trimmed.toLowerCase();
    if (RESERVED_PROJECT_NAMES.some((r) => r.toLowerCase() === lowerName)) {
      throw new Error(`"${trimmed}" is a reserved name and cannot be used.`);
    }

    const existing = Array.from(files.keys()).find(
      (k) => k.toLowerCase() === lowerName && k !== oldName,
    );
    if (existing) {
      throw new Error(`A project named "${existing}" already exists.`);
    }

    await adapter.renameProject(oldName, trimmed);

    if (
      currentWorkspaceId !== null &&
      get().currentWorkspaceId !== currentWorkspaceId
    ) {
      return;
    }

    set((state) => {
      const updatedTasks = new Map<string, TodoItem>();
      for (const [id, t] of file.tasks) {
        updatedTasks.set(id, { ...t, projectId: trimmed });
      }

      const newFiles = new Map<string, TodoFile>();
      for (const [key, val] of state.files) {
        if (key === oldName) {
          newFiles.set(trimmed, { ...val, name: trimmed, tasks: updatedTasks });
        } else {
          newFiles.set(key, val);
        }
      }

      const newIndex = new Map(state.taskIndex);
      for (const [taskId, fileName] of newIndex) {
        if (fileName === oldName) {
          newIndex.set(taskId, trimmed);
        }
      }

      setCachedFiles(currentWorkspaceId, newFiles);
      return { files: newFiles, taskIndex: newIndex };
    });
  },

  deleteProject: async (name) => {
    const { adapter, files, currentWorkspaceId } = get();
    if (!adapter) return;

    const file = files.get(name);
    if (!file || file.isSystem) return;

    await adapter.deleteProject(name);

    if (
      currentWorkspaceId !== null &&
      get().currentWorkspaceId !== currentWorkspaceId
    ) {
      return;
    }

    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.delete(name);

      const newIndex = new Map(state.taskIndex);
      for (const [taskId, fileName] of newIndex) {
        if (fileName === name) {
          newIndex.delete(taskId);
        }
      }

      setCachedFiles(currentWorkspaceId, newFiles);
      return { files: newFiles, taskIndex: newIndex };
    });
  },

  getAllTags: (workspaceTags) => {
    const { files } = get();
    const tagSet = new Set<string>();

    if (workspaceTags) {
      for (const tag of workspaceTags) {
        if (typeof tag === "string" && tag.trim()) {
          tagSet.add(tag.trim());
        }
      }
    }

    for (const file of files.values()) {
      for (const task of file.tasks.values()) {
        const rawTags = task.metadata.tags;
        const taskTags = Array.isArray(rawTags)
          ? rawTags
          : typeof rawTags === "string"
            ? (rawTags as string).split(",")
            : [];
        for (const tag of taskTags) {
          if (typeof tag === "string" && tag.trim()) {
            tagSet.add(tag.trim());
          }
        }
      }
    }
    return Array.from(tagSet).sort();
  },

  renameTagInAllTasks: async (oldName, newName) => {
    const { files } = get();
    const affectedFiles = new Set<string>();
    const newFiles = new Map(files);

    for (const [fileName, file] of files) {
      let changed = false;
      const newTasks = new Map(file.tasks);
      for (const [id, task] of newTasks) {
        if (
          Array.isArray(task.metadata.tags) &&
          task.metadata.tags.includes(oldName)
        ) {
          const newTags = task.metadata.tags.map((t) =>
            t === oldName ? newName : t,
          );
          newTasks.set(id, {
            ...task,
            metadata: { ...task.metadata, tags: newTags },
          });
          changed = true;
        }
      }
      if (changed) {
        affectedFiles.add(fileName);
        newFiles.set(fileName, { ...file, tasks: newTasks });
      }
    }

    if (affectedFiles.size > 0) {
      set({ files: newFiles });

      for (const fileName of affectedFiles) {
        await get().saveFile(fileName);
      }
    }
  },

  removeTagFromAllTasks: async (tagName) => {
    const { files } = get();
    const affectedFiles = new Set<string>();
    const newFiles = new Map(files);

    for (const [fileName, file] of files) {
      let changed = false;
      const newTasks = new Map(file.tasks);
      for (const [id, task] of newTasks) {
        if (
          Array.isArray(task.metadata.tags) &&
          task.metadata.tags.includes(tagName)
        ) {
          const newTags = task.metadata.tags.filter((t) => t !== tagName);
          newTasks.set(id, {
            ...task,
            metadata: {
              ...task.metadata,
              tags: newTags.length > 0 ? newTags : undefined,
            },
          });
          changed = true;
        }
      }
      if (changed) {
        affectedFiles.add(fileName);
        newFiles.set(fileName, { ...file, tasks: newTasks });
      }
    }

    if (affectedFiles.size > 0) {
      set({ files: newFiles });

      for (const fileName of affectedFiles) {
        await get().saveFile(fileName);
      }
    }
  },
}));

if (syncChannel) {
  syncChannel.onmessage = async (event: MessageEvent) => {
    const data = event.data;
    if (data?.type !== "FILE_SAVED") return;
    const { workspaceId, fileName } = data as {
      workspaceId?: string;
      fileName?: string;
    };
    const { currentWorkspaceId, adapter, isLoaded } = useTaskStore.getState();
    if (
      !adapter ||
      !isLoaded ||
      workspaceId !== currentWorkspaceId ||
      !fileName ||
      typeof fileName !== "string"
    ) {
      return;
    }

    const trimmed = fileName.trim();
    if (!SAFE_NAME_REGEX.test(trimmed)) {
      return;
    }

    try {
      const isSystem = fileName.toLowerCase() === "inbox";
      const canonicalName = isSystem ? "Inbox" : fileName;
      const content = await adapter.readFile(`${canonicalName}.todo`);
      const tasks = parseTodoFile(content, canonicalName);

      const currentFiles = useTaskStore.getState().files;
      const newFiles = new Map(currentFiles);
      newFiles.set(canonicalName, {
        name: canonicalName,
        isSystem,
        tasks,
      });

      setCachedFiles(workspaceId, newFiles);
      useTaskStore.setState({
        files: newFiles,
        taskIndex: buildTaskIndex(newFiles),
      });
    } catch (err) {
      console.error("Cross-tab sync error:", err);
    }
  };
}

export function useTasksByView(view: string): TodoItem[] {
  const files = useTaskStore((s) => s.files);
  return useMemo(() => filterTasksByView(files, view), [files, view]);
}

export function useProjects(): string[] {
  const files = useTaskStore((s) => s.files);
  return useMemo(
    () =>
      Array.from(files.values())
        .filter((f) => !f.isSystem)
        .map((f) => f.name)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [files],
  );
}

export function useAllTags(workspaceTags?: string[]): string[] {
  const files = useTaskStore((s) => s.files);
  return useMemo(() => {
    const tagSet = new Set<string>();
    if (workspaceTags) {
      for (const tag of workspaceTags) {
        if (typeof tag === "string" && tag.trim()) tagSet.add(tag.trim());
      }
    }
    for (const file of files.values()) {
      for (const task of file.tasks.values()) {
        const rawTags = task.metadata.tags;
        const taskTags = Array.isArray(rawTags)
          ? rawTags
          : typeof rawTags === "string"
            ? (rawTags as string).split(",")
            : [];
        for (const tag of taskTags) {
          if (typeof tag === "string" && tag.trim()) tagSet.add(tag.trim());
        }
      }
    }
    return Array.from(tagSet).sort();
  }, [files, workspaceTags]);
}
