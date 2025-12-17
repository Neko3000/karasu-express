# Implementation Plan: AI Content Generation Studio

**Branch**: `001-ai-content-studio` | **Date**: 2025-12-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-content-studio/spec.md`

## Summary

Build an enterprise-grade AI content generation platform using PayloadCMS v3 with native Jobs Queue for async task processing. The system transforms creative themes into high-throughput batch image generation across multiple AI providers (Flux, DALL-E 3, Nano Banana), with intelligent prompt optimization, style templates, and comprehensive asset management.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: PayloadCMS v3 (Next.js App Router), React 18+, TailwindCSS (scoped with `.twp`)
**Storage**: MongoDB (single data store per Constitution Principle II)
**Testing**: Vitest + Testing Library (per Constitution Principle VI)
**Target Platform**: Node.js 18+ server, Modern browsers (Chrome, Firefox, Safari)
**Project Type**: Web application (PayloadCMS monolith with custom admin views)
**Performance Goals**: 500+ images per batch, <5 second status polling updates, virtualized gallery for 500+ items
**Constraints**: Rate-limited per AI provider, async-first architecture (no blocking on generation)
**Scale/Scope**: Single Admin user, internal enterprise use

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Payload Native (框架原生优先) ✅

| Rule | Compliance |
|------|------------|
| All async task management MUST use PayloadCMS v3 native Jobs Queue | ✅ Using `payload.jobs.queue()` for prompt expansion and image generation |
| MUST NOT introduce external queue systems | ✅ No Redis/RabbitMQ/Celery |
| Admin panel customization MUST use Payload's React component replacement | ✅ Custom views via admin panel API |
| Server Actions MUST call `payload.jobs.queue()` directly | ✅ Task submission via Server Actions |

### Principle II: Infrastructure Minimalism (基础设施极简) ✅

| Rule | Compliance |
|------|------------|
| MongoDB MUST be single data store | ✅ MongoDB for Tasks, SubTasks, Assets, Jobs |
| MUST NOT add infrastructure without justification | ✅ No new infrastructure added |
| Configuration MUST be in `payload.config.ts` | ✅ Jobs, queues, rate limits configured in config |
| New dependencies MUST demonstrate clear necessity | ✅ All deps serve specific, documented purposes |

### Principle III: Async-First Architecture (异步优先架构) ✅

| Rule | Compliance |
|------|------------|
| All AI generation operations MUST be async | ✅ Jobs Queue handles all generation |
| Frontend MUST NOT wait for generation results | ✅ Polling-based progress updates |
| Long-running operations MUST implement timeout handling | ✅ Job retry with configurable timeout |
| Worker processes MUST be separable from web server | ✅ `payload jobs:run` as separate process |

### Principle IV: Heterogeneous API Abstraction (异构API抽象) ✅

| Rule | Compliance |
|------|------------|
| Each AI provider MUST have dedicated adapter | ✅ FluxAdapter, DalleAdapter, NanoBananaAdapter |
| `request_payload` and `response_data` MUST use JSON/Mixed type | ✅ Schema-less JSON fields in SubTask |
| API rate limiting MUST be per-provider via queue `limit` | ✅ Separate queue limits per provider |
| Provider errors MUST normalize to system categories | ✅ ErrorCategory enum with retryable flags |

### Principle V: Observability by Default (可观测性优先) ✅

| Rule | Compliance |
|------|------------|
| All SubTask executions MUST log request/response/error | ✅ `requestPayload`, `responseData`, `errorLog` fields |
| Task progress MUST be queryable in real-time | ✅ `progress` percentage field with polling |
| Failed tasks MUST retain full error context | ✅ `errorCategory`, `errorLog`, provider codes |
| Admin panel MUST expose job queue status | ✅ PayloadCMS native job queue visualization |

### Principle VI: Testing Discipline (测试纪律) ✅

| Rule | Compliance |
|------|------------|
| Unit tests MUST be written for all utility functions, service methods, adapter logic | ✅ Vitest tests for adapters, utilities, services |
| Integration tests MUST be written for all Job task handlers and API endpoints | ✅ Integration tests with MongoDB Memory Server |
| Tests MUST run and pass before code is committed | ✅ Pre-commit hook validates test pass |
| New features MUST include corresponding test coverage | ✅ Tests required for all new logic |
| Test failures MUST block progressive implementation | ✅ Phase N+1 blocked until Phase N tests pass |
| Mock external dependencies in unit tests | ✅ AI providers mocked in unit tests |
| Test naming: `[module].test.ts` for unit, `[flow].integration.test.ts` for integration | ✅ Naming convention enforced |

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-content-studio/
├── plan.md              # This file
├── research.md          # Phase 0 output - technology decisions
├── data-model.md        # Phase 1 output - entity definitions
├── quickstart.md        # Phase 1 output - setup guide
├── contracts/           # Phase 1 output - API contracts
│   ├── openapi.yaml     # REST API specification
│   └── types.ts         # TypeScript type definitions
└── tasks.md             # Phase 2 output - implementation tasks
```

### Source Code (repository root)

```text
src/
├── adapters/            # AI provider adapters (Flux, DALL-E, Nano Banana)
│   ├── types.ts         # Common adapter interface
│   ├── flux.adapter.ts  # Fal.ai Flux implementation
│   ├── dalle.adapter.ts # OpenAI DALL-E 3 implementation
│   ├── nano-banana.adapter.ts # Google Imagen 3 implementation
│   └── index.ts         # Adapter registry
├── app/                 # Next.js App Router pages
│   └── (payload)/       # Payload admin views
├── collections/         # PayloadCMS collections
│   ├── Tasks/           # Parent task collection
│   ├── SubTasks/        # Atomic execution unit collection
│   ├── StyleTemplates/  # Style template collection
│   ├── ModelConfigs/    # AI provider config collection
│   └── Media/           # Generated assets upload collection
├── components/          # React components
│   └── studio/          # Studio workspace components
├── endpoints/           # Custom API endpoints
├── jobs/                # PayloadCMS job handlers
│   ├── expand-prompt.ts # LLM prompt expansion job
│   └── generate-image.ts # Image generation job
├── lib/                 # Utility functions
│   ├── prompt-merger.ts # Style + prompt merging
│   ├── task-fission.ts  # Task decomposition
│   └── error-normalizer.ts # Error categorization
├── services/            # Business logic services
│   └── task-service.ts  # Task orchestration
├── payload.config.ts    # PayloadCMS configuration
└── payload-types.ts     # Generated types

tests/
├── unit/                # Unit tests (isolated, mocked)
│   ├── adapters/        # Adapter unit tests
│   │   ├── flux.adapter.test.ts
│   │   ├── dalle.adapter.test.ts
│   │   └── nano-banana.adapter.test.ts
│   ├── lib/             # Utility function tests
│   │   ├── prompt-merger.test.ts
│   │   ├── task-fission.test.ts
│   │   └── error-normalizer.test.ts
│   └── services/        # Service method tests
│       └── task-service.test.ts
├── integration/         # Integration tests (real DB, mocked APIs)
│   ├── jobs/            # Job handler tests
│   │   ├── expand-prompt.integration.test.ts
│   │   └── generate-image.integration.test.ts
│   └── endpoints/       # API endpoint tests
│       ├── tasks.integration.test.ts
│       └── studio.integration.test.ts
├── contract/            # Contract tests (API schema validation)
│   └── adapters.contract.test.ts
└── e2e/                 # End-to-end tests
    └── studio-workflow.e2e.test.ts
```

**Structure Decision**: PayloadCMS monolith with custom admin views. All source code in `src/`, tests mirror source structure in `tests/` with unit/integration/contract/e2e separation per Constitution Principle VI.

## Testing Strategy (Constitution Principle VI)

### Test Categories

| Category | Location | Purpose | Dependencies |
|----------|----------|---------|--------------|
| Unit | `tests/unit/` | Isolated function/method testing | Mocked (vi.mock) |
| Integration | `tests/integration/` | Component interaction testing | MongoDB Memory Server |
| Contract | `tests/contract/` | API schema validation | Mocked providers |
| E2E | `tests/e2e/` | Full workflow validation | Running dev server |

### Test Requirements per Module

| Module | Unit Tests | Integration Tests | Contract Tests |
|--------|------------|-------------------|----------------|
| Adapters (Flux, DALL-E, Nano Banana) | ✅ Required | ❌ N/A | ✅ Required |
| Lib utilities (prompt-merger, task-fission, error-normalizer) | ✅ Required | ❌ N/A | ❌ N/A |
| Services (task-service) | ✅ Required | ✅ Required | ❌ N/A |
| Jobs (expand-prompt, generate-image) | ❌ N/A | ✅ Required | ❌ N/A |
| API Endpoints | ❌ N/A | ✅ Required | ❌ N/A |
| Collections (CRUD) | ❌ N/A | ✅ Required | ❌ N/A |

### Progressive Implementation Testing

Per Constitution Principle VI:

1. **Phase N tests MUST be written before or during Phase N implementation**
2. **All Phase N tests MUST pass before Phase N+1 begins**
3. **Regression: All previous phase tests MUST continue passing**
4. **If tests fail during implementation, STOP and fix before proceeding**

### Test Commands

```bash
# Run all tests
pnpm test

# Run unit tests only (fast, < 60 seconds)
pnpm test:unit

# Run integration tests (requires MongoDB Memory Server)
pnpm test:integration

# Run contract tests
pnpm test:contract

# Run E2E tests (requires running dev server)
pnpm test:e2e

# Run tests with coverage
pnpm test:coverage

# Watch mode during development
pnpm test:watch
```

### Test Configuration (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/', '*.config.*'],
    },
    setupFiles: ['tests/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

## Complexity Tracking

> **No violations requiring justification. All principles satisfied.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Artifacts Generated

| Artifact | Status | Path |
|----------|--------|------|
| Research Document | ✅ Complete | `specs/001-ai-content-studio/research.md` |
| Data Model | ✅ Complete | `specs/001-ai-content-studio/data-model.md` |
| API Contracts | ✅ Complete | `specs/001-ai-content-studio/contracts/` |
| Quickstart Guide | ✅ Complete | `specs/001-ai-content-studio/quickstart.md` |
| Implementation Plan | ✅ Complete | `specs/001-ai-content-studio/plan.md` (this file) |

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks from this plan
2. Implementation phases will include test tasks per Constitution Principle VI
3. Each phase must pass all tests before proceeding to next phase
