# karasu-express Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-06

## MCP
Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

## Active Technologies
- MongoDB (single data store per Constitution Principle II) (001-ai-content-studio)
- TypeScript 5.7.3 (strict mode enabled) + PayloadCMS v3.68.3, Next.js 15.4.9, React 19.2.1, TailwindCSS 4.1.18 (001-phase-07)
- MongoDB (via @payloadcms/db-mongodb) (001-phase-07)
- TypeScript 5.7.3 (strict mode) + PayloadCMS v3.68.3, Next.js 15.4.9, React 19.2.1, TailwindCSS 4.1.18 (`.twp` scope), shadcn/ui, LightGallery, Lucide React (001-media-page-refinement)
- MongoDB (existing Media, SubTasks collections - no schema changes) (001-media-page-refinement)

- TypeScript 5.x (strict mode enabled) + PayloadCMS v3 (Next.js App Router), React 18+, TailwindCSS (scoped with `.twp`) (001-ai-content-studio)

## Project Structure

```text
src/
tests/
```

## Commands

```bash
pnpm test          # Run all tests (unit + integration + contract)
pnpm test:unit     # Unit tests only
pnpm test:integration  # Integration tests only
pnpm test:contract # Contract tests only
pnpm test:watch    # Watch mode
pnpm test:coverage # With coverage report
pnpm test:e2e      # Playwright end-to-end tests
pnpm lint          # ESLint via Next.js
pnpm dev           # Dev server
pnpm devsafe       # Dev server (clears .next cache first)
```

## Code Style

TypeScript 5.7.3 (strict mode enabled): Follow standard conventions

## TailwindCSS `.twp` Scoping

TailwindCSS is scoped with a `.twp` prefix to avoid conflicts with PayloadCMS admin styles. ALL UI components MUST:

- Wrap the component root in a `<div className="twp">` container
- Use `twp:` prefixed classes: `twp:bg-blue-500`, `twp:text-sm`, etc.
- shadcn/ui components already use the `twp:` prefix (configured in `components.json`)

## Component Patterns

All interactive admin panel components MUST use the `'use client'` directive at the top of the file. Example:

```typescript
'use client';
import { useState } from 'react';

export function MyComponent() {
  return (
    <div className="twp">
      {/* twp: prefixed TailwindCSS classes work inside */}
    </div>
  );
}
```

## Testing Conventions

- **Package manager**: `pnpm` (NOT npm)
- **Framework**: Vitest + Testing Library
- **Config**: `vitest.config.mts` (environment: node, setupFiles: `tests/setup.ts`)
- **Unit tests**: `tests/unit/[module].test.ts`
- **Integration tests**: `tests/integration/[flow].integration.test.ts`
- **Contract tests**: `tests/contract/[api].contract.test.ts`
- Tests MUST pass before committing. Phase N tests MUST pass before advancing to Phase N+1.

## Commit Conventions

Follow Conventional Commits format:
- `feat:` new feature, `fix:` bug fix, `refactor:` code restructuring
- `test:` test-only changes, `style:` UI/styling-only changes, `docs:` documentation
- `BREAKING CHANGE:` footer for backward-incompatible changes

## Admin Panel UI Standards (Constitution Principle VII)

Follow heading hierarchy: H1 (`text-2xl font-bold mb-6`) → H2 (`text-xl font-semibold mb-4`) → H3 (`text-lg font-medium mb-3`) → H4 (`text-base font-medium mb-2`). Section dividers only between H2-level sections. See `.specify/memory/constitution.md` Principle VII for full details.

## Key Config Files

- `components.json` — shadcn/ui config (project root)
- `src/app/tailwind.css` — TailwindCSS v4 config with `@theme` and CSS variables
- `postcss.config.mjs` — PostCSS config
- `vitest.config.mts` — Vitest test runner config
- `src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)

## Recent Changes
- 001-media-page-refinement: Added TypeScript 5.7.3 (strict mode) + PayloadCMS v3.68.3, Next.js 15.4.9, React 19.2.1, TailwindCSS 4.1.18 (`.twp` scope), shadcn/ui, LightGallery, Lucide Reac
- 001-media-page-refinement: Added TypeScript 5.7.3 (strict mode) + PayloadCMS v3.68.3, Next.js 15.4.9, React 19.2.1, TailwindCSS 4.1.18 (`.twp` scope), shadcn/ui, LightGallery, Lucide React
- 001-phase-07: Added TypeScript 5.7.3 (strict mode enabled) + PayloadCMS v3.68.3, Next.js 15.4.9, React 19.2.1, TailwindCSS 4.1.18


## Dependency-First Development (Constitution Principle VIII)

Before writing any UI or field config code, MUST audit existing capabilities in this order:

1. **PayloadCMS native**: Check built-in field options (`virtual`, `displayPreview`, `admin.hidden`, `admin.condition`, etc.), built-in behaviors (upload thumbnail rendering, list column features), and `@payloadcms/ui` hooks/components (`useDocumentInfo`, `useListQuery`, `DefaultListView`)
2. **UI components**: PayloadCMS built-in → shadcn/ui → Custom (last resort)
3. **Icons**: Lucide React (via shadcn/ui) → Custom SVG (with justification only)

Do NOT add new UI or icon libraries. Do NOT build custom components or workarounds when a built-in config flag or approved dependency already provides the solution. When in doubt, search PayloadCMS type definitions (`node_modules/payload/dist/`) before writing custom code.

<!-- MANUAL ADDITIONS START -->

## Key Collections & Admin Routes

### Tasks Collection (Primary UI Target)
- **Source file**: `src/collections/Tasks.ts`
- **Collection slug**: `tasks`
- **Admin routes**:
  - **Create page**: `/admin/collections/tasks/create` - Task creation form
  - **List page**: `/admin/collections/tasks` - All tasks list view
  - **Edit page**: `/admin/collections/tasks/{id}` - Edit existing task

The Tasks collection is the **main entry point** for the AI Content Generation Studio. When implementing UI features for task creation, editing, or configuration, target the `src/collections/Tasks.ts` file and its associated components under `src/components/Studio/`.

### Other Collections
- `src/collections/SubTasks.ts` - Child tasks for batch processing
- `src/collections/StyleTemplates.ts` - Custom style templates
- `src/collections/ModelConfigs.ts` - AI model configurations
- `src/collections/Media.ts` - Generated images storage
- `src/collections/Users.ts` - User authentication

<!-- MANUAL ADDITIONS END -->
