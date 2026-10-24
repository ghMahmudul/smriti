import { openIndexedDB } from "./idb";

const DB_NAME = "smriti-handles";
const STORE_NAME = "dirHandles";

export async function storeDirHandle(
  id: string,
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  const db = await openIndexedDB(DB_NAME, STORE_NAME);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(handle, `handle:${id}`);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getDirHandle(
  id: string,
): Promise<FileSystemDirectoryHandle | null> {
  const db = await openIndexedDB(DB_NAME, STORE_NAME);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(`handle:${id}`);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function clearDirHandle(id: string): Promise<void> {
  const db = await openIndexedDB(DB_NAME, STORE_NAME);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(`handle:${id}`);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

interface FileSystemDirectoryHandleWithPermission
  extends FileSystemDirectoryHandle {
  requestPermission?: (descriptor?: { mode: string }) => Promise<string>;
}

function getPermissionAPI(
  handle: FileSystemDirectoryHandle,
): FileSystemDirectoryHandleWithPermission {
  return handle as FileSystemDirectoryHandleWithPermission;
}

export async function requestPermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const api = getPermissionAPI(handle);
  if (typeof api.requestPermission !== "function") {
    return true;
  }
  const permission = await api.requestPermission({ mode: "readwrite" });
  return permission === "granted";
}
