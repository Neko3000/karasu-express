<!--
Sync Impact Report
==================
Version change: 1.2.0 → 1.5.0
Modified principles:
  - None renamed
Added sections:
  - Expanded Technology Stack table with detailed version pinning
  - Added UI Component Libraries subsection (shadcn/ui, Lucide React, LightGallery)
  - Added AI Services subsection (LLM Prompt Optimization, Image Generation providers)
Changes in 1.4.0:
  - Replaced FontAwesome with Lucide React (via shadcn/ui) as icon library
Changes in 1.5.0:
  - Added Principle VIII: Dependency-First Development (依赖优先开发)
  - UI resolution order: PayloadCMS → shadcn/ui → Custom
  - Icon resolution order: Lucide React → Custom SVG (with justification)
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ No updates needed (Technical Context already captures stack)
  - .specify/templates/spec-template.md: ✅ No updates needed (technology-agnostic by design)
  - .specify/templates/tasks-template.md: ✅ No updates needed (task structure unchanged)
Follow-up TODOs: None
-->

# Karasu-Express Constitution

## Core Principles

### I. Payload Native (框架原生优先)

**Non-Negotiable Rules:**
- All async task management MUST use PayloadCMS v3 native Jobs Queue system
- MUST NOT introduce external queue systems (Redis, RabbitMQ, Celery) unless Jobs Queue proves insufficient with documented evidence
- Admin panel customization MUST use Payload's React component replacement mechanism
- Server Actions MUST call `payload.jobs.queue()` directly for task submission

**Rationale:** PayloadCMS v3's native Jobs system provides persistent queuing, retry mechanisms,
cron scheduling, and admin visualization without external dependencies. Leveraging native features
reduces operational complexity and maintenance burden.

### II. Infrastructure Minimalism (基础设施极简)

**Non-Negotiable Rules:**
- MongoDB MUST be the single data store for business data, task state, and execution logs
- MUST NOT add infrastructure components without explicit justification in Complexity Tracking
- Configuration (task definitions, retry strategies, rate limits) MUST be declared in `payload.config.ts`
- New dependencies MUST demonstrate clear necessity over existing native capabilities

**Rationale:** A unified data layer simplifies deployment, reduces failure points, and enables
consistent querying across business entities and job metadata. The system targets small-to-medium
scale operations where MongoDB's performance is sufficient.

### III. Async-First Architecture (异步优先架构)

**Non-Negotiable Rules:**
- All AI generation operations (LLM expansion, image generation, video generation) MUST be async
- Frontend MUST NOT wait for generation results; use polling or WebSocket for status updates
- Long-running operations MUST implement proper timeout handling and state tracking
- Worker processes MUST be separable from web server processes for production deployment

**Rationale:** AI generation tasks have unpredictable latency (seconds to minutes). Async
architecture prevents request timeouts, enables horizontal scaling of workers, and isolates
failures from user-facing services.

### IV. Heterogeneous API Abstraction (异构API抽象)

**Non-Negotiable Rules:**
- Each AI provider (Flux, DALL-E, Nano Banana, Veo) MUST have a dedicated adapter implementing a common interface
- `request_payload` and `response_data` fields MUST use JSON/Mixed type for schema-less storage
- API rate limiting MUST be configured per-provider via queue `limit` settings
- Provider-specific error codes MUST be normalized to system-standard error categories

**Rationale:** Different AI providers have vastly different API schemas, authentication methods,
and response formats. A unified abstraction layer enables model switching, A/B testing, and
future provider additions without core logic changes.

### V. Observability by Default (可观测性优先)

**Non-Negotiable Rules:**
- All SubTask executions MUST log request payload, response data, and error details
- Task progress MUST be queryable in real-time (percentage completion, sub-task status)
- Failed tasks MUST retain full error context for debugging (API error codes, rate limit info)
- Admin panel MUST expose job queue status (pending, running, failed counts)

**Rationale:** AI generation failures are common (rate limits, content moderation, API outages).
Rich observability enables rapid debugging, cost tracking, and system health monitoring. Users
need visibility into generation progress for large batch operations.

### VI. Testing Discipline (测试纪律)

**Non-Negotiable Rules:**
- Unit tests MUST be written for all utility functions, service methods, and adapter logic
- Integration tests MUST be written for all Job task handlers and API endpoint flows
- Tests MUST be run and pass before any code is committed to the repository
- New features MUST include corresponding test coverage; PRs without tests for new logic MUST be rejected
- Test failures MUST block progressive implementation; broken tests MUST be fixed before proceeding
- Mock external dependencies (AI providers, database) in unit tests to ensure isolation
- Test naming MUST follow pattern: `[module].test.ts` for unit tests, `[flow].integration.test.ts` for integration tests

**Rationale:** Progressive implementation without proper testing leads to cascading errors that
are expensive to debug. Unit tests catch logic errors early at the function level. Integration
tests validate system behavior across component boundaries. Enforcing test-first or test-alongside
development ensures that each implementation phase produces verifiable, working code before
advancing to dependent phases.

### VII. Admin Panel UI Standards (管理面板UI标准)

**Non-Negotiable Rules:**

#### Heading Hierarchy

All admin panel sections MUST follow this heading hierarchy with consistent styling:

| Level | Element | Font Size | Font Weight | Use Case |
|-------|---------|-----------|-------------|----------|
| H1 | `<h1>` | `text-2xl` (1.5rem/24px) | `font-bold` (700) | Page title, main view header |
| H2 | `<h2>` | `text-xl` (1.25rem/20px) | `font-semibold` (600) | Major section headers |
| H3 | `<h3>` | `text-lg` (1.125rem/18px) | `font-medium` (500) | Subsection headers |
| H4 | `<h4>` | `text-base` (1rem/16px) | `font-medium` (500) | Minor groupings, field group labels |

- Heading levels MUST NOT be skipped (e.g., H1 → H3 without H2 is forbidden)
- Each heading MUST include appropriate margin: H1 (`mb-6`), H2 (`mb-4`), H3 (`mb-3`), H4 (`mb-2`)
- Dark mode variants MUST use `text-gray-100` for H1/H2, `text-gray-200` for H3/H4

#### Section Dividers

- Dividers MUST only appear between major sections (H2-level sections)
- Dividers MUST NOT appear between subsections (H3/H4) or between individual fields
- Divider styling: `border-t border-gray-200 dark:border-gray-700` with `my-6` spacing
- Dividers MUST have equal spacing above and below

#### Section Organization

- Each major section (H2) MUST be a logical grouping of related functionality
- Subsections (H3) MUST group related fields or controls within a section
- Field groups (H4) MAY be used for closely related field clusters (e.g., "Address" grouping street, city, zip)
- Empty sections MUST be hidden, not displayed with placeholder text

#### Form Fields

- Labels MUST use `text-sm font-medium text-gray-700 dark:text-gray-300`
- Labels MUST appear above their associated input with `mb-2` spacing
- Required field indicators MUST use red asterisk: `<span className="text-red-500">*</span>`
- Help text MUST appear below inputs with `text-sm text-gray-500 dark:text-gray-400 mt-1`
- Field groups MUST have consistent vertical spacing: `space-y-4` between fields

#### Spacing Standards

| Context | Spacing |
|---------|---------|
| After H1 (page header) | `mb-6` |
| After H2 (section header) | `mb-4` |
| After H3 (subsection header) | `mb-3` |
| After H4 (field group header) | `mb-2` |
| Between major sections | `my-6` (with divider) |
| Between subsections | `mt-6` |
| Between fields | `space-y-4` |
| Between label and input | `mb-2` |

**Rationale:** Consistent UI standards across admin panels reduce cognitive load for users and
development friction when creating new views. A clear heading hierarchy with predictable spacing
creates visual rhythm that guides users through complex forms. Limiting dividers to major
sections prevents visual clutter while maintaining clear content separation.

### VIII. Dependency-First Development (依赖优先开发)

**Non-Negotiable Rules:**
- Before writing any component or UI code, MUST check existing dependencies for available solutions in the following resolution order
- MUST NOT introduce custom implementations when an approved dependency already provides the needed functionality
- MUST NOT add new UI or icon dependencies without documenting why the approved stack is insufficient

#### UI Component Resolution Order

When implementing any UI element, MUST check for an existing solution in this order:

| Priority | Source | When to Use |
|----------|--------|-------------|
| 1st | PayloadCMS built-in components | Admin panel primitives (buttons, fields, modals, navigation) already provided by Payload |
| 2nd | shadcn/ui | General-purpose UI components (dialogs, dropdowns, tabs, cards, badges, tooltips, etc.) |
| 3rd | Custom implementation | Only when neither PayloadCMS nor shadcn/ui provides the needed component |

#### Icon Resolution Order

When using icons, MUST use Lucide React (shadcn/ui's icon library):

| Priority | Source | When to Use |
|----------|--------|-------------|
| 1st | Lucide React (via shadcn/ui) | All icon needs — this is the single approved icon library |
| 2nd | Custom SVG | Only when Lucide React does not have a suitable icon, with documented justification |

#### Verification Gate

- Before writing UI code, developer MUST search the approved dependency's documentation/API for existing components
- If a custom component is created that duplicates approved dependency functionality, it MUST be flagged in code review and replaced
- New third-party UI or icon libraries MUST NOT be added to `package.json` without a Complexity Tracking entry justifying why the approved stack is insufficient

**Rationale:** Reusing approved dependencies ensures visual consistency, reduces bundle size, and
prevents fragmentation across the codebase. Checking dependencies before coding avoids wasted
effort building components that already exist. A strict resolution order eliminates ambiguity
about which library to reach for first.

## Technical Constraints

### Technology Stack

| Layer | Choice | Version | Justification |
|-------|--------|---------|---------------|
| Framework | PayloadCMS + Next.js (App Router) | v3.68.3 / 15.4.9 | Native Jobs Queue, Server Components integration |
| Frontend | React | 19.2.1 | Latest stable, concurrent features |
| Styling | TailwindCSS (scoped with `.twp`) | 4.1.18 | Isolation from Payload Admin styles |
| Language | TypeScript (strict mode) | 5.7.3 | Type safety, latest language features |
| Database | MongoDB (via @payloadcms/db-mongodb) | - | Document model suits heterogeneous payloads, native Jobs backend |
| Testing | Vitest + Testing Library | - | Fast unit tests, React component testing, TypeScript native |

### UI Component Libraries

| Category | Library | Purpose |
|----------|---------|---------|
| Component System | shadcn/ui | Accessible, customizable UI primitives |
| Icons | Lucide React (via shadcn/ui) | Comprehensive icon set |
| Gallery | LightGallery | Image/video gallery with lightbox |

### AI Services

| Category | Provider(s) | Purpose |
|----------|-------------|---------|
| LLM Prompt Optimization | Gemini 3 Flash Preview (Primary) | Prompt enhancement and expansion |
| Image Generation | Flux (Fal.ai), DALL-E 3 (OpenAI), Nano Banana (Google AI) | Multi-provider image generation with fallback |

### Performance Requirements

- SubTask queue processing: MUST support rate-limited execution (configurable per-provider)
- Asset gallery: MUST use virtualization for 500+ items (Masonry + virtual scroll)
- Task status polling: SHOULD update within 5 seconds of state change
- Test suite execution: SHOULD complete in under 60 seconds for unit tests

### Security Requirements

- AI API keys MUST be stored server-side only, never exposed to frontend
- Generated assets MUST be uploaded to OSS with standardized naming convention
- NSFW content flags from providers MUST be captured and actionable

## Development Workflow

### Code Quality Gates

1. **Type Safety:** TypeScript strict mode enabled; no `any` types without explicit justification
2. **Unit Testing:** MUST write unit tests for all service methods, utility functions, and adapter logic; tests MUST pass before commit
3. **Integration Testing:** MUST write integration tests for Job task handlers and API endpoints; tests MUST verify end-to-end behavior
4. **Test Coverage:** New code MUST have corresponding tests; PRs adding logic without tests MUST be rejected
5. **Test-First Implementation:** When implementing features progressively, tests for the current phase MUST pass before advancing
6. **API Contracts:** New endpoints MUST have OpenAPI/TypeDoc documentation
7. **UI Consistency:** Admin panel views MUST comply with Principle VII heading hierarchy and spacing standards

### Testing Strategy

1. **Unit Tests (`tests/unit/`):**
   - Test individual functions and methods in isolation
   - Mock all external dependencies (database, APIs, file system)
   - Focus on edge cases, error handling, and boundary conditions
   - MUST run fast (< 100ms per test)

2. **Integration Tests (`tests/integration/`):**
   - Test component interactions and data flow
   - Use test database instances (MongoDB Memory Server or dedicated test DB)
   - Verify Job task handlers execute correctly
   - Test API endpoint request/response cycles

3. **Contract Tests (`tests/contract/`):**
   - Validate API response schemas match documented contracts
   - Ensure AI provider adapters conform to common interface

### Progressive Implementation Testing

When implementing features in phases:
1. Phase N tests MUST be written before or during Phase N implementation
2. All Phase N tests MUST pass before Phase N+1 begins
3. Regression: All previous phase tests MUST continue passing
4. If tests fail during implementation, STOP and fix before proceeding

### Change Process

1. Feature changes MUST reference a spec document
2. Schema changes to `Tasks`, `SubTasks`, or `Assets` collections MUST include migration plan
3. New AI provider integrations MUST include adapter, rate limit configuration, error mapping, AND unit tests for adapter logic
4. Admin panel views MUST be reviewed for Principle VII compliance before merge

### Commit Conventions

- Commits MUST follow Conventional Commits format
- Breaking changes MUST be marked with `BREAKING CHANGE:` footer
- Test-only commits SHOULD use `test:` prefix
- UI-only commits SHOULD use `style:` prefix when only styling changes are made

## Governance

### Constitutional Authority

This constitution supersedes all other development practices for Karasu-Express. Any deviation
MUST be documented in the Complexity Tracking section of the relevant plan document.

### Amendment Process

1. Propose amendment with rationale in a dedicated PR
2. Document impact on existing code and required migrations
3. Update version number according to semantic versioning:
   - MAJOR: Backward-incompatible principle changes or removals
   - MINOR: New principles or expanded guidance
   - PATCH: Clarifications and wording improvements

### Compliance Review

- All PRs MUST verify compliance with Core Principles
- Constitution Check in plan-template.md MUST be completed before implementation
- Violations MUST be justified in Complexity Tracking or rejected
- PRs without adequate test coverage MUST be rejected per Principle VI
- Admin panel PRs MUST verify UI Standards compliance per Principle VII

**Version**: 1.5.0 | **Ratified**: 2025-12-15 | **Last Amended**: 2026-02-06
