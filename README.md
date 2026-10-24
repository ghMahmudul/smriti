# Smriti

A local-first task management app powered by `.todo` files. No server — you own your data.

## Tech Stack

| Category | Technology |
|----------|------------|
| UI Framework | React 19 |
| Language | TypeScript 6 (strict mode) |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI) |
| State Management | Zustand 5 |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Testing | Vitest + Playwright |
| Linting | Biome |
| Package Manager | pnpm |

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Type-check + production build
pnpm lint         # Run Biome lint
pnpm format       # Run Biome format
pnpm test         # Run unit tests
pnpm test:watch   # Run tests in watch mode
pnpm test:e2e     # Run Playwright E2E tests
```

## Project Structure

```
src/
  core/
    types.ts              # TodoItem, Metadata, Settings, Attachment, etc.
    schemas.ts            # Zod validation schemas
    parser/
      index.ts            # .todo file parser (spec-compliant, round-trip safe)
      serializer.ts       # Tasks → .todo text
      __tests__/          # Parser tests
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
    layout/               # Sidebar, Layout, CreateProjectModal, etc.
    task/                 # TaskViewContent, TaskDetailPanel, TaskItem, etc.
    workspace/            # WorkspacePicker, ReconnectScreen
    search/               # SearchPopup (cmdk)
    settings/             # SettingsModal
    ui/                   # shadcn/ui primitives + custom modals
    __tests__/            # Component tests
  lib/
    utils.ts              # cn() utility
  router.tsx              # React Router configuration
  App.tsx                 # App entry — routing between picker/reconnect/app
  main.tsx                # React entry point
  index.css               # Tailwind + shadcn/ui theme
e2e/
  app.spec.ts             # Playwright E2E tests
```
