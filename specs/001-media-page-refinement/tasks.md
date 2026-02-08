# Tasks: Media Page Experience Optimization

**Input**: Design documents from `/specs/001-media-page-refinement/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/components.ts

**Tests**: Included per Constitution Principle VI — unit tests for utilities/hooks, integration test for gallery view.

**Organization**: Tasks grouped by user story. US1 and US2 are P1 (MVP), US3 and US4 are P2 (refinement).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Uses `@/` path alias → `./src/*`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and initialize tooling. No code written yet.

- [X] T001 Install lightgallery and lucide-react: `pnpm add lightgallery lucide-react`
- [X] T002 Initialize shadcn/ui with twp prefix: `pnpm dlx shadcn@latest init --yes` (configure `components.json` with prefix `twp`, paths `src/components/ui`, utils `src/lib/utils.ts`)
- [X] T003 Add shadcn/ui components: `pnpm dlx shadcn@latest add badge button tooltip sonner --yes --overwrite`
- [X] T004 Verify setup: confirm `src/components/ui/` contains badge.tsx, button.tsx, tooltip.tsx, sonner.tsx; confirm `src/lib/utils.ts` has `cn()` utility; confirm all deps in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared hooks, utilities, and primitive components used across multiple user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 [P] Create useViewPreference hook in `src/hooks/useViewPreference.ts` — localStorage persistence for ViewMode ('list' | 'gallery'), key `karasu-media-view-preference`, default 'list'. Implement per contracts/components.ts `UseViewPreferenceReturn` interface and research.md §4 pattern.
- [X] T006 [P] Create clipboard utility in `src/lib/clipboard.ts` — async `copyToClipboard(text: string): Promise<boolean>` with navigator.clipboard API + textarea fallback. Implement per contracts/components.ts `CopyToClipboard` type.
- [X] T007 [P] Create format utilities in `src/lib/format.ts` — `formatFileSize(bytes: number): string` (KB/MB/GB) and `formatRelativeTime(date: Date | string): string` (uses `Intl.RelativeTimeFormat`). Implement per contracts/components.ts `FormatFileSize` and `FormatRelativeTime` types.
- [X] T008 [P] Create MetadataBadge component in `src/components/Media/MetadataBadge.tsx` — wraps shadcn/ui Badge with variant mapping (default/primary/secondary/success/warning/error). Implement per contracts/components.ts `MetadataBadgeProps`. Use `'use client'` directive and `.twp` wrapper.
- [X] T009 [P] Create RelativeTime component in `src/components/Media/RelativeTime.tsx` — displays relative time string with full ISO timestamp in tooltip (uses shadcn/ui Tooltip). Implement per contracts/components.ts `RelativeTimeProps`. Uses `formatRelativeTime` from `src/lib/format.ts`.
- [X] T010 [P] Unit test for useViewPreference in `tests/unit/useViewPreference.test.ts` — mock localStorage, test: default value, read stored value, write on setView, invalid stored value fallback.
- [X] T011 [P] Unit test for clipboard and format utilities in `tests/unit/clipboard.test.ts` and `tests/unit/format.test.ts` — mock `navigator.clipboard`, test: success, fallback, formatFileSize edge cases (0, KB, MB, GB), formatRelativeTime (seconds, minutes, hours, days).

**Checkpoint**: Foundation ready — hooks, utilities, and primitive components available for all stories.

---

## Phase 3: User Story 1 — Gallery View for Visual Browsing (Priority: P1) 🎯 MVP

**Goal**: Users can toggle between List and Gallery views on the Media list page. Gallery displays images in a responsive CSS columns grid with LightGallery lightbox. View preference persists in localStorage.

**Independent Test**: Navigate to `/admin/collections/media`, click Gallery toggle, verify CSS columns grid with images, click image to open LightGallery lightbox, refresh page and verify preference persists.

**Acceptance**: FR-001, FR-002, FR-003, FR-004 | SC-001, SC-002, SC-003, SC-006, SC-007

### Implementation for User Story 1

- [X] T012 [US1] Create MediaGalleryView component in `src/components/Media/MediaGalleryView.tsx` — CSS columns grid (`columns-1 sm:columns-2 lg:columns-3 xl:columns-4` + `break-inside-avoid`) with LightGallery dynamic mode integration. Each image card shows thumbnail with lazy loading. Click on image opens LightGallery lightbox at that index for quick browsing; a separate detail-link icon (Lucide `ExternalLink`) on each card navigates to the detail page via `onImageClick` callback (satisfies FR-004). Implement per contracts/components.ts `MediaGalleryViewProps`. Include empty state for zero items.
- [X] T013 [US1] Create `src/components/Media/MediaGalleryView.module.css` — styles for gallery grid items, image hover effects, loading states. Import LightGallery CSS (`lightgallery/css/lightgallery.css`, `lg-zoom.css`, `lg-thumbnail.css`, `lg-fullscreen.css`).
- [X] T014 [US1] Create MediaListHeader component in `src/components/Media/MediaListHeader.tsx` — toolbar with List/Gallery toggle buttons using Lucide React icons (`LayoutList`, `LayoutGrid`). Shows total item count. Uses shadcn/ui Button component. Implement per contracts/components.ts `MediaListHeaderProps`.
- [X] T015 [US1] Create MediaListView wrapper component in `src/components/Media/MediaListView.tsx` — orchestrates MediaListHeader + conditional rendering of default Payload table (list mode) vs MediaGalleryView (gallery mode). Uses `useViewPreference` hook. Receives media data from Payload's list view props.
- [X] T016 [US1] Register MediaListView in `src/collections/Media.ts` — add `admin.components.views.list.Component` pointing to `'@/components/Media/MediaListView'`. Regenerate import map if needed.
- [X] T017 [US1] Update barrel export in `src/components/Media/index.ts` — add exports for MediaGalleryView, MediaListHeader, MediaListView.

**Checkpoint**: Gallery view fully functional. Users can toggle views, browse images in grid, open lightbox, and preference persists.

---

## Phase 4: User Story 2 — Restructured Detail Page (Priority: P1)

**Goal**: Media detail page displays organized sections: Image Preview (with zoom), Basic Info (filename, dimensions, format, size, created), Generation Info (SubTask link, model, style, prompts, params — hidden when no generationMeta), and Actions (download, copy prompt with toast).

**Independent Test**: Navigate to any Media detail page, verify 4 sections with correct data, click Download to download image, click Copy Prompt to copy text with toast confirmation.

**Acceptance**: FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-016, FR-018 | SC-004, SC-005, SC-008

### Implementation for User Story 2

- [X] T018 [P] [US2] Create ImagePreview component in `src/components/Media/ImagePreview.tsx` — displays main image prominently with LightGallery single-image zoom on click. Implement per contracts/components.ts `ImagePreviewProps`. Responsive sizing with `max-w-full`.
- [X] T019 [US2] Create MediaDetailView component in `src/components/Media/MediaDetailView.tsx` — structured layout following Constitution Principle VII heading hierarchy. Sections: H1 filename, Image Preview, H2 Basic Info (filename, dimensions `{w}×{h} px`, format from mimeType, file size via `formatFileSize`, created via RelativeTime), H2 Generation Info (conditionally rendered — SubTask link to `/admin/collections/sub-tasks/{id}`, model/style/aspectRatio as MetadataBadge, prompt as plain text, negative prompt if exists, seed in monospace, providerParams as JSON string), H2 Actions (Download button, Copy Prompt button using `copyToClipboard` with Sonner toast). Implement per contracts/components.ts `MediaDetailViewProps`.
- [X] T020 [US2] Create `src/components/Media/MediaDetailView.module.css` — section spacing per Principle VII (`mb-6` after H1, `mb-4` after H2, `my-6` dividers between H2 sections), responsive image sizing, action button layout.
- [X] T021 [US2] Register MediaDetailView in `src/collections/Media.ts` — add `admin.components.edit.beforeDocumentControls` pointing to `'@/components/Media/MediaDetailView'`. Ensures default Payload edit fields still render below (detail view augments, does not replace).
- [X] T022 [US2] Update barrel export in `src/components/Media/index.ts` — add exports for ImagePreview, MediaDetailView.

**Checkpoint**: Detail page fully restructured with organized sections. Download and Copy Prompt actions work. Generation Info hidden for non-generated media.

---

## Phase 5: User Story 3 — Separated Thumbnail Column & Enhanced Hover Preview (Priority: P2)

**Goal**: Two-part improvement to the Media list view. Part 1: Separate the thumbnail and filename into distinct columns — currently PayloadCMS upload collections combine the thumbnail with the filename in one column. The `preview` field (type `ui`) does NOT render its Cell component in list views (PayloadCMS skips Cell rendering for `type: 'ui'` fields). Fix this by changing the `preview` field to `type: 'text'` with `admin.hidden: true` so `MediaThumbnailCell` actually renders as its own dedicated column, while `filename` remains a standalone text column. Part 2: After separation, enhance the hover preview on the thumbnail with a metadata overlay (dimensions, format, model), debounce to prevent flash, and keyboard accessibility.

**Independent Test**: Navigate to `/admin/collections/media` in list view. Verify the table has a separate thumbnail column (small image only, no text) and a separate filename column (text only). Hover over the thumbnail to verify enlarged preview appears with metadata overlay after ~100ms debounce. Move cursor away quickly to verify no flash. Tab to thumbnail and press Enter/Space to trigger preview.

**Acceptance**: FR-005, FR-006, FR-007

### Part 1: Separate Thumbnail and Filename Columns

- [X] T023 [US3] Update `preview` field in `src/collections/Media.ts` — change from `type: 'ui'` to `type: 'text'` with `admin.hidden: true` so the Cell component (`MediaThumbnailCell`) actually renders in the list view table. Keep `admin.components.Cell` pointing to `'/components/Media/MediaThumbnailCell#MediaThumbnailCell'`. Verify `defaultColumns` order places `preview` (thumbnail-only column) before `filename` (text-only column) so they appear as two distinct columns: `['preview', 'filename', 'assetType', 'relatedSubtask', 'createdAt']`. Note: `type: 'ui'` fields do NOT render Cell components in PayloadCMS list views — this is the root cause of the combined display.
- [X] T024 [US3] Verify MediaThumbnailCell in `src/components/Media/MediaThumbnailCell.tsx` renders only the thumbnail image (40×40) without any filename text. The current implementation already does this correctly — confirm no regressions after the field type change. Ensure the component still receives `data` (MediaDocument) via Cell props from the `type: 'text'` field.

### Part 2: Enhanced Hover Preview with Metadata

- [ ] T025 [US3] Enhance MediaThumbnailCell in `src/components/Media/MediaThumbnailCell.tsx` — add metadata overlay to the hover preview showing `{width}×{height}`, format (extracted from mimeType), and modelId (or "N/A"). Add 100ms debounce on mouseenter to prevent flash on quick mouse movements. Add `tabIndex={0}`, `onKeyDown` handler for Enter/Space to toggle preview. Ensure `data` typing includes MediaDocument fields per contracts/components.ts `MediaThumbnailCellProps`.
- [ ] T026 [US3] Update `src/components/Media/MediaThumbnailCell.module.css` — add styles for metadata overlay (semi-transparent background, white text, positioned at bottom of preview), smooth fade-in animation, focus-visible outline for keyboard accessibility.

**Checkpoint**: Thumbnail and filename display as separate columns in the Media list table. Hover previews show metadata, don't flash on quick movements, and are keyboard accessible.

---

## Phase 6: User Story 4 — Optimized Metadata Controls (Priority: P2)

**Goal**: Long prompts (>200 chars) collapse with expand/collapse toggle. JSON data displays in formatted code blocks. Timestamps show relative time. These controls enhance the detail page created in US2.

**Independent Test**: View a Media detail page with a long prompt (>200 chars), verify it's collapsed with "Expand" button. Click Expand, verify full text shown. View providerParams as formatted JSON. Verify timestamps show "2 hours ago" format with full date on hover.

**Acceptance**: FR-014, FR-015, FR-017

### Implementation for User Story 4

- [ ] T027 [P] [US4] Create ExpandableText component in `src/components/Media/ExpandableText.tsx` — truncates text at `maxLength` (default 200) with "Expand" button. Toggling shows full text with "Collapse" button. Handles edge cases: text shorter than maxLength (no button), very long text (>2000 chars). Implement per contracts/components.ts `ExpandableTextProps`.
- [ ] T028 [P] [US4] Create FormattedJson component in `src/components/Media/FormattedJson.tsx` — renders JSON data in `<pre><code>` block with proper indentation (JSON.stringify with 2-space indent). Optional `collapsed` prop for initial state. Styled with TailwindCSS monospace font, background, and overflow scroll. Implement per contracts/components.ts `FormattedJsonProps`.
- [ ] T029 [US4] Integrate metadata controls into MediaDetailView in `src/components/Media/MediaDetailView.tsx` — replace plain prompt text with ExpandableText, replace JSON string with FormattedJson for providerParams, ensure RelativeTime is used for all timestamps. Verify Generation Info section uses all control components.
- [ ] T030 [P] [US4] Unit test for ExpandableText in `tests/unit/ExpandableText.test.tsx` — test: short text (no button), long text (shows truncated + Expand), expand/collapse toggle, very long text (>2000 chars), empty string.

**Checkpoint**: All metadata controls refined. Prompts expandable, JSON formatted, timestamps relative.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling, final integration, and verification.

- [ ] T031 Handle edge cases across components — empty gallery state message in MediaGalleryView, "SubTask not found" for missing/deleted SubTask references in MediaDetailView, hidden Generation Info for non-generated media (verify), very long prompts (>2000 chars) in ExpandableText.
- [ ] T032 Update barrel export in `src/components/Media/index.ts` — final pass: ensure all new components (MediaGalleryView, MediaListHeader, MediaListView, MediaDetailView, ImagePreview, ExpandableText, FormattedJson, RelativeTime, MetadataBadge) are exported.
- [ ] T033 Run quickstart.md verification checklist — manually verify all items in `specs/001-media-page-refinement/quickstart.md` §Verification Checklist.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (shadcn/ui must be initialized)
- **US1 Gallery View (Phase 3)**: Depends on Foundational (uses useViewPreference, MetadataBadge)
- **US2 Detail Page (Phase 4)**: Depends on Foundational (uses clipboard, format utils, MetadataBadge, RelativeTime)
- **US3 Separated Columns & Hover Preview (Phase 5)**: Depends on Foundational only (modifies collection config and enhances existing component)
- **US4 Metadata Controls (Phase 6)**: Depends on US2 (integrates into MediaDetailView)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependencies on other stories
- **US2 (P1)**: After Foundational — no dependencies on other stories
- **US3 (P2)**: After Foundational — independent, can run in parallel with US1/US2. Part 1 (column separation) modifies `Media.ts` so should not run in parallel with US1's T016 (which also modifies `Media.ts`)
- **US4 (P2)**: After US2 — integrates controls into detail page created by US2

### Within Each User Story

- Components before integration
- Integration before collection config registration
- Barrel export after all components for that phase

### Parallel Opportunities

**Phase 2** — all tasks T005–T011 can run in parallel (different files):
```
T005 (useViewPreference) | T006 (clipboard) | T007 (format) | T008 (MetadataBadge) | T009 (RelativeTime) | T010 (test) | T011 (test)
```

**Phase 3+4** — US1 and US2 can run in parallel after Foundational:
```
US1: T012→T013→T014→T015→T016→T017
US2: T018→T019→T020→T021→T022
```

**Phase 5+6** — US3 and US4 can run in parallel (different files, different concerns):
```
US3: T023→T024→T025→T026
US4: T027+T028 (parallel) → T029 → T030
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T011)
3. Complete Phase 3: US1 Gallery View (T012–T017)
4. **STOP and VALIDATE**: Test gallery view independently
5. Deploy/demo if ready — users can already browse visually

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Gallery view works → **MVP!**
3. Add US2 → Detail page restructured → Deploy
4. Add US3 → Separated columns + hover previews enhanced → Deploy
5. Add US4 → Metadata controls refined → Deploy
6. Polish → Edge cases, final verification → **Feature complete**

---

## Summary

| Phase | Tasks | Parallel? |
|-------|-------|-----------|
| Phase 1: Setup | T001–T004 (4) | Sequential |
| Phase 2: Foundational | T005–T011 (7) | All parallel |
| Phase 3: US1 Gallery | T012–T017 (6) | Mostly sequential |
| Phase 4: US2 Detail | T018–T022 (5) | T018 parallel, rest sequential |
| Phase 5: US3 Columns & Hover | T023–T026 (4) | T023→T024 then T025→T026 |
| Phase 6: US4 Controls | T027–T030 (4) | T027+T028 parallel |
| Phase 7: Polish | T031–T033 (3) | Sequential |
| **Total** | **33 tasks** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All components MUST use `'use client'` directive and `.twp` wrapper for TailwindCSS scoping
- Gallery masonry uses TailwindCSS CSS columns — no react-masonry-css
- Icons MUST use Lucide React (Principle VIII) — no other icon libraries
- shadcn/ui components use `twp:` prefix (configured in `components.json`)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
