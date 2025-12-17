# Tasks: AI Content Generation Studio

**Input**: Design documents from `/specs/001-ai-content-studio/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**LLM for Prompt Expansion**: **Gemini Pro** (Google AI) is the primary LLM for prompt optimization. Future expansion will support ChatGPT (GPT-4o) and Claude (Claude 3.5 Sonnet).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- Collections: `src/collections/`
- Jobs: `src/jobs/`
- Adapters: `src/adapters/`
- Services: `src/services/`
- Components: `src/components/`
- Lib/Utilities: `src/lib/`
- Config: `src/payload.config.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, PayloadCMS configuration, and dependency installation

- [X] T001 Create project structure per implementation plan with directories: src/collections, src/jobs, src/adapters, src/services, src/components, src/lib
- [X] T002 Initialize PayloadCMS v3 project with Next.js App Router and MongoDB adapter
- [X] T003 [P] Configure TailwindCSS with `.twp` scope prefix in tailwind.config.ts
- [X] T004 [P] Configure TypeScript strict mode and path aliases in tsconfig.json
- [X] T005 [P] Install AI provider dependencies: @google/generative-ai (Gemini Pro for LLM), @fal-ai/client, openai, @google-cloud/aiplatform
- [X] T006 [P] Install UI dependencies: masonic (virtual masonry), react-hook-form
- [X] T007 Create environment configuration template (.env.example) with all required variables per quickstart.md
- [X] T008 Configure payload.config.ts with MongoDB adapter, admin panel settings, and upload configuration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Define common TypeScript types and enums in src/lib/types.ts based on contracts/types.ts
- [X] T010 [P] Create error normalization utility in src/lib/error-normalizer.ts with ErrorCategory enum mapping
- [X] T011 [P] Create rate limiter utility in src/lib/rate-limiter.ts for per-provider rate limiting
- [X] T012 Create base adapter interface in src/adapters/types.ts (ImageGenerationAdapter, GenerationResult, NormalizedError)
- [X] T013 [P] Implement Flux adapter in src/adapters/flux.ts with Fal.ai client integration
- [X] T014 [P] Implement DALL-E 3 adapter in src/adapters/dalle.ts with OpenAI client integration
- [X] T015 [P] Implement Imagen adapter in src/adapters/imagen.ts with Google Cloud client integration
- [X] T016 Create adapter registry in src/adapters/index.ts to resolve adapters by modelId
- [X] T017 Create StyleTemplates collection in src/collections/StyleTemplates.ts with validation (positivePrompt must contain {prompt})
- [X] T018 [P] Create ModelConfigs collection in src/collections/ModelConfigs.ts with provider enum and rate limit settings
- [X] T019 Create seed script for default Base style and model configurations in src/seed/index.ts
- [X] T020 Configure PayloadCMS Jobs Queue in payload.config.ts with expand-prompt and generate-image task definitions and ai-generation queue

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create Batch Generation Task (Priority: P1) 🎯 MVP

**Goal**: Admin can submit a creative theme and have the system automatically generate hundreds of images across different styles and AI models

**Independent Test**: Submit a theme, select styles/models, verify the system generates the expected number of images with correct naming and organization

### Implementation for User Story 1

- [ ] T021 Create Tasks collection in src/collections/Tasks.ts with subject, expandedPrompts array, styles relationship, models selection, batchConfig group, status enum, and progress field
- [ ] T022 Create SubTasks collection in src/collections/SubTasks.ts with parentTask relationship, status, styleId, modelId, finalPrompt, negativePrompt, requestPayload JSON, responseData JSON, errorLog, errorCategory, retryCount, and timestamps
- [ ] T023 Create Media collection in src/collections/Media.ts as PayloadCMS Upload collection with relatedSubtask relationship, generationMeta JSON, and assetType enum
- [ ] T024 Implement task orchestrator service in src/services/task-orchestrator.ts with calculateFission() and createSubTasks() functions
- [ ] T025 Implement style merger utility in src/services/style-merger.ts with mergeStyle(prompt, style) function that handles {prompt} placeholder substitution
- [ ] T026 Implement asset manager service in src/services/asset-manager.ts with generateFilename() and uploadToStorage() functions following naming convention
- [ ] T027 [P] Create expand-prompt job handler in src/jobs/expand-prompt.ts that calls LLM and updates Task.expandedPrompts
- [ ] T028 [P] Create generate-image job handler in src/jobs/generate-image.ts that calls adapter, uploads to storage, creates Media document
- [ ] T029 Implement Task submission endpoint hook in src/collections/Tasks.ts afterChange hook to queue expand-prompt job when status changes to queued
- [ ] T030 Implement progress aggregation logic in SubTasks collection afterChange hook to update parent Task.progress and Task.status
- [ ] T031 Create POST /api/tasks/{id}/submit custom endpoint in src/endpoints/submit-task.ts to transition task from draft to queued
- [ ] T032 Create POST /api/tasks/{id}/retry-failed custom endpoint in src/endpoints/retry-failed.ts to re-queue failed sub-tasks
- [ ] T033 [P] Create POST /api/studio/calculate-fission custom endpoint in src/endpoints/calculate-fission.ts for preview calculation

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - admin can create a task, submit it, and receive generated images

---

## Phase 4: User Story 2 - Intelligent Prompt Optimization (Priority: P1)

**Goal**: System automatically enhances brief creative themes into detailed, high-quality prompts using AI

**Independent Test**: Enter a simple theme like "a crying cat in the rain" and verify the system produces multiple optimized prompt variants with composition, lighting, and texture details

### Implementation for User Story 2

- [ ] T034 Implement prompt optimizer service in src/services/prompt-optimizer.ts with expandPrompt() function using Gemini Pro structured output (JSON mode)
- [ ] T035 Create system prompt template in src/services/prompt-optimizer.ts for "prompt engineering expert" persona with composition/lighting/atmosphere instructions
- [ ] T035a [P] Add LLM provider abstraction interface in src/services/prompt-optimizer.ts to support future ChatGPT/Claude expansion
- [ ] T036 Implement web search enhancement in src/services/prompt-optimizer.ts with optional RAG context fetching
- [ ] T037 Create POST /api/studio/expand-prompt custom endpoint in src/endpoints/expand-prompt-preview.ts for testing prompt expansion without creating task
- [ ] T038 Update expand-prompt job handler in src/jobs/expand-prompt.ts to use prompt-optimizer service and generate subjectSlug

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - admin can submit themes and get AI-enhanced prompts before generation

---

## Phase 5: User Story 3 - Style Configuration and Management (Priority: P2)

**Goal**: Admin can create and manage reusable style templates that can be applied to any generation

**Independent Test**: Create a style template, apply it to a generation task, verify style modifiers are correctly merged into the final prompt

### Implementation for User Story 3

- [ ] T039 Add StyleTemplates collection access control in src/collections/StyleTemplates.ts to prevent deletion of system styles (isSystem: true)
- [ ] T040 Create admin custom component for style template preview in src/components/StylePreview/index.tsx showing merged prompt example
- [ ] T041 Create seed data for default style templates (Ghibli, Cyberpunk, Film Noir, Watercolor) in src/seed/styles.ts
- [ ] T042 Update task orchestrator to automatically include Base style when other styles are selected in src/services/task-orchestrator.ts

**Checkpoint**: Style management is fully functional - admin can create/edit styles and apply them to generations

---

## Phase 6: User Story 4 - Task Monitoring and Management (Priority: P2)

**Goal**: Admin can view all generation tasks with progress and status, and manage failed tasks

**Independent Test**: Create tasks and verify they appear in the task list with accurate status, progress, and filtering capabilities

### Implementation for User Story 4

- [ ] T043 Create TaskManager custom admin view in src/components/TaskManager/index.tsx with task list, status filters, and progress bars
- [ ] T044 [P] Create TaskDetail component in src/components/TaskManager/TaskDetail.tsx showing sub-task breakdown, error logs, and retry buttons
- [ ] T045 [P] Create SubTaskList component in src/components/TaskManager/SubTaskList.tsx with status indicators and expandable error details
- [ ] T046 Implement task polling hook in src/components/TaskManager/useTaskProgress.ts with 5-second interval for real-time updates
- [ ] T047 Add TaskManager to Payload admin panel navigation in payload.config.ts admin.components configuration

**Checkpoint**: Task monitoring is fully functional - admin can view and manage all tasks from a centralized dashboard

---

## Phase 7: User Story 5 - Asset Gallery and Management (Priority: P2)

**Goal**: Admin can browse generated images in a visual gallery with filtering, search, and download capabilities

**Independent Test**: Generate images and verify they appear in the gallery with proper masonry layout, metadata display, and download functionality

### Implementation for User Story 5

- [ ] T048 Create Gallery custom admin view in src/components/Gallery/index.tsx with masonry layout using Masonic library
- [ ] T049 [P] Create GalleryFilters component in src/components/Gallery/GalleryFilters.tsx with taskId, styleId, modelId filters
- [ ] T050 [P] Create ImageLightbox component in src/components/Gallery/ImageLightbox.tsx showing full-size image with generation metadata panel
- [ ] T051 Implement virtual scrolling in Gallery component for 500+ items performance
- [ ] T052 Create batch download functionality in src/components/Gallery/BatchDownload.tsx with selection and ZIP generation
- [ ] T053 Add Gallery to Payload admin panel navigation in payload.config.ts admin.components configuration

**Checkpoint**: Gallery is fully functional - admin can browse, filter, view details, and download generated assets

---

## Phase 8: User Story 6 - Multi-Model Comparison (Priority: P3)

**Goal**: Admin can generate the same prompt across different AI **image** models simultaneously and compare results

**Independent Test**: Submit a generation with multiple image models selected and verify outputs from each model are generated and properly labeled

### Implementation for User Story 6

- [ ] T054 Update task orchestrator in src/services/task-orchestrator.ts to generate sub-tasks for all selected model combinations
- [ ] T055 Add model-specific parameter configuration UI in src/components/Studio/ModelParams.tsx for per-model settings (inference steps, quality level)
- [ ] T056 Add model filter to Gallery in src/components/Gallery/GalleryFilters.tsx to isolate and compare outputs by model

**Checkpoint**: Multi-model comparison is functional - admin can generate across image models and compare results side-by-side

---

## Phase 9: User Story 7 - Dashboard Overview (Priority: P3)

**Goal**: Admin can see an overview of system activity including daily generation counts and resource consumption

**Independent Test**: Perform generation tasks and verify the dashboard reflects accurate counts and metrics

### Implementation for User Story 7

- [ ] T057 Create Dashboard custom admin view in src/components/Dashboard/index.tsx with overview metrics layout
- [ ] T058 [P] Create DailyStats component in src/components/Dashboard/DailyStats.tsx showing today's generation count and total images
- [ ] T059 [P] Create RecentActivity component in src/components/Dashboard/RecentActivity.tsx showing recent task completions
- [ ] T060 [P] Create UsageStats component in src/components/Dashboard/UsageStats.tsx showing most used styles and models
- [ ] T061 Add Dashboard to Payload admin panel as default landing page in payload.config.ts admin configuration

**Checkpoint**: Dashboard is functional - admin has visibility into system activity and usage patterns

---

## Phase 10: Studio Workspace UI (Supporting All Stories)

**Goal**: Create the main Studio workspace UI that ties together task creation, prompt optimization, and generation

### Implementation for Studio Workspace

- [ ] T062 Create Studio custom admin view in src/components/Studio/index.tsx as the main generation workspace
- [ ] T063 [P] Create ThemeInput component in src/components/Studio/ThemeInput.tsx with multi-line text input and character counter
- [ ] T064 [P] Create StyleSelector component in src/components/Studio/StyleSelector.tsx with multi-select grid and preview thumbnails
- [ ] T065 [P] Create ModelSelector component in src/components/Studio/ModelSelector.tsx with provider grouping and feature badges
- [ ] T066 [P] Create BatchConfig component in src/components/Studio/BatchConfig.tsx with countPerPrompt input and total calculation display
- [ ] T067 Create PromptPreview component in src/components/Studio/PromptPreview.tsx showing expanded prompts with edit capability
- [ ] T068 Implement task submission flow in src/components/Studio/index.tsx with confirmation dialog when total > 500
- [ ] T069 Add Studio to Payload admin panel navigation in payload.config.ts admin.components configuration

**Checkpoint**: Studio workspace is complete - admin has a unified interface for the entire generation workflow

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T070 Add admin panel left navigation with Dashboard, Studio, Task Manager, Gallery, and Configuration Center in payload.config.ts
- [ ] T071 [P] Create MongoDB indexes per data-model.md specifications in src/seed/indexes.ts
- [ ] T072 [P] Add input validation across all collections using Payload field validation
- [ ] T073 Implement configurable warning threshold (default 500) for large batch submissions
- [ ] T074 Add error boundary and loading states to all custom admin components
- [ ] T075 Run quickstart.md validation to ensure all documented workflows function correctly

---

## Phase 12: Video Generation - Veo (DEFERRED - Lowest Priority)

**Purpose**: Video generation capability using Google Veo - explicitly deferred per clarification

**⚠️ DEFERRED**: Video generation is not required for initial release. Focus on image generation first.

- [ ] T076 Implement Veo video adapter in src/adapters/veo.ts for Google Veo integration with long-running operation polling
- [ ] T077 Add video-specific UI components in src/components/Studio/VideoConfig.tsx for video generation parameters
- [ ] T078 Update Media collection in src/collections/Media.ts to handle video assets with duration metadata
- [ ] T079 Add video playback support in src/components/Gallery/VideoPlayer.tsx

**Checkpoint**: Video generation is functional - admin can generate videos using Google Veo (future enhancement)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - Core MVP
- **User Story 2 (Phase 4)**: Depends on Phase 3 (T027 expand-prompt job)
- **User Stories 3-7 (Phases 5-9)**: All depend on Phase 3 completion but can proceed in parallel
- **Studio UI (Phase 10)**: Depends on Phases 3-5 for full functionality
- **Polish (Phase 11)**: Depends on all desired user stories being complete
- **Video/Veo (Phase 12)**: DEFERRED - Lowest priority, implement only after all image generation features are complete

### User Story Dependencies

- **User Story 1 (P1)**: Core foundation - No dependencies on other stories
- **User Story 2 (P1)**: Builds on US1's expand-prompt job infrastructure
- **User Story 3 (P2)**: Can start after Foundational - StyleTemplates are independent
- **User Story 4 (P2)**: Can start after US1 - Task monitoring requires Tasks/SubTasks
- **User Story 5 (P2)**: Can start after US1 - Gallery requires Media collection
- **User Story 6 (P3)**: Can start after US1 - Multi-model (image) comparison requires adapter infrastructure
- **User Story 7 (P3)**: Can start after US1 - Dashboard requires Task data
- **Video Generation (Deferred)**: Requires all core image generation infrastructure complete

### Within Each User Story

- Collections/Models before services
- Services before job handlers
- Job handlers before endpoints
- Endpoints before UI components
- Core implementation before integration

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational adapter implementations (T013-T015) can run in parallel
- Collections T021-T023 can be created in parallel
- Job handlers T027-T028 can run in parallel
- UI components within each story marked [P] can run in parallel
- Once Phase 3 completes, Phases 5-9 can run in parallel (if team capacity allows)

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch all adapters together:
Task: "Implement Flux adapter in src/adapters/flux.ts"
Task: "Implement DALL-E 3 adapter in src/adapters/dalle.ts"
Task: "Implement Imagen adapter in src/adapters/imagen.ts"

# Launch utility files together:
Task: "Create error normalization utility in src/lib/error-normalizer.ts"
Task: "Create rate limiter utility in src/lib/rate-limiter.ts"
```

## Parallel Example: User Story 5 Gallery

```bash
# Launch all gallery components together:
Task: "Create GalleryFilters component in src/components/Gallery/GalleryFilters.tsx"
Task: "Create ImageLightbox component in src/components/Gallery/ImageLightbox.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Batch Generation)
4. Complete Phase 4: User Story 2 (Prompt Optimization)
5. **STOP and VALIDATE**: Test core generation workflow end-to-end
6. Deploy/demo if ready - Admin can now generate AI images

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Core MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Enhanced prompts)
4. Add User Stories 3-5 → Test independently → Deploy/Demo (Management features)
5. Add User Stories 6-7 → Test independently → Deploy/Demo (Advanced features)
6. Add Studio UI → Test independently → Deploy/Demo (Unified experience)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Stories 1 + 2 (Core generation flow)
   - Developer B: User Stories 3 + 4 (Styles + Task Manager)
   - Developer C: User Stories 5 (Gallery)
3. After core stories complete:
   - Developer A: User Stories 6 + 7 (Advanced features)
   - Developer B: Studio UI
   - Developer C: Polish tasks
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- PayloadCMS collections are defined via code, not migrations
- Jobs Queue is configured in payload.config.ts, no external queue systems
- All UI components are React components integrated into PayloadCMS admin
- TailwindCSS classes must use `.twp` prefix scope
- **Video generation (Veo) is DEFERRED** - Phase 12 is lowest priority; focus on image generation first
- **LLM Provider Strategy**: Start with Gemini Pro for prompt expansion; the abstraction layer (T035a) enables future expansion to ChatGPT (GPT-4o) and Claude (Claude 3.5 Sonnet) without refactoring
