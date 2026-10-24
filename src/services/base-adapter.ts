import type { StorageAdapter } from "./workspace";

export abstract class BaseStorageAdapter implements StorageAdapter {
  abstract readFile(path: string): Promise<string>;
  abstract writeFile(path: string, content: string): Promise<void>;
  abstract listFiles(): Promise<string[]>;
  abstract deleteFile(path: string): Promise<void>;
  abstract renameFile(oldPath: string, newPath: string): Promise<void>;
  abstract readSettings(): Promise<import("../core/types").Settings>;
  abstract writeSettings(
    settings: import("../core/types").Settings,
  ): Promise<void>;

  async createProject(name: string): Promise<void> {
    await this.writeFile(`${name}.todo`, "");
  }

  async deleteProject(name: string): Promise<void> {
    await this.deleteFile(`${name}.todo`);
  }

  async renameProject(oldName: string, newName: string): Promise<void> {
    await this.renameFile(`${oldName}.todo`, `${newName}.todo`);
  }

  async ensureInbox(): Promise<void> {
    const INBOX_FILE = "Inbox.todo";
    const files = await this.listFiles();
    if (files.includes(INBOX_FILE)) return;
    if (files.includes("inbox.todo")) {
      await this.renameFile("inbox.todo", INBOX_FILE);
      return;
    }
    await this.writeFile(INBOX_FILE, "");
  }
}
