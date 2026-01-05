# Data Model: AI Content Generation Studio

**Feature**: 001-ai-content-studio
**Created**: 2025-12-16
**Database**: MongoDB (via PayloadCMS)

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      Task       │       │    SubTask      │       │     Asset       │
│  (Parent Task)  │──1:N──│ (Atomic Unit)   │──1:N──│ (Media File)    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
        │                         │
        │                         │
        ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│ StyleTemplate   │       │  ModelConfig    │
│  (many-to-many) │       │  (reference)    │
└─────────────────┘       └─────────────────┘
```

---

## Collections

### 1. Tasks (Parent Task / Aggregate Root)

**Slug**: `tasks`
**Description**: Records a user's generation request with all configuration parameters.

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | UUID | Auto | Primary key | - |
| subject | Text | Yes | User's original subject input | Min: 1, Max: 1000 chars |
| expandedPrompts | Array\<ExpandedPrompt\> | No | LLM-optimized prompt variants | - |
| styles | Relationship[] | Yes | Selected style templates | Min: 1 selection |
| models | Select[] | Yes | Selected AI model IDs | Min: 1 selection |
| batchConfig | Group | Yes | Batch generation settings | - |
| batchConfig.countPerPrompt | Number | Yes | Images per prompt variant | Min: 1, Max: 50 |
| batchConfig.totalExpected | Number | Computed | Total expected outputs | Read-only |
| status | Select | Yes | Aggregate task status | Enum |
| progress | Number | Yes | Completion percentage | 0-100 |
| webSearchEnabled | Checkbox | No | Enable RAG for prompt optimization | Default: false |
| createdAt | Date | Auto | Creation timestamp | - |
| updatedAt | Date | Auto | Last update timestamp | - |

**ExpandedPrompt Object**:
```typescript
interface ExpandedPrompt {
  variantId: string;
  variantName: string;       // "Realistic", "Abstract", "Artistic"
  originalPrompt: string;    // User's input
  expandedPrompt: string;    // LLM-enhanced prompt
  subjectSlug: string;       // English slug for file naming
}
```

**Status Enum**:
| Value | Description |
|-------|-------------|
| `draft` | Task created, not yet submitted |
| `queued` | Submitted, waiting for processing |
| `expanding` | LLM prompt expansion in progress |
| `processing` | Image generation in progress |
| `completed` | All sub-tasks completed successfully |
| `partial_failed` | Some sub-tasks failed |
| `failed` | Critical failure, task aborted |

**Indexes**:
- `{ status: 1 }` - Admin filtering
- `{ createdAt: -1 }` - Recent tasks listing

---

### 2. SubTasks (Atomic Execution Unit)

**Slug**: `sub-tasks`
**Description**: Individual API request to an AI provider. Core entity for the job queue.

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | UUID | Auto | Primary key | - |
| parentTask | Relationship | Yes | Reference to parent Task | - |
| status | Select | Yes | Execution status | Enum |
| lockedBy | Text | No | Current worker ID (lock mechanism) | - |
| lockExpiresAt | Date | No | Lock expiration time | - |
| styleId | Text | Yes | Applied style template ID | - |
| modelId | Text | Yes | Target AI model ID | - |
| expandedPrompt | JSON | Yes | Prompt variant details | - |
| finalPrompt | Text | Yes | Merged prompt (prompt + style) | - |
| negativePrompt | Text | No | Negative prompt from style | - |
| batchIndex | Number | Yes | Index within batch (0-based) | Min: 0 |
| requestPayload | JSON | No | Raw API request body (schema-less) | - |
| responseData | JSON | No | Raw API response (schema-less) | - |
| errorLog | Text | No | Error message/stack trace | - |
| errorCategory | Select | No | Normalized error type | Enum |
| retryCount | Number | Yes | Number of retry attempts | Default: 0 |
| startedAt | Date | No | Processing start time | - |
| completedAt | Date | No | Processing completion time | - |
| createdAt | Date | Auto | Creation timestamp | - |

**Status Enum**:
| Value | Description |
|-------|-------------|
| `pending` | Waiting in queue |
| `processing` | Currently being executed |
| `success` | Completed successfully |
| `failed` | Failed after all retries |

**Error Category Enum**:
| Value | Retryable | Description |
|-------|-----------|-------------|
| `RATE_LIMITED` | Yes | 429 Too Many Requests |
| `CONTENT_FILTERED` | No | NSFW/safety rejection |
| `INVALID_INPUT` | No | Bad prompt/parameters |
| `PROVIDER_ERROR` | Yes | Provider internal error |
| `NETWORK_ERROR` | Yes | Connectivity issues |
| `TIMEOUT` | Yes | Request timeout |
| `UNKNOWN` | No | Unclassified errors |

**Indexes**:
- `{ status: 1, createdAt: 1 }` - Worker task pickup (oldest pending first)
- `{ status: 1, lockExpiresAt: 1 }` - Zombie task detection
- `{ parentTask: 1 }` - Task detail aggregation

---

### 3. StyleTemplates

**Slug**: `style-templates`
**Description**: Reusable style configurations with prompt modifiers.

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | UUID | Auto | Primary key | - |
| styleId | Text | Yes | Unique identifier (slug) | Pattern: `^[a-z0-9-]+$` |
| name | Text | Yes | Display name | Min: 1, Max: 100 chars |
| description | Textarea | No | Style description | Max: 500 chars |
| positivePrompt | Textarea | Yes | Positive prompt template | Must contain `{prompt}` |
| negativePrompt | Textarea | No | Negative prompt additions | - |
| previewImage | Upload | No | Style preview thumbnail | - |
| isSystem | Checkbox | Yes | System-provided (non-editable) | Default: false |
| sortOrder | Number | No | Display order in UI | Default: 0 |
| createdAt | Date | Auto | Creation timestamp | - |
| updatedAt | Date | Auto | Last update timestamp | - |

**Default Style (Base)**:
```json
{
  "styleId": "base",
  "name": "Base (No Style)",
  "description": "Original prompt without style modifications",
  "positivePrompt": "{prompt}",
  "negativePrompt": "",
  "isSystem": true,
  "sortOrder": -1
}
```

**Example Style**:
```json
{
  "styleId": "ghibli-anime",
  "name": "Studio Ghibli Style",
  "description": "Hayao Miyazaki's signature animation aesthetic",
  "positivePrompt": "{prompt}, studio ghibli style, cel shaded, vibrant colors, hayao miyazaki, hand-drawn animation",
  "negativePrompt": "3d render, realistic, photorealistic, low quality, blurry, cgi",
  "isSystem": true,
  "sortOrder": 10
}
```

---

### 4. Media (Assets / Generated Content)

**Slug**: `media`
**Description**: PayloadCMS Upload Collection for generated images/videos.

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | UUID | Auto | Primary key | - |
| filename | Text | Auto | Standardized filename | - |
| url | Text | Auto | Public URL (OSS) | - |
| mimeType | Text | Auto | Content type | - |
| filesize | Number | Auto | File size in bytes | - |
| width | Number | Auto | Image width in pixels | - |
| height | Number | Auto | Image height in pixels | - |
| relatedSubtask | Relationship | Yes | Source SubTask reference | - |
| generationMeta | JSON | Yes | Generation parameters snapshot | - |
| assetType | Select | Yes | Asset type | Enum: `image`, `video` |
| createdAt | Date | Auto | Creation timestamp | - |

**GenerationMeta Object**:
```typescript
interface GenerationMeta {
  taskId: string;
  subjectSlug: string;
  styleId: string;
  modelId: string;
  batchIndex: number;
  finalPrompt: string;
  negativePrompt?: string;
  seed: number;
  aspectRatio: string;
  providerParams?: Record<string, unknown>;
}
```

**Filename Convention**: `image_{timestamp}_{subject}_{style}_{model}_{index}.{ext}`

---

### 5. ModelConfigs (AI Provider Configuration)

**Slug**: `model-configs`
**Description**: Configuration for each AI model provider.

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | UUID | Auto | Primary key | - |
| modelId | Text | Yes | Unique identifier | Pattern: `^[a-z0-9-]+$` |
| displayName | Text | Yes | Human-readable name | - |
| provider | Select | Yes | Provider type | Enum |
| isEnabled | Checkbox | Yes | Available for selection | Default: true |
| rateLimit | Number | Yes | Concurrent requests limit | Min: 1, Max: 100 |
| defaultParams | JSON | Yes | Default generation parameters | - |
| supportedAspectRatios | Array\<Text\> | Yes | Available aspect ratios | - |
| supportedFeatures | Array\<Select\> | No | Supported features | Enum: `batch`, `seed`, `negativePrompt` |
| sortOrder | Number | No | Display order | Default: 0 |

**Provider Enum**:
| Value | Description |
|-------|-------------|
| `fal` | Fal.ai (Flux models) |
| `openai` | OpenAI (DALL-E 3) |
| `google` | Google Cloud (Nano Banana, Veo) |

**Example Configurations**:

```json
// Flux Pro
{
  "modelId": "flux-pro",
  "displayName": "Flux Pro",
  "provider": "fal",
  "isEnabled": true,
  "rateLimit": 10,
  "defaultParams": {
    "num_inference_steps": 25,
    "guidance_scale": 3.5,
    "safety_tolerance": "2"
  },
  "supportedAspectRatios": ["1:1", "16:9", "9:16", "4:3", "3:4"],
  "supportedFeatures": ["seed", "negativePrompt"]
}

// DALL-E 3
{
  "modelId": "dalle-3",
  "displayName": "DALL-E 3",
  "provider": "openai",
  "isEnabled": true,
  "rateLimit": 5,
  "defaultParams": {
    "quality": "hd",
    "style": "vivid"
  },
  "supportedAspectRatios": ["1:1", "16:9", "9:16"],
  "supportedFeatures": []
}

// Nano Banana
{
  "modelId": "nano-banana",
  "displayName": "Nano Banana",
  "provider": "google",
  "isEnabled": true,
  "rateLimit": 15,
  "defaultParams": {
    "safetySetting": "block_some"
  },
  "supportedAspectRatios": ["1:1", "16:9", "9:16", "4:3", "3:4"],
  "supportedFeatures": ["batch"]
}
```

---

## State Transitions

### Task Status Flow

```
  ┌─────────┐
  │  draft  │
  └────┬────┘
       │ submit()
       ▼
  ┌─────────┐
  │ queued  │
  └────┬────┘
       │ startExpansion()
       ▼
┌───────────┐
│ expanding │
└─────┬─────┘
      │ expansionComplete()
      ▼
┌────────────┐
│ processing │◄────────────┐
└─────┬──────┘             │
      │                    │ retryFailed()
      ▼                    │
┌─────────────────────┐    │
│ completed OR        │────┘
│ partial_failed OR   │
│ failed              │
└─────────────────────┘
```

### SubTask Status Flow

```
  ┌─────────┐
  │ pending │
  └────┬────┘
       │ acquire()
       ▼
┌────────────┐
│ processing │
└─────┬──────┘
      │
      ├──success──► ┌─────────┐
      │             │ success │
      │             └─────────┘
      │
      └──failure──► ┌─────────┐
        (retries    │ pending │ (if retryable && retryCount < max)
        exhausted)  └─────────┘
            │
            ▼
       ┌────────┐
       │ failed │
       └────────┘
```

---

## Validation Rules

### Task Validation
1. `subject` must be non-empty and ≤1000 characters
2. At least one style must be selected
3. At least one model must be selected
4. `batchConfig.countPerPrompt` must be between 1 and 50
5. Warn if `totalExpected > 500` (cost/time warning)

### SubTask Validation
1. `parentTask` must reference existing Task
2. `styleId` must reference existing StyleTemplate
3. `modelId` must reference existing ModelConfig with `isEnabled: true`
4. `finalPrompt` must be non-empty

### StyleTemplate Validation
1. `styleId` must be unique and match pattern `^[a-z0-9-]+$`
2. `positivePrompt` must contain `{prompt}` placeholder
3. System styles (`isSystem: true`) cannot be deleted

### Asset Validation
1. `relatedSubtask` must reference existing SubTask with `status: success`
2. `filename` must follow naming convention
