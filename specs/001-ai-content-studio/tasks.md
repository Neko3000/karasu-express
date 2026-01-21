# Tasks: AI Content Generation Studio

**Input**: Design documents from `/specs/001-ai-content-studio/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests ARE required per Constitution Principle VI (Testing Discipline). Test tasks are included following the Testing Strategy defined in plan.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**LLM for Prompt Expansion**: **Gemini 3 Flash Preview** (model: `gemini-3-flash-preview`) is the primary LLM for prompt optimization. This model offers Pro-level reasoning with Flash speed and pricing. Supports configurable thinking levels (minimal/low/medium/high) for latency vs reasoning depth tradeoffs. Future expansion will support ChatGPT (GPT-4o) and Claude (Claude 3.5 Sonnet).

**Image Generation Models**: Flux (via Fal.ai), DALL-E 3 (via OpenAI), and Nano Banana (via Google AI) are the image generation providers. These are distinct from the LLM used for prompt expansion - the LLM enhances prompts, then the image models generate visuals from those enhanced prompts.

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
| Adapters (Flux, DALL-E, Nano Banana) | REQUIRED | N/A | REQUIRED |
| Lib utilities (prompt-merger, task-fission, error-normalizer) | REQUIRED | N/A | N/A |
| Services (task-service, task-manager) | REQUIRED | REQUIRED | N/A |
| Jobs (expand-prompt, generate-image) | N/A | REQUIRED | N/A |
| API Endpoints (cancel, retry) | N/A | REQUIRED | N/A |
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
- [X] T015 [P] Implement Nano Banana adapter in src/adapters/nano-banana.ts with Google Cloud client integration
- [X] T015a [P] Write unit tests for Nano Banana adapter in tests/unit/adapters/nano-banana.adapter.test.ts (mock Google client, test generate, normalizeError, getDefaultOptions)
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

### Nano Banana API Key Migration (Authentication Simplification)

> **Purpose**: Migrate Nano Banana adapter from Google Cloud Vertex AI (service account JSON) to Google AI Studio API Key (GOOGLE_AI_API_KEY) for simpler authentication

#### Unit Tests (Nano Banana API Key)

- [X] T033k [P] [US1] Update unit tests for Nano Banana adapter in tests/unit/adapters/nano-banana.adapter.test.ts to mock @google/generative-ai SDK instead of google-auth-library

#### Implementation for Nano Banana API Key

- [X] T033l [US1] Update NanoBananaConfig interface in src/adapters/nano-banana.ts to accept apiKey instead of projectId/location
- [X] T033m [US1] Refactor NanoBananaAdapter to use @google/generative-ai SDK with GOOGLE_AI_API_KEY environment variable instead of Vertex AI REST API
- [X] T033n [US1] Update callNanoBananaApi method in src/adapters/nano-banana.ts to use Google AI generateImages endpoint instead of Vertex AI predict endpoint
- [X] T033o [US1] Update .env.example to clarify GOOGLE_AI_API_KEY usage for both Gemini LLM and Nano Banana image generation
- [X] T033p [P] [US1] Verify Nano Banana adapter works with real GOOGLE_AI_API_KEY by running manual test

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

**Gate Criteria**: All unit tests pass for prompt-optimizer service, UI components functional

**Model**: `gemini-3-flash-preview` (Google AI) - High-speed thinking model with Pro-level reasoning, 1M token context, supports configurable thinking levels (minimal/low/medium/high)

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

### Gemini 3 Flash Preview Model Upgrade

> **Purpose**: Upgrade prompt optimizer to use gemini-3-flash-preview model for improved reasoning performance

- [X] T038b [US2] Update GeminiProvider default model from 'gemini-1.5-flash' to 'gemini-3-flash-preview' in src/services/prompt-optimizer.ts
- [X] T038c [P] [US2] Add thinking_level parameter support to GeminiProvider in src/services/prompt-optimizer.ts (options: minimal/low/medium/high)
- [X] T038d [P] [US2] Update createPromptOptimizer factory function to accept optional model name parameter in src/services/prompt-optimizer.ts
- [X] T038e [US2] Update unit tests in tests/unit/services/prompt-optimizer.test.ts to verify gemini-3-flash-preview model usage

### Prompt Optimization UI Components (Moved from Phase 10)

> **Purpose**: UI components for prompt input, "Extend" button with collapsible results section, and editable/selectable prompt variants on task creation page
>
> **Reference**: spec.md Session 2025-12-23 clarifications define:
> - "Extend" button (not "Generate Extended Prompts")
> - Collapsible section below text input that expands with optimization results
> - Progress bar with stages: Analyzing → Enhancing → Formatting
> - 3 (default), 5, or 7 variants with dropdown selector
> - Each variant has checkbox for selection + inline text editor
> - Inline error banner with "Retry" button on failure

#### Subject Input & Configuration

- [X] T038f [P] [US2] Create SubjectInput component in src/components/Studio/SubjectInput.tsx with multi-line text input and character counter
- [X] T038f2 [P] [US2] Create VariantCountSelector component in src/components/Studio/VariantCountSelector.tsx as dropdown with options 3 (default), 5, or 7

#### Extend Button & Collapsible Section

- [X] T038g [US2] Create ExtendButton component in src/components/Studio/ExtendButton.tsx with "Extend" label that triggers prompt optimization API call
- [X] T038g2 [US2] Create PromptOptimizationSection component in src/components/Studio/PromptOptimizationSection.tsx as collapsible container below SubjectInput that expands when ExtendButton is clicked
- [X] T038g3 [US2] Create OptimizationProgressBar component in src/components/Studio/OptimizationProgressBar.tsx with three stages: "Analyzing" → "Enhancing" → "Formatting" and visual progress indicator

#### Prompt Variants Display

- [X] T038h [US2] Create PromptVariantsList component in src/components/Studio/PromptVariantsList.tsx to display generated variants inside the collapsible section after progress completes
- [X] T038i [US2] Create PromptVariantCard component in src/components/Studio/PromptVariantCard.tsx with:
  - Checkbox for selection (allows multi-select of variants)
  - Variant name/label (e.g., "Realistic", "Abstract", "Artistic")
  - Inline editable text area for the expanded prompt
  - Suggested negative prompt display (non-editable, for reference)

#### Error Handling

- [X] T038i2 [US2] Create OptimizationErrorBanner component in src/components/Studio/OptimizationErrorBanner.tsx with inline error message display and "Retry" button inside the collapsible section

#### State Management Hook

- [X] T038j [US2] Create usePromptExpansion hook in src/components/Studio/hooks/usePromptExpansion.ts to manage:
  - Subject input state
  - Variant count selection (3/5/7)
  - Collapsible section open/closed state
  - Progress stage tracking (idle/analyzing/enhancing/formatting/complete/error)
  - Generated variants array with selection state
  - User modifications to generated prompts
  - Error state and retry logic

#### Integration

- [X] T038k [US2] Integrate SubjectInput, VariantCountSelector, ExtendButton, and PromptOptimizationSection into task creation page in src/components/Studio/index.tsx
- [X] T038l [US2] Connect usePromptExpansion hook to /api/studio/expand-prompt endpoint with loading stages simulation (Analyzing → Enhancing → Formatting progress)
- [X] T038m [US2] Implement prompt editing persistence in usePromptExpansion hook to track user modifications to generated prompts (preserve edits across re-renders)

**Checkpoint**: User Story 2 complete - all unit tests pass for prompt-optimizer, UI components allow subject input, "Extend" button triggers collapsible section with staged progress bar, displays selectable/editable prompt variants, handles errors with inline retry. Admin can submit subjects, get AI-enhanced prompts, select and edit variants, and proceed to generation.

---

## Phase 5: Optimize Task Creation Page (UI Enhancement)

**Goal**: Enhance the task creation page with a calculated prompts preview showing final prompt combinations and total image count, plus an Overview section summarizing the entire generation task

**Context**: Currently when user inputs 1 subject, the system generates 3 variant prompts. Then the user selects multiple styles. Each variant prompt combines with each selected style. This phase adds visibility into the final calculated prompts and total image count, plus a comprehensive Overview section at the beginning of the Status & Progress area.

**Independent Test**: Enter a subject, generate 3 variants, select 2 styles, and verify the calculated prompts section shows 6 final prompts (3 variants x 2 styles) with the correct total image count based on count per prompt. Also verify the Overview section displays all summary information correctly.

**Unit Tests**: NOT required (UI components with display logic only)
**Integration Tests**: NOT required (uses already-tested endpoints)

**Gate Criteria**: Component renders correctly showing all prompt/style combinations, Overview section displays accurate summary, manual testing passes

### Implementation for Task Creation Page Optimization

#### Overview Section (NEW - Before Status & Progress)

- [X] T038u [US1] Create TaskOverviewSection component in src/components/Studio/TaskOverviewSection.tsx as a summary panel displayed before Status & Progress section showing:
  - Section title: "Overview"
  - Subsections for each category of information (settings, counts, etc.)
- [X] T038v [P] [US1] Create SelectedSettingsSummary component in src/components/Studio/Overview/SelectedSettingsSummary.tsx to display:
  - Selected models (list with provider badges)
  - Selected aspect ratio
  - Any other generation settings configured
- [X] T038w [P] [US1] Create PromptsCountSummary component in src/components/Studio/Overview/PromptsCountSummary.tsx to display:
  - Number of prompt variants selected
  - Number of styles selected
  - Calculated prompts count: variants × styles
  - Visual breakdown formula (e.g., "3 variants × 2 styles = 6 prompts")
- [X] T038x [P] [US1] Create ImageCountSummary component in src/components/Studio/Overview/ImageCountSummary.tsx to display:
  - Image count per model: variants × styles × count per prompt
  - Image count for all models: variants × styles × count per prompt × models
  - Visual breakdown with formula display
  - Prominent display of total images to be generated
- [X] T038y [P] [US1] Create TaskSummaryStats component in src/components/Studio/Overview/TaskSummaryStats.tsx to display additional key information:
  - Estimated API calls count
  - Selected AI providers summary
  - Any warnings (e.g., high image count > 500)
- [X] T038z [US1] Create useTaskOverview hook in src/components/Studio/hooks/useTaskOverview.ts to:
  - Aggregate all form state (variants, styles, models, batch config)
  - Calculate all summary statistics
  - Return structured overview data for display components
- [X] T038aa [US1] Integrate TaskOverviewSection into task creation page in src/components/Studio/index.tsx positioned before the Status & Progress section

#### Calculated Prompts Preview

- [X] T038n [US1] Create CalculatedPromptsSection component in src/components/Studio/CalculatedPromptsSection.tsx to display the final prompt combinations at the end of the "Prompts" section
- [X] T038o [P] [US1] Create CalculatedPromptCard component in src/components/Studio/CalculatedPromptCard.tsx to display individual calculated prompt with:
  - Variant label (e.g., "Variant 1 - Realistic")
  - Style name applied (e.g., "Cyberpunk")
  - Final merged prompt text (preview, non-editable)
  - Negative prompt if applicable
- [X] T038p [US1] Create useCalculatedPrompts hook in src/components/Studio/hooks/useCalculatedPrompts.ts to:
  - Take selected variants and selected styles as input
  - Calculate all combinations (variants x styles)
  - Apply style-merger logic to generate final prompts
  - Return array of calculated prompt objects

#### Total Image Count Display

- [X] T038q [P] [US1] Create TotalImageCount component in src/components/Studio/TotalImageCount.tsx to display:
  - Number of calculated prompts (variants x styles)
  - Count per prompt (from BatchConfig)
  - Final total: (variants x styles x countPerPrompt)
  - Visual emphasis for the final number
- [X] T038r [US1] Integrate TotalImageCount with BatchConfig component to update in real-time as parameters change

#### Integration

- [X] T038s [US1] Integrate CalculatedPromptsSection into task creation page in src/components/Studio/index.tsx at the end of the "Prompts" section (after prompt variants and before generation submit)
- [X] T038t [US1] Connect useCalculatedPrompts hook to style-merger service for accurate prompt merging preview

**Checkpoint**: Task creation page now shows all calculated prompt combinations (variants x styles) with final merged prompts, displays the total image count that will be generated, and includes a comprehensive Overview section summarizing all generation settings and counts.

---

### UI Enhancement: Overview Section Optimization

> **Purpose**: Improve the Overview section UI to align with PayloadCMS style conventions and improve layout for better readability

#### Title Style Alignment

- [X] T038ab [US1] Update TaskOverviewField section header in src/components/Studio/TaskOverviewField.tsx to use SectionHeader component style (matching "Batch Settings" and "Image Settings" sections) - remove emoji and align font styles

#### Layout Simplification

- [X] T038ac [US1] Refactor TaskOverviewField grid layout in src/components/Studio/TaskOverviewField.tsx from 4-column auto-fit to 2-column layout (each card takes 1/2 row width) to handle longer text content properly
- [X] T038ad [P] [US1] Update OverviewCard component in src/components/Studio/TaskOverviewField.tsx to use consistent padding and spacing matching PayloadCMS form field cards
- [X] T038ae [P] [US1] Simplify InfoRow component in src/components/Studio/TaskOverviewField.tsx to handle longer text values without truncation - adjust label/value layout to stack vertically when content is long

**Checkpoint**: Overview section now matches PayloadCMS admin panel styling with proper section headers, 2-column layout for better text handling, and simplified card design.

---

### Style Selection Database Migration (Data Source Refactor)

> **Purpose**: Migrate style selection from embedded TypeScript file to database lookup, aligning with PayloadCMS standard patterns for reading data from DB. Remove redundant TS file after migration.
>
> **Current State**: Style selection reads from `src/resources/style-list/sdxl-styles-exp.ts` via `style-loader.ts`
>
> **Target State**: Style selection reads from `StyleTemplates` collection in MongoDB (populated by seed script)

#### Implementation for Style DB Migration

- [X] T038af [US1] Update `style-loader.ts` in src/services/style-loader.ts to read styles from StyleTemplates collection via PayloadCMS API instead of embedded TypeScript data
- [X] T038ag [P] [US1] Create `getStylesFromDB()` function in src/services/style-loader.ts that fetches all styles from StyleTemplates collection using `payload.find()`
- [X] T038ah [US1] Update `getAllStyles()` function in src/services/style-loader.ts to call `getStylesFromDB()` instead of importing from `sdxl-styles-exp.ts`
- [X] T038ai [US1] Update `getStyleById()` function in src/services/style-loader.ts to query StyleTemplates collection by styleId field
- [X] T038aj [US1] Update `getStylesByIds()` function in src/services/style-loader.ts to batch query StyleTemplates collection
- [X] T038ak [P] [US1] Update GET /api/studio/styles endpoint in src/endpoints/get-styles.ts to use the refactored style-loader service
- [X] T038al [US1] Ensure seed script in src/seed/index.ts imports all styles from `sdxl-styles-exp.ts` to StyleTemplates collection before migration
- [X] T038am [P] [US1] Write migration script or update seed to populate StyleTemplates with all styles from sdxl-styles-exp.ts (currently only 8 system styles are seeded, need to seed all 180+ styles)

#### Cleanup After Migration

- [X] T038an [US1] Remove TypeScript style data file src/resources/style-list/sdxl-styles-exp.ts after confirming DB migration works
- [X] T038ao [P] [US1] Remove import of `sdxlStylesData` from style-loader.ts after migration
- [X] T038ap [US1] Update unit tests in tests/unit/services/style-loader.test.ts to mock PayloadCMS API calls instead of embedded data

**Checkpoint**: Style selection now reads from StyleTemplates collection in database. Redundant TypeScript file removed. Seed script reads from JSON file (src/resources/original/sdxl_styles_exp.json). All 180+ styles will be seeded on next pnpm payload:seed run.

---

### Imported Style Ids Field - DB Integration (UI Component)

> **Purpose**: Connect the "Imported Style Ids" field on the task creation page (collections/tasks) to fetch style options from the database via API
>
> **Context**: The task creation page needs to display available styles for selection. The styles should be fetched from the StyleTemplates collection in MongoDB via the `/api/studio/styles` endpoint.

#### Implementation for Imported Style Ids Field

- [X] T038aq [US1] Update StyleSelector component in src/components/Studio/StyleSelectorField.tsx to fetch style options from GET /api/studio/styles endpoint on component mount
- [X] T038ar [P] [US1] Create useStyleOptions hook in src/components/Studio/hooks/useStyleOptions.ts to manage fetching styles from API, loading state, and error handling
- [X] T038as [US1] Integrate useStyleOptions hook with StyleSelectorField component to populate the multi-select style options from database query results

**Checkpoint**: Imported Style Ids field on task creation page now fetches style options from database via API. Users see all available styles from StyleTemplates collection when creating a task.

---

### Submit Button for Task Creation Page

> **Purpose**: Add a prominent "Submit Task" button to the task creation page that saves the task and transitions it from draft to queued status, triggering the image generation workflow.
>
> **Context**: Currently, users can only use PayloadCMS's built-in "Save" button which saves as draft. A dedicated submit button is needed to:
> 1. Save the current form data as a task
> 2. Call the POST /api/tasks/{id}/submit endpoint to transition to queued status
> 3. Show loading state during submission
> 4. Handle success (redirect to task detail or show confirmation) and error states
> 5. Display validation warnings (e.g., high image count > 500) before submission

#### Submit Button Component

- [X] T038at [US1] Create SubmitTaskButton component in src/components/Studio/SubmitTaskButton.tsx with:
  - Prominent button styling (primary color, larger than standard buttons)
  - "Submit Task" label with optional icon
  - Loading spinner during submission
  - Disabled state when form is invalid or already submitted
  - Integration with PayloadCMS form context to access task ID and form state

#### Submit Button Hook

- [X] T038au [US1] Create useSubmitTask hook in src/components/Studio/hooks/useSubmitTask.ts to:
  - Access PayloadCMS form context for task ID and form data
  - Handle form save via PayloadCMS API before submission
  - Call POST /api/tasks/{id}/submit endpoint after save completes
  - Track submission state (idle, saving, submitting, success, error)
  - Return error messages for validation failures
  - Handle redirect or success callback after successful submission

#### Confirmation Dialog

- [X] T038av [P] [US1] Create SubmitConfirmationDialog component in src/components/Studio/SubmitConfirmationDialog.tsx with:
  - Modal overlay with task summary (total images, selected models, styles)
  - Warning message when total images exceeds 500 (per FR-005)
  - "Confirm Submit" and "Cancel" buttons
  - Accessible modal implementation (focus trap, ESC to close)

#### Integration with Task Creation Page

- [X] T038aw [US1] Create SubmitTaskField component in src/components/Studio/SubmitTaskField.tsx as PayloadCMS UI field wrapper that renders SubmitTaskButton
- [X] T038ax [US1] Add SubmitTaskAction to Tasks collection in src/collections/Tasks.ts via admin.components.edit.beforeDocumentControls (positioned next to Save button in document header)
- [X] T038ay [US1] Update src/components/Studio/index.tsx barrel file to export SubmitTaskButton, useSubmitTask, SubmitConfirmationDialog, SubmitTaskField, SubmitTaskAction components

#### Success and Error States

- [X] T038az [P] [US1] Create SubmitSuccessMessage component in src/components/Studio/SubmitSuccessMessage.tsx showing:
  - Success confirmation with task ID
  - Link to Task Manager to track progress
  - Option to create another task
- [X] T038ba [P] [US1] Create SubmitErrorMessage component in src/components/Studio/SubmitErrorMessage.tsx showing:
  - Error message from API response
  - Retry button to attempt submission again
  - Styled consistently with OptimizationErrorBanner

**Checkpoint**: Task creation page now has a dedicated "Submit Task" button in the document header (next to the Save button) that saves the task, shows a confirmation dialog with warnings if applicable, submits to the generation queue, and provides clear success/error feedback via toast notifications. Users can now complete the full task creation workflow from a single page.

---

## Phase 6: User Story 3 - Style Configuration and Management (Priority: P2)

**Goal**: Admin can create and manage reusable style templates that can be applied to any generation

**Independent Test**: Create a style template, apply it to a generation task, verify style modifiers are correctly merged into the final prompt

**Unit Tests**: NOT required (StyleTemplates collection uses Payload built-in validation, no custom service logic)
**Integration Tests**: REQUIRED for collection CRUD operations

**Gate Criteria**: Integration tests pass for StyleTemplates CRUD

### Optimize Style Template Page (Simplification)

> **Purpose**: Simplify the style template collection to only include essential fields:
> - styleId (unique identifier)
> - name (display name)
> - description (optional)
> - positivePrompt (with {prompt} placeholder)
> - negativePrompt (optional)
>
> **Remove**: previewImage and sortOrder fields

- [X] T038a [P] [US3] Write integration tests for StyleTemplates collection in tests/integration/collections/style-templates.integration.test.ts (test CRUD, validation of {prompt} placeholder, unique name case-insensitive)
- [X] T039 [US3] Remove previewImage field from StyleTemplates collection in src/collections/StyleTemplates.ts
- [X] T039a [US3] Remove sortOrder field from StyleTemplates collection in src/collections/StyleTemplates.ts
- [X] T039b [US3] Update StyleTemplates admin.defaultColumns to remove sortOrder in src/collections/StyleTemplates.ts (keep: name, styleId, isSystem)
- [X] T039c [US3] Update data-model.md StyleTemplates section to remove previewImage and sortOrder fields

### Implementation for User Story 3

- [X] T040 [US3] Create admin custom component for style template preview in src/components/StylePreview/index.tsx showing merged prompt example
- [X] T041 [US3] Create seed data for default style templates (Ghibli, Cyberpunk, Film Noir, Watercolor) in src/seed/styles.ts
- [X] T042 [US3] Update task orchestrator to automatically include Base style when other styles are selected in src/services/task-orchestrator.ts

---

## Phase 7: User Story 4 - Task Monitoring and Management (Priority: P2)

**Goal**: Admin can view all generation tasks with progress and status, filter/search tasks, cancel in-progress tasks, and retry failed sub-tasks

**Independent Test**: Create tasks, verify they appear in the task list with accurate status/progress, test filtering by status/date/keyword, verify cancel stops pending sub-tasks, verify retry clears error state

**Unit Tests**: REQUIRED for task-manager service (filtering, sorting, search logic)
**Integration Tests**: REQUIRED for cancel/retry endpoints

**Gate Criteria**: All unit tests pass for task-manager service, all integration tests pass for cancel/retry endpoints, manual testing passes

**Reference**: spec.md Session 2026-01-14 clarifications define:
- Filter options: Status + date range + search by theme keyword
- Default sort: Newest first (most recent creation time at top)
- Cancel behavior: Complete current sub-task, stop pending sub-tasks, keep completed assets
- Retry behavior: Update existing sub-task in place, clear error state

### Backend Services & Endpoints for User Story 4

#### Unit Tests (Services)

- [X] T043a [P] [US4] Write unit tests for task-manager service in tests/unit/services/task-manager.test.ts (test filterTasks with status/date/keyword, test sortTasks with newest-first, test buildTaskQuery)

#### Integration Tests (Endpoints)

- [X] T043b [P] [US4] Write integration tests for task-cancel endpoint in tests/integration/endpoints/task-cancel.integration.test.ts (test cancel transitions task to cancelled, test pending sub-tasks cancelled, test completed assets retained)
- [X] T043c [P] [US4] Write integration tests for subtask-retry endpoint in tests/integration/endpoints/subtask-retry.integration.test.ts (test retry clears error state, test retryCount reset, test sub-task re-queued)

#### Type & Status Updates

- [X] T043d [P] [US4] Add Cancelled status to TaskStatus enum in src/lib/types.ts per data-model.md
- [X] T043e [P] [US4] Add Cancelled status to SubTaskStatus enum in src/lib/types.ts per data-model.md

#### Service Implementation

- [X] T043f [US4] Implement task-manager service in src/services/task-manager.ts with:
  - filterTasks(filters: TaskFilters): Filters by status array, date range, keyword search
  - sortTasks(sortOrder: 'newest' | 'oldest'): Default newest first (-createdAt)
  - buildTaskQuery(filters, sort, pagination): Construct MongoDB query
  - getTaskWithSubTasks(taskId): Fetch task with related sub-tasks for detail view

#### Endpoint Implementation

- [X] T043g [US4] Create POST /api/tasks/{id}/cancel endpoint in src/app/api/tasks/[id]/cancel/route.ts that:
  - Updates Task status to 'cancelled'
  - Updates all pending SubTasks to 'cancelled' status
  - Returns CancelTaskResponse with cancelledSubTasks and completedSubTasks counts
  - Respects: current sub-task completes, only pending sub-tasks cancelled
- [X] T043h [US4] Create POST /api/sub-tasks/{id}/retry endpoint in src/app/api/sub-tasks/[id]/retry/route.ts that:
  - Clears errorLog, errorCategory on existing sub-task (in-place update)
  - Resets status to 'pending', retryCount to 0
  - Re-queues generate-image job for the sub-task
  - Returns RetrySubTaskResponse with subTaskId and newStatus

#### Job Handler Update

- [X] T043i [US4] Update generate-image job handler in src/jobs/generate-image.ts to check parent Task status before processing:
  - If parent Task status is 'cancelled', skip processing and mark SubTask as 'cancelled'
  - Prevents orphaned job execution after cancellation

#### Job Queue Runner Configuration

- [X] T043ia [US4] Configure PayloadCMS jobs queue auto-run in src/payload.config.ts to enable automatic job processing:
  - Add `autoRun: true` to jobs configuration so expand-prompt and generate-image jobs run automatically after task submission
  - This ensures sub-tasks are created immediately when a task is submitted (status changes to 'queued')
  - Without this, jobs are queued but never processed, resulting in empty sub-tasks list

### UI Components for User Story 4

> **Path Convention**: Custom admin views in src/app/(payload)/admin/[[...segments]]/custom/task-manager/

#### Task Manager Page

- [X] T043j [US4] Create TaskManager custom admin view page in src/app/(payload)/admin/[[...segments]]/custom/task-manager/page.tsx as the main Task Manager entry point

#### Filter & List Components

- [X] T043k [P] [US4] Create TaskFilters component in src/app/(payload)/admin/[[...segments]]/custom/task-manager/TaskFilters.tsx with:
  - Status multi-select: In Progress, Completed, Failed, Cancelled
  - Date range selector: Today, Last 7 days, Last 30 days, Custom range
  - Theme keyword search input
- [X] T043l [P] [US4] Create TaskList component in src/app/(payload)/admin/[[...segments]]/custom/task-manager/TaskList.tsx with:
  - Task rows showing ID, theme, creation time, progress bar, status badge
  - Default sort: newest first
  - Pagination controls
  - Cancel button for in-progress tasks
  - Click to expand task details

#### Detail Components

- [X] T043m [P] [US4] Create TaskDetail component in src/app/(payload)/admin/[[...segments]]/custom/task-manager/TaskDetail.tsx showing:
  - Configuration snapshot (prompts, styles, models, parameters)
  - Sub-task breakdown with status counts
  - Error summary for failed tasks
  - Retry All Failed button
- [X] T043n [P] [US4] Create SubTaskList component in src/app/(payload)/admin/[[...segments]]/custom/task-manager/SubTaskList.tsx with:
  - Status indicators per sub-task
  - Expandable error details (errorLog, errorCategory)
  - Individual retry button for failed sub-tasks

#### State Management Hook

- [X] T043o [US4] Create useTaskProgress hook in src/app/(payload)/admin/[[...segments]]/custom/task-manager/hooks/useTaskProgress.ts with:
  - 5-second polling interval (PROGRESS_POLL_INTERVAL = 5000ms)
  - Visibility API integration (pause polling when tab hidden)
  - Auto-refresh task list on status changes

#### Navigation Integration

- [X] T043p [US4] Add TaskManager to Payload admin panel navigation (auto-discovered via custom admin view path convention)

### Generated Image Storage & Media Creation (Bug Fix)

> **Purpose**: Fix the "MissingFile: No files were uploaded" error when creating Media documents.
> The Media collection is configured as a PayloadCMS upload collection requiring actual file uploads.
> Current implementation tries to create Media without uploading a file.
>
> **Solution**:
> 1. Download generated image from API response URL to `src/generates/` folder
> 2. Upload the local file to PayloadCMS Media collection using file upload API
>
> **Reference Error**:
> ```
> [generate-image] Error generating image for sub-task: MissingFile: No files were uploaded.
>     at async generateImageHandler (src/jobs/generate-image.ts:225:21)
> ```

#### Unit Tests (Image Storage)

- [X] T043q [P] [US4] Write unit tests for image-storage service in tests/unit/services/image-storage.test.ts (test downloadImage, saveToGeneratesFolder, getLocalFilePath, cleanupOldFiles)

#### Service Implementation (Image Storage)

- [X] T043r [US4] Create image-storage service in src/services/image-storage.ts with:
  - `downloadImage(imageUrl: string): Promise<Buffer>` - Download image from remote URL
  - `saveToGeneratesFolder(buffer: Buffer, filename: string): Promise<string>` - Save buffer to src/generates/ folder and return absolute path
  - `getLocalFilePath(filename: string): string` - Get absolute path to file in generates folder
  - `ensureGeneratesFolderExists(): Promise<void>` - Create src/generates/ if not exists
  - `getExtensionFromUrl(url: string): string` - Extract file extension from URL or content-type

#### Directory Setup

- [X] T043s [P] [US4] Create src/generates/ directory with .gitkeep file (empty directory for storing downloaded images before upload)
- [X] T043t [P] [US4] Add src/generates/*.{png,jpg,jpeg,webp} to .gitignore (keep directory but ignore generated images)

#### Generate-Image Job Handler Update

- [X] T043u [US4] Update generate-image job handler in src/jobs/generate-image.ts to:
  - Import image-storage service
  - After successful API generation, call `downloadImage(generatedImage.url)`
  - Save downloaded buffer to generates folder via `saveToGeneratesFolder(buffer, filename)`
  - Use the local file path for PayloadCMS Media upload instead of trying to create without file

- [X] T043v [US4] Update Media document creation in src/jobs/generate-image.ts to:
  - Use PayloadCMS file upload API: `payload.create({ collection: 'media', data: {...}, file: { data: buffer, mimetype, name } })`
  - Pass the downloaded image buffer directly to payload.create as file data
  - This ensures PayloadCMS processes the upload correctly and generates thumbnails

#### Integration Tests (Image Storage Flow)

- [X] T043w [P] [US4] Write integration tests for generate-image job with image storage in tests/integration/jobs/generate-image-storage.integration.test.ts:
  - Test image download from mock URL
  - Test file saved to generates folder
  - Test Media document created with proper file upload
  - Test cleanup after successful upload (optional)

#### Image Storage Optimization

> **Purpose**: Optimize the image storage workflow for better reliability and debugging.
>
> **Changes**:
> 1. Keep generated files in `src/generates/` instead of deleting them after upload
> 2. Use file path for PayloadCMS upload instead of passing base64 buffer in imageUrl
>
> **Benefits**:
> - Files persist for debugging and manual inspection
> - Cleaner upload flow using PayloadCMS filePath option
> - Reduces memory usage by not holding large base64 strings

- [X] T043x [US4] Update generate-image job in src/jobs/generate-image.ts to remove `deleteFromGeneratesFolder()` call:
  - Remove the cleanup step after successful Media upload
  - Keep generated images in `src/generates/` for persistence
  - Files will remain until manually cleaned or by scheduled cleanup job

- [X] T043y [US4] Update Media document creation in src/jobs/generate-image.ts to use file path:
  - Instead of `file: { data: buffer, mimetype, name, size }`, use `filePath` option
  - Update to: `payload.create({ collection: 'media', data: {...}, filePath: savedFile.filePath })`
  - This allows PayloadCMS to read the file directly from disk instead of from memory

- [X] T043z [P] [US4] Update unit tests in tests/unit/services/image-storage.test.ts:
  - Remove or update tests that expect file deletion after upload
  - Update test assertions to reflect files are retained

- [X] T043za [P] [US4] Update integration tests in tests/integration/jobs/generate-image-storage.integration.test.ts:
  - Update tests to verify files remain after upload
  - Add test case verifying filePath is used in payload.create call

**Checkpoint**: Generated images are now properly saved locally then uploaded to Media collection. Task monitoring and management complete - admin can view tasks sorted by newest first, filter by status/date/keyword, cancel in-progress tasks (completing current sub-task), retry failed sub-tasks in place, all tests pass.

---

## Phase 8: Task Creation Page & Workflow Optimization

**Goal**: Improve the user experience on the task creation page by optimizing default values, form behavior, dialog focus management, and Generated Variants UI

**Independent Test**: Create a new task and verify: (1) models default to nano-banana, (2) aspect ratio defaults to 9:16, (3) Total Expected field is not shown, (4) submit button remains visible but disabled after submission, (5) confirmation dialog buttons are properly focused, (6) expandedPrompts field is hidden, (7) Generated Variants displays in 2-column grid, (8) variant cards have compact layout with collapsible negative prompts, (9) character counts displayed, (10) color-coded borders by variant type

**Unit Tests**: NOT required (UI behavior changes only)
**Integration Tests**: NOT required (no new business logic)

**Gate Criteria**: Manual testing passes for all listed improvements

### Submit Button Visibility After Submission

> **Purpose**: Keep the submit button visible but disabled after task submission instead of hiding it completely. This provides visual confirmation that the task was submitted.

- [X] T044 Update SubmitTaskAction component in src/components/Studio/SubmitTaskAction.tsx to:
  - Remove the early return `null` for already-submitted tasks (line ~214)
  - Keep button visible but disabled with "Already Submitted" label
  - Apply disabled styling (gray background, no hover effects)
  - Button should show "Submitted!" immediately after success, then "Already Submitted" on subsequent views

### Default Values for Form Fields

> **Purpose**: Set sensible default values for models and aspect ratio to streamline the task creation workflow

- [X] T045 [P] Update Tasks collection in src/collections/Tasks.ts to set default value for models field:
  - Add `defaultValue: ['nano-banana']` to the models field configuration
  - This ensures Nano Banana is pre-selected when creating a new task

- [X] T046 [P] Update Tasks collection in src/collections/Tasks.ts to change default aspect ratio:
  - Change `defaultValue: '1:1'` to `defaultValue: '9:16'` for the aspectRatio field
  - Portrait orientation (9:16) is more commonly used for social media content

### Remove Total Expected Field

> **Purpose**: Remove the redundant "Total Expected" field from the task creation form. The Overview section already displays the total image count calculation, making this field unnecessary.

- [X] T047 Update Tasks collection in src/collections/Tasks.ts to:
  - Remove the `totalExpected` field definition (lines ~283-289)
  - Remove the `totalExpected` calculation logic from the `beforeChange` hook
  - This simplifies the form and avoids duplicate information display

### Dialog Focus Fix

> **Purpose**: Ensure the confirmation dialog buttons are properly focused when the dialog opens. Currently the buttons may appear gray/unfocused due to focus management issues.

- [X] T047a Update SubmitConfirmationDialog component in src/components/Studio/SubmitConfirmationDialog.tsx to:
  - Verify focus trap is working correctly (dialog should trap focus within itself)
  - Ensure the "Confirm Submit" button receives initial focus when dialog opens
  - Add `autoFocus` attribute to the confirm button as a fallback
  - Test with keyboard navigation to ensure Tab cycles through dialog buttons properly

### Prompt Variants UI Optimization (PromptOptimizerField Component)

> **Purpose**: Optimize the Generated Variants section within PromptOptimizerField for better space usage, cleaner UI, and improved information display.
>
> **Context**: `PromptOptimizerField` (src/components/Studio/PromptOptimizerField.tsx) is the main custom field component used on the Task creation page. It renders:
> - SubjectInput for theme entry
> - PromptOptimizationSection containing PromptVariantsList
> - PromptVariantsList (child) renders multiple PromptVariantCard components
>
> The tasks below modify child components that are rendered inside PromptOptimizerField on the Task creation page.

- [X] T048 Hide `expandedPrompts` field from Tasks collection UI in src/collections/Tasks.ts:
  - Change the `condition` function to always return `false` (never show)
  - The field data is still stored for backend use, but hidden from admin UI
  - Generated Variants in PromptOptimizerField already displays this data visually

- [X] T049 [P] Update PromptVariantsList (used by PromptOptimizerField) to use 2-column grid layout in src/components/Studio/PromptVariantsList.tsx:
  - Component hierarchy: PromptOptimizerField → PromptOptimizationSection → PromptVariantsList
  - Change the variants container from `flexDirection: 'column'` to CSS Grid
  - Use `display: 'grid'`, `gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))'`
  - Responsive: 1 column on narrow screens, 2 columns on wider screens
  - Maintain consistent gap between cards

- [X] T050 [P] Reduce padding/margins in PromptVariantCard (rendered inside PromptOptimizerField) for denser layout in src/components/Studio/PromptVariantCard.tsx:
  - Component hierarchy: PromptOptimizerField → PromptVariantsList → PromptVariantCard
  - Reduce card padding from `calc(var(--base) * 0.75)` to `calc(var(--base) * 0.5)`
  - Reduce gap between header and content sections
  - Reduce margin between label and textarea
  - Ensure text remains readable at smaller spacing

- [X] T051 [P] Collapse "Suggested Negative Prompt" section by default in PromptVariantCard (rendered inside PromptOptimizerField) in src/components/Studio/PromptVariantCard.tsx:
  - Component hierarchy: PromptOptimizerField → PromptVariantsList → PromptVariantCard
  - Add local state `isNegativePromptExpanded` (default: false)
  - Replace static negative prompt display with collapsible section
  - Add toggle button/chevron icon to expand/collapse
  - Show "Negative prompt available" hint when collapsed
  - Animate expand/collapse transition

- [X] T052 [P] Add character count display to each variant card in PromptVariantCard (rendered inside PromptOptimizerField) in src/components/Studio/PromptVariantCard.tsx:
  - Component hierarchy: PromptOptimizerField → PromptVariantsList → PromptVariantCard
  - Display character count next to the "Expanded Prompt" label
  - Format: "X chars"
  - Use muted styling (small font, gray color) to not distract
  - Update count reactively as user edits the prompt

- [X] T053 [P] Add color-coded left border to variant cards by type in PromptVariantCard (rendered inside PromptOptimizerField) in src/components/Studio/PromptVariantCard.tsx:
  - Component hierarchy: PromptOptimizerField → PromptVariantsList → PromptVariantCard
  - Create a color mapping for variant names (e.g., Realistic=blue, Artistic=purple, Cinematic=amber, Abstract=teal, Surreal=pink)
  - Add 4px left border with the mapped color
  - Use a fallback color (gray) for unknown variant types
  - Ensure colors have sufficient contrast in both light and dark themes

**Checkpoint**: Task creation page is optimized with better defaults (nano-banana model, 9:16 aspect ratio), cleaner form (no Total Expected field), persistent submit button state, properly focused confirmation dialog, and improved Generated Variants UI (2-column layout, compact cards, collapsible negative prompts, character counts, color-coded borders).

---

## Phase 9: User Story 5 - Asset Gallery and Management (Priority: P2)

**Goal**: Admin can browse generated images in a visual gallery with filtering, search, and download capabilities

**Independent Test**: Generate images and verify they appear in the gallery with proper masonry layout, metadata display, and download functionality

**Unit Tests**: NOT required (UI components with library-based rendering)
**Integration Tests**: Already covered by media endpoints in Phase 3

**Gate Criteria**: Gallery renders 500+ images without performance issues, manual testing passes

### Implementation for User Story 5

- [ ] T048 [US5] Create Gallery custom admin view in src/components/Gallery/index.tsx with masonry layout using Masonic library
- [ ] T049 [P] [US5] Create GalleryFilters component in src/components/Gallery/GalleryFilters.tsx with taskId, styleId, modelId filters
- [ ] T050 [P] [US5] Create ImageLightbox component in src/components/Gallery/ImageLightbox.tsx showing full-size image with generation metadata panel
- [ ] T051 [US5] Implement virtual scrolling in Gallery component for 500+ items performance (FR-024)
- [ ] T052 [US5] Create batch download functionality in src/components/Gallery/BatchDownload.tsx with selection and ZIP generation
- [ ] T053 [US5] Add Gallery to Payload admin panel navigation in payload.config.ts admin.components configuration

**Checkpoint**: Gallery complete - admin can browse, filter, view details, and download generated assets.

---

## Phase 10: User Story 6 - Multi-Model Comparison (Priority: P3)

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

## Phase 11: User Story 7 - Dashboard Overview (Priority: P3)

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

## Phase 12: Studio Workspace UI (Supporting All Stories)

**Goal**: Create the main Studio workspace UI that ties together task creation, prompt optimization, and generation

**Unit Tests**: NOT required (UI components)
**Integration Tests**: NOT required (uses already-tested endpoints)

**Gate Criteria**: Studio workflow functions end-to-end, manual testing passes

**Note**: SubjectInput and PromptPreview components moved to Phase 4 (User Story 2) for prompt optimization workflow

### Implementation for Studio Workspace

- [ ] T062 Create Studio custom admin view in src/components/Studio/index.tsx as the main generation workspace (integrates Phase 4 prompt components)
- [ ] T064 [P] Create StyleSelector component in src/components/Studio/StyleSelector.tsx with multi-select grid and preview thumbnails
- [ ] T065 [P] Create ModelSelector component in src/components/Studio/ModelSelector.tsx with provider grouping and feature badges
- [ ] T066 [P] Create BatchConfig component in src/components/Studio/BatchConfig.tsx with countPerPrompt input and total calculation display
- [ ] T068 Implement task submission flow in src/components/Studio/index.tsx with confirmation dialog when total > 500
- [ ] T069 Add Studio to Payload admin panel navigation in payload.config.ts admin.components configuration

**Checkpoint**: Studio workspace complete - admin has a unified interface for the entire generation workflow.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

**Unit Tests**: NOT required (configuration and polish tasks)
**Integration Tests**: NOT required

**Gate Criteria**: Full test suite passes, quickstart.md validation passes

- [ ] T070 Add admin panel left navigation with Dashboard, Studio, Task Manager, Gallery, and Configuration Center in payload.config.ts (FR-026)
- [ ] T071 [P] Create MongoDB indexes per data-model.md specifications in src/seed/indexes.ts
- [ ] T072 [P] Add input validation across all collections using Payload field validation
- [ ] T073 Implement configurable warning threshold (default 500) for large batch submissions
- [ ] T074 Add error boundary and loading states to all custom admin components
- [ ] T075 Run quickstart.md validation to ensure all documented workflows function correctly
- [ ] T075a Run full test suite (pnpm test) and verify all tests pass with no regressions

---

## Phase 14: Video Generation - Veo (DEFERRED - Lowest Priority)

**Purpose**: Video generation capability using Google Veo - explicitly deferred per clarification

**DEFERRED**: Video generation is not required for initial release. Focus on image generation first.

**Implementation Criteria**: Begin Phase 14 implementation ONLY when ALL of the following conditions are met:
1. All image generation phases (1-13) are complete with passing tests
2. Core image generation workflows are stable in production for at least 2 weeks
3. Explicit stakeholder request or business requirement for video generation
4. Google Veo API is generally available (not preview/beta) with documented SLAs

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
- **Task Creation Optimization (Phase 5)**: Depends on Phase 4 (prompt expansion UI components)
  - **Gate**: Manual testing passes for calculated prompts and total image count
- **User Stories 3-7 (Phases 6-11)**: All depend on Phase 3 completion but can proceed in parallel
  - **Gate**: Relevant integration tests MUST pass for each story
- **Task Creation Page & Workflow Optimization (Phase 8)**: Depends on Phase 7 (US4 Task Monitoring)
  - **Gate**: Manual testing passes for all UI improvements
- **Studio UI (Phase 12)**: Depends on Phases 3-6 for full functionality
- **Polish (Phase 13)**: Depends on all desired user stories being complete
  - **Gate**: Full test suite MUST pass
- **Video/Veo (Phase 14)**: DEFERRED - Lowest priority, implement only after all image generation features are complete

### User Story Dependencies

- **User Story 1 (P1)**: Core foundation - No dependencies on other stories
- **User Story 2 (P1)**: Builds on US1's expand-prompt job infrastructure
- **Task Creation Optimization (Phase 5)**: Builds on US2's prompt expansion UI
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
- Once Phase 3 completes, Phases 6-11 can run in parallel (if team capacity allows)
- Phase 5 tasks T038o (CalculatedPromptCard), T038q (TotalImageCount), T038v (SelectedSettingsSummary), T038w (PromptsCountSummary), T038x (ImageCountSummary), and T038y (TaskSummaryStats) can run in parallel
- Phase 5 UI Enhancement tasks T038ad (OverviewCard) and T038ae (InfoRow) can run in parallel after T038ab (title) and T038ac (grid layout)
- Phase 5 Style DB Migration tasks T038ag (getStylesFromDB), T038ak (endpoint update), T038am (seed all styles) can run in parallel
- Phase 5 Style DB Migration cleanup tasks T038ao (remove import) can run in parallel with T038an (remove TS file) after confirming migration works
- Phase 5 Imported Style Ids task T038ar (useStyleOptions hook) can run in parallel with T038aq (StyleSelector update)
- Phase 5 UI optimization tasks T038ad (SelectedSettingsSummary borderless), T038ae (PromptsCountSummary borderless), T038af (ImageCountSummary borderless), and T038ag (TaskSummaryStats borderless) can run in parallel
- Phase 5 Submit Button tasks T038av (SubmitConfirmationDialog), T038az (SubmitSuccessMessage), and T038ba (SubmitErrorMessage) can run in parallel
- Phase 7 tests T043a (task-manager unit), T043b (task-cancel integration), T043c (subtask-retry integration) can run in parallel
- Phase 7 type updates T043d (TaskStatus Cancelled) and T043e (SubTaskStatus Cancelled) can run in parallel
- Phase 7 UI components T043k (TaskFilters), T043l (TaskList), T043m (TaskDetail), and T043n (SubTaskList) can run in parallel
- Phase 7 Image Storage tasks T043q (unit tests) and T043w (integration tests) can run in parallel
- Phase 7 Directory Setup tasks T043s (.gitkeep) and T043t (.gitignore) can run in parallel
- Phase 7 Image Storage Optimization tasks T043z (unit test updates) and T043za (integration test updates) can run in parallel
- Phase 8 Default Value tasks T045 (models default) and T046 (aspect ratio default) can run in parallel
- Phase 8 Prompt Variants UI tasks T049 (2-column grid), T050 (reduce padding), T051 (collapse negative prompt), T052 (character count), and T053 (color-coded borders) can run in parallel

---

## Test Summary by Phase

| Phase | Unit Tests | Integration Tests | Contract Tests | Gate Criteria |
|-------|------------|-------------------|----------------|---------------|
| Phase 1: Setup | - | - | - | Project builds, test infra ready |
| Phase 2: Foundational | T010a, T011a, T013a, T014a, T015a | - | T016a | All unit + contract tests pass |
| Phase 3: US1 | T020a, T020b, T020c, T033b, T033k | T020d, T020e, T020f, T033h | - | All tests pass |
| Phase 4: US2 | T033a, T038e | T037a | - | All tests pass, UI functional |
| Phase 5: Task Creation Optimization | T038ap | - | - | Manual testing + unit tests pass, submit button functional |
| Phase 6: US3 | - | T038a | - | Integration tests pass |
| Phase 7: US4 | T043a, T043q | T043b, T043c, T043w | - | All tests pass, UI functional, image storage works |
| Phase 8: Page & Workflow Optimization | - | - | - | Manual testing |
| Phase 9: US5 | - | - | - | Manual testing |
| Phase 10: US6 | - | - | - | Manual testing |
| Phase 11: US7 | - | - | - | Manual testing |
| Phase 12: Studio | - | - | - | Manual testing |
| Phase 13: Polish | - | - | - | Full suite passes |
| Phase 14: Veo | T076a | - | - | (Deferred) |

**Total Test Tasks**: 23 (13 unit, 9 integration, 1 contract)

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch all adapters and their tests together:
Task: "Implement Flux adapter in src/adapters/flux.ts"
Task: "Write unit tests for Flux adapter in tests/unit/adapters/flux.adapter.test.ts"
Task: "Implement DALL-E 3 adapter in src/adapters/dalle.ts"
Task: "Write unit tests for DALL-E adapter in tests/unit/adapters/dalle.adapter.test.ts"
Task: "Implement Nano Banana adapter in src/adapters/nano-banana.ts"
Task: "Write unit tests for Nano Banana adapter in tests/unit/adapters/nano-banana.adapter.test.ts"

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

## Parallel Example: User Story 4 (Phase 7)

```bash
# Launch all US4 tests together:
Task: "Write unit tests for task-manager service in tests/unit/services/task-manager.test.ts"
Task: "Write integration tests for task-cancel endpoint in tests/integration/endpoints/task-cancel.integration.test.ts"
Task: "Write integration tests for subtask-retry endpoint in tests/integration/endpoints/subtask-retry.integration.test.ts"

# Launch type updates together:
Task: "Add Cancelled status to TaskStatus enum in src/lib/types.ts"
Task: "Add Cancelled status to SubTaskStatus enum in src/lib/types.ts"

# Launch UI components together:
Task: "Create TaskFilters component in src/app/(payload)/admin/[[...segments]]/custom/task-manager/TaskFilters.tsx"
Task: "Create TaskList component in src/app/(payload)/admin/[[...segments]]/custom/task-manager/TaskList.tsx"
Task: "Create TaskDetail component in src/app/(payload)/admin/[[...segments]]/custom/task-manager/TaskDetail.tsx"
Task: "Create SubTaskList component in src/app/(payload)/admin/[[...segments]]/custom/task-manager/SubTaskList.tsx"
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
5. Complete Phase 5: Task Creation Optimization (Calculated Prompts Preview)
   - **MANUAL TEST**: Verify calculated prompts and total image count display
6. **STOP and VALIDATE**: Test core generation workflow end-to-end
7. Deploy/demo if ready - Admin can now generate AI images with full visibility

### Incremental Delivery

1. Complete Setup + Foundational + Tests -> Foundation ready
2. Add User Story 1 + Tests -> Test independently -> Deploy/Demo (Core MVP!)
3. Add User Story 2 + Tests -> Test independently -> Deploy/Demo (Enhanced prompts)
4. Add Phase 5 (Task Creation Optimization) -> Test independently -> Deploy/Demo (Calculated prompts preview)
5. Add User Stories 3-5 + Tests -> Test independently -> Deploy/Demo (Management features)
6. Add User Stories 6-7 -> Test independently -> Deploy/Demo (Advanced features)
7. Add Phase 8 (Page & Workflow Optimization) -> Test independently -> Deploy/Demo (Better defaults and UX)
8. Add Studio UI -> Test independently -> Deploy/Demo (Unified experience)
9. Each story adds value without breaking previous stories

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
- **Video generation (Veo) is DEFERRED** - Phase 14 is lowest priority; focus on image generation first
- **LLM Provider Strategy**: Start with Gemini 3 Flash Preview (`gemini-3-flash-preview`) for prompt expansion; the abstraction layer (T035a) enables future expansion to ChatGPT (GPT-4o) and Claude (Claude 3.5 Sonnet) without refactoring. Supports configurable thinking levels for latency optimization.
- **Testing Tools**: Vitest + Testing Library + MongoDB Memory Server per plan.md
