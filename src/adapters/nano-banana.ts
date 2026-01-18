/**
 * Nano Banana Adapter (Google AI - Gemini 3 Pro Image)
 *
 * Implementation of the ImageGenerationAdapter for Google's Gemini image generation
 * using the @google/genai SDK with API key authentication.
 *
 * Model: gemini-3-pro-image-preview
 */

import { GoogleGenAI, Modality } from '@google/genai'

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
} from './types'

/**
 * Nano Banana specific configuration using Google AI API Key
 */
export interface NanoBananaConfig {
  /** Google AI API Key (from https://aistudio.google.com/apikey) */
  apiKey?: string
}

/**
 * Default Nano Banana configuration
 */
const DEFAULT_NANO_BANANA_CONFIG: NanoBananaConfig = {
  apiKey: process.env.GOOGLE_AI_API_KEY,
}

/**
 * Map aspect ratio to Google AI format
 */
const ASPECT_RATIO_TO_GOOGLE_AI: Record<AspectRatio, string> = {
  [AspectRatio.Square]: '1:1',
  [AspectRatio.Landscape]: '16:9',
  [AspectRatio.Portrait]: '9:16',
  [AspectRatio.Standard]: '4:3',
  [AspectRatio.StandardPortrait]: '3:4',
}

/**
 * Approximate dimensions for aspect ratios
 */
const ASPECT_RATIO_DIMENSIONS: Record<
  AspectRatio,
  { width: number; height: number }
> = {
  [AspectRatio.Square]: { width: 1024, height: 1024 },
  [AspectRatio.Landscape]: { width: 1408, height: 768 },
  [AspectRatio.Portrait]: { width: 768, height: 1408 },
  [AspectRatio.Standard]: { width: 1152, height: 896 },
  [AspectRatio.StandardPortrait]: { width: 896, height: 1152 },
}

/**
 * Supported aspect ratios for Nano Banana image generation
 */
const NANO_BANANA_SUPPORTED_ASPECT_RATIOS: AspectRatio[] = [
  AspectRatio.Square,
  AspectRatio.Landscape,
  AspectRatio.Portrait,
  AspectRatio.Standard,
  AspectRatio.StandardPortrait,
]

/**
 * Nano Banana Adapter using Google AI SDK (Gemini 3 Pro Image)
 */
export class NanoBananaAdapter implements ImageGenerationAdapter {
  readonly providerId = Provider.Google
  readonly modelId = 'nano-banana' // Must match the value in Tasks collection models field
  readonly displayName = 'Nano Banana'

  // Internal model name for API calls
  private readonly internalModelId = 'gemini-2.0-flash-preview-image-generation'

  private readonly config: NanoBananaConfig
  private genAI: GoogleGenAI | null = null

  constructor(config?: NanoBananaConfig) {
    this.config = { ...DEFAULT_NANO_BANANA_CONFIG, ...config }
  }

  /**
   * Get or create the GoogleGenAI client
   */
  private getClient(): GoogleGenAI {
    const apiKey = this.config.apiKey || process.env.GOOGLE_AI_API_KEY

    if (!apiKey) {
      throw createNormalizedError(
        ErrorCategory.ProviderError,
        'Google AI API key is required. Set GOOGLE_AI_API_KEY environment variable.',
        null,
        'API_KEY_MISSING'
      )
    }

    if (!this.genAI) {
      this.genAI = new GoogleGenAI({ apiKey })
    }

    return this.genAI
  }

  /**
   * Generate images using Nano Banana (Gemini 3 Pro Image)
   *
   * Uses the @google/genai SDK with models.generateContent API
   * that supports image generation through responseModalities configuration.
   */
  async generate(params: ImageGenerationParams): Promise<GenerationResult> {
    const aspectRatio = ASPECT_RATIO_TO_GOOGLE_AI[params.aspectRatio]
    const dimensions = ASPECT_RATIO_DIMENSIONS[params.aspectRatio]

    // Execute with rate limiting
    const response = await withRateLimit(
      this.providerId,
      async () => {
        return this.callGoogleAI(params.prompt, aspectRatio)
      },
      60000 // Gemini image generation can take longer
    )

    // Extract image data from response
    const candidates = response.candidates
    if (!candidates || candidates.length === 0) {
      throw createNormalizedError(
        ErrorCategory.ProviderError,
        'No image candidates returned from Nano Banana',
        response,
        'NO_CANDIDATES'
      )
    }

    // Find inline data parts (images) in the response
    const imageParts = candidates[0].content?.parts?.filter(
      (part: { inlineData?: { mimeType: string; data: string } }) =>
        part.inlineData
    ) || []

    if (imageParts.length === 0) {
      throw createNormalizedError(
        ErrorCategory.ProviderError,
        'No image data returned from Nano Banana',
        response,
        'NO_IMAGE_DATA'
      )
    }

    // Convert inline data to data URLs
    const images = imageParts.map(
      (part: { inlineData: { mimeType: string; data: string } }) => {
        const { mimeType, data } = part.inlineData
        const dataUrl = `data:${mimeType};base64,${data}`

        return {
          url: dataUrl,
          width: dimensions.width,
          height: dimensions.height,
          contentType: mimeType,
        }
      }
    )

    // Nano Banana doesn't provide seed - generate for consistency
    const seed = Math.floor(Math.random() * 2147483647)

    return {
      images,
      seed,
      metadata: {
        aspectRatio,
        model: this.modelId,
        ...response,
      },
    }
  }

  /**
   * Call Google AI SDK for image generation using the new @google/genai API
   */
  private async callGoogleAI(
    prompt: string,
    aspectRatio: string
  ): Promise<{
    candidates: Array<{
      content?: {
        parts?: Array<{
          text?: string
          inlineData?: { mimeType: string; data: string }
        }>
      }
    }>
    text?: string
  }> {
    const client = this.getClient()

    // Use the new @google/genai API: client.models.generateContent()
    // Note: Use internalModelId for the actual API call (Gemini model name)
    const response = await client.models.generateContent({
      model: this.internalModelId,
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        // @ts-expect-error - imageConfig is a valid config for image generation models
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    })

    return response
  }

  /**
   * Normalize Google AI errors
   */
  normalizeError(error: unknown): NormalizedError {
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>

      // Google AI specific error shapes
      if (errorObj.status) {
        const status = errorObj.status as number

        // Rate limiting
        if (status === 429) {
          return createNormalizedError(
            ErrorCategory.RateLimited,
            (errorObj.message as string) || 'Google AI rate limit exceeded',
            error,
            'RATE_LIMITED'
          )
        }

        // Content filtering
        if (status === 400) {
          const message = (errorObj.message as string) || ''
          if (
            message.toLowerCase().includes('safety') ||
            message.toLowerCase().includes('blocked') ||
            message.toLowerCase().includes('policy')
          ) {
            return createNormalizedError(
              ErrorCategory.ContentFiltered,
              message,
              error,
              'SAFETY_BLOCKED'
            )
          }
          return createNormalizedError(
            ErrorCategory.InvalidInput,
            message,
            error,
            'INVALID_INPUT'
          )
        }

        // Authentication errors
        if (status === 401 || status === 403) {
          return createNormalizedError(
            ErrorCategory.ProviderError,
            (errorObj.message as string) || 'Authentication failed',
            error,
            'AUTH_ERROR'
          )
        }

        // Server errors
        if (status >= 500) {
          return createNormalizedError(
            ErrorCategory.ProviderError,
            (errorObj.message as string) || 'Google AI server error',
            error,
            'SERVER_ERROR'
          )
        }
      }

      // Check for safety filter messages
      if (errorObj.message && typeof errorObj.message === 'string') {
        const msg = errorObj.message.toLowerCase()
        if (
          msg.includes('safety') ||
          msg.includes('blocked') ||
          msg.includes('policy')
        ) {
          return createNormalizedError(
            ErrorCategory.ContentFiltered,
            errorObj.message,
            error,
            'SAFETY_BLOCKED'
          )
        }
      }
    }

    // Fall back to base normalizer
    return baseNormalizeError(error)
  }

  /**
   * Get default options for Nano Banana image generation
   */
  getDefaultOptions(): Record<string, unknown> {
    return {
      aspectRatio: '1:1',
    }
  }

  /**
   * Check if a feature is supported
   * Note: Nano Banana image generation supports batch but not seed or negative prompts
   */
  supportsFeature(feature: AdapterFeature): boolean {
    const supportedFeatures: AdapterFeature[] = ['batch']
    return supportedFeatures.includes(feature)
  }

  /**
   * Get supported aspect ratios
   */
  getSupportedAspectRatios(): AspectRatio[] {
    return NANO_BANANA_SUPPORTED_ASPECT_RATIOS
  }
}

/**
 * Factory function to create Nano Banana adapter
 */
export function createNanoBananaAdapter(config?: NanoBananaConfig): NanoBananaAdapter {
  return new NanoBananaAdapter(config)
}
