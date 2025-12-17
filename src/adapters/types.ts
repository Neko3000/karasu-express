/**
 * AI Provider Adapter Types
 *
 * Common interface for all image generation adapters.
 * Each provider (Flux, DALL-E, Imagen) implements this interface.
 */

import type { AspectRatio, Provider } from '../lib/types'
import type { NormalizedError } from '../lib/error-normalizer'

// ============================================
// GENERATION PARAMETERS
// ============================================

/**
 * Parameters for image generation request
 */
export interface ImageGenerationParams {
  /** The positive prompt for generation */
  prompt: string
  /** Optional negative prompt (not supported by all providers) */
  negativePrompt?: string
  /** Desired aspect ratio */
  aspectRatio: AspectRatio
  /** Optional seed for reproducibility (not supported by all providers) */
  seed?: number
  /** Provider-specific options */
  providerOptions?: Record<string, unknown>
}

// ============================================
// GENERATION RESULTS
// ============================================

/**
 * Single generated image result
 */
export interface GeneratedImage {
  /** URL to the generated image */
  url: string
  /** Image width in pixels */
  width: number
  /** Image height in pixels */
  height: number
  /** MIME type (e.g., 'image/png') */
  contentType: string
}

/**
 * Result from a successful generation
 */
export interface GenerationResult {
  /** Array of generated images */
  images: GeneratedImage[]
  /** Seed used for generation (if available) */
  seed: number
  /** Timing information (if available) */
  timing?: {
    /** Inference time in milliseconds */
    inference: number
  }
  /** Raw provider response metadata */
  metadata: Record<string, unknown>
}

// ============================================
// ADAPTER INTERFACE
// ============================================

/**
 * Base interface for all image generation adapters
 *
 * Each AI provider must implement this interface to provide
 * a consistent API for the job handlers.
 */
export interface ImageGenerationAdapter {
  /** Provider identifier (e.g., 'fal', 'openai', 'google') */
  readonly providerId: Provider

  /** Model identifier (e.g., 'flux-pro', 'dalle-3', 'imagen-3') */
  readonly modelId: string

  /** Human-readable display name */
  readonly displayName: string

  /**
   * Generate images based on the provided parameters
   *
   * @param params - Generation parameters including prompt and settings
   * @returns Promise resolving to generation result with images
   * @throws Provider-specific errors that should be normalized
   */
  generate(params: ImageGenerationParams): Promise<GenerationResult>

  /**
   * Normalize a provider-specific error into a standard format
   *
   * @param error - The original error thrown by the provider SDK
   * @returns Normalized error with category and retryable flag
   */
  normalizeError(error: unknown): NormalizedError

  /**
   * Get default provider options for this adapter
   *
   * @returns Default options to merge with request parameters
   */
  getDefaultOptions(): Record<string, unknown>

  /**
   * Check if the adapter supports a specific feature
   *
   * @param feature - Feature name to check
   * @returns true if the feature is supported
   */
  supportsFeature(feature: AdapterFeature): boolean

  /**
   * Get supported aspect ratios for this adapter
   *
   * @returns Array of supported aspect ratios
   */
  getSupportedAspectRatios(): AspectRatio[]
}

// ============================================
// ADAPTER FEATURES
// ============================================

/**
 * Features that adapters may support
 */
export type AdapterFeature = 'seed' | 'negativePrompt' | 'batch' | 'inpainting'

// ============================================
// ADAPTER CONFIGURATION
// ============================================

/**
 * Configuration for initializing an adapter
 */
export interface AdapterConfig {
  /** API key or credentials */
  apiKey?: string
  /** Base URL override */
  baseUrl?: string
  /** Request timeout in milliseconds */
  timeoutMs?: number
  /** Provider-specific configuration */
  providerConfig?: Record<string, unknown>
}

// ============================================
// PROVIDER-SPECIFIC PAYLOAD TYPES
// ============================================

/**
 * Flux (Fal.ai) request payload
 */
export interface FluxRequestPayload {
  prompt: string
  image_size: {
    width: number
    height: number
  }
  num_inference_steps?: number
  guidance_scale?: number
  seed?: number
  num_images?: number
  safety_tolerance?: string
}

/**
 * Flux (Fal.ai) response data
 */
export interface FluxResponseData {
  images: Array<{
    url: string
    width: number
    height: number
    content_type: string
  }>
  timings?: {
    inference: number
  }
  seed: number
  has_nsfw_concepts?: boolean[]
}

/**
 * DALL-E 3 (OpenAI) request payload
 */
export interface DalleRequestPayload {
  model: 'dall-e-3'
  prompt: string
  n: number
  size: '1024x1024' | '1792x1024' | '1024x1792'
  quality: 'standard' | 'hd'
  style: 'vivid' | 'natural'
  response_format: 'url' | 'b64_json'
}

/**
 * DALL-E 3 (OpenAI) response data
 */
export interface DalleResponseData {
  created: number
  data: Array<{
    revised_prompt?: string
    url?: string
    b64_json?: string
  }>
}

/**
 * Imagen 3 (Google) request payload
 */
export interface ImagenRequestPayload {
  instances: Array<{
    prompt: string
  }>
  parameters: {
    sampleCount: number
    aspectRatio: string
    safetySetting?: 'block_few' | 'block_some' | 'block_most'
  }
}

/**
 * Imagen 3 (Google) response data
 */
export interface ImagenResponseData {
  predictions: Array<{
    bytesBase64Encoded: string
    mimeType: string
  }>
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Result type for operations that may fail
 */
export type AdapterResult<T> =
  | { success: true; data: T }
  | { success: false; error: NormalizedError }

/**
 * Async adapter result type
 */
export type AsyncAdapterResult<T> = Promise<AdapterResult<T>>
