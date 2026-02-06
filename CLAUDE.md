# karasu-express Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-16

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

npm test && npm run lint

## Code Style

TypeScript 5.x (strict mode enabled): Follow standard conventions

## Recent Changes
- 001-media-page-refinement: Added TypeScript 5.7.3 (strict mode) + PayloadCMS v3.68.3, Next.js 15.4.9, React 19.2.1, TailwindCSS 4.1.18 (`.twp` scope), shadcn/ui, LightGallery, Lucide React
- 001-phase-07: Added TypeScript 5.7.3 (strict mode enabled) + PayloadCMS v3.68.3, Next.js 15.4.9, React 19.2.1, TailwindCSS 4.1.18
- 001-ai-content-studio: Added TypeScript 5.x (strict mode enabled) + PayloadCMS v3 (Next.js App Router), React 18+, TailwindCSS (scoped with `.twp`)


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
