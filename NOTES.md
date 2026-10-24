## 1. Version Bump Commands

Run one of these commands before deploying a new release:

```bash
# Bug fixes, tweaks, minor improvements (e.g. 0.1.0 → 0.1.1)
pnpm version patch

# New features, non-breaking additions (e.g. 0.1.0 → 0.2.0)
pnpm version minor

# Major milestone, redesign, or breaking changes (e.g. 0.1.0 → 1.0.0)
pnpm version major
```

> **Tip:** If you prefer not to auto-create a git commit/tag when bumping:
> ```bash
> pnpm version patch --no-git-tag-version
> ```

---

## 2. Pre-Release Verification Checklist

Run this quick checklist before pushing to production:

```bash
# 1. Format code with Biome
pnpm format

# 2. Check for linting errors
pnpm lint

# 3. Run all unit tests (462+ tests)
pnpm test

# 4. Run Playwright E2E tests
pnpm test:e2e

# 5. Type-check & build production bundle
pnpm build

# 6. (Optional) Test production build locally
pnpm preview
```

---

## 3. Essential Commands Reference

| Command | Description |
|---|---|
| `pnpm dev` | Start the local Vite development server with HMR. |
| `pnpm build` | Run TypeScript check (`tsc -b`) and bundle for production. |
| `pnpm test` | Run Vitest unit tests once. |
| `pnpm test:watch` | Run Vitest in interactive watch mode while editing code. |
| `pnpm test:e2e` | Run Playwright end-to-end integration tests headless. |
| `pnpm test:e2e:ui` | Run Playwright with interactive visual UI debugger. |
| `pnpm lint` | Run Biome linter across the entire project. |
| `pnpm format` | Run Biome formatter to automatically fix formatting. |
| `pnpm preview` | Spin up a local server serving the `dist/` production build. |

---
