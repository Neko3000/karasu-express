/**
 * Karasu-Express AI Content Generation Studio
 * TypeScript Type Definitions
 *
 * These types correspond to the OpenAPI specification and PayloadCMS collections.
 */

// ============================================
// ENUMS
// ============================================

export enum TaskStatus {
  Draft = 'draft',
  Queued = 'queued',
  Expanding = 'expanding',
  Processing = 'processing',
  Completed = 'completed',
  PartialFailed = 'partial_failed',
  Failed = 'failed',
}

export enum SubTaskStatus {
  Pending = 'pending',
  Processing = 'processing',
  Success = 'success',
  Failed = 'failed',
}

export enum ErrorCategory {
  RateLimited = 'RATE_LIMITED',
  ContentFiltered = 'CONTENT_FILTERED',
  InvalidInput = 'INVALID_INPUT',
  ProviderError = 'PROVIDER_ERROR',
  NetworkError = 'NETWORK_ERROR',
  Timeout = 'TIMEOUT',
  Unknown = 'UNKNOWN',
}

export enum Provider {
  Fal = 'fal',
  OpenAI = 'openai',
  Google = 'google',
}

export enum AssetType {
  Image = 'image',
  Video = 'video',
}

export enum AspectRatio {
  Square = '1:1',
  Landscape = '16:9',
  Portrait = '9:16',
  Standard = '4:3',
  StandardPortrait = '3:4',
}

// ============================================
// TASK TYPES
// ============================================

export interface ExpandedPrompt {
  variantId: string;
  variantName: string; // e.g., "Realistic", "Abstract", "Artistic"
  originalPrompt: string;
  expandedPrompt: string;
  subjectSlug: string; // English slug for file naming
}

export interface BatchConfig {
  countPerPrompt: number;
  totalExpected: number; // Computed: prompts * styles * models * countPerPrompt
}

export interface Task {
  id: string;
  subject: string;
  expandedPrompts: ExpandedPrompt[];
  styles: string[]; // StyleTemplate IDs
  models: string[]; // ModelConfig IDs
  batchConfig: BatchConfig;
  status: TaskStatus;
  progress: number; // 0-100
  webSearchEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  subject: string;
  styles: string[];
  models: string[];
  batchConfig: {
    countPerPrompt: number;
  };
  webSearchEnabled?: boolean;
}

export interface UpdateTaskInput {
  subject?: string;
  styles?: string[];
  models?: string[];
  batchConfig?: {
    countPerPrompt: number;
  };
}

// ============================================
// SUB-TASK TYPES
// ============================================

export interface SubTask {
  id: string;
  parentTask: string;
  status: SubTaskStatus;
  lockedBy?: string;
  lockExpiresAt?: Date;
  styleId: string;
  modelId: string;
  expandedPrompt: ExpandedPrompt;
  finalPrompt: string;
  negativePrompt?: string;
  batchIndex: number;
  requestPayload?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
  errorLog?: string;
  errorCategory?: ErrorCategory;
  retryCount: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

// ============================================
// STYLE TEMPLATE TYPES
// ============================================

export interface StyleTemplate {
  id: string;
  styleId: string; // Unique slug: ^[a-z0-9-]+$
  name: string;
  description?: string;
  positivePrompt: string; // Must contain {prompt}
  negativePrompt: string;
  previewImage?: string;
  isSystem: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStyleInput {
  styleId: string;
  name: string;
  description?: string;
  positivePrompt: string;
  negativePrompt?: string;
  sortOrder?: number;
}

export interface UpdateStyleInput {
  name?: string;
  description?: string;
  positivePrompt?: string;
  negativePrompt?: string;
  sortOrder?: number;
}

// ============================================
// MODEL CONFIG TYPES
// ============================================

export type ModelFeature = 'batch' | 'seed' | 'negativePrompt';

export interface ModelConfig {
  id: string;
  modelId: string;
  displayName: string;
  provider: Provider;
  isEnabled: boolean;
  rateLimit: number;
  defaultParams: Record<string, unknown>;
  supportedAspectRatios: AspectRatio[];
  supportedFeatures: ModelFeature[];
  sortOrder: number;
}

// ============================================
// ASSET TYPES
// ============================================

export interface GenerationMeta {
  taskId: string;
  subjectSlug: string;
  styleId: string;
  modelId: string;
  batchIndex: number;
  finalPrompt: string;
  negativePrompt?: string;
  seed: number;
  aspectRatio: AspectRatio;
  providerParams?: Record<string, unknown>;
}

export interface Asset {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  filesize: number;
  width: number;
  height: number;
  relatedSubtask: string;
  generationMeta: GenerationMeta;
  assetType: AssetType;
  createdAt: Date;
}

// ============================================
// ADAPTER TYPES
// ============================================

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  seed?: number;
  providerOptions?: Record<string, unknown>;
}

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
  contentType: string;
}

export interface GenerationResult {
  images: GeneratedImage[];
  seed: number;
  timing?: { inference: number };
  metadata: Record<string, unknown>;
}

export interface NormalizedError {
  category: ErrorCategory;
  message: string;
  retryable: boolean;
  originalError: unknown;
  providerCode?: string;
}

export interface ImageGenerationAdapter {
  providerId: string;

  generate(params: ImageGenerationParams): Promise<GenerationResult>;

  normalizeError(error: unknown): NormalizedError;

  getDefaultOptions(): Record<string, unknown>;
}

// ============================================
// STUDIO TYPES
// ============================================

export interface PromptExpansionInput {
  subject: string;
  variantCount?: number;
  webSearchEnabled?: boolean;
}

export interface PromptExpansionResult {
  variants: Array<{
    variantId: string;
    variantName: string;
    expandedPrompt: string;
    suggestedNegativePrompt: string;
    keywords: string[];
  }>;
  subjectSlug: string;
  searchContext?: string;
}

export interface FissionCalculationInput {
  promptCount: number;
  styleCount: number;
  modelCount: number;
  batchSize: number;
}

export interface FissionCalculationResult {
  totalSubTasks: number;
  warning?: string;
}

// ============================================
// JOB TYPES
// ============================================

export interface ExpandPromptJobInput {
  taskId: string;
  subject: string;
  variantCount: number;
  webSearchEnabled: boolean;
}

export interface GenerateImageJobInput {
  subTaskId: string;
  modelId: string;
  finalPrompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  seed?: number;
  providerOptions?: Record<string, unknown>;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type TaskListResponse = PaginatedResponse<Task>;
export type SubTaskListResponse = PaginatedResponse<SubTask>;
export type StyleListResponse = PaginatedResponse<StyleTemplate>;
export type AssetListResponse = PaginatedResponse<Asset>;

export interface ModelConfigListResponse {
  docs: ModelConfig[];
  totalDocs: number;
}

// ============================================
// PROVIDER-SPECIFIC PAYLOAD TYPES
// ============================================

// Flux (Fal.ai)
export interface FluxRequestPayload {
  prompt: string;
  image_size: {
    width: number;
    height: number;
  };
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
  num_images?: number;
  safety_tolerance?: string;
}

export interface FluxResponseData {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings?: {
    inference: number;
  };
  seed: number;
  has_nsfw_concepts?: boolean[];
}

// DALL-E 3 (OpenAI)
export interface DalleRequestPayload {
  model: 'dall-e-3';
  prompt: string;
  n: number;
  size: '1024x1024' | '1792x1024' | '1024x1792';
  quality: 'standard' | 'hd';
  style: 'vivid' | 'natural';
  response_format: 'url' | 'b64_json';
}

export interface DalleResponseData {
  created: number;
  data: Array<{
    revised_prompt?: string;
    url?: string;
    b64_json?: string;
  }>;
}

// Nano Banana (Google)
export interface NanoBananaRequestPayload {
  instances: Array<{
    prompt: string;
  }>;
  parameters: {
    sampleCount: number;
    aspectRatio: string;
    safetySetting?: 'block_few' | 'block_some' | 'block_most';
  };
}

export interface NanoBananaResponseData {
  predictions: Array<{
    bytesBase64Encoded: string;
    mimeType: string;
  }>;
}

// Veo (Google Video)
export interface VeoRequestPayload {
  instances: Array<{
    prompt: string;
    image?: {
      gcsUri: string;
    };
  }>;
  parameters: {
    storageUri: string;
    negativePrompt?: string;
  };
}

export interface VeoOperationResponse {
  name: string;
  metadata: {
    '@type': string;
    state: 'RUNNING' | 'SUCCEEDED' | 'FAILED';
    createTime: string;
  };
}
