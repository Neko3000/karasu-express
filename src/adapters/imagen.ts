/**
 * Imagen 3 Adapter (Google Cloud Vertex AI)
 *
 * Implementation of the ImageGenerationAdapter for Google's Imagen 3
 * (also known as "Nano Banana" internally).
 */

// Note: We use the REST API directly instead of the VertexAI SDK
// because the SDK doesn't have full image generation support yet

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
 * Imagen specific configuration
 */
export interface ImagenConfig {
  /** Google Cloud project ID */
  projectId?: string
  /** Google Cloud location/region */
  location?: string
  /** Safety setting level */
  safetySetting?: 'block_few' | 'block_some' | 'block_most'
}

/**
 * Default Imagen configuration
 */
const DEFAULT_IMAGEN_CONFIG: ImagenConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  safetySetting: 'block_some',
}

/**
 * Map aspect ratio to Imagen format
 */
const ASPECT_RATIO_TO_IMAGEN: Record<AspectRatio, string> = {
  [AspectRatio.Square]: '1:1',
  [AspectRatio.Landscape]: '16:9',
  [AspectRatio.Portrait]: '9:16',
  [AspectRatio.Standard]: '4:3',
  [AspectRatio.StandardPortrait]: '3:4',
}

/**
 * Approximate dimensions for aspect ratios (Imagen determines final size)
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
 * Supported aspect ratios for Imagen 3
 */
const IMAGEN_SUPPORTED_ASPECT_RATIOS: AspectRatio[] = [
  AspectRatio.Square,
  AspectRatio.Landscape,
  AspectRatio.Portrait,
  AspectRatio.Standard,
  AspectRatio.StandardPortrait,
]

/**
 * Imagen 3 Adapter using Google Cloud Vertex AI
 */
export class ImagenAdapter implements ImageGenerationAdapter {
  readonly providerId = Provider.Google
  readonly modelId = 'imagen-3'
  readonly displayName = 'Imagen 3 (Nano Banana)'

  private readonly config: ImagenConfig

  constructor(config?: ImagenConfig) {
    this.config = { ...DEFAULT_IMAGEN_CONFIG, ...config }
  }

  /**
   * Generate images using Imagen 3
   *
   * Note: Imagen 3 uses the Vertex AI REST API directly since the SDK
   * doesn't have full image generation support yet.
   */
  async generate(params: ImageGenerationParams): Promise<GenerationResult> {
    const aspectRatio = ASPECT_RATIO_TO_IMAGEN[params.aspectRatio]
    const dimensions = ASPECT_RATIO_DIMENSIONS[params.aspectRatio]

    // Build the request for Imagen 3
    const requestBody = {
      instances: [
        {
          prompt: params.prompt,
        },
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio,
        safetySetting: this.config.safetySetting,
        ...(params.providerOptions || {}),
      },
    }

    // Execute with rate limiting
    const response = await withRateLimit(
      this.providerId,
      async () => {
        return this.callImagenApi(requestBody)
      },
      60000 // Imagen can take longer
    )

    if (!response.predictions || response.predictions.length === 0) {
      throw createNormalizedError(
        ErrorCategory.ProviderError,
        'No images returned from Imagen',
        response,
        'NO_PREDICTIONS'
      )
    }

    // Convert base64 images to data URLs
    const images = response.predictions.map(
      (prediction: { bytesBase64Encoded: string; mimeType?: string }) => {
        const mimeType = prediction.mimeType || 'image/png'
        const dataUrl = `data:${mimeType};base64,${prediction.bytesBase64Encoded}`

        return {
          url: dataUrl,
          width: dimensions.width,
          height: dimensions.height,
          contentType: mimeType,
        }
      }
    )

    // Imagen doesn't provide seed - generate for consistency
    const seed = Math.floor(Math.random() * 2147483647)

    return {
      images,
      seed,
      metadata: {
        aspectRatio,
        safetySetting: this.config.safetySetting,
        ...response,
      },
    }
  }

  /**
   * Call Imagen API via Vertex AI REST endpoint
   */
  private async callImagenApi(requestBody: {
    instances: Array<{ prompt: string }>
    parameters: Record<string, unknown>
  }): Promise<{
    predictions: Array<{ bytesBase64Encoded: string; mimeType?: string }>
  }> {
    const projectId = this.config.projectId
    const location = this.config.location || 'us-central1'

    // Imagen 3 model endpoint
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`

    // Get access token from Google Cloud credentials
    const { GoogleAuth } = await import('google-auth-library') as typeof import('google-auth-library')
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })
    const client = await auth.getClient()
    const accessToken = await client.getAccessToken()

    if (!accessToken.token) {
      throw createNormalizedError(
        ErrorCategory.ProviderError,
        'Failed to obtain Google Cloud access token',
        null,
        'AUTH_FAILED'
      )
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData: unknown
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      throw { status: response.status, ...((errorData as object) || {}) }
    }

    return response.json()
  }

  /**
   * Normalize Google Cloud errors
   */
  normalizeError(error: unknown): NormalizedError {
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>

      // Google Cloud specific error shapes
      if (errorObj.status) {
        const status = errorObj.status as number

        // Rate limiting
        if (status === 429) {
          return createNormalizedError(
            ErrorCategory.RateLimited,
            (errorObj.message as string) || 'Google Cloud rate limit exceeded',
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
            (errorObj.message as string) || 'Google Cloud server error',
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
   * Get default options for Imagen
   */
  getDefaultOptions(): Record<string, unknown> {
    return {
      safetySetting: this.config.safetySetting,
    }
  }

  /**
   * Check if a feature is supported
   * Note: Imagen 3 supports batch generation but not seed or negative prompts
   */
  supportsFeature(feature: AdapterFeature): boolean {
    const supportedFeatures: AdapterFeature[] = ['batch']
    return supportedFeatures.includes(feature)
  }

  /**
   * Get supported aspect ratios
   */
  getSupportedAspectRatios(): AspectRatio[] {
    return IMAGEN_SUPPORTED_ASPECT_RATIOS
  }
}

/**
 * Factory function to create Imagen adapter
 */
export function createImagenAdapter(config?: ImagenConfig): ImagenAdapter {
  return new ImagenAdapter(config)
}
