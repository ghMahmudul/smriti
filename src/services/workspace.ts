import type { Settings } from "../core/types";

export interface StorageAdapter {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  listFiles(): Promise<string[]>;
  deleteFile(path: string): Promise<void>;
  renameFile(oldPath: string, newPath: string): Promise<void>;

  ensureInbox(): Promise<void>;
  readSettings(): Promise<Settings>;
  writeSettings(settings: Settings): Promise<void>;
  createProject(name: string): Promise<void>;
  deleteProject(name: string): Promise<void>;
  renameProject(oldName: string, newName: string): Promise<void>;
  cleanup?(): Promise<void>;
}
