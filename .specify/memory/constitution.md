<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0
Modified principles:
  - None renamed
Added sections:
  - Core Principle VI: Testing Discipline (测试纪律)
  - Enhanced Code Quality Gates with testing requirements
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ No updates needed (Constitution Check section exists, testing in Technical Context)
  - .specify/templates/spec-template.md: ✅ No updates needed (User Scenarios & Testing section exists)
  - .specify/templates/tasks-template.md: ✅ No updates needed (test-first approach already documented)
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

## Technical Constraints

### Technology Stack

| Layer | Choice | Justification |
|-------|--------|---------------|
| Framework | PayloadCMS v3 (Next.js App Router) | Native Jobs Queue, Server Components integration |
| Database | MongoDB | Document model suits heterogeneous payloads, native Jobs backend |
| Styling | TailwindCSS (scoped with `.twp`) | Isolation from Payload Admin styles |
| AI Providers | Flux, DALL-E 3, Nano Banana, Veo | Coverage of image/video generation use cases |
| Testing | Vitest + Testing Library | Fast unit tests, React component testing, TypeScript native |

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

### Commit Conventions

- Commits MUST follow Conventional Commits format
- Breaking changes MUST be marked with `BREAKING CHANGE:` footer
- Test-only commits SHOULD use `test:` prefix

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

**Version**: 1.1.0 | **Ratified**: 2025-12-15 | **Last Amended**: 2025-12-17
