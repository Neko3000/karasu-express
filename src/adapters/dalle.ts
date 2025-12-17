/**
 * DALL-E 3 Adapter (OpenAI)
 *
 * Implementation of the ImageGenerationAdapter for OpenAI DALL-E 3.
 */

import OpenAI from 'openai'

import { AspectRatio, Provider } from '../lib/types'
import {
  normalizeError as baseNormalizeError,
  createNormalizedError,
  type NormalizedError,
} from '../lib/error-normalizer'
import { ErrorCategory } from '../lib/types'
import { withRateLimit } from '../lib/rate-limiter'

import type {
  ImageGenerationAdapter,
  ImageGenerationParams,
  GenerationResult,
  AdapterFeature,
  DalleRequestPayload,
  DalleResponseData,
} from './types'

/**
 * DALL-E specific configuration
 */
export interface DalleConfig {
  /** Quality level: 'standard' or 'hd' */
  quality?: 'standard' | 'hd'
  /** Style: 'vivid' or 'natural' */
  style?: 'vivid' | 'natural'
}

/**
 * Default DALL-E configuration
 */
const DEFAULT_DALLE_CONFIG: DalleConfig = {
  quality: 'hd',
  style: 'vivid',
}

/**
 * Map aspect ratio to DALL-E size
 */
const ASPECT_RATIO_TO_SIZE: Record<
  AspectRatio,
  '1024x1024' | '1792x1024' | '1024x1792'
> = {
  [AspectRatio.Square]: '1024x1024',
  [AspectRatio.Landscape]: '1792x1024',
  [AspectRatio.Portrait]: '1024x1792',
  // Map other ratios to closest supported size
  [AspectRatio.Standard]: '1792x1024',
  [AspectRatio.StandardPortrait]: '1024x1792',
}

/**
 * Size to dimensions mapping
 */
const SIZE_TO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1024x1024': { width: 1024, height: 1024 },
  '1792x1024': { width: 1792, height: 1024 },
  '1024x1792': { width: 1024, height: 1792 },
}

/**
 * Supported aspect ratios for DALL-E 3
 * Note: Only Square, Landscape, and Portrait are natively supported
 */
const DALLE_SUPPORTED_ASPECT_RATIOS: AspectRatio[] = [
  AspectRatio.Square,
  AspectRatio.Landscape,
  AspectRatio.Portrait,
]

/**
 * DALL-E 3 Adapter using OpenAI API
 */
export class DalleAdapter implements ImageGenerationAdapter {
  readonly providerId = Provider.OpenAI
  readonly modelId = 'dalle-3'
  readonly displayName = 'DALL-E 3'

  private readonly client: OpenAI
  private readonly config: DalleConfig

  constructor(config?: DalleConfig) {
    this.config = { ...DEFAULT_DALLE_CONFIG, ...config }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Generate images using DALL-E 3
   */
  async generate(params: ImageGenerationParams): Promise<GenerationResult> {
    const size = ASPECT_RATIO_TO_SIZE[params.aspectRatio]
    const dimensions = SIZE_TO_DIMENSIONS[size]

    // DALL-E 3 only supports n=1
    const requestPayload: DalleRequestPayload = {
      model: 'dall-e-3',
      prompt: params.prompt,
      n: 1,
      size,
      quality: this.config.quality || 'hd',
      style: this.config.style || 'vivid',
      response_format: 'url',
    }

    // Merge provider options (but maintain type constraints)
    if (params.providerOptions) {
      if (params.providerOptions.quality) {
        requestPayload.quality = params.providerOptions.quality as
          | 'standard'
          | 'hd'
      }
      if (params.providerOptions.style) {
        requestPayload.style = params.providerOptions.style as
          | 'vivid'
          | 'natural'
      }
    }

    // Execute with rate limiting
    const response = await withRateLimit(
      this.providerId,
      async () => {
        return this.client.images.generate(requestPayload)
      },
      30000
    )

    const responseData = response as DalleResponseData

    if (!responseData.data || responseData.data.length === 0) {
      throw createNormalizedError(
        ErrorCategory.ProviderError,
        'No images returned from DALL-E',
        responseData,
        'NO_IMAGES'
      )
    }

    const images = responseData.data
      .filter((img) => img.url)
      .map((img) => ({
        url: img.url!,
        width: dimensions.width,
        height: dimensions.height,
        contentType: 'image/png',
      }))

    // DALL-E 3 doesn't support seed - generate a random one for consistency
    const seed = Math.floor(Math.random() * 2147483647)

    return {
      images,
      seed,
      metadata: {
        created: responseData.created,
        revisedPrompt: responseData.data[0]?.revised_prompt,
      },
    }
  }

  /**
   * Normalize OpenAI errors
   */
  normalizeError(error: unknown): NormalizedError {
    // Check for OpenAI API error shapes
    if (error instanceof OpenAI.APIError) {
      const { status, message, code } = error

      // Content policy violations
      if (
        code === 'content_policy_violation' ||
        message.toLowerCase().includes('safety')
      ) {
        return createNormalizedError(
          ErrorCategory.ContentFiltered,
          message,
          error,
          code || undefined
        )
      }

      // Rate limiting
      if (status === 429) {
        return createNormalizedError(
          ErrorCategory.RateLimited,
          message,
          error,
          code || undefined
        )
      }

      // Invalid request
      if (status === 400) {
        return createNormalizedError(
          ErrorCategory.InvalidInput,
          message,
          error,
          code || undefined
        )
      }

      // Authentication errors
      if (status === 401 || status === 403) {
        return createNormalizedError(
          ErrorCategory.ProviderError,
          message,
          error,
          code || undefined
        )
      }

      // Server errors
      if (status && status >= 500) {
        return createNormalizedError(
          ErrorCategory.ProviderError,
          message,
          error,
          code || undefined
        )
      }
    }

    // Fall back to base normalizer
    return baseNormalizeError(error)
  }

  /**
   * Get default options for DALL-E 3
   */
  getDefaultOptions(): Record<string, unknown> {
    return {
      quality: this.config.quality,
      style: this.config.style,
    }
  }

  /**
   * Check if a feature is supported
   * Note: DALL-E 3 does NOT support seed or negative prompts
   */
  supportsFeature(feature: AdapterFeature): boolean {
    // DALL-E 3 has very limited feature support
    const supportedFeatures: AdapterFeature[] = []
    return supportedFeatures.includes(feature)
  }

  /**
   * Get supported aspect ratios
   */
  getSupportedAspectRatios(): AspectRatio[] {
    return DALLE_SUPPORTED_ASPECT_RATIOS
  }
}

/**
 * Factory function to create DALL-E adapter
 */
export function createDalleAdapter(config?: DalleConfig): DalleAdapter {
  return new DalleAdapter(config)
}
