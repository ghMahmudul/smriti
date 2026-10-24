interface Window {
  showDirectoryPicker(options?: {
    id?: string;
    mode?: "read" | "readwrite";
    startIn?: "desktop" | "documents" | "downloads" | FileSystemHandle;
  }): Promise<FileSystemDirectoryHandle>;
}
