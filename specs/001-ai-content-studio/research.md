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

## Dependencies Identified

| Dependency | Purpose | Version |
|------------|---------|---------|
| payloadcms | Core CMS framework with Jobs Queue | ^3.0.0 |
| @payloadcms/db-mongodb | MongoDB adapter | ^3.0.0 |
| openai | DALL-E 3 API client | ^4.0.0 |
| @anthropic-ai/sdk | Claude API client | ^0.20.0 |
| @fal-ai/client | Flux via Fal.ai | ^0.14.0 |
| @google-cloud/aiplatform | Imagen/Veo via Vertex AI | ^3.0.0 |
| masonic | Virtual masonry layout | ^4.0.0 |
| tailwindcss | Styling (scoped) | ^3.4.0 |
