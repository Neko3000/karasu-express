# Tasks: AI Content Generation Studio

**Input**: Design documents from `/specs/001-ai-content-studio/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests ARE required per Constitution Principle VI (Testing Discipline). Test tasks are included following the Testing Strategy defined in plan.md.

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
- **Unit Tests**: `tests/unit/`
- **Integration Tests**: `tests/integration/`
- **Contract Tests**: `tests/contract/`

## Testing Strategy Reference (Constitution Principle VI)

Per plan.md Testing Requirements:

| Module | Unit Tests | Integration Tests | Contract Tests |
|--------|------------|-------------------|----------------|
| Adapters (Flux, DALL-E, Imagen) | REQUIRED | N/A | REQUIRED |
| Lib utilities (prompt-merger, task-fission, error-normalizer) | REQUIRED | N/A | N/A |
| Services (task-service) | REQUIRED | REQUIRED | N/A |
| Jobs (expand-prompt, generate-image) | N/A | REQUIRED | N/A |
| API Endpoints | N/A | REQUIRED | N/A |
| Collections (CRUD) | N/A | REQUIRED | N/A |

**Progressive Testing Protocol**:
1. Phase N tests MUST be written during Phase N implementation
2. All Phase N tests MUST pass before Phase N+1 begins
3. If tests fail during implementation, STOP and fix before proceeding

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, PayloadCMS configuration, testing infrastructure, and dependency installation

**Unit Tests**: NOT required for setup tasks (infrastructure only per Testing Strategy)

**Gate Criteria**: Project builds, linting passes, test infrastructure configured

- [X] T001 Create project structure per implementation plan with directories: src/collections, src/jobs, src/adapters, src/services, src/components, src/lib, tests/unit, tests/integration, tests/contract
- [X] T002 Initialize PayloadCMS v3 project with Next.js App Router and MongoDB adapter
- [X] T003 [P] Configure TailwindCSS with `.twp` scope prefix in tailwind.config.ts
- [X] T004 [P] Configure TypeScript strict mode and path aliases in tsconfig.json
- [X] T005 [P] Install AI provider dependencies: @google/generative-ai (Gemini Pro for LLM), @fal-ai/client, openai, @google-cloud/aiplatform
- [X] T006 [P] Install UI dependencies: masonic (virtual masonry), react-hook-form
- [X] T007 Create environment configuration template (.env.example) with all required variables per quickstart.md
- [X] T008 Configure payload.config.ts with MongoDB adapter, admin panel settings, and upload configuration
- [X] T008a [P] Install testing dependencies: vitest, @testing-library/react, mongodb-memory-server per plan.md
- [X] T008b [P] Configure vitest in vitest.config.ts with globals, node environment, coverage settings per plan.md
- [X] T008c Create test setup file in tests/setup.ts with common test utilities and mocks

**Checkpoint**: Setup complete - project builds, linting passes, test infrastructure ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Unit Tests**: REQUIRED for lib utilities and adapters per Testing Strategy

**Gate Criteria**: All unit tests pass for utilities and adapters, contract tests pass for adapters

**CRITICAL**: No user story work can begin until this phase is complete AND all tests pass

### Utility Implementation & Unit Tests

- [X] T009 Define common TypeScript types and enums in src/lib/types.ts based on contracts/types.ts
- [X] T010 [P] Create error normalization utility in src/lib/error-normalizer.ts with ErrorCategory enum mapping
- [X] T010a [P] Write unit tests for error-normalizer in tests/unit/lib/error-normalizer.test.ts (test all error category mappings and retryable flags)
- [X] T011 [P] Create rate limiter utility in src/lib/rate-limiter.ts for per-provider rate limiting
- [X] T011a [P] Write unit tests for rate-limiter in tests/unit/lib/rate-limiter.test.ts (test rate limiting logic, cooldown, concurrent limits)

### Adapter Implementation & Tests

- [X] T012 Create base adapter interface in src/adapters/types.ts (ImageGenerationAdapter, GenerationResult, NormalizedError)
- [X] T013 [P] Implement Flux adapter in src/adapters/flux.ts with Fal.ai client integration
- [X] T013a [P] Write unit tests for Flux adapter in tests/unit/adapters/flux.adapter.test.ts (mock Fal.ai client, test generate, normalizeError, getDefaultOptions)
- [X] T014 [P] Implement DALL-E 3 adapter in src/adapters/dalle.ts with OpenAI client integration
- [X] T014a [P] Write unit tests for DALL-E adapter in tests/unit/adapters/dalle.adapter.test.ts (mock OpenAI client, test generate, normalizeError, getDefaultOptions)
- [X] T015 [P] Implement Imagen adapter in src/adapters/imagen.ts with Google Cloud client integration
- [X] T015a [P] Write unit tests for Imagen adapter in tests/unit/adapters/imagen.adapter.test.ts (mock Google client, test generate, normalizeError, getDefaultOptions)
- [X] T016 Create adapter registry in src/adapters/index.ts to resolve adapters by modelId
- [X] T016a Write contract tests for all adapters in tests/contract/adapters.contract.test.ts verifying interface compliance (providerId, generate, normalizeError, getDefaultOptions exist and return correct types)

### Collection & Configuration

- [X] T017 Create StyleTemplates collection in src/collections/StyleTemplates.ts with validation (positivePrompt must contain {prompt})
- [X] T018 [P] Create ModelConfigs collection in src/collections/ModelConfigs.ts with provider enum and rate limit settings
- [X] T019 Create seed script for default Base style and model configurations in src/seed/index.ts
- [X] T020 Configure PayloadCMS Jobs Queue in payload.config.ts with expand-prompt and generate-image task definitions and ai-generation queue

**Checkpoint**: Foundation ready - all unit tests pass for utilities, all adapter unit tests pass, contract tests pass. User story implementation can now begin.

---

## Phase 3: User Story 1 - Create Batch Generation Task (Priority: P1) MVP

**Goal**: Admin can submit a creative theme and have the system automatically generate hundreds of images across different styles and AI models

**Independent Test**: Submit a theme, select styles/models, verify the system generates the expected number of images with correct naming and organization

**Unit Tests**: REQUIRED for services (task-orchestrator, style-merger, asset-manager)
**Integration Tests**: REQUIRED for jobs (expand-prompt, generate-image) and endpoints

**Gate Criteria**: All unit tests pass for services, all integration tests pass for jobs and endpoints

### Tests for User Story 1

> **NOTE: Write tests FIRST or during implementation, ensure they FAIL before implementation**

#### Unit Tests (Services)

- [X] T020a [P] [US1] Write unit tests for task-orchestrator service in tests/unit/services/task-orchestrator.test.ts (test calculateFission with various inputs, createSubTasks logic)
- [X] T020b [P] [US1] Write unit tests for style-merger utility in tests/unit/services/style-merger.test.ts (test mergeStyle with {prompt} placeholder, base style, negative prompts)
- [X] T020c [P] [US1] Write unit tests for asset-manager service in tests/unit/services/asset-manager.test.ts (test generateFilename follows naming convention, various params)

#### Integration Tests (Jobs & Endpoints)

- [X] T020d [P] [US1] Write integration tests for expand-prompt job in tests/integration/jobs/expand-prompt.integration.test.ts (mock LLM, test task status transitions, expandedPrompts updates)
- [X] T020e [P] [US1] Write integration tests for generate-image job in tests/integration/jobs/generate-image.integration.test.ts (mock adapter, test subtask status, asset creation, progress updates)
- [X] T020f [P] [US1] Write integration tests for task endpoints in tests/integration/endpoints/tasks.integration.test.ts (test CRUD, submit, retry-failed endpoints)

### Implementation for User Story 1

- [X] T021 [US1] Create Tasks collection in src/collections/Tasks.ts with subject, expandedPrompts array, styles relationship, models selection, batchConfig group, status enum, and progress field
- [X] T022 [US1] Create SubTasks collection in src/collections/SubTasks.ts with parentTask relationship, status, styleId, modelId, finalPrompt, negativePrompt, requestPayload JSON, responseData JSON, errorLog, errorCategory, retryCount, and timestamps
- [X] T023 [US1] Create Media collection in src/collections/Media.ts as PayloadCMS Upload collection with relatedSubtask relationship, generationMeta JSON, and assetType enum
- [X] T024 [US1] Implement task orchestrator service in src/services/task-orchestrator.ts with calculateFission() and createSubTasks() functions
- [X] T025 [US1] Implement style merger utility in src/services/style-merger.ts with mergeStyle(prompt, style) function that handles {prompt} placeholder substitution
- [X] T026 [US1] Implement asset manager service in src/services/asset-manager.ts with generateFilename() and uploadToStorage() functions following naming convention
- [X] T027 [P] [US1] Create expand-prompt job handler in src/jobs/expand-prompt.ts that calls LLM and updates Task.expandedPrompts
- [X] T028 [P] [US1] Create generate-image job handler in src/jobs/generate-image.ts that calls adapter, uploads to storage, creates Media document
- [X] T029 [US1] Implement Task submission endpoint hook in src/collections/Tasks.ts afterChange hook to queue expand-prompt job when status changes to queued
- [X] T030 [US1] Implement progress aggregation logic in SubTasks collection afterChange hook to update parent Task.progress and Task.status
- [X] T031 [US1] Create POST /api/tasks/{id}/submit custom endpoint in src/endpoints/submit-task.ts to transition task from draft to queued
- [X] T032 [US1] Create POST /api/tasks/{id}/retry-failed custom endpoint in src/endpoints/retry-failed.ts to re-queue failed sub-tasks
- [X] T033 [P] [US1] Create POST /api/studio/calculate-fission custom endpoint in src/endpoints/calculate-fission.ts for preview calculation

### Imagen API Key Migration (Authentication Simplification)

> **Purpose**: Migrate Imagen adapter from Google Cloud Vertex AI (service account JSON) to Google AI Studio API Key (GOOGLE_AI_API_KEY) for simpler authentication

#### Unit Tests (Imagen API Key)

- [X] T033k [P] [US1] Update unit tests for Imagen adapter in tests/unit/adapters/imagen.adapter.test.ts to mock @google/generative-ai SDK instead of google-auth-library

#### Implementation for Imagen API Key

- [X] T033l [US1] Update ImagenConfig interface in src/adapters/imagen.ts to accept apiKey instead of projectId/location
- [X] T033m [US1] Refactor ImagenAdapter to use @google/generative-ai SDK with GOOGLE_AI_API_KEY environment variable instead of Vertex AI REST API
- [X] T033n [US1] Update callImagenApi method in src/adapters/imagen.ts to use Google AI generateImages endpoint instead of Vertex AI predict endpoint
- [X] T033o [US1] Update .env.example to clarify GOOGLE_AI_API_KEY usage for both Gemini LLM and Imagen image generation
- [X] T033p [P] [US1] Verify Imagen adapter works with real GOOGLE_AI_API_KEY by running manual test

### Imported Style Prompts (New Feature)

> **Purpose**: Load style prompts from external JSON file and display them on the task creation page with "base" as default

#### Unit Tests (Style Loader)

- [X] T033b [P] [US1] Write unit tests for style-loader service in tests/unit/services/style-loader.test.ts (test loadStylesFromJson, parseStyleTemplate, getDefaultStyle returns "base")

#### Implementation for Imported Styles

- [X] T033c [US1] Create style types in src/lib/style-types.ts for ImportedStyle interface matching JSON schema (name, prompt, negative_prompt)
- [X] T033d [US1] Implement style-loader service in src/services/style-loader.ts with loadStylesFromJson() function to read src/resources/style-list/sdxl_styles_exp.json
- [X] T033e [US1] Add getDefaultStyle() function in src/services/style-loader.ts that returns "base" style as default selection
- [X] T033f [US1] Add getAllStyles() function in src/services/style-loader.ts to return all styles sorted alphabetically with "base" first
- [X] T033g [US1] Create GET /api/studio/styles endpoint in src/endpoints/get-styles.ts to return imported styles for frontend consumption
- [X] T033h [P] [US1] Write integration tests for get-styles endpoint in tests/integration/endpoints/styles.integration.test.ts (test returns all styles, base is first, correct format)
- [X] T033i [US1] Update style-merger service in src/services/style-merger.ts to accept ImportedStyle in addition to database StyleTemplate
- [X] T033j [US1] Integrate imported styles with task creation - update Tasks collection to support imported style IDs alongside database style relationships

**Checkpoint**: User Story 1 complete - all unit tests pass for services, all integration tests pass for jobs/endpoints. Admin can create a task, submit it, and receive generated images.

---

## Phase 4: User Story 2 - Intelligent Prompt Optimization (Priority: P1)

**Goal**: System automatically enhances brief creative themes into detailed, high-quality prompts using AI

**Independent Test**: Enter a simple theme like "a crying cat in the rain" and verify the system produces multiple optimized prompt variants with composition, lighting, and texture details

**Unit Tests**: REQUIRED for prompt-optimizer service
**Integration Tests**: Already covered by Phase 3 expand-prompt job tests

**Gate Criteria**: All unit tests pass for prompt-optimizer service

### Tests for User Story 2

- [X] T033a [P] [US2] Write unit tests for prompt-optimizer service in tests/unit/services/prompt-optimizer.test.ts (mock Gemini client, test expandPrompt with various themes, test structured output parsing, test web search integration)

### Implementation for User Story 2

- [X] T034 [US2] Implement prompt optimizer service in src/services/prompt-optimizer.ts with expandPrompt() function using Gemini Pro structured output (JSON mode)
- [X] T035 [US2] Create system prompt template in src/services/prompt-optimizer.ts for "prompt engineering expert" persona with composition/lighting/atmosphere instructions
- [X] T035a [P] [US2] Add LLM provider abstraction interface in src/services/prompt-optimizer.ts to support future ChatGPT/Claude expansion
- [X] T036 [US2] Implement web search enhancement in src/services/prompt-optimizer.ts with optional RAG context fetching
- [X] T037 [US2] Create POST /api/studio/expand-prompt custom endpoint in src/app/api/studio/expand-prompt/route.ts for testing prompt expansion without creating task
- [X] T037a [P] [US2] Write integration tests for expand-prompt-preview endpoint in tests/integration/endpoints/studio.integration.test.ts
- [X] T038 [US2] Update expand-prompt job handler in src/jobs/expand-prompt.ts to use prompt-optimizer service and generate subjectSlug

**Checkpoint**: User Story 2 complete - all unit tests pass for prompt-optimizer. Admin can submit themes and get AI-enhanced prompts before generation.

---

## Phase 5: User Story 3 - Style Configuration and Management (Priority: P2)

**Goal**: Admin can create and manage reusable style templates that can be applied to any generation

**Independent Test**: Create a style template, apply it to a generation task, verify style modifiers are correctly merged into the final prompt

**Unit Tests**: NOT required (StyleTemplates collection uses Payload built-in validation, no custom service logic)
**Integration Tests**: REQUIRED for collection CRUD operations

**Gate Criteria**: Integration tests pass for StyleTemplates CRUD

### Tests for User Story 3

- [ ] T038a [P] [US3] Write integration tests for StyleTemplates collection in tests/integration/collections/style-templates.integration.test.ts (test CRUD, validation of {prompt} placeholder, system style deletion prevention)

### Implementation for User Story 3

- [ ] T039 [US3] Add StyleTemplates collection access control in src/collections/StyleTemplates.ts to prevent deletion of system styles (isSystem: true)
- [ ] T040 [US3] Create admin custom component for style template preview in src/components/StylePreview/index.tsx showing merged prompt example
- [ ] T041 [US3] Create seed data for default style templates (Ghibli, Cyberpunk, Film Noir, Watercolor) in src/seed/styles.ts
- [ ] T042 [US3] Update task orchestrator to automatically include Base style when other styles are selected in src/services/task-orchestrator.ts

**Checkpoint**: Style management complete - integration tests pass. Admin can create/edit styles and apply them to generations.

---

## Phase 6: User Story 4 - Task Monitoring and Management (Priority: P2)

**Goal**: Admin can view all generation tasks with progress and status, and manage failed tasks

**Independent Test**: Create tasks and verify they appear in the task list with accurate status, progress, and filtering capabilities

**Unit Tests**: NOT required (UI components, no complex business logic)
**Integration Tests**: Already covered by Phase 3 task endpoint tests

**Gate Criteria**: Component renders correctly, manual testing passes

### Implementation for User Story 4

- [ ] T043 [US4] Create TaskManager custom admin view in src/components/TaskManager/index.tsx with task list, status filters, and progress bars
- [ ] T044 [P] [US4] Create TaskDetail component in src/components/TaskManager/TaskDetail.tsx showing sub-task breakdown, error logs, and retry buttons
- [ ] T045 [P] [US4] Create SubTaskList component in src/components/TaskManager/SubTaskList.tsx with status indicators and expandable error details
- [ ] T046 [US4] Implement task polling hook in src/components/TaskManager/useTaskProgress.ts with 5-second interval for real-time updates
- [ ] T047 [US4] Add TaskManager to Payload admin panel navigation in payload.config.ts admin.components configuration

**Checkpoint**: Task monitoring complete - admin can view and manage all tasks from a centralized dashboard.

---

## Phase 7: User Story 5 - Asset Gallery and Management (Priority: P2)

**Goal**: Admin can browse generated images in a visual gallery with filtering, search, and download capabilities

**Independent Test**: Generate images and verify they appear in the gallery with proper masonry layout, metadata display, and download functionality

**Unit Tests**: NOT required (UI components with library-based rendering)
**Integration Tests**: Already covered by media endpoints in Phase 3

**Gate Criteria**: Gallery renders 500+ images without performance issues, manual testing passes

### Implementation for User Story 5

- [ ] T048 [US5] Create Gallery custom admin view in src/components/Gallery/index.tsx with masonry layout using Masonic library
- [ ] T049 [P] [US5] Create GalleryFilters component in src/components/Gallery/GalleryFilters.tsx with taskId, styleId, modelId filters
- [ ] T050 [P] [US5] Create ImageLightbox component in src/components/Gallery/ImageLightbox.tsx showing full-size image with generation metadata panel
- [ ] T051 [US5] Implement virtual scrolling in Gallery component for 500+ items performance
- [ ] T052 [US5] Create batch download functionality in src/components/Gallery/BatchDownload.tsx with selection and ZIP generation
- [ ] T053 [US5] Add Gallery to Payload admin panel navigation in payload.config.ts admin.components configuration

**Checkpoint**: Gallery complete - admin can browse, filter, view details, and download generated assets.

---

## Phase 8: User Story 6 - Multi-Model Comparison (Priority: P3)

**Goal**: Admin can generate the same prompt across different AI **image** models simultaneously and compare results

**Independent Test**: Submit a generation with multiple image models selected and verify outputs from each model are generated and properly labeled

**Unit Tests**: NOT required (extends existing task-orchestrator logic already tested)
**Integration Tests**: Already covered by Phase 3 tests

**Gate Criteria**: Multi-model generation works correctly, manual testing passes

### Implementation for User Story 6

- [ ] T054 [US6] Update task orchestrator in src/services/task-orchestrator.ts to generate sub-tasks for all selected model combinations
- [ ] T055 [US6] Add model-specific parameter configuration UI in src/components/Studio/ModelParams.tsx for per-model settings (inference steps, quality level)
- [ ] T056 [US6] Add model filter to Gallery in src/components/Gallery/GalleryFilters.tsx to isolate and compare outputs by model

**Checkpoint**: Multi-model comparison complete - admin can generate across image models and compare results side-by-side.

---

## Phase 9: User Story 7 - Dashboard Overview (Priority: P3)

**Goal**: Admin can see an overview of system activity including daily generation counts and resource consumption

**Independent Test**: Perform generation tasks and verify the dashboard reflects accurate counts and metrics

**Unit Tests**: NOT required (UI components with aggregation queries)
**Integration Tests**: NOT required (read-only dashboard with no business logic)

**Gate Criteria**: Dashboard renders correctly with accurate metrics, manual testing passes

### Implementation for User Story 7

- [ ] T057 [US7] Create Dashboard custom admin view in src/components/Dashboard/index.tsx with overview metrics layout
- [ ] T058 [P] [US7] Create DailyStats component in src/components/Dashboard/DailyStats.tsx showing today's generation count and total images
- [ ] T059 [P] [US7] Create RecentActivity component in src/components/Dashboard/RecentActivity.tsx showing recent task completions
- [ ] T060 [P] [US7] Create UsageStats component in src/components/Dashboard/UsageStats.tsx showing most used styles and models
- [ ] T061 [US7] Add Dashboard to Payload admin panel as default landing page in payload.config.ts admin configuration

**Checkpoint**: Dashboard complete - admin has visibility into system activity and usage patterns.

---

## Phase 10: Studio Workspace UI (Supporting All Stories)

**Goal**: Create the main Studio workspace UI that ties together task creation, prompt optimization, and generation

**Unit Tests**: NOT required (UI components)
**Integration Tests**: NOT required (uses already-tested endpoints)

**Gate Criteria**: Studio workflow functions end-to-end, manual testing passes

### Implementation for Studio Workspace

- [ ] T062 Create Studio custom admin view in src/components/Studio/index.tsx as the main generation workspace
- [ ] T063 [P] Create ThemeInput component in src/components/Studio/ThemeInput.tsx with multi-line text input and character counter
- [ ] T064 [P] Create StyleSelector component in src/components/Studio/StyleSelector.tsx with multi-select grid and preview thumbnails
- [ ] T065 [P] Create ModelSelector component in src/components/Studio/ModelSelector.tsx with provider grouping and feature badges
- [ ] T066 [P] Create BatchConfig component in src/components/Studio/BatchConfig.tsx with countPerPrompt input and total calculation display
- [ ] T067 Create PromptPreview component in src/components/Studio/PromptPreview.tsx showing expanded prompts with edit capability
- [ ] T068 Implement task submission flow in src/components/Studio/index.tsx with confirmation dialog when total > 500
- [ ] T069 Add Studio to Payload admin panel navigation in payload.config.ts admin.components configuration

**Checkpoint**: Studio workspace complete - admin has a unified interface for the entire generation workflow.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

**Unit Tests**: NOT required (configuration and polish tasks)
**Integration Tests**: NOT required

**Gate Criteria**: Full test suite passes, quickstart.md validation passes

- [ ] T070 Add admin panel left navigation with Dashboard, Studio, Task Manager, Gallery, and Configuration Center in payload.config.ts
- [ ] T071 [P] Create MongoDB indexes per data-model.md specifications in src/seed/indexes.ts
- [ ] T072 [P] Add input validation across all collections using Payload field validation
- [ ] T073 Implement configurable warning threshold (default 500) for large batch submissions
- [ ] T074 Add error boundary and loading states to all custom admin components
- [ ] T075 Run quickstart.md validation to ensure all documented workflows function correctly
- [ ] T075a Run full test suite (pnpm test) and verify all tests pass with no regressions

---

## Phase 12: Video Generation - Veo (DEFERRED - Lowest Priority)

**Purpose**: Video generation capability using Google Veo - explicitly deferred per clarification

**DEFERRED**: Video generation is not required for initial release. Focus on image generation first.

**Unit Tests**: REQUIRED when implemented (Veo adapter)
**Integration Tests**: REQUIRED when implemented (video job handler)

- [ ] T076 Implement Veo video adapter in src/adapters/veo.ts for Google Veo integration with long-running operation polling
- [ ] T076a [P] Write unit tests for Veo adapter in tests/unit/adapters/veo.adapter.test.ts (mock Google client, test polling logic)
- [ ] T077 Add video-specific UI components in src/components/Studio/VideoConfig.tsx for video generation parameters
- [ ] T078 Update Media collection in src/collections/Media.ts to handle video assets with duration metadata
- [ ] T079 Add video playback support in src/components/Gallery/VideoPlayer.tsx

**Checkpoint**: Video generation complete - admin can generate videos using Google Veo (future enhancement)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
  - **Gate**: All unit tests and contract tests MUST pass before proceeding
- **User Story 1 (Phase 3)**: Depends on Foundational - Core MVP
  - **Gate**: All unit tests for services MUST pass, all integration tests MUST pass
- **User Story 2 (Phase 4)**: Depends on Phase 3 (T027 expand-prompt job)
  - **Gate**: All unit tests for prompt-optimizer MUST pass
- **User Stories 3-7 (Phases 5-9)**: All depend on Phase 3 completion but can proceed in parallel
  - **Gate**: Relevant integration tests MUST pass for each story
- **Studio UI (Phase 10)**: Depends on Phases 3-5 for full functionality
- **Polish (Phase 11)**: Depends on all desired user stories being complete
  - **Gate**: Full test suite MUST pass
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

- Tests (TDD) should be written FIRST or during implementation
- Collections/Models before services
- Services before job handlers
- Job handlers before endpoints
- Endpoints before UI components
- Core implementation before integration
- **All tests MUST pass before story is considered complete**

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational adapter implementations (T013-T015) and their tests can run in parallel
- Collections T021-T023 can be created in parallel
- Job handlers T027-T028 can run in parallel
- Unit test files marked [P] can be written in parallel
- UI components within each story marked [P] can run in parallel
- Once Phase 3 completes, Phases 5-9 can run in parallel (if team capacity allows)

---

## Test Summary by Phase

| Phase | Unit Tests | Integration Tests | Contract Tests | Gate Criteria |
|-------|------------|-------------------|----------------|---------------|
| Phase 1: Setup | - | - | - | Project builds, test infra ready |
| Phase 2: Foundational | T010a, T011a, T013a, T014a, T015a | - | T016a | All unit + contract tests pass |
| Phase 3: US1 | T020a, T020b, T020c, T033b, T033k | T020d, T020e, T020f, T033h | - | All tests pass |
| Phase 4: US2 | T033a | T037a | - | All tests pass |
| Phase 5: US3 | - | T038a | - | Integration tests pass |
| Phase 6: US4 | - | - | - | Manual testing |
| Phase 7: US5 | - | - | - | Manual testing |
| Phase 8: US6 | - | - | - | Manual testing |
| Phase 9: US7 | - | - | - | Manual testing |
| Phase 10: Studio | - | - | - | Manual testing |
| Phase 11: Polish | - | - | - | Full suite passes |
| Phase 12: Veo | T076a | - | - | (Deferred) |

**Total Test Tasks**: 19 (10 unit, 8 integration, 1 contract)

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch all adapters and their tests together:
Task: "Implement Flux adapter in src/adapters/flux.ts"
Task: "Write unit tests for Flux adapter in tests/unit/adapters/flux.adapter.test.ts"
Task: "Implement DALL-E 3 adapter in src/adapters/dalle.ts"
Task: "Write unit tests for DALL-E adapter in tests/unit/adapters/dalle.adapter.test.ts"
Task: "Implement Imagen adapter in src/adapters/imagen.ts"
Task: "Write unit tests for Imagen adapter in tests/unit/adapters/imagen.adapter.test.ts"

# Launch utility files and their tests together:
Task: "Create error normalization utility in src/lib/error-normalizer.ts"
Task: "Write unit tests for error-normalizer in tests/unit/lib/error-normalizer.test.ts"
Task: "Create rate limiter utility in src/lib/rate-limiter.ts"
Task: "Write unit tests for rate-limiter in tests/unit/lib/rate-limiter.test.ts"
```

## Parallel Example: User Story 1 Tests

```bash
# Launch all US1 unit tests together:
Task: "Write unit tests for task-orchestrator service in tests/unit/services/task-orchestrator.test.ts"
Task: "Write unit tests for style-merger utility in tests/unit/services/style-merger.test.ts"
Task: "Write unit tests for asset-manager service in tests/unit/services/asset-manager.test.ts"

# Launch all US1 integration tests together:
Task: "Write integration tests for expand-prompt job in tests/integration/jobs/expand-prompt.integration.test.ts"
Task: "Write integration tests for generate-image job in tests/integration/jobs/generate-image.integration.test.ts"
Task: "Write integration tests for task endpoints in tests/integration/endpoints/tasks.integration.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (including test infrastructure)
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
   - **RUN TESTS**: `pnpm test:unit` - All unit tests must pass
   - **RUN TESTS**: `pnpm test:contract` - All contract tests must pass
3. Complete Phase 3: User Story 1 (Batch Generation)
   - **RUN TESTS**: `pnpm test:unit` - Service tests must pass
   - **RUN TESTS**: `pnpm test:integration` - Job/endpoint tests must pass
4. Complete Phase 4: User Story 2 (Prompt Optimization)
   - **RUN TESTS**: `pnpm test` - All tests must pass
5. **STOP and VALIDATE**: Test core generation workflow end-to-end
6. Deploy/demo if ready - Admin can now generate AI images

### Incremental Delivery

1. Complete Setup + Foundational + Tests -> Foundation ready
2. Add User Story 1 + Tests -> Test independently -> Deploy/Demo (Core MVP!)
3. Add User Story 2 + Tests -> Test independently -> Deploy/Demo (Enhanced prompts)
4. Add User Stories 3-5 + Tests -> Test independently -> Deploy/Demo (Management features)
5. Add User Stories 6-7 -> Test independently -> Deploy/Demo (Advanced features)
6. Add Studio UI -> Test independently -> Deploy/Demo (Unified experience)
7. Each story adds value without breaking previous stories

### Test Failure Response Protocol

```
IF test fails THEN
  1. Do NOT proceed to next task
  2. Analyze failure root cause
  3. Fix implementation OR fix test if test is wrong
  4. Verify all related tests pass
  5. Resume implementation
END IF
```

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **Tests must pass before proceeding to next phase (Constitution Principle VI)**
- Commit after each task or logical group with passing tests
- Stop at any checkpoint to validate story independently
- PayloadCMS collections are defined via code, not migrations
- Jobs Queue is configured in payload.config.ts, no external queue systems
- All UI components are React components integrated into PayloadCMS admin
- TailwindCSS classes must use `.twp` prefix scope
- **Video generation (Veo) is DEFERRED** - Phase 12 is lowest priority; focus on image generation first
- **LLM Provider Strategy**: Start with Gemini Pro for prompt expansion; the abstraction layer (T035a) enables future expansion to ChatGPT (GPT-4o) and Claude (Claude 3.5 Sonnet) without refactoring
- **Testing Tools**: Vitest + Testing Library + MongoDB Memory Server per plan.md
