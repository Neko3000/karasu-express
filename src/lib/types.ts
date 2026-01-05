/**
 * Karasu-Express AI Content Generation Studio
 * Common TypeScript Type Definitions
 *
 * These types are used throughout the application for type safety
 * and correspond to the PayloadCMS collections and API contracts.
 */

// ============================================
// ENUMS
// ============================================

/**
 * Task status represents the aggregate state of a generation task
 */
export enum TaskStatus {
  Draft = 'draft',
  Queued = 'queued',
  Expanding = 'expanding',
  Processing = 'processing',
  Completed = 'completed',
  PartialFailed = 'partial_failed',
  Failed = 'failed',
}

/**
 * SubTask status represents the execution state of an individual API call
 */
export enum SubTaskStatus {
  Pending = 'pending',
  Processing = 'processing',
  Success = 'success',
  Failed = 'failed',
}

/**
 * Error categories for normalized error handling across providers
 */
export enum ErrorCategory {
  RateLimited = 'RATE_LIMITED',
  ContentFiltered = 'CONTENT_FILTERED',
  InvalidInput = 'INVALID_INPUT',
  ProviderError = 'PROVIDER_ERROR',
  NetworkError = 'NETWORK_ERROR',
  Timeout = 'TIMEOUT',
  Unknown = 'UNKNOWN',
}

/**
 * AI provider identifiers
 */
export enum Provider {
  Fal = 'fal',
  OpenAI = 'openai',
  Google = 'google',
}

/**
 * Asset types for generated content
 */
export enum AssetType {
  Image = 'image',
  Video = 'video',
}

/**
 * Supported aspect ratios for image generation
 */
export enum AspectRatio {
  Square = '1:1',
  Landscape = '16:9',
  Portrait = '9:16',
  Standard = '4:3',
  StandardPortrait = '3:4',
}

// ============================================
// ERROR CATEGORY METADATA
// ============================================

/**
 * Determines if an error category should trigger a retry
 */
export const ERROR_CATEGORY_RETRYABLE: Record<ErrorCategory, boolean> = {
  [ErrorCategory.RateLimited]: true,
  [ErrorCategory.ContentFiltered]: false,
  [ErrorCategory.InvalidInput]: false,
  [ErrorCategory.ProviderError]: true,
  [ErrorCategory.NetworkError]: true,
  [ErrorCategory.Timeout]: true,
  [ErrorCategory.Unknown]: false,
}

// ============================================
// ASPECT RATIO DIMENSIONS
// ============================================

/**
 * Standard dimensions for each aspect ratio
 */
export const ASPECT_RATIO_DIMENSIONS: Record<
  AspectRatio,
  { width: number; height: number }
> = {
  [AspectRatio.Square]: { width: 1024, height: 1024 },
  [AspectRatio.Landscape]: { width: 1792, height: 1024 },
  [AspectRatio.Portrait]: { width: 1024, height: 1792 },
  [AspectRatio.Standard]: { width: 1365, height: 1024 },
  [AspectRatio.StandardPortrait]: { width: 1024, height: 1365 },
}

// ============================================
// SHARED INTERFACES
// ============================================

/**
 * Expanded prompt variant from LLM optimization
 */
export interface ExpandedPrompt {
  variantId: string
  variantName: string
  originalPrompt: string
  expandedPrompt: string
  subjectSlug: string
}

/**
 * Batch configuration for task generation
 */
export interface BatchConfig {
  countPerPrompt: number
  totalExpected: number
}

/**
 * Generation metadata attached to assets
 */
export interface GenerationMeta {
  taskId: string
  subjectSlug: string
  styleId: string
  modelId: string
  batchIndex: number
  finalPrompt: string
  negativePrompt?: string
  seed: number
  aspectRatio: AspectRatio
  providerParams?: Record<string, unknown>
}

/**
 * Model feature capabilities
 */
export type ModelFeature = 'batch' | 'seed' | 'negativePrompt'

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Select option for PayloadCMS collections
 */
export interface SelectOption {
  label: string
  value: string
}

/**
 * Task status options for PayloadCMS
 */
export const TASK_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Draft', value: TaskStatus.Draft },
  { label: 'Queued', value: TaskStatus.Queued },
  { label: 'Expanding', value: TaskStatus.Expanding },
  { label: 'Processing', value: TaskStatus.Processing },
  { label: 'Completed', value: TaskStatus.Completed },
  { label: 'Partial Failed', value: TaskStatus.PartialFailed },
  { label: 'Failed', value: TaskStatus.Failed },
]

/**
 * SubTask status options for PayloadCMS
 */
export const SUBTASK_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Pending', value: SubTaskStatus.Pending },
  { label: 'Processing', value: SubTaskStatus.Processing },
  { label: 'Success', value: SubTaskStatus.Success },
  { label: 'Failed', value: SubTaskStatus.Failed },
]

/**
 * Error category options for PayloadCMS
 */
export const ERROR_CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Rate Limited', value: ErrorCategory.RateLimited },
  { label: 'Content Filtered', value: ErrorCategory.ContentFiltered },
  { label: 'Invalid Input', value: ErrorCategory.InvalidInput },
  { label: 'Provider Error', value: ErrorCategory.ProviderError },
  { label: 'Network Error', value: ErrorCategory.NetworkError },
  { label: 'Timeout', value: ErrorCategory.Timeout },
  { label: 'Unknown', value: ErrorCategory.Unknown },
]

/**
 * Provider options for PayloadCMS
 */
export const PROVIDER_OPTIONS: SelectOption[] = [
  { label: 'Fal.ai (Flux)', value: Provider.Fal },
  { label: 'OpenAI (DALL-E)', value: Provider.OpenAI },
  { label: 'Google (Nano Banana)', value: Provider.Google },
]

/**
 * Asset type options for PayloadCMS
 */
export const ASSET_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Image', value: AssetType.Image },
  { label: 'Video', value: AssetType.Video },
]

/**
 * Aspect ratio options for PayloadCMS
 */
export const ASPECT_RATIO_OPTIONS: SelectOption[] = [
  { label: 'Square (1:1)', value: AspectRatio.Square },
  { label: 'Landscape (16:9)', value: AspectRatio.Landscape },
  { label: 'Portrait (9:16)', value: AspectRatio.Portrait },
  { label: 'Standard (4:3)', value: AspectRatio.Standard },
  { label: 'Standard Portrait (3:4)', value: AspectRatio.StandardPortrait },
]

// ============================================
// CONFIGURATION CONSTANTS
// ============================================

/**
 * Warning threshold for large batch submissions
 */
export const BATCH_WARNING_THRESHOLD = 500

/**
 * Default batch size per prompt
 */
export const DEFAULT_BATCH_SIZE = 1

/**
 * Maximum batch size per prompt
 */
export const MAX_BATCH_SIZE = 50

/**
 * Default number of prompt variants to generate
 */
export const DEFAULT_VARIANT_COUNT = 3

/**
 * Maximum retry attempts for failed sub-tasks
 */
export const MAX_RETRY_ATTEMPTS = 3

/**
 * Polling interval for task progress (in milliseconds)
 */
export const PROGRESS_POLL_INTERVAL = 5000
