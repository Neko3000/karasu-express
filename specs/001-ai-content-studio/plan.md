# Implementation Plan: AI Content Generation Studio

**Branch**: `001-ai-content-studio` | **Date**: 2025-12-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-content-studio/spec.md`

## Summary

Build an enterprise-grade AI content generation and asset management platform (Karasu-Express) that transforms creative themes into batch-generated images through intelligent prompt optimization and multi-model parallel processing. The system uses PayloadCMS v3's native Jobs Queue for async task orchestration, MongoDB for unified data storage, and implements a "multiplication fission" algorithm (prompts x styles x models x batch) to enable industrial-scale content production.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: PayloadCMS v3 (Next.js App Router), React 18+, TailwindCSS (scoped with `.twp`)
**Storage**: MongoDB (via @payloadcms/db-mongodb adapter) for business data, task state, and job queue; Object Storage (OSS/S3) for generated assets
**Testing**: Vitest for unit tests, Playwright for E2E tests, integration tests for Job handlers
**Target Platform**: Web application (Next.js), separate Worker process for production
**Project Type**: Web application (monorepo structure with PayloadCMS)
**Performance Goals**: Real-time progress updates within 10s, support 500+ image batch tasks, masonry gallery with virtual scrolling for 500+ items
**Constraints**: Rate limiting per AI provider, async-first architecture, no external queue systems
**Scale/Scope**: Internal enterprise users, 500+ image batches, multiple AI provider integrations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Payload Native (Framework Native First)

| Rule | Compliance | Evidence |
|------|------------|----------|
| All async task management MUST use PayloadCMS v3 native Jobs Queue | PASS | Using `payload.jobs.queue()` for expand-prompt and generate-image tasks |
| MUST NOT introduce external queue systems | PASS | No Redis, RabbitMQ, or Celery in architecture |
| Admin panel customization MUST use Payload's React component replacement | PASS | Custom Studio and Task Manager via Payload dashboard components |
| Server Actions MUST call `payload.jobs.queue()` directly | PASS | Task submission via Next.js Server Actions |

### II. Infrastructure Minimalism

| Rule | Compliance | Evidence |
|------|------------|----------|
| MongoDB MUST be single data store | PASS | All collections (tasks, sub-tasks, styles, assets) in MongoDB |
| MUST NOT add infrastructure without justification | PASS | Only OSS added for asset storage (required for file hosting) |
| Configuration MUST be declared in `payload.config.ts` | PASS | Job definitions, retry strategies, rate limits in config |
| New dependencies MUST demonstrate necessity | PASS | Only essential deps: PayloadCMS, MongoDB adapter, AI SDKs |

### III. Async-First Architecture

| Rule | Compliance | Evidence |
|------|------------|----------|
| All AI generation operations MUST be async | PASS | expand-prompt and generate-image are queued jobs |
| Frontend MUST NOT wait for generation results | PASS | Polling/WebSocket for status updates |
| Long-running operations MUST have timeout handling | PASS | Job retries and lock expiration in SubTask model |
| Worker processes MUST be separable | PASS | `payload jobs:run` for production workers |

### IV. Heterogeneous API Abstraction

| Rule | Compliance | Evidence |
|------|------------|----------|
| Each AI provider MUST have dedicated adapter | PASS | Adapters for Flux, DALL-E 3, Nano Banana, Veo |
| `request_payload` and `response_data` MUST use JSON | PASS | Mixed/JSON type fields in SubTask collection |
| Rate limiting MUST be per-provider | PASS | Queue `limit` settings per provider in config |
| Provider errors MUST be normalized | PASS | Error mapping in adapter layer |

### V. Observability by Default

| Rule | Compliance | Evidence |
|------|------------|----------|
| All SubTask executions MUST log payloads | PASS | request_payload and response_data persisted |
| Task progress MUST be queryable real-time | PASS | progress field and sub-task status aggregation |
| Failed tasks MUST retain error context | PASS | error_log field in SubTask |
| Admin panel MUST expose job queue status | PASS | PayloadCMS native job visualization |

**Gate Status**: PASS - All constitutional principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-content-studio/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   ├── openapi.yaml     # REST API specification
│   └── types.ts         # TypeScript type definitions
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── collections/           # PayloadCMS collection definitions
│   ├── Tasks.ts          # Parent task collection
│   ├── SubTasks.ts       # Atomic execution unit collection
│   ├── StyleTemplates.ts # Style configuration collection
│   └── Media.ts          # Asset/media collection (Payload upload)
├── jobs/                  # PayloadCMS job handlers
│   ├── expand-prompt.ts  # LLM prompt optimization job
│   └── generate-image.ts # Image generation job
├── adapters/              # AI provider adapters
│   ├── types.ts          # Common adapter interface
│   ├── flux.ts           # Fal.ai Flux adapter
│   ├── dalle.ts          # OpenAI DALL-E 3 adapter
│   ├── imagen.ts         # Google Imagen (Nano Banana) adapter
│   └── veo.ts            # Google Veo video adapter
├── services/              # Business logic services
│   ├── prompt-optimizer.ts    # LLM prompt enhancement service
│   ├── task-orchestrator.ts   # Task fission and aggregation
│   └── asset-manager.ts       # OSS upload and naming
├── components/            # Custom React components (admin)
│   ├── Studio/           # Generation workspace UI
│   ├── TaskManager/      # Task monitoring UI
│   ├── Gallery/          # Asset gallery with masonry
│   └── Dashboard/        # Overview metrics UI
├── lib/                   # Shared utilities
│   ├── rate-limiter.ts   # Per-provider rate limiting
│   └── error-normalizer.ts # API error standardization
└── payload.config.ts      # PayloadCMS configuration

tests/
├── integration/           # Job handler tests
│   ├── expand-prompt.test.ts
│   └── generate-image.test.ts
├── unit/                  # Service and utility tests
│   ├── adapters/
│   └── services/
└── e2e/                   # Playwright E2E tests
    └── studio-workflow.test.ts
```

**Structure Decision**: Monorepo PayloadCMS structure with dedicated directories for collections, jobs, adapters, and components. This aligns with PayloadCMS conventions and separates concerns between data models, async processing, external integrations, and UI.

## Complexity Tracking

> No violations to justify - all constitutional principles are satisfied.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | - | - |
