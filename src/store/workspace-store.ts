import { nanoid } from "nanoid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Settings, WorkspaceEntry, WorkspaceMode } from "../core/types";
import { DEFAULT_SETTINGS } from "../core/types";
import { FileSystemAdapter } from "../services/file-system";
import { LocalStorageAdapter } from "../services/local-storage";
import {
  clearDirHandle,
  getDirHandle,
  requestPermission,
  storeDirHandle,
} from "../services/permission";
import { clearCachedFiles } from "../services/task-cache";
import type { StorageAdapter } from "../services/workspace";
import { useTaskStore } from "./task-store";

function isMissingFolderError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotFoundError";
}

async function findFileSystemEntry(
  workspaces: WorkspaceEntry[],
  dirHandle: FileSystemDirectoryHandle,
  folderName: string,
): Promise<WorkspaceEntry | null> {
  for (const entry of workspaces) {
    if (entry.mode !== "file-system") continue;
    try {
      const stored = await getDirHandle(entry.id);
      if (stored && (await dirHandle.isSameEntry(stored))) {
        return entry;
      }
    } catch {
      // Fall through to name matching below.
    }
  }
  return (
    workspaces.find((w) => w.name === folderName && w.mode === "file-system") ??
    null
  );
}

function getActiveWorkspaceState(params: {
  id: string;
  name: string;
  mode: WorkspaceMode;
  adapter: StorageAdapter;
  settings?: Settings;
  workspaces?: WorkspaceEntry[];
}) {
  return {
    mode: params.mode,
    view: "main" as const,
    workspaceName: params.name,
    settings: params.settings ?? { ...DEFAULT_SETTINGS },
    isLoaded: true,
    needsReconnect: false,
    folderMissing: false,
    adapter: params.adapter,
    currentWorkspaceId: params.id,
    ...(params.workspaces ? { workspaces: params.workspaces } : {}),
  };
}

interface WorkspaceState {
  mode: WorkspaceMode | null;
  view: "picker" | "main";
  workspaceName: string;
  settings: Settings;
  isLoaded: boolean;
  needsReconnect: boolean;
  adapter: StorageAdapter | null;
  currentWorkspaceId: string | null;
  workspaces: WorkspaceEntry[];

  setView: (view: "picker" | "main") => void;
  setSettings: (settings: Partial<Settings>) => void;
  folderMissing: boolean;
  setFolderMissing: (missing: boolean) => void;
  reset: () => void;

  createWorkspace: (
    name: string,
    dirHandle: FileSystemDirectoryHandle,
    path?: string,
  ) => Promise<StorageAdapter>;
  openWorkspace: (
    dirHandle: FileSystemDirectoryHandle,
    path?: string,
  ) => Promise<StorageAdapter>;
  connectLocalStorage: (name: string) => Promise<StorageAdapter>;
  reconnectWorkspace: () => Promise<StorageAdapter | null>;
  rebindWorkspaceFolder: (
    dirHandle: FileSystemDirectoryHandle,
  ) => Promise<StorageAdapter | null>;
  switchWorkspace: (id: string) => Promise<StorageAdapter | null>;
  removeWorkspace: (id: string) => Promise<void>;
  renameWorkspace: (id: string, newName: string) => void;
  addTag: (name: string) => void;
  renameTag: (oldName: string, newName: string) => void;
  removeTag: (name: string) => void;
  setProjectIcon: (projectName: string, icon?: string) => void;
  removeProjectIcon: (projectName: string) => void;
  renameProjectIcon: (
    oldName: string,
    newName: string,
    newIcon?: string,
  ) => void;
  setTagIcon: (tagName: string, icon?: string) => void;
  removeTagIcon: (tagName: string) => void;
  renameTagIcon: (oldName: string, newName: string, newIcon?: string) => void;
  togglePinProject: (projectName: string) => void;
  removePinnedProject: (projectName: string) => void;
  renamePinnedProject: (oldName: string, newName: string) => void;
  togglePinTag: (tagName: string) => void;
  removePinnedTag: (tagName: string) => void;
  renamePinnedTag: (oldName: string, newName: string) => void;
}

let settingsSavePromise = Promise.resolve();

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      mode: null,
      view: "picker",
      workspaceName: "",
      settings: DEFAULT_SETTINGS,
      isLoaded: false,
      needsReconnect: false,
      folderMissing: false,
      adapter: null,
      currentWorkspaceId: null,
      workspaces: [],

      setView: (view) => set({ view }),
      setSettings: (newSettings) => {
        set((state) => {
          const currentTags = Array.isArray(state.settings?.tags)
            ? state.settings.tags
            : [];
          const incomingTags = newSettings.tags;
          const safeTags = Array.isArray(incomingTags)
            ? incomingTags
            : currentTags;

          const currentProjectIcons =
            state.settings?.projectIcons &&
            typeof state.settings.projectIcons === "object"
              ? state.settings.projectIcons
              : {};
          const safeProjectIcons =
            newSettings.projectIcons !== undefined
              ? newSettings.projectIcons
              : currentProjectIcons;

          const currentTagIcons =
            state.settings?.tagIcons &&
            typeof state.settings.tagIcons === "object"
              ? state.settings.tagIcons
              : {};
          const safeTagIcons =
            newSettings.tagIcons !== undefined
              ? newSettings.tagIcons
              : currentTagIcons;

          const currentPinnedProjects = Array.isArray(
            state.settings?.pinnedProjects,
          )
            ? state.settings.pinnedProjects
            : [];
          const safePinnedProjects = Array.isArray(newSettings.pinnedProjects)
            ? newSettings.pinnedProjects
            : currentPinnedProjects;

          const currentPinnedTags = Array.isArray(state.settings?.pinnedTags)
            ? state.settings.pinnedTags
            : [];
          const safePinnedTags = Array.isArray(newSettings.pinnedTags)
            ? newSettings.pinnedTags
            : currentPinnedTags;

          return {
            settings: {
              ...DEFAULT_SETTINGS,
              ...state.settings,
              ...newSettings,
              tags: safeTags,
              projectIcons: safeProjectIcons,
              tagIcons: safeTagIcons,
              pinnedProjects: safePinnedProjects,
              pinnedTags: safePinnedTags,
            },
          };
        });
        const { adapter, settings } = get();
        if (adapter) {
          settingsSavePromise = settingsSavePromise
            .then(async () => {
              if (get().adapter === adapter) {
                await adapter.writeSettings(settings);
              }
            })
            .catch(() => {});
        }
      },
      setFolderMissing: (folderMissing) => set({ folderMissing }),
      reset: () => {
        const { currentWorkspaceId, workspaces, adapter } = get();
        if (adapter?.cleanup) {
          adapter.cleanup().catch(() => {});
        }
        if (currentWorkspaceId) {
          clearDirHandle(currentWorkspaceId).catch(() => {});
          clearCachedFiles(currentWorkspaceId);
        }
        for (const ws of workspaces) {
          clearCachedFiles(ws.id);
        }
        set({
          mode: null,
          view: "picker",
          workspaceName: "",
          settings: DEFAULT_SETTINGS,
          isLoaded: false,
          needsReconnect: false,
          folderMissing: false,
          adapter: null,
          currentWorkspaceId: null,
          workspaces: [],
        });
      },

      createWorkspace: async (name, dirHandle, path) => {
        const id = nanoid();
        await storeDirHandle(id, dirHandle);
        const adapter = new FileSystemAdapter(dirHandle);
        await adapter.ensureInbox();
        await adapter.writeSettings({ ...DEFAULT_SETTINGS });
        const fullPath = path || `/${dirHandle.name}`;
        set((state) =>
          getActiveWorkspaceState({
            id,
            name,
            mode: "file-system",
            adapter,
            workspaces: [
              ...state.workspaces,
              { id, name, mode: "file-system", path: fullPath },
            ],
          }),
        );
        return adapter;
      },

      openWorkspace: async (dirHandle, path) => {
        const permission = await requestPermission(dirHandle);
        if (!permission) {
          throw new Error("Permission denied");
        }
        const adapter = new FileSystemAdapter(dirHandle);
        await adapter.ensureInbox();
        const settings = await adapter.readSettings();
        const folderName = dirHandle.name;
        const fullPath = path || `/${folderName}`;
        const existing = await findFileSystemEntry(
          get().workspaces,
          dirHandle,
          folderName,
        );
        if (existing) {
          await storeDirHandle(existing.id, dirHandle);
          set((state) =>
            getActiveWorkspaceState({
              id: existing.id,
              name: folderName,
              mode: "file-system",
              adapter,
              settings,
              workspaces: state.workspaces.map((w) =>
                w.id === existing.id
                  ? { ...w, name: folderName, path: fullPath || w.path }
                  : w,
              ),
            }),
          );
          return adapter;
        }
        const id = nanoid();
        await storeDirHandle(id, dirHandle);
        set((state) =>
          getActiveWorkspaceState({
            id,
            name: folderName,
            mode: "file-system",
            adapter,
            settings,
            workspaces: [
              ...state.workspaces,
              { id, name: folderName, mode: "file-system", path: fullPath },
            ],
          }),
        );
        return adapter;
      },

      connectLocalStorage: async (name) => {
        const existing = get().workspaces.find(
          (w) => w.name === name && w.mode === "local-storage",
        );
        const id = existing?.id ?? nanoid();
        const adapter = new LocalStorageAdapter(id);
        if (existing) {
          await adapter.migrateNamespace(name);
        }
        await adapter.ensureInbox();
        const settings = await adapter.readSettings();
        if (existing) {
          set(
            getActiveWorkspaceState({
              id: existing.id,
              name,
              mode: "local-storage",
              adapter,
              settings,
            }),
          );
          return adapter;
        }
        set((state) =>
          getActiveWorkspaceState({
            id,
            name,
            mode: "local-storage",
            adapter,
            settings,
            workspaces: [
              ...state.workspaces,
              { id, name, mode: "local-storage" },
            ],
          }),
        );
        return adapter;
      },

      reconnectWorkspace: async () => {
        const { mode, currentWorkspaceId } = get();
        if (!currentWorkspaceId) {
          set({ needsReconnect: true });
          return null;
        }

        if (mode === "local-storage") {
          const entry = get().workspaces.find(
            (w) => w.id === currentWorkspaceId,
          );
          if (!entry) {
            set({ needsReconnect: true });
            return null;
          }
          const adapter = new LocalStorageAdapter(entry.id);
          let settings = get().settings;
          try {
            const storedSettings = await adapter.readSettings();
            settings = { ...DEFAULT_SETTINGS, ...settings, ...storedSettings };
          } catch {
            // Use current store settings
          }
          set({
            isLoaded: true,
            needsReconnect: false,
            folderMissing: false,
            adapter,
            settings,
          });
          return adapter;
        }

        if (mode === "file-system") {
          const handle = await getDirHandle(currentWorkspaceId);
          if (!handle) {
            set({ needsReconnect: true });
            return null;
          }

          try {
            const permission = await requestPermission(handle);
            if (!permission) {
              set({ needsReconnect: true });
              return null;
            }

            const adapter = new FileSystemAdapter(handle);
            await adapter.listFiles();
            let settings = get().settings;
            try {
              const storedSettings = await adapter.readSettings();
              settings = {
                ...DEFAULT_SETTINGS,
                ...settings,
                ...storedSettings,
              };
            } catch {
              // Use current store settings
            }
            set({
              isLoaded: true,
              needsReconnect: false,
              folderMissing: false,
              adapter,
              settings,
            });
            return adapter;
          } catch (e) {
            if (isMissingFolderError(e)) {
              await clearDirHandle(currentWorkspaceId).catch(() => {});
              set((state) => ({
                workspaces: state.workspaces.filter(
                  (w) => w.id !== currentWorkspaceId,
                ),
                folderMissing: true,
                adapter: null,
              }));
            } else {
              set({ folderMissing: true, adapter: null });
            }
            return null;
          }
        }

        return null;
      },

      rebindWorkspaceFolder: async (dirHandle) => {
        const { currentWorkspaceId } = get();
        if (!currentWorkspaceId) return null;
        const adapter = new FileSystemAdapter(dirHandle);
        try {
          await adapter.listFiles();
        } catch {
          set({ folderMissing: true, adapter: null });
          return null;
        }
        await storeDirHandle(currentWorkspaceId, dirHandle);
        const settings = await adapter.readSettings();
        const folderName = dirHandle.name;
        const fullPath = `/${folderName}`;
        set((state) =>
          getActiveWorkspaceState({
            id: currentWorkspaceId,
            name: folderName,
            mode: "file-system",
            adapter,
            settings,
            workspaces: state.workspaces.some(
              (w) => w.id === currentWorkspaceId,
            )
              ? state.workspaces.map((w) =>
                  w.id === currentWorkspaceId
                    ? { ...w, name: folderName, path: w.path || fullPath }
                    : w,
                )
              : [
                  ...state.workspaces,
                  {
                    id: currentWorkspaceId,
                    name: folderName,
                    mode: "file-system",
                    path: fullPath,
                  },
                ],
          }),
        );
        return adapter;
      },

      switchWorkspace: async (id) => {
        const entry = get().workspaces.find((w) => w.id === id);
        if (!entry) return null;

        if (entry.mode === "file-system") {
          const handle = await getDirHandle(id);
          if (!handle) {
            set({ needsReconnect: true });
            return null;
          }

          try {
            const permission = await requestPermission(handle);
            if (!permission) {
              set({ needsReconnect: true });
              return null;
            }

            const folderName = handle.name;
            const adapter = new FileSystemAdapter(handle);
            await adapter.listFiles();
            await adapter.ensureInbox();
            const settings = await adapter.readSettings();
            set((state) =>
              getActiveWorkspaceState({
                id,
                name: folderName,
                mode: "file-system",
                adapter,
                settings,
                workspaces: state.workspaces.map((w) =>
                  w.id === id ? { ...w, name: folderName } : w,
                ),
              }),
            );
            void useTaskStore.getState().loadFiles(adapter, id);
            return adapter;
          } catch (e) {
            if (isMissingFolderError(e)) {
              await clearDirHandle(id).catch(() => {});
              clearCachedFiles(id);
              set((state) => ({
                workspaces: state.workspaces.filter((w) => w.id !== id),
                folderMissing: true,
                adapter: null,
              }));
            } else {
              set({ folderMissing: true, adapter: null });
            }
            return null;
          }
        }

        if (entry.mode === "local-storage") {
          const adapter = new LocalStorageAdapter(entry.id);
          await adapter.migrateNamespace(entry.name);
          await adapter.ensureInbox();
          const settings = await adapter.readSettings();
          set(
            getActiveWorkspaceState({
              id,
              name: entry.name,
              mode: "local-storage",
              adapter,
              settings,
            }),
          );
          void useTaskStore.getState().loadFiles(adapter, id);
          return adapter;
        }

        return null;
      },

      removeWorkspace: async (id) => {
        const { workspaces, currentWorkspaceId, adapter } = get();
        const workspace = workspaces.find((w) => w.id === id);

        if (workspace?.mode === "local-storage") {
          if (currentWorkspaceId === id && adapter?.cleanup) {
            await adapter.cleanup();
            const legacyAdapter = new LocalStorageAdapter(workspace.name);
            await legacyAdapter.cleanup?.();
          } else if (workspace) {
            const tempAdapter = new LocalStorageAdapter(workspace.id);
            await tempAdapter.cleanup?.();
            const legacyAdapter = new LocalStorageAdapter(workspace.name);
            await legacyAdapter.cleanup?.();
          }
        }

        await clearDirHandle(id);
        clearCachedFiles(id);
        const remaining = workspaces.filter((w) => w.id !== id);
        set({ workspaces: remaining });
        if (currentWorkspaceId === id && remaining.length > 0) {
          const next = remaining[0];
          if (next) get().switchWorkspace(next.id);
        } else if (remaining.length === 0) {
          get().reset();
        }
      },

      renameWorkspace: (id, newName) => {
        const { currentWorkspaceId } = get();
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === id ? { ...w, name: newName } : w,
          ),
          ...(currentWorkspaceId === id ? { workspaceName: newName } : {}),
        }));
      },

      addTag: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const { settings } = get();
        const currentTags = Array.isArray(settings?.tags) ? settings.tags : [];
        if (currentTags.includes(trimmed)) return;
        const newTags = [...currentTags, trimmed].sort();
        get().setSettings({ tags: newTags });
      },

      renameTag: (oldName, newName) => {
        const { settings } = get();
        const currentTags = Array.isArray(settings?.tags) ? settings.tags : [];
        const newTags = currentTags
          .map((t) => (t === oldName ? newName : t))
          .sort();
        const tagIcons = { ...(settings?.tagIcons || {}) };
        if (tagIcons[oldName]) {
          tagIcons[newName] = tagIcons[oldName];
          delete tagIcons[oldName];
        }
        const currentPinnedTags = Array.isArray(settings?.pinnedTags)
          ? settings.pinnedTags
          : [];
        const pinnedTags = currentPinnedTags.map((t) =>
          t === oldName ? newName : t,
        );
        get().setSettings({ tags: newTags, tagIcons, pinnedTags });
      },

      removeTag: (name) => {
        const { settings } = get();
        const currentTags = Array.isArray(settings?.tags) ? settings.tags : [];
        const newTags = currentTags.filter((t) => t !== name);
        const tagIcons = { ...(settings?.tagIcons || {}) };
        delete tagIcons[name];
        const currentPinnedTags = Array.isArray(settings?.pinnedTags)
          ? settings.pinnedTags
          : [];
        const pinnedTags = currentPinnedTags.filter((t) => t !== name);
        get().setSettings({ tags: newTags, tagIcons, pinnedTags });
      },

      setProjectIcon: (projectName, icon) => {
        const { settings } = get();
        const projectIcons = { ...(settings?.projectIcons || {}) };
        if (icon) {
          projectIcons[projectName] = icon;
        } else {
          delete projectIcons[projectName];
        }
        get().setSettings({ projectIcons });
      },

      removeProjectIcon: (projectName) => {
        const { settings } = get();
        const projectIcons = { ...(settings?.projectIcons || {}) };
        delete projectIcons[projectName];
        get().setSettings({ projectIcons });
      },

      renameProjectIcon: (oldName, newName, newIcon) => {
        const { settings } = get();
        const projectIcons = { ...(settings?.projectIcons || {}) };
        const icon = newIcon !== undefined ? newIcon : projectIcons[oldName];
        delete projectIcons[oldName];
        if (icon) {
          projectIcons[newName] = icon;
        }
        get().setSettings({ projectIcons });
      },

      setTagIcon: (tagName, icon) => {
        const { settings } = get();
        const tagIcons = { ...(settings?.tagIcons || {}) };
        if (icon) {
          tagIcons[tagName] = icon;
        } else {
          delete tagIcons[tagName];
        }
        get().setSettings({ tagIcons });
      },

      removeTagIcon: (tagName) => {
        const { settings } = get();
        const tagIcons = { ...(settings?.tagIcons || {}) };
        delete tagIcons[tagName];
        get().setSettings({ tagIcons });
      },

      renameTagIcon: (oldName, newName, newIcon) => {
        const { settings } = get();
        const tagIcons = { ...(settings?.tagIcons || {}) };
        const icon = newIcon !== undefined ? newIcon : tagIcons[oldName];
        delete tagIcons[oldName];
        if (icon) {
          tagIcons[newName] = icon;
        }
        get().setSettings({ tagIcons });
      },

      togglePinProject: (projectName) => {
        const { settings } = get();
        const current = Array.isArray(settings?.pinnedProjects)
          ? settings.pinnedProjects
          : [];
        const isPinned = current.includes(projectName);
        const pinnedProjects = isPinned
          ? current.filter((p) => p !== projectName)
          : Array.from(new Set([...current, projectName]));
        get().setSettings({ pinnedProjects });
      },

      removePinnedProject: (projectName) => {
        const { settings } = get();
        const current = Array.isArray(settings?.pinnedProjects)
          ? settings.pinnedProjects
          : [];
        if (!current.includes(projectName)) return;
        get().setSettings({
          pinnedProjects: current.filter((p) => p !== projectName),
        });
      },

      renamePinnedProject: (oldName, newName) => {
        const { settings } = get();
        const current = Array.isArray(settings?.pinnedProjects)
          ? settings.pinnedProjects
          : [];
        if (!current.includes(oldName)) return;
        const pinnedProjects = Array.from(
          new Set(current.map((p) => (p === oldName ? newName : p))),
        );
        get().setSettings({ pinnedProjects });
      },

      togglePinTag: (tagName) => {
        const { settings } = get();
        const current = Array.isArray(settings?.pinnedTags)
          ? settings.pinnedTags
          : [];
        const isPinned = current.includes(tagName);
        const pinnedTags = isPinned
          ? current.filter((t) => t !== tagName)
          : Array.from(new Set([...current, tagName]));
        get().setSettings({ pinnedTags });
      },

      removePinnedTag: (tagName) => {
        const { settings } = get();
        const current = Array.isArray(settings?.pinnedTags)
          ? settings.pinnedTags
          : [];
        if (!current.includes(tagName)) return;
        get().setSettings({
          pinnedTags: current.filter((t) => t !== tagName),
        });
      },

      renamePinnedTag: (oldName, newName) => {
        const { settings } = get();
        const current = Array.isArray(settings?.pinnedTags)
          ? settings.pinnedTags
          : [];
        if (!current.includes(oldName)) return;
        const pinnedTags = Array.from(
          new Set(current.map((t) => (t === oldName ? newName : t))),
        );
        get().setSettings({ pinnedTags });
      },
    }),
    {
      name: "smriti-workspace",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentWorkspaceId: state.currentWorkspaceId,
        workspaces: state.workspaces,
        mode: state.mode,
        view: state.view,
        workspaceName: state.workspaceName,
        settings: state.settings,
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<WorkspaceState> | undefined;
        const rawSettings = state?.settings;
        const safeSettings: Settings = {
          ...DEFAULT_SETTINGS,
          ...rawSettings,
          tags: Array.isArray(rawSettings?.tags) ? rawSettings.tags : [],
          pinnedProjects: Array.isArray(rawSettings?.pinnedProjects)
            ? rawSettings.pinnedProjects
            : [],
          pinnedTags: Array.isArray(rawSettings?.pinnedTags)
            ? rawSettings.pinnedTags
            : [],
          projectIcons:
            rawSettings?.projectIcons &&
            typeof rawSettings.projectIcons === "object"
              ? rawSettings.projectIcons
              : {},
          tagIcons:
            rawSettings?.tagIcons && typeof rawSettings.tagIcons === "object"
              ? rawSettings.tagIcons
              : {},
        };
        return {
          ...currentState,
          ...state,
          settings: safeSettings,
        };
      },
    },
  ),
);
