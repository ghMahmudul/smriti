import { z } from "zod";
import { SYSTEM_VIEW_IDS } from "./constants";

export const SAFE_NAME_REGEX = /^[a-zA-Z0-9 _-]+$/;

export const SAFE_NAME_MESSAGE =
  "Name can only contain letters, numbers, spaces, hyphens, and underscores";

export const RESERVED_PROJECT_NAMES = ["inbox", "Inbox"];

export const settingsSchema = z.object({
  defaultView: z.enum(SYSTEM_VIEW_IDS).default("all"),
  showCompleted: z.boolean().default(true),
  showArchived: z.boolean().default(true),
  showTrash: z.boolean().default(true),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  tags: z.array(z.string()).default([]),
  sprinkleEffect: z.boolean().default(true),
  projectIcons: z.record(z.string(), z.string()).default({}),
  tagIcons: z.record(z.string(), z.string()).default({}),
  pinnedProjects: z.array(z.string()).default([]),
  pinnedTags: z.array(z.string()).default([]),
});

export const renameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters")
    .regex(SAFE_NAME_REGEX, SAFE_NAME_MESSAGE),
});

export type RenameFormData = z.infer<typeof renameSchema>;
