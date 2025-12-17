# Quickstart Guide: AI Content Generation Studio

**Feature**: 001-ai-content-studio
**Prerequisites**: Node.js 18+, MongoDB 6+, pnpm

## 1. Project Setup

### Install Dependencies

```bash
# Clone and install
cd karasu-express
pnpm install
```

### Environment Configuration

Create `.env` file in project root:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/karasu-express

# PayloadCMS
PAYLOAD_SECRET=your-secure-secret-here

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
FAL_API_KEY=...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Object Storage (choose one)
# AWS S3
S3_BUCKET=karasu-assets
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# OR Aliyun OSS
OSS_BUCKET=karasu-assets
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=...
OSS_ACCESS_KEY_SECRET=...
```

## 2. Database Setup

### Start MongoDB

```bash
# Using Docker
docker run -d --name karasu-mongo -p 27017:27017 mongo:6

# Or use MongoDB Atlas connection string in MONGODB_URI
```

### Seed Initial Data

```bash
# Create default style templates and model configs
pnpm payload:seed
```

This seeds:
- Base style template (required)
- Pre-configured style templates (Ghibli, Cyberpunk, Film Noir, etc.)
- Model configurations for Flux, DALL-E 3, Nano Banana

## 3. Development Server

### Start Next.js Dev Server

```bash
pnpm dev
```

Access:
- **Admin Panel**: http://localhost:3000/admin
- **API**: http://localhost:3000/api

### Start Background Worker (separate terminal)

```bash
# For processing Jobs Queue
pnpm payload jobs:run
```

## 4. Core Workflows

### A. Create a Generation Task (API)

```bash
# 1. Create task in draft status
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "A cyberpunk cat sitting on a neon-lit rooftop",
    "styles": ["base", "ghibli-anime", "cyberpunk"],
    "models": ["flux-pro", "dalle-3"],
    "batchConfig": {
      "countPerPrompt": 5
    },
    "webSearchEnabled": false
  }'

# Response: { "id": "task_abc123", "status": "draft", ... }

# 2. Submit task for processing
curl -X POST http://localhost:3000/api/tasks/task_abc123/submit

# Response: { "status": "queued", ... }
```

### B. Monitor Task Progress

```bash
# Get task status
curl http://localhost:3000/api/tasks/task_abc123

# Response includes:
# - status: "processing"
# - progress: 45
# - expandedPrompts: [...]

# List sub-tasks
curl "http://localhost:3000/api/sub-tasks?parentTask=task_abc123"
```

### C. Preview Prompt Expansion

```bash
# Test LLM prompt optimization without creating task
curl -X POST http://localhost:3000/api/studio/expand-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "A serene mountain lake at sunset",
    "variantCount": 3,
    "webSearchEnabled": false
  }'

# Response: { "variants": [...], "subjectSlug": "mountain-lake-sunset" }
```

### D. Calculate Task Fission

```bash
# Estimate total images before submission
curl -X POST http://localhost:3000/api/studio/calculate-fission \
  -H "Content-Type: application/json" \
  -d '{
    "promptCount": 3,
    "styleCount": 4,
    "modelCount": 2,
    "batchSize": 10
  }'

# Response: { "totalSubTasks": 240, "warning": null }
# Warning appears if total > 500
```

## 5. Admin Panel Usage

### Dashboard
Navigate to `/admin` to access:
- **Tasks**: View all generation tasks, filter by status
- **Sub-Tasks**: Drill into individual API calls, view logs
- **Style Templates**: Create/edit style configurations
- **Model Configs**: View AI provider settings
- **Media**: Browse generated assets

### Creating Styles via Admin

1. Go to `/admin/collections/style-templates`
2. Click "Create New"
3. Fill in:
   - **Style ID**: `my-custom-style` (lowercase, hyphens only)
   - **Name**: "My Custom Style"
   - **Positive Prompt**: `{prompt}, watercolor painting, soft edges, pastel colors`
   - **Negative Prompt**: `photograph, realistic, sharp lines`
4. Save

### Viewing Generated Assets

1. Navigate to `/admin/collections/media`
2. Filter by task ID or model
3. Click on asset to view:
   - Full-size image
   - Generation metadata (prompt, seed, parameters)
   - Download original file

## 6. Key Configuration Files

### payload.config.ts - Jobs Configuration

```typescript
// Example job queue configuration
export default buildConfig({
  jobs: {
    autoRun: [
      {
        queue: 'default',
        limit: 5,
        cron: '*/10 * * * * *', // Every 10 seconds
      },
      {
        queue: 'ai-generation',
        limit: 10, // Rate limit for AI APIs
        cron: '*/5 * * * * *',
      },
    ],
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
  },
});
```

### Adding a New AI Provider Adapter

1. Create adapter file: `src/adapters/my-provider.ts`

```typescript
import type { ImageGenerationAdapter } from './types';

export const myProviderAdapter: ImageGenerationAdapter = {
  providerId: 'my-provider',

  async generate(params) {
    const response = await fetch('https://api.my-provider.com/generate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.MY_PROVIDER_KEY}` },
      body: JSON.stringify({
        prompt: params.prompt,
        // ... map params to provider schema
      }),
    });

    const data = await response.json();

    return {
      images: data.images.map((img) => ({
        url: img.url,
        width: img.width,
        height: img.height,
        contentType: 'image/png',
      })),
      seed: data.seed,
      metadata: data,
    };
  },

  normalizeError(error) {
    // Map provider errors to ErrorCategory
    if (error.status === 429) {
      return { category: 'RATE_LIMITED', retryable: true, ... };
    }
    // ...
  },

  getDefaultOptions() {
    return { quality: 'hd' };
  },
};
```

2. Register in `src/adapters/index.ts`
3. Add model config to database

## 7. Testing (Constitution Principle VI)

Testing is mandatory per Constitution Principle VI. All tests must pass before code is committed.

### Test Structure

```text
tests/
├── unit/                # Fast, isolated tests (< 100ms each)
│   ├── adapters/        # AI provider adapter tests
│   ├── lib/             # Utility function tests
│   └── services/        # Service method tests
├── integration/         # Component interaction tests
│   ├── jobs/            # Job handler tests
│   └── endpoints/       # API endpoint tests
├── contract/            # API schema validation
│   └── adapters.contract.test.ts
└── e2e/                 # Full workflow tests
    └── studio-workflow.e2e.test.ts
```

### Run Unit Tests

```bash
# Run all unit tests (should complete in < 60 seconds)
pnpm test:unit

# Run specific test file
pnpm test:unit tests/unit/lib/prompt-merger.test.ts

# Watch mode during development
pnpm test:unit --watch
```

### Run Integration Tests

```bash
# Requires MongoDB Memory Server (auto-started)
pnpm test:integration

# Run specific integration test
pnpm test:integration tests/integration/jobs/generate-image.integration.test.ts
```

### Run Contract Tests

```bash
# Verify adapter contracts
pnpm test:contract
```

### Run All Tests

```bash
# Run complete test suite
pnpm test

# Run with coverage report
pnpm test:coverage
```

### Run E2E Tests

```bash
# Requires running dev server in another terminal
pnpm dev  # Terminal 1
pnpm test:e2e  # Terminal 2
```

### Test Commands Summary

| Command | Description | When to Use |
|---------|-------------|-------------|
| `pnpm test` | Run all tests | Before commit, CI |
| `pnpm test:unit` | Unit tests only | During development |
| `pnpm test:integration` | Integration tests | After implementing features |
| `pnpm test:contract` | Contract tests | After modifying adapters |
| `pnpm test:e2e` | E2E tests | Before release |
| `pnpm test:coverage` | Tests with coverage | Periodic check |
| `pnpm test:watch` | Watch mode | Active development |

### Writing Tests

**Unit Test Example** (for utility functions):

```typescript
// tests/unit/lib/task-fission.test.ts
import { describe, it, expect } from 'vitest';
import { calculateFission } from '../../../src/lib/task-fission';

describe('calculateFission', () => {
  it('should calculate correct total for simple config', () => {
    const result = calculateFission({
      expandedPrompts: [{ variantId: 'v1' }, { variantId: 'v2' }],
      selectedStyles: ['base', 'ghibli'],
      selectedModels: ['flux-pro'],
      batchSize: 5,
      includeBaseStyle: false,
    });

    // 2 prompts * 2 styles * 1 model * 5 batch = 20
    expect(result).toHaveLength(20);
  });

  it('should add base style when includeBaseStyle is true', () => {
    const result = calculateFission({
      expandedPrompts: [{ variantId: 'v1' }],
      selectedStyles: ['ghibli'],
      selectedModels: ['flux-pro'],
      batchSize: 1,
      includeBaseStyle: true,
    });

    // 1 prompt * 2 styles (base + ghibli) * 1 model * 1 batch = 2
    expect(result).toHaveLength(2);
    expect(result.some(t => t.styleId === 'base')).toBe(true);
  });
});
```

**Integration Test Example** (for job handlers):

```typescript
// tests/integration/jobs/expand-prompt.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('expand-prompt job', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
  });

  afterAll(async () => {
    await mongod.stop();
  });

  it('should expand a simple theme into multiple variants', async () => {
    // Mock LLM response
    vi.mock('../../../src/lib/llm-client', () => ({
      expandPrompt: vi.fn().mockResolvedValue({
        variants: [
          { variantId: 'realistic', expandedPrompt: 'detailed prompt...' },
          { variantId: 'abstract', expandedPrompt: 'abstract prompt...' },
        ],
      }),
    }));

    const result = await expandPromptHandler({
      input: { subject: 'a cat in rain', variantCount: 2 },
    });

    expect(result.variants).toHaveLength(2);
  });
});
```

### Progressive Testing Protocol

Per Constitution Principle VI, tests must pass before advancing phases:

1. **Phase 2 (Foundational)**: All unit tests for `lib/` utilities must pass
2. **Phase 3+ (User Stories)**: All unit + integration tests for the story must pass
3. **Final (Polish)**: Full test suite including E2E must pass

**If tests fail:**
1. STOP implementation immediately
2. Analyze failure root cause
3. Fix implementation or test
4. Verify all tests pass
5. Resume implementation

## 8. Production Deployment

### Build for Production

```bash
pnpm build
```

### Start Web Server

```bash
pnpm start
```

### Start Workers (separate process/container)

```bash
NODE_ENV=production payload jobs:run
```

### Recommended Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Load Balancer │     │    MongoDB      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       │
┌─────────────────┐              │
│  Web Server(s)  │◄─────────────┤
│  (next start)   │              │
└─────────────────┘              │
                                 │
┌─────────────────┐              │
│   Worker(s)     │◄─────────────┘
│ (payload jobs)  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Object Storage │
│   (S3 / OSS)    │
└─────────────────┘
```

## 9. Troubleshooting

### Jobs Not Processing

1. Verify worker is running: `pnpm payload jobs:run`
2. Check job queue in admin: `/admin/collections/payload-jobs`
3. Look for error logs in failed jobs

### Rate Limit Errors (429)

1. Reduce `limit` in queue configuration
2. Check provider-specific rate limits in Model Config
3. Consider adding delay between requests

### Image Generation Fails

1. View sub-task details for `errorLog` and `errorCategory`
2. Check `requestPayload` to verify correct parameters
3. Test prompt manually with provider's playground

### Gallery Performance Issues

1. Enable virtualization in Gallery component
2. Implement lazy loading for thumbnails
3. Use appropriate image sizes for thumbnails vs full view
