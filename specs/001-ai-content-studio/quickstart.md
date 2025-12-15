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

## 7. Testing

### Run Unit Tests

```bash
pnpm test
```

### Run Integration Tests

```bash
# Requires running MongoDB
pnpm test:integration
```

### Run E2E Tests

```bash
# Requires running dev server
pnpm test:e2e
```

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
