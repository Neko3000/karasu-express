# Research Document: AI Content Generation Studio

**Feature**: 001-ai-content-studio
**Created**: 2025-12-16
**Status**: Complete

## Research Tasks

### 1. PayloadCMS v3 Jobs Queue Integration

**Context**: Core async task management for prompt expansion and image generation.

**Decision**: Use PayloadCMS v3 native Jobs Queue system

**Rationale**:
- Native integration with PayloadCMS eliminates external dependencies
- Built-in persistence to MongoDB ensures job durability
- Supports retry mechanisms with configurable attempts
- Provides admin panel visualization out of the box
- Enables queue-specific rate limiting via `limit` configuration

**Alternatives Considered**:
| Alternative | Rejected Because |
|------------|------------------|
| Redis + Bull/BullMQ | Violates Constitution Principle I (Payload Native) and II (Infrastructure Minimalism) |
| Temporal.io | Over-engineered for current scale; adds operational complexity |
| Custom MongoDB polling | Re-invents what Payload Jobs provides natively |

**Implementation Pattern**:
```typescript
// payload.config.ts
export default buildConfig({
  jobs: {
    tasks: [
      {
        slug: 'expand-prompt',
        handler: expandPromptHandler,
        retries: 3,
      },
      {
        slug: 'generate-image',
        queue: 'ai-generation',
        handler: generateImageHandler,
        retries: 3,
      },
    ],
    queues: [
      {
        name: 'ai-generation',
        limit: 10, // Rate limit: 10 concurrent jobs
      },
    ],
  },
})
```

---

### 2. AI Provider Adapter Pattern

**Context**: Need to integrate multiple AI providers (Flux, DALL-E 3, Nano Banana, Veo) with different API schemas.

**Decision**: Implement a common adapter interface with provider-specific implementations

**Rationale**:
- Enables model switching without changing core logic
- Facilitates A/B testing across providers
- Isolates provider-specific error handling
- Simplifies adding new providers in the future

**Alternatives Considered**:
| Alternative | Rejected Because |
|------------|------------------|
| Direct API calls in job handlers | Tight coupling; hard to test; duplicated error handling |
| AI SDK abstraction library (e.g., Vercel AI SDK) | May not support all target providers; adds dependency |

**Common Interface**:
```typescript
interface ImageGenerationAdapter {
  providerId: string;

  generate(params: {
    prompt: string;
    negativePrompt?: string;
    aspectRatio: AspectRatio;
    seed?: number;
    providerOptions?: Record<string, unknown>;
  }): Promise<GenerationResult>;

  normalizeError(error: unknown): NormalizedError;

  getDefaultOptions(): ProviderOptions;
}

interface GenerationResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
    contentType: string;
  }>;
  seed: number;
  timing?: { inference: number };
  metadata: Record<string, unknown>;
}
```

---

### 3. LLM Prompt Optimization Strategy

**Context**: Transform user's brief themes into high-quality generation prompts.

**Decision**: Use Claude 3.5 Sonnet or GPT-4o with structured JSON output and optional web search enhancement

**Rationale**:
- Claude 3.5 Sonnet and GPT-4o excel at following complex instructions
- JSON output format ensures consistent parsing
- Web search (RAG) enables trending topic awareness

**Meta-Prompting Strategy**:
- System prompt instructs LLM to act as "prompt engineering expert"
- Request structured output with composition, lighting, texture, atmosphere details
- Generate N variants (configurable, default 3) with different interpretations

**Output Schema**:
```typescript
interface PromptExpansionResult {
  variants: Array<{
    variantId: string;
    variantName: string; // e.g., "Realistic", "Abstract", "Artistic"
    expandedPrompt: string;
    suggestedNegativePrompt: string;
    keywords: string[];
  }>;
  subjectSlug: string; // English slug for file naming
  searchContext?: string; // If web search was used
}
```

---

### 4. Style Template Merging

**Context**: Combine user prompts with style templates that include positive/negative modifiers.

**Decision**: Template-based string interpolation with placeholder `{prompt}`

**Rationale**:
- Simple and predictable behavior
- Users can see exactly how their prompt will be modified
- Matches ComfyUI/SDXL Prompt Styler conventions

**Style Template Structure**:
```typescript
interface StyleTemplate {
  styleId: string;
  name: string;
  positivePrompt: string; // Must contain {prompt} placeholder
  negativePrompt: string;
}

// Example:
{
  styleId: "ghibli-anime",
  name: "Studio Ghibli Style",
  positivePrompt: "{prompt}, studio ghibli style, cel shaded, vibrant colors, hayao miyazaki",
  negativePrompt: "3d render, realistic, photorealistic, low quality, blurry"
}
```

**Merging Logic**:
```typescript
function mergeStyle(basePrompt: string, style: StyleTemplate): MergedPrompt {
  return {
    finalPrompt: style.positivePrompt.replace('{prompt}', basePrompt),
    negativePrompt: style.negativePrompt,
  };
}
```

---

### 5. Task Fission Algorithm

**Context**: Calculate and generate sub-tasks from user configuration.

**Decision**: Cartesian product of (prompts x styles x models) with batch multiplication

**Formula**: `Total = N_prompts * N_styles * N_models * batch_size`

**Implementation**:
```typescript
function calculateFission(config: TaskConfig): SubTaskSpec[] {
  const subTasks: SubTaskSpec[] = [];

  // Ensure Base style is included
  const styles = config.includeBaseStyle
    ? ['base', ...config.selectedStyles]
    : config.selectedStyles;

  for (const prompt of config.expandedPrompts) {
    for (const style of styles) {
      for (const model of config.selectedModels) {
        for (let i = 0; i < config.batchSize; i++) {
          subTasks.push({
            promptVariant: prompt,
            styleId: style,
            modelId: model,
            batchIndex: i,
          });
        }
      }
    }
  }

  return subTasks;
}
```

**Warning Threshold**: Display cost/time warning when `Total > 500`

---

### 6. Asset Naming Convention

**Context**: Standardized file naming for OSS storage enabling identification without database.

**Decision**: `image_{timestamp}_{subject}_{style}_{model}_{index}.{ext}`

**Rationale**:
- Timestamp ensures chronological sorting
- Subject slug enables project grouping
- Style and model IDs enable filtering by generation parameters
- Index distinguishes batch items

**Example**: `image_1702761234_cyberpunk-cat_ghibli_flux-pro_01.png`

**Implementation**:
```typescript
function generateAssetFilename(params: {
  subjectSlug: string;
  styleId: string;
  modelId: string;
  batchIndex: number;
  extension: string;
}): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const paddedIndex = String(params.batchIndex + 1).padStart(2, '0');
  return `image_${timestamp}_${params.subjectSlug}_${params.styleId}_${params.modelId}_${paddedIndex}.${params.extension}`;
}
```

---

### 7. Gallery Virtualization Strategy

**Context**: Display 500+ images in masonry layout without performance degradation.

**Decision**: Use react-virtualized or Masonic library with intersection observer

**Rationale**:
- Only renders visible items in DOM
- Supports variable height items (required for masonry)
- Proven performance at 1000+ items

**Alternatives Considered**:
| Alternative | Rejected Because |
|------------|------------------|
| react-window | Limited masonry support; requires fixed row heights |
| CSS-only masonry | Poor browser support; no virtualization |
| Infinite scroll without virtualization | Memory issues with 500+ images |

**Recommended Library**: `masonic` (supports virtual scrolling natively)

---

### 8. Real-time Progress Updates

**Context**: Show task completion progress without page refresh.

**Decision**: Polling with 5-second intervals (fallback to WebSocket for future enhancement)

**Rationale**:
- Simple to implement with PayloadCMS REST API
- Sufficient for non-critical updates
- WebSocket can be added later without breaking changes

**Polling Strategy**:
```typescript
// Client-side polling
const useTaskProgress = (taskId: string) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const poll = async () => {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      setProgress(data.progress);
      if (data.status !== 'completed' && data.status !== 'failed') {
        setTimeout(poll, 5000);
      }
    };
    poll();
  }, [taskId]);

  return progress;
};
```

---

### 9. Error Normalization

**Context**: Different AI providers return errors in various formats.

**Decision**: Map all provider errors to standardized error categories

**Error Categories**:
```typescript
enum ErrorCategory {
  RATE_LIMITED = 'RATE_LIMITED',       // 429 errors
  CONTENT_FILTERED = 'CONTENT_FILTERED', // NSFW/safety rejection
  INVALID_INPUT = 'INVALID_INPUT',      // Bad prompt/parameters
  PROVIDER_ERROR = 'PROVIDER_ERROR',    // Provider internal error
  NETWORK_ERROR = 'NETWORK_ERROR',      // Connectivity issues
  TIMEOUT = 'TIMEOUT',                  // Request timeout
  UNKNOWN = 'UNKNOWN',                  // Unclassified errors
}

interface NormalizedError {
  category: ErrorCategory;
  message: string;
  retryable: boolean;
  originalError: unknown;
  providerCode?: string;
}
```

---

### 10. MongoDB Indexing Strategy

**Context**: Support high-concurrency task polling and user queries.

**Decision**: Create indexes per domain-model.md specifications

**Required Indexes**:
```javascript
// sub-tasks collection
db.sub_tasks.createIndex({ status: 1, createdAt: 1 });  // Worker task pickup
db.sub_tasks.createIndex({ status: 1, lockExpiresAt: 1 });  // Zombie detection
db.sub_tasks.createIndex({ parentTask: 1 });  // Task detail queries

// tasks collection
db.tasks.createIndex({ userId: 1, createdAt: -1 });  // User history
db.tasks.createIndex({ status: 1 });  // Admin filtering
```

---

## Resolved Unknowns Summary

| Unknown | Resolution |
|---------|------------|
| Async task management | PayloadCMS v3 native Jobs Queue |
| Multi-provider integration | Common adapter interface pattern |
| Prompt optimization | Claude/GPT with JSON output + optional RAG |
| Style merging | Template interpolation with `{prompt}` placeholder |
| Gallery performance | Masonic library with virtual scrolling |
| Progress updates | 5-second polling (WebSocket future option) |
| Error handling | Normalized error categories with retry flags |
| Asset naming | Timestamp + subject + style + model + index convention |
| **Testing strategy** | **Vitest + Testing Library + MongoDB Memory Server** |
| **Progressive testing** | **Phase-gated testing with mandatory passage before advancement** |

## Dependencies Identified

| Dependency | Purpose | Version |
|------------|---------|---------|
| payloadcms | Core CMS framework with Jobs Queue | ^3.0.0 |
| @payloadcms/db-mongodb | MongoDB adapter | ^3.0.0 |
| openai | DALL-E 3 API client | ^4.0.0 |
| @anthropic-ai/sdk | Claude API client | ^0.20.0 |
| @fal-ai/client | Flux via Fal.ai | ^0.14.0 |
| @google-cloud/aiplatform | Nano Banana/Veo via Vertex AI | ^3.0.0 |
| masonic | Virtual masonry layout | ^4.0.0 |
| tailwindcss | Styling (scoped) | ^3.4.0 |
| vitest | Unit/integration testing | ^2.0.0 |
| @testing-library/react | React component testing | ^16.0.0 |
| mongodb-memory-server | In-memory MongoDB for tests | ^10.0.0 |

---

### 11. Testing Strategy (Constitution Principle VI)

**Context**: Ensure proper unit testing during progressive implementation per Constitution v1.1.0.

**Decision**: Use Vitest + Testing Library with MongoDB Memory Server for isolated testing

**Rationale**:
- Vitest is TypeScript-native, fast, and compatible with Vite/Next.js
- Testing Library provides React component testing with user-centric approach
- MongoDB Memory Server enables integration tests without external database
- Supports mocking of AI providers for isolated unit tests

**Alternatives Considered**:
| Alternative | Rejected Because |
|------------|------------------|
| Jest | Slower, requires more configuration for ESM/TypeScript |
| Mocha + Chai | Less integrated TypeScript support |
| Real MongoDB for tests | Requires running database, slower, flaky |

**Test Structure**:
```typescript
// tests/unit/lib/prompt-merger.test.ts
import { describe, it, expect } from 'vitest';
import { mergeStyle } from '../../../src/lib/prompt-merger';

describe('mergeStyle', () => {
  it('should replace {prompt} placeholder with base prompt', () => {
    const result = mergeStyle('a cat', {
      styleId: 'ghibli',
      name: 'Ghibli',
      positivePrompt: '{prompt}, studio ghibli style',
      negativePrompt: 'realistic',
    });

    expect(result.finalPrompt).toBe('a cat, studio ghibli style');
    expect(result.negativePrompt).toBe('realistic');
  });

  it('should handle base style with no modifications', () => {
    const result = mergeStyle('a cat', {
      styleId: 'base',
      name: 'Base',
      positivePrompt: '{prompt}',
      negativePrompt: '',
    });

    expect(result.finalPrompt).toBe('a cat');
    expect(result.negativePrompt).toBe('');
  });
});
```

**Integration Test Pattern**:
```typescript
// tests/integration/jobs/generate-image.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getPayload } from 'payload';

describe('generate-image job', () => {
  let mongod: MongoMemoryServer;
  let payload: Payload;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    payload = await getPayload({ config });
  });

  afterAll(async () => {
    await payload.db.destroy();
    await mongod.stop();
  });

  it('should create asset record on successful generation', async () => {
    // Mock the AI provider
    vi.mock('../../../src/adapters/flux.adapter', () => ({
      fluxAdapter: {
        generate: vi.fn().mockResolvedValue({
          images: [{ url: 'https://example.com/image.png', width: 1024, height: 1024 }],
          seed: 12345,
        }),
      },
    }));

    // Create test subtask
    const subTask = await payload.create({
      collection: 'sub-tasks',
      data: { /* ... */ },
    });

    // Execute job
    await generateImageHandler({ input: { subTaskId: subTask.id } });

    // Verify asset created
    const assets = await payload.find({
      collection: 'media',
      where: { relatedSubtask: { equals: subTask.id } },
    });

    expect(assets.docs).toHaveLength(1);
  });
});
```

**Adapter Contract Test Pattern**:
```typescript
// tests/contract/adapters.contract.test.ts
import { describe, it, expect } from 'vitest';
import type { ImageGenerationAdapter, GenerationResult } from '../../src/adapters/types';

// Contract: All adapters must conform to this interface
const adapterContractTests = (adapterName: string, adapter: ImageGenerationAdapter) => {
  describe(`${adapterName} adapter contract`, () => {
    it('should have required providerId', () => {
      expect(adapter.providerId).toBeDefined();
      expect(typeof adapter.providerId).toBe('string');
    });

    it('should have generate method that returns GenerationResult', async () => {
      expect(typeof adapter.generate).toBe('function');
    });

    it('should have normalizeError method', () => {
      expect(typeof adapter.normalizeError).toBe('function');
    });

    it('should have getDefaultOptions method', () => {
      expect(typeof adapter.getDefaultOptions).toBe('function');
      const options = adapter.getDefaultOptions();
      expect(typeof options).toBe('object');
    });
  });
};

// Run contract tests for all adapters
import { fluxAdapter } from '../../src/adapters/flux.adapter';
import { dalleAdapter } from '../../src/adapters/dalle.adapter';
import { nanoBananaAdapter } from '../../src/adapters/nano-banana.adapter';

adapterContractTests('Flux', fluxAdapter);
adapterContractTests('DALL-E', dalleAdapter);
adapterContractTests('Nano Banana', nanoBananaAdapter);
```

---

### 12. Progressive Implementation Testing Protocol

**Context**: Ensure each implementation phase produces verifiable, working code before advancing.

**Decision**: Phase-gated testing with mandatory test passage before phase advancement

**Protocol**:

| Phase | Test Requirements | Gate Criteria |
|-------|-------------------|---------------|
| Phase 1: Setup | N/A (infrastructure only) | Project builds, linting passes |
| Phase 2: Foundational | Unit tests for lib utilities | All unit tests pass |
| Phase 3+: User Stories | Unit + Integration tests | All tests pass, no regressions |
| Final: Polish | E2E tests | Full test suite passes |

**Implementation Rules**:
1. Write tests before or during implementation (TDD encouraged but not mandatory)
2. Tests must fail first to verify they're testing the right thing
3. No advancing to Phase N+1 until all Phase N tests pass
4. If a test fails during implementation, stop and fix immediately
5. Commit frequently with passing tests

**Test Failure Response Protocol**:
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

## Phase 7 Research: Task Monitoring and Management

**Date**: 2026-01-14

### 13. Custom Admin Views in PayloadCMS v3

**Context**: Implement Task Manager interface within PayloadCMS admin panel.

**Decision**: Extend existing admin panel with custom Task Manager view using PayloadCMS component replacement mechanism.

**Rationale**:
- PayloadCMS v3 supports custom admin views via Next.js App Router integration
- Existing patterns in `src/app/(payload)/admin/` demonstrate proper structure
- Custom UI field components (TaskOverviewField, SectionHeader) already established
- Native PayloadCMS hooks (`useFormFields`, `usePayloadAPI`) provide reactive data access

**Alternatives Considered**:
| Alternative | Rejected Because |
|------------|------------------|
| External dashboard application | Violates Constitution Principle I (Payload Native) and adds infrastructure complexity |
| PayloadCMS list view customization only | Insufficient for complex Task Manager requirements (detail panels, bulk actions) |

---

### 14. Task Cancellation with Graceful Shutdown

**Context**: Allow users to cancel in-progress tasks while preserving generated assets.

**Decision**: Implement cancellation that marks task as "Cancelled", completes current sub-task, and stops pending sub-tasks while retaining generated assets.

**Rationale**:
- Spec clarification (Session 2026-01-14): "Cancel stops new sub-tasks but completes the current one"
- Spec clarification: "Keep all completed assets; only pending sub-tasks are stopped"
- Constitution Principle V (Observability) requires cancellation status to be queryable
- Generated assets represent completed API costs - deletion wastes resources

**Alternatives Considered**:
| Alternative | Rejected Because |
|------------|------------------|
| Immediate abort (terminate current sub-task) | May leave sub-tasks in unknown state |
| Delete assets on cancellation | Wastes completed API calls; user may want partial results |

**Implementation Pattern**:
```typescript
// Cancel endpoint marks parent task and pending sub-tasks
await payload.update({
  collection: 'tasks',
  id: taskId,
  data: { status: TaskStatus.Cancelled },
})

// Job handler checks parent status before processing
const task = await payload.findByID({ collection: 'tasks', id: input.taskId })
if (task.status === TaskStatus.Cancelled) {
  return { output: { success: false, cancelled: true } }
}
```

---

### 15. In-Place Retry for Failed Sub-Tasks

**Context**: Allow users to retry failed sub-tasks without creating duplicate records.

**Decision**: Retry updates existing sub-task record in place, clearing error state and resetting retry count to 0.

**Rationale**:
- Spec clarification (Session 2026-01-14): "Retry updates the existing sub-task in place, clearing the error"
- Existing pattern in `src/endpoints/retry-failed.ts` demonstrates this approach
- Constitution Principle II (Infrastructure Minimalism) - no separate retry records needed
- Preserves sub-task ID for asset linkage and audit trail

**Alternatives Considered**:
| Alternative | Rejected Because |
|------------|------------------|
| Create new sub-task for retry | Duplicates records; complicates asset relationships |
| Archive failed, create new | Adds complexity without clear benefit |

**Implementation Pattern**:
```typescript
await payload.update({
  collection: 'sub-tasks',
  id: subTaskId,
  data: {
    status: SubTaskStatus.Pending,
    retryCount: 0,
    errorLog: null,
    errorCategory: null,
    startedAt: null,
    completedAt: null,
  },
})
```

---

### 16. Task Filtering and Search

**Context**: Provide filtering capabilities for Task Manager list view.

**Decision**: Implement filters for status, date range (predefined + custom), and theme keyword search using PayloadCMS query API.

**Rationale**:
- Spec clarification (Session 2026-01-14): "Status + date range + search by theme keyword"
- PayloadCMS query API supports compound `where` conditions
- MongoDB indexes on `createdAt`, `status`, and `subject` fields provide efficient querying
- Predefined date ranges (today, 7 days, 30 days) cover common use cases

**Implementation Pattern**:
```typescript
interface TaskFilters {
  status?: TaskStatus[]
  dateRange?: 'today' | '7days' | '30days' | 'custom'
  startDate?: Date
  endDate?: Date
  searchKeyword?: string
}

return payload.find({
  collection: 'tasks',
  where: { and: conditions },
  sort: '-createdAt', // Newest first (spec requirement)
  limit: 50,
})
```

---

### 17. Task Status Extension

**Context**: Support cancelled task state in the system.

**Decision**: Add `Cancelled` status to TaskStatus enum.

**Rationale**:
- Spec clarification requires explicit "Cancelled" state for cancelled tasks
- Existing TaskStatus enum in `src/lib/types.ts` needs extension
- SubTask already has patterns for terminal states (success, failed)

**Implementation**:
```typescript
export const TaskStatus = {
  Draft: 'draft',
  Queued: 'queued',
  Expanding: 'expanding',
  Processing: 'processing',
  Completed: 'completed',
  PartialFailed: 'partial_failed',
  Failed: 'failed',
  Cancelled: 'cancelled', // NEW for Phase 7
} as const
```

---

## Phase 7 Resolved Unknowns

| Unknown | Resolution |
|---------|------------|
| Task Manager UI location | Custom admin view at `/admin/custom/task-manager/` |
| Task cancellation behavior | Complete current sub-task, stop pending, retain assets |
| Sub-task retry behavior | In-place update, clear error state |
| Task list filters | Status + date range + theme keyword search |
| Default sort order | Newest first (`-createdAt`) |
| Cancelled status | Added to TaskStatus enum |

---

## Phase 9 Research: Asset Gallery and Management

**Date**: 2026-02-04

### 18. PayloadCMS Upload Collection List View Customization

**Context**: Enhance Media collection list view with larger pagination defaults and image hover preview.

**Decision**: Use PayloadCMS admin.pagination config for pagination limits and create custom Cell component for hover preview.

**Rationale**:
- PayloadCMS v3 supports `admin.pagination.defaultLimit` and `admin.pagination.limits` for pagination configuration
- PayloadCMS does NOT have built-in hover preview for upload collections
- Custom Cell components can be created via `admin.components.Cell` path configuration
- The `adminThumbnail` config only controls which image size is shown in the list, not hover behavior

**Research Findings**:

1. **Pagination Configuration**:
   - `admin.pagination.defaultLimit: 100` sets default items per page
   - `admin.pagination.limits: [25, 50, 100, 200]` defines available options
   - This is documented in PayloadCMS collection configuration

2. **Custom Cell Components**:
   - Cell components receive `cellData` and `data` props
   - Path format: `'/path/to/Component'` or `'/path/to/Component#ExportName'`
   - For upload fields, use the filename field's Cell component to add hover preview
   - Component must be a React component that renders the cell content

3. **Built-in Upload Features**:
   - `adminThumbnail` config specifies which image size to display in list view
   - No native hover preview functionality exists
   - Custom implementation required for hover preview overlay

**Alternatives Considered**:
| Alternative | Rejected Because |
|------------|------------------|
| Use built-in PayloadCMS hover preview | Does not exist - feature must be custom built |
| Modify adminThumbnail only | Only changes displayed size, no hover behavior |

**Implementation Pattern**:
```typescript
// Media collection pagination config
admin: {
  pagination: {
    defaultLimit: 100,
    limits: [25, 50, 100, 200],
  },
}

// Custom Cell component registration
{
  name: 'filename',
  // ... other config
  admin: {
    components: {
      Cell: '/components/Media/MediaThumbnailCell',
    },
  },
}
```

---

## Phase 9 Resolved Unknowns

| Unknown | Resolution |
|---------|------------|
| Built-in hover preview | Does NOT exist in PayloadCMS v3 - requires custom Cell component |
| Pagination configuration | `admin.pagination.defaultLimit` and `admin.pagination.limits` |
| Custom Cell component path | `'/components/Media/MediaThumbnailCell'` |
| Image size for preview | Use `card` size (768x1024) defined in upload.imageSizes |
