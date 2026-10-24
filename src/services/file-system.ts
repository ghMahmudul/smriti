import { settingsSchema } from "../core/schemas";
import type { Settings } from "../core/types";
import { DEFAULT_SETTINGS } from "../core/types";
import { BaseStorageAdapter } from "./base-adapter";

export class FileSystemAdapter extends BaseStorageAdapter {
  private dirHandle: FileSystemDirectoryHandle;

  constructor(dirHandle: FileSystemDirectoryHandle) {
    super();
    this.dirHandle = dirHandle;
  }

  async readFile(path: string): Promise<string> {
    try {
      const fileHandle = await this.dirHandle.getFileHandle(path);
      const file = await fileHandle.getFile();
      return file.text();
    } catch (e) {
      if ((e as Error).name === "NotFoundError") {
        return "";
      }
      throw e;
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    const fileHandle = await this.dirHandle.getFileHandle(path, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async listFiles(): Promise<string[]> {
    const files: string[] = [];
    for await (const [name, handle] of this.dirHandle) {
      if (handle.kind === "file" && name.endsWith(".todo")) {
        files.push(name);
      }
    }
    return files;
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await this.dirHandle.removeEntry(path);
    } catch (e) {
      if ((e as Error).name === "NotFoundError") {
        return;
      }
      throw e;
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (oldPath === newPath) return;
    const content = await this.readFile(oldPath);
    if (oldPath.toLowerCase() === newPath.toLowerCase()) {
      const tempPath = `${oldPath}.tmp-${Date.now()}`;
      await this.writeFile(tempPath, content);
      await this.deleteFile(oldPath);
      await this.writeFile(newPath, content);
      await this.deleteFile(tempPath);
    } else {
      await this.writeFile(newPath, content);
      await this.deleteFile(oldPath);
    }
  }

  async readSettings(): Promise<Settings> {
    try {
      const todoDir = await this.dirHandle.getDirectoryHandle(".todo");
      const fileHandle = await todoDir.getFileHandle("settings.json");
      const file = await fileHandle.getFile();
      const content = await file.text();
      if (!content) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(content);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      const result = settingsSchema.safeParse(merged);
      if (result.success) return result.data;
      return DEFAULT_SETTINGS;
    } catch (e) {
      if ((e as Error).name !== "NotFoundError") {
        console.warn(
          "Failed to read settings.json, falling back to default settings:",
          e,
        );
      }
      return DEFAULT_SETTINGS;
    }
  }

  async writeSettings(settings: Settings): Promise<void> {
    const todoDir = await this.dirHandle.getDirectoryHandle(".todo", {
      create: true,
    });
    const fileHandle = await todoDir.getFileHandle("settings.json", {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(settings, null, 2));
    await writable.close();
  }

  async cleanupOrphanTemps(): Promise<void> {
    try {
      for await (const [name, handle] of this.dirHandle) {
        if (handle.kind === "file" && name.includes(".tmp-")) {
          await this.dirHandle.removeEntry(name).catch(() => {});
        }
      }
    } catch {
      // Ignore directory iteration errors during cleanup
    }
  }

  async cleanup(): Promise<void> {
    await this.cleanupOrphanTemps();
  }
}
