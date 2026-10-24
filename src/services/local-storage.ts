import { settingsSchema } from "../core/schemas";
import type { Settings } from "../core/types";
import { DEFAULT_SETTINGS } from "../core/types";
import { BaseStorageAdapter } from "./base-adapter";

import { openIndexedDB } from "./idb";

const DB_NAME = "smriti";
const DB_VERSION = 1;
const STORE_NAME = "files";

export class LocalStorageAdapter extends BaseStorageAdapter {
  private namespace: string;

  constructor(namespace: string) {
    super();
    this.namespace = namespace;
  }

  private getKey(path: string): string {
    return `${this.namespace}/${path}`;
  }

  private getPrefix(): string {
    return `${this.namespace}/`;
  }

  async migrateNamespace(fromNamespace: string): Promise<void> {
    if (!fromNamespace || fromNamespace === this.namespace) return;
    const db = await openIndexedDB(DB_NAME, STORE_NAME, DB_VERSION);
    const allKeys: string[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
    const targetPrefix = this.getPrefix();
    const sourcePrefix = `${fromNamespace}/`;
    if (allKeys.some((key) => key.startsWith(targetPrefix))) return;
    const legacyKeys = allKeys.filter((key) => key.startsWith(sourcePrefix));
    if (legacyKeys.length === 0) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const copyNext = (index: number) => {
        const oldKey = legacyKeys[index];
        if (oldKey === undefined) {
          resolve();
          return;
        }
        const getRequest = store.get(oldKey);
        getRequest.onerror = () => reject(getRequest.error);
        getRequest.onsuccess = () => {
          const newKey = targetPrefix + oldKey.slice(sourcePrefix.length);
          const putRequest = store.put(getRequest.result, newKey);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => copyNext(index + 1);
        };
      };
      copyNext(0);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      for (const key of legacyKeys) {
        store.delete(key);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async readFile(path: string): Promise<string> {
    const db = await openIndexedDB(DB_NAME, STORE_NAME, DB_VERSION);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(this.getKey(path));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || "");
    });
  }

  async writeFile(path: string, content: string): Promise<void> {
    const db = await openIndexedDB(DB_NAME, STORE_NAME, DB_VERSION);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(content, this.getKey(path));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async listFiles(): Promise<string[]> {
    const db = await openIndexedDB(DB_NAME, STORE_NAME, DB_VERSION);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const keys = request.result as string[];
        const prefix = this.getPrefix();
        const files = keys
          .filter((key: string) => {
            if (!key.startsWith(prefix) || !key.endsWith(".todo")) return false;
            const relPath = key.slice(prefix.length);
            return !relPath.includes("/");
          })
          .map((key: string) => key.slice(prefix.length));
        resolve(files);
      };
    });
  }

  async deleteFile(path: string): Promise<void> {
    const db = await openIndexedDB(DB_NAME, STORE_NAME, DB_VERSION);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(this.getKey(path));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (oldPath === newPath) return;
    const db = await openIndexedDB(DB_NAME, STORE_NAME, DB_VERSION);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const oldKey = this.getKey(oldPath);
      const newKey = this.getKey(newPath);

      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();

      const getReq = store.get(oldKey);
      getReq.onerror = () => reject(getReq.error);
      getReq.onsuccess = () => {
        const content = getReq.result;
        if (content === undefined) {
          reject(new Error(`File not found: ${oldPath}`));
          return;
        }
        store.put(content, newKey);
        store.delete(oldKey);
      };
    });
  }

  async readSettings(): Promise<Settings> {
    try {
      const db = await openIndexedDB(DB_NAME, STORE_NAME, DB_VERSION);
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(this.getKey(".todo/settings.json"));
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const content = request.result;
          if (!content) {
            resolve(DEFAULT_SETTINGS);
          } else {
            try {
              const parsed = JSON.parse(content);
              const result = settingsSchema.safeParse(parsed);
              if (result.success) {
                resolve(result.data);
              } else {
                resolve({ ...DEFAULT_SETTINGS, ...parsed });
              }
            } catch {
              resolve(DEFAULT_SETTINGS);
            }
          }
        };
      });
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async writeSettings(settings: Settings): Promise<void> {
    await this.writeFile(
      ".todo/settings.json",
      JSON.stringify(settings, null, 2),
    );
  }

  async cleanup(): Promise<void> {
    const db = await openIndexedDB(DB_NAME, STORE_NAME, DB_VERSION);
    const prefix = this.getPrefix();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const keys = request.result as string[];
        const keysToDelete = keys.filter((key: string) =>
          key.startsWith(prefix),
        );
        for (const key of keysToDelete) {
          store.delete(key);
        }
        resolve();
      };
    });
  }
}
