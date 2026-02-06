# Implementation Plan: Media Page Experience Optimization

**Branch**: `001-media-page-refinement` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-media-page-refinement/spec.md`

## Summary

Optimize the Media collection admin pages with two core improvements:

1. **List Page**: Add Gallery/List view toggle using LightGallery for visual browsing, enhance hover preview with metadata overlay, persist view preference in localStorage
2. **Detail Page**: Restructure into organized sections (Image Preview, Basic Info, Generation Info, Actions) with expandable prompts, formatted JSON, clickable links, and quick actions (download, copy prompt)

Technical approach: Extend PayloadCMS admin UI using custom React components, leverage constitution-approved libraries (LightGallery, shadcn/ui, Lucide React), and follow Principle VII UI Standards for consistent styling.

## Technical Context

**Language/Version**: TypeScript 5.7.3 (strict mode)
**Primary Dependencies**: PayloadCMS v3.68.3, Next.js 15.4.9, React 19.2.1, TailwindCSS 4.1.18 (`.twp` scope), shadcn/ui, LightGallery, Lucide React
**Storage**: MongoDB (existing Media, SubTasks collections - no schema changes)
**Testing**: Vitest + Testing Library
**Target Platform**: Web (Admin panel - desktop primary, responsive)
**Project Type**: PayloadCMS monolith (single project structure)
**Performance Goals**: Gallery view renders 100 items in <2s, view toggle <1s response
**Constraints**: MUST use PayloadCMS component replacement pattern, MUST scope TailwindCSS with `.twp`
**Scale/Scope**: ~100-500 media items typical page, up to 1000+ in collection

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Payload Native** | ✅ PASS | Using PayloadCMS custom component pattern for admin UI extension |
| **II. Infrastructure Minimalism** | ✅ PASS | No new infrastructure - localStorage for preferences, MongoDB unchanged |
| **III. Async-First** | ✅ PASS | N/A - UI feature only, no async operations added |
| **IV. Heterogeneous API Abstraction** | ✅ PASS | N/A - No new API providers |
| **V. Observability by Default** | ✅ PASS | Displaying existing generationMeta data, improving visibility |
| **VI. Testing Discipline** | ✅ PASS | Unit tests for utilities, component tests per Testing Strategy |
| **VII. Admin Panel UI Standards** | ✅ PASS | Will follow heading hierarchy (H1-H4), spacing standards, section organization |

**Post-Design Re-check**: All principles remain compliant after design phase.

## Project Structure

### Documentation (this feature)

```text
specs/001-media-page-refinement/
├── plan.md              # This file
├── research.md          # Phase 0: LightGallery integration patterns
├── data-model.md        # Phase 1: View preference storage schema
├── quickstart.md        # Phase 1: Developer setup guide
├── contracts/           # Phase 1: Component interfaces
│   └── components.ts    # TypeScript interfaces for new components
└── tasks.md             # Phase 2: Implementation tasks (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── collections/
│   └── Media.ts                 # Extend with custom admin.components
├── components/
│   └── Media/
│       ├── index.ts             # Export barrel (existing)
│       ├── MediaThumbnailCell.tsx      # Enhance hover preview (existing)
│       ├── MediaThumbnailCell.module.css
│       ├── MediaGalleryView.tsx        # NEW: Gallery view component
│       ├── MediaGalleryView.module.css
│       ├── MediaListHeader.tsx         # NEW: View toggle toolbar
│       ├── MediaDetailView.tsx         # NEW: Custom detail page layout
│       ├── MediaDetailView.module.css
│       ├── ExpandableText.tsx          # NEW: Expand/collapse text
│       ├── FormattedJson.tsx           # NEW: JSON syntax display
│       ├── RelativeTime.tsx            # NEW: Relative timestamp
│       └── MetadataBadge.tsx           # NEW: Enum badge display
├── hooks/
│   └── useViewPreference.ts     # NEW: localStorage persistence hook
└── lib/
    └── clipboard.ts             # NEW: Copy to clipboard utility

tests/
├── unit/
│   ├── useViewPreference.test.ts
│   ├── clipboard.test.ts
│   └── ExpandableText.test.tsx
└── integration/
    └── MediaGalleryView.integration.test.tsx
```

**Structure Decision**: Single project structure following existing PayloadCMS layout. New components under `src/components/Media/`, new hooks under `src/hooks/`, new utilities under `src/lib/`.

## Complexity Tracking

> No Constitution violations - no entries needed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| - | - | - |
