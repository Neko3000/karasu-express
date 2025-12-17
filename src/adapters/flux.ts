/**
 * Flux Adapter (Fal.ai)
 *
 * Implementation of the ImageGenerationAdapter for Fal.ai Flux models.
 * Supports Flux Pro and Flux Dev models.
 */

import { fal } from '@fal-ai/client'

import { AspectRatio, Provider, ASPECT_RATIO_DIMENSIONS } from '../lib/types'
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
  FluxRequestPayload,
  FluxResponseData,
} from './types'

/**
 * Flux-specific configuration
 */
export interface FluxConfig {
  /** Number of inference steps (higher = better quality, slower) */
  numInferenceSteps?: number
  /** Guidance scale (higher = more prompt adherence) */
  guidanceScale?: number
  /** Safety tolerance level */
  safetyTolerance?: '0' | '1' | '2' | '3' | '4' | '5' | '6'
}

/**
 * Default Flux configuration
 */
const DEFAULT_FLUX_CONFIG: FluxConfig = {
  numInferenceSteps: 25,
  guidanceScale: 3.5,
  safetyTolerance: '2',
}

/**
 * Supported aspect ratios for Flux
 */
const FLUX_SUPPORTED_ASPECT_RATIOS: AspectRatio[] = [
  AspectRatio.Square,
  AspectRatio.Landscape,
  AspectRatio.Portrait,
  AspectRatio.Standard,
  AspectRatio.StandardPortrait,
]

/**
 * Configure Fal.ai client with API key
 */
function configureFalClient(): void {
  if (process.env.FAL_API_KEY) {
    fal.config({
      credentials: process.env.FAL_API_KEY,
    })
  }
}

/**
 * Flux Pro Adapter using Fal.ai
 */
export class FluxAdapter implements ImageGenerationAdapter {
  readonly providerId = Provider.Fal
  readonly modelId: string
  readonly displayName: string

  private readonly falModelId: string
  private readonly config: FluxConfig

  constructor(
    modelId = 'flux-pro',
    displayName = 'Flux Pro',
    config?: FluxConfig
  ) {
    this.modelId = modelId
    this.displayName = displayName
    this.config = { ...DEFAULT_FLUX_CONFIG, ...config }

    // Map model IDs to Fal.ai model endpoints
    this.falModelId = this.mapModelIdToFalEndpoint(modelId)

    // Configure Fal client
    configureFalClient()
  }

  /**
   * Map our model IDs to Fal.ai endpoints
   */
  private mapModelIdToFalEndpoint(modelId: string): string {
    const mapping: Record<string, string> = {
      'flux-pro': 'fal-ai/flux-pro',
      'flux-dev': 'fal-ai/flux/dev',
      'flux-schnell': 'fal-ai/flux/schnell',
    }
    return mapping[modelId] || 'fal-ai/flux-pro'
  }

  /**
   * Generate images using Flux via Fal.ai
   */
  async generate(params: ImageGenerationParams): Promise<GenerationResult> {
    const { width, height } = ASPECT_RATIO_DIMENSIONS[params.aspectRatio]

    const requestPayload: FluxRequestPayload = {
      prompt: params.prompt,
      image_size: { width, height },
      num_inference_steps: this.config.numInferenceSteps,
      guidance_scale: this.config.guidanceScale,
      safety_tolerance: this.config.safetyTolerance,
      num_images: 1,
    }

    // Add seed if provided
    if (params.seed !== undefined) {
      requestPayload.seed = params.seed
    }

    // Merge provider options
    if (params.providerOptions) {
      Object.assign(requestPayload, params.providerOptions)
    }

    // Execute with rate limiting
    const result = await withRateLimit(
      this.providerId,
      async () => {
        const response = await fal.subscribe(this.falModelId, {
          input: requestPayload as unknown as Record<string, unknown>,
          logs: false,
        })
        return response as unknown as FluxResponseData
      },
      30000
    )

    const responseData = result

    // Check for NSFW content filtering
    if (responseData.has_nsfw_concepts?.some((hasNsfw) => hasNsfw)) {
      throw createNormalizedError(
        ErrorCategory.ContentFiltered,
        'Image was flagged for NSFW content',
        responseData,
        'NSFW_DETECTED'
      )
    }

    return {
      images: responseData.images.map((img) => ({
        url: img.url,
        width: img.width,
        height: img.height,
        contentType: img.content_type || 'image/png',
      })),
      seed: responseData.seed,
      timing: responseData.timings
        ? { inference: responseData.timings.inference }
        : undefined,
      metadata: {
        ...responseData,
      },
    }
  }

  /**
   * Normalize Fal.ai errors
   */
  normalizeError(error: unknown): NormalizedError {
    // Check for Fal.ai specific error shapes
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>

      // Fal.ai validation errors
      if (errorObj.detail && typeof errorObj.detail === 'string') {
        if (errorObj.detail.toLowerCase().includes('content policy')) {
          return createNormalizedError(
            ErrorCategory.ContentFiltered,
            errorObj.detail,
            error,
            'CONTENT_POLICY_VIOLATION'
          )
        }
      }

      // Fal.ai rate limiting
      if (errorObj.status === 429) {
        return createNormalizedError(
          ErrorCategory.RateLimited,
          'Fal.ai rate limit exceeded',
          error,
          'RATE_LIMITED'
        )
      }
    }

    // Fall back to base normalizer
    return baseNormalizeError(error)
  }

  /**
   * Get default options for Flux
   */
  getDefaultOptions(): Record<string, unknown> {
    return {
      num_inference_steps: this.config.numInferenceSteps,
      guidance_scale: this.config.guidanceScale,
      safety_tolerance: this.config.safetyTolerance,
    }
  }

  /**
   * Check if a feature is supported
   */
  supportsFeature(feature: AdapterFeature): boolean {
    const supportedFeatures: AdapterFeature[] = ['seed', 'negativePrompt']
    return supportedFeatures.includes(feature)
  }

  /**
   * Get supported aspect ratios
   */
  getSupportedAspectRatios(): AspectRatio[] {
    return FLUX_SUPPORTED_ASPECT_RATIOS
  }
}

/**
 * Factory function to create Flux adapter instances
 */
export function createFluxAdapter(
  variant: 'pro' | 'dev' | 'schnell' = 'pro',
  config?: FluxConfig
): FluxAdapter {
  const variants = {
    pro: { modelId: 'flux-pro', displayName: 'Flux Pro' },
    dev: { modelId: 'flux-dev', displayName: 'Flux Dev' },
    schnell: { modelId: 'flux-schnell', displayName: 'Flux Schnell' },
  }

  const { modelId, displayName } = variants[variant]
  return new FluxAdapter(modelId, displayName, config)
}
