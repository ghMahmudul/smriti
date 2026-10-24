# AGENTS.md — Smriti Project Context

## Project Overview

Smriti is a local-first task management app powered by `.todo` files.

- The `.todo` file format is the **source of truth** — human-readable, portable, hand-editable
- Two workspace modes: **File System** (File System Access API), **Local Storage** (IndexedDB)
- One `.todo` file = one project (except `Inbox.todo` which is special)
- No server — fully local-first, user owns their data

## Technology Stack

| Category | Technology |
|----------|------------|
| UI Framework | React 19 |
| Language | TypeScript 6 (strict mode) |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Component Library | shadcn/ui (Base UI primitives) |
| State Management | Zustand 5 |
| Routing | React Router v7 |
| Form Validation | React Hook Form + Zod |
| Icons | Lucide React |
| ID Generation | Nanoid |
| Testing | Vitest (unit) + Playwright (E2E) |
| Linting | Biome |
| Package Manager | pnpm |

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Type-check + production build
pnpm lint         # Run Biome lint
pnpm format       # Run Biome format
pnpm test         # Run unit tests once
pnpm test:watch   # Run tests in watch mode
pnpm test:e2e     # Run Playwright E2E tests
```

## Project Structure

```
src/
  core/
    types.ts              # TodoItem, Metadata, Settings, Attachment, etc.
    schemas.ts            # Zod validation schemas (settings, rename)
    parser/
      index.ts            # .todo file parser (spec-compliant, round-trip safe)
      serializer.ts       # Tasks → .todo text
      __tests__/
        parser.test.ts    # Parser tests (17 tests)
  services/
    workspace.ts          # StorageAdapter interface
    file-system.ts        # File System Access API adapter
    local-storage.ts      # IndexedDB adapter
    permission.ts         # Directory handle persistence in IndexedDB
  store/
    workspace-store.ts    # Workspace state (Zustand + persist)
    task-store.ts         # Task state (Zustand)
  hooks/
    useKeyboard.ts        # Keyboard shortcuts
    useTheme.ts           # Theme management
  components/
    layout/
      Layout.tsx          # Root layout with sidebar context
      Sidebar.tsx         # Navigation sidebar
      SidebarView.tsx     # View navigation items
      SidebarSection.tsx  # Collapsible sidebar section (Projects, Tags)
      SidebarSectionItem.tsx # Actionable sidebar list item with context menu
      ProjectContextMenu.tsx  # Right-click menu (DropdownMenu)
      CreateProjectModal.tsx   # Create project dialog
    task/
      TaskViewContent.tsx # Main task view (header + list + detail panel)
      TaskDetailPanel.tsx # Task detail sidebar
      TaskItem.tsx        # Individual task row
      TaskList.tsx        # Task list container
      AddTaskModal.tsx    # Add task dialog
      EmptyState.tsx      # Empty state placeholder
      LoadingSkeleton.tsx # Loading skeleton
    workspace/
      WorkspacePicker.tsx # Root page — 3 options (Create/Open/LocalStorage)
      ReconnectScreen.tsx # Permission re-request UI
    search/
      SearchPopup.tsx     # Search dialog (cmdk)
    settings/
      SettingsModal.tsx   # Settings dialog
    ui/
      button.tsx          # shadcn/ui Button
      dialog.tsx          # shadcn/ui Dialog
      dropdown-menu.tsx   # shadcn/ui DropdownMenu
      input.tsx           # shadcn/ui Input
      textarea.tsx        # shadcn/ui Textarea
      select.tsx          # shadcn/ui Select
      switch.tsx          # shadcn/ui Switch
      label.tsx           # shadcn/ui Label
      command.tsx         # shadcn/ui Command (cmdk)
      separator.tsx       # shadcn/ui Separator
      scroll-area.tsx     # shadcn/ui ScrollArea
      alert-dialog.tsx    # shadcn/ui AlertDialog
      input-group.tsx     # shadcn/ui InputGroup
      ConfirmModal.tsx    # Custom confirm modal (AlertDialog)
      RenameModal.tsx     # Custom rename modal (Dialog)
      SmritiIcon.tsx      # App icon
    __tests__/
      ConfirmModal.test.tsx
      RenameModal.test.tsx
      CreateProjectModal.test.tsx
  lib/
    utils.ts              # cn() utility
  router.tsx              # React Router configuration
  App.tsx                 # App entry — routing between picker/reconnect/app
  main.tsx                # React entry point — ErrorBoundary + RouterProvider
  index.css               # Tailwind + shadcn/ui theme (semantic tokens)
e2e/
  app.spec.ts             # Playwright E2E tests
```

## Key Interfaces

### StorageAdapter (`src/services/workspace.ts`)

```ts
interface StorageAdapter {
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  listFiles(): Promise<string[]>
  deleteFile(path: string): Promise<void>
  renameFile(oldPath: string, newPath: string): Promise<void>
  ensureInbox(): Promise<void>
  readSettings(): Promise<Settings>
  writeSettings(settings: Settings): Promise<void>
  createProject(name: string): Promise<void>
  deleteProject(name: string): Promise<void>
  renameProject(oldName: string, newName: string): Promise<void>
}
```

Two implementations: `FileSystemAdapter` (File System Access API) and `LocalStorageAdapter` (IndexedDB).

### TodoItem (`src/core/types.ts`)

```ts
interface TodoItem {
  id: string              # Stable ID, read from file or generated
  title: string           # Task title
  state: TaskState        # 'open' | 'done'
  projectId: string       # Which .todo file this belongs to
  parentId: string | null # Parent task ID (for subtasks)
  metadata: Metadata      # All reserved keys (id, created, due, priority, tags, etc.)
  body: string            # Freeform text (paragraphs separated by blank lines)
  children: string[]      # Ordered child task IDs
  order: number           # Sort order within parent
  attachments: Attachment[] # File attachments
}
```

### WorkspaceState (`src/store/workspace-store.ts`)

```ts
interface WorkspaceState {
  mode: WorkspaceMode | null    # 'file-system' | 'local-storage'
  view: "picker" | "main"      # URL-driven, not state-driven
  workspaceName: string
  settings: Settings
  isLoaded: boolean
  needsReconnect: boolean
  adapter: StorageAdapter | null
  currentWorkspaceId: string | null
  workspaces: WorkspaceEntry[]
  workspaceVersion: number      # Increments on workspace switch

  setView(view)                 → void
  setSettings(settings)         → void
  reset()                       → void

  createWorkspace(name, dirHandle)  → StorageAdapter
  openWorkspace(dirHandle)          → StorageAdapter
  connectLocalStorage(name)         → StorageAdapter
  reconnectWorkspace()              → StorageAdapter | null
  switchWorkspace(id)               → StorageAdapter | null
  removeWorkspace(id)               → Promise<void>
  renameWorkspace(id, newName)      → void
  addTag(name)                      → void
  renameTag(oldName, newName)       → void
  removeTag(name)                   → void
  togglePinProject(name)            → void
  removePinnedProject(name)         → void
  renamePinnedProject(old, new)     → void
  togglePinTag(name)                → void
  removePinnedTag(name)             → void
  renamePinnedTag(old, new)         → void
}
```

Persisted to localStorage (excluding `adapter` and `workspaceVersion`).

### WorkspaceEntry (`src/core/types.ts`)

```ts
interface WorkspaceEntry {
  id: string                    # Nanoid, used as IndexedDB key
  name: string                  # Display name
  mode: WorkspaceMode           # 'file-system' | 'local-storage'
}
```

### TaskState (`src/store/task-store.ts`)

```ts
interface TaskState {
  files: Map<string, TodoFile>  # fileName → parsed content
  adapter: StorageAdapter | null
  isLoaded: boolean

  loadFiles(adapter)         → void  # Parse all .todo files
  saveFile(fileName)         → void  # Serialize + write
  getTask(id)                → TodoItem | undefined
  addTask(task, fileName)    → void
  updateTask(id, updates)    → void
  deleteTask(id)             → void
  getTasksByView(view)       → TodoItem[]  # Filtered tasks
  getProjects()              → string[]
  createProject(name)        → void
  renameProject(old, new)    → void
  deleteProject(name)        → void
  getAllTags()                → string[]
  renameTagInAllTasks(old, new) → void
  removeTagFromAllTasks(tag)    → void
}
```

## Architecture Decisions

1. **Flat map with parent references** (not tree) — better for filtering, virtual scrolling, state updates
2. **File System Access API** for file workspace — user owns files, no server needed
3. **IndexedDB** for Local Storage mode — handles large data, async
4. **Zustand** for state — lightweight (~1KB), no providers, persist middleware
5. **React Router v7** for navigation — URL is source of truth for views
6. **shadcn/ui (Base UI)** for components — accessible, composable, themeable
7. **Biome** for linting/formatting — fast, unified toolchain
8. **React Hook Form + Zod** for forms — performant, type-safe validation
9. **Inbox.todo is special** — not a project, used for Inbox view only (inbox.todo supported for backwards compatibility)
10. **.todo/settings.json** — workspace settings stored in `.todo/` directory
11. **Round-trip safe parser** — parse → serialize → parse yields identical output
12. **Permission can expire** — File System Access API requires user gesture to re-request
13. **Semantic tokens** — all components use `text-foreground`, `bg-muted`, etc. (no hardcoded colors)
14. **ErrorBoundary** — catches runtime errors at app root

## Coding Conventions

- TypeScript strict mode — no `any` types
- No comments unless explicitly asked
- Tailwind utility classes — no CSS modules, no styled-components
- shadcn/ui components preferred over raw HTML elements
- Semantic tokens (`text-foreground`, `bg-muted`) over hardcoded colors
- Functional components with hooks only
- Zustand stores — no Redux, no React Context for state
- Named exports preferred
- File naming: kebab-case for files, PascalCase for components
- Run `pnpm build` and `pnpm lint` after changes

## .todo Format Rules

- Task line: `- [ ] Title` (open), `- [x]` (done)
- Metadata: indented one level (2 spaces), `key: value` format, one field per line
- Metadata block ends at first non-metadata line or blank line
- Body: separated from metadata by blank line, paragraphs separated by blank lines
- Subtasks: indented exactly one level deeper than parent
- Attachments: `attachments:` block with YAML-like list syntax
- Unknown metadata keys **MUST** be preserved on round-trip (spec §4.1)

## Workspace Structure

```
workspace/
  .todo/
    settings.json        # App settings (name, showTrash, theme, etc.)
    files/               # Attachment storage (convention)
    images/              # Attachment images (convention)
  Inbox.todo             # Special — NOT a project, for Inbox view (or legacy inbox.todo)
  project-alpha.todo     # User-created projects = .todo files
  project-beta.todo
```

## View Logic

| View | Source | Filter |
|------|--------|--------|
| All | All files | `archived` AND `trashed` absent |
| Today | All files | `due <= today` (due today or overdue) AND not archived/trashed |
| Upcoming | All files | `due > today` AND not archived/trashed |
| Inbox | `Inbox.todo` only | Tasks in inbox file |
| Archived | All files | `archived` present, `trashed` absent |
| Completed | All files | `state === 'done'`, `trashed` absent |
| Trash | All files | `trashed` present (takes precedence over `archived`) |
| Project X | `project-x.todo` | Tasks in that file |
| Tag X | All files | Tasks with tag X |
