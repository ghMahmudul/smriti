export type TaskState = "open" | "done";

export type Priority = "low" | "medium" | "high";

export interface Attachment {
  path: string;
  name?: string;
  type?: string;
  size?: number;
}

export interface Metadata {
  id: string;
  created: string;
  modified?: string;
  completed?: string;
  due?: string;
  remind?: string;
  priority?: Priority;
  tags?: string[];
  estimate?: string;
  repeat?: string;
  archived?: string;
  trashed?: string;
  [key: string]: string | string[] | undefined;
}

export interface TodoItem {
  id: string;
  title: string;
  state: TaskState;
  projectId: string;
  parentId: string | null;
  metadata: Metadata;
  body: string;
  children: string[];
  order: number;
  attachments: Attachment[];
}

export interface TodoFile {
  name: string;
  isSystem: boolean;
  tasks: Map<string, TodoItem>;
}

export type WorkspaceMode = "file-system" | "local-storage";

export interface WorkspaceEntry {
  id: string;
  name: string;
  mode: WorkspaceMode;
  path?: string;
}

export interface Settings {
  showTrash: boolean;
  showArchived: boolean;
  showCompleted: boolean;
  defaultView: string;
  theme: "light" | "dark" | "system";
  tags: string[];
  sprinkleEffect: boolean;
  projectIcons: Record<string, string>;
  tagIcons: Record<string, string>;
  pinnedProjects: string[];
  pinnedTags: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  showTrash: true,
  showArchived: true,
  showCompleted: true,
  defaultView: "all",
  theme: "system",
  tags: [],
  sprinkleEffect: true,
  projectIcons: {},
  tagIcons: {},
  pinnedProjects: [],
  pinnedTags: [],
};
