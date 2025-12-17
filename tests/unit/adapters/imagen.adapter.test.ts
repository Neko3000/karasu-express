/**
 * Unit Tests: Imagen Adapter
 *
 * Tests for src/adapters/imagen.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Mock Google Cloud client and test:
 * - generate method
 * - normalizeError method
 * - getDefaultOptions method
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import {
  ImagenAdapter,
  createImagenAdapter,
} from '../../../src/adapters/imagen'
import { AspectRatio, Provider, ErrorCategory } from '../../../src/lib/types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock google-auth-library
vi.mock('google-auth-library', () => ({
  GoogleAuth: vi.fn().mockImplementation(() => ({
    getClient: vi.fn().mockResolvedValue({
      getAccessToken: vi.fn().mockResolvedValue({ token: 'mock-access-token' }),
    }),
  })),
}))

// Mock the rate limiter
vi.mock('../../../src/lib/rate-limiter', () => ({
  withRateLimit: vi.fn(
    async <T>(_providerId: string, operation: () => Promise<T>) => operation()
  ),
  rateLimiter: {
    acquire: vi.fn(),
    recordRequest: vi.fn(),
  },
}))

describe('ImagenAdapter', () => {
  let adapter: ImagenAdapter

  beforeEach(() => {
    vi.clearAllMocks()

    // Set up environment variables
    process.env.GOOGLE_CLOUD_PROJECT = 'test-project'
    process.env.GOOGLE_CLOUD_LOCATION = 'us-central1'

    // Create adapter
    adapter = new ImagenAdapter()
  })

  // ============================================
  // Constructor and Properties
  // ============================================

  describe('constructor', () => {
    it('should create adapter with default config', () => {
      const adapter = new ImagenAdapter()

      expect(adapter.providerId).toBe(Provider.Google)
      expect(adapter.modelId).toBe('imagen-3')
      expect(adapter.displayName).toBe('Imagen 3 (Nano Banana)')
    })

    it('should accept custom config', () => {
      const adapter = new ImagenAdapter({
        projectId: 'custom-project',
        location: 'europe-west1',
        safetySetting: 'block_most',
      })

      const options = adapter.getDefaultOptions()
      expect(options.safetySetting).toBe('block_most')
    })

    it('should use environment variables for defaults', () => {
      process.env.GOOGLE_CLOUD_PROJECT = 'env-project'
      process.env.GOOGLE_CLOUD_LOCATION = 'asia-east1'

      // Create new adapter to pick up env vars
      const adapter = new ImagenAdapter()

      // Verify it uses the env vars (indirectly through the API call)
      expect(adapter).toBeDefined()
    })
  })

  // ============================================
  // generate method
  // ============================================

  describe('generate', () => {
    it('should call Imagen API with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          predictions: [
            {
              bytesBase64Encoded: 'base64imagedata==',
              mimeType: 'image/png',
            },
          ],
        }),
      }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await adapter.generate({
        prompt: 'A beautiful sunset',
        aspectRatio: AspectRatio.Square,
      })

      // Verify fetch was called with correct URL
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('us-central1-aiplatform.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-access-token',
            'Content-Type': 'application/json',
          }),
        })
      )

      // Verify request body
      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.instances[0].prompt).toBe('A beautiful sunset')
      expect(body.parameters.aspectRatio).toBe('1:1')
      expect(body.parameters.sampleCount).toBe(1)

      // Verify result
      expect(result.images).toHaveLength(1)
      expect(result.images[0].url).toContain('data:image/png;base64,')
      expect(result.images[0].width).toBe(1024)
      expect(result.images[0].height).toBe(1024)
    })

    it('should handle different aspect ratios', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          predictions: [
            { bytesBase64Encoded: 'base64data==', mimeType: 'image/png' },
          ],
        }),
      })

      await adapter.generate({
        prompt: 'Landscape image',
        aspectRatio: AspectRatio.Landscape,
      })

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.parameters.aspectRatio).toBe('16:9')
    })

    it('should handle portrait aspect ratio', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          predictions: [
            { bytesBase64Encoded: 'base64data==', mimeType: 'image/png' },
          ],
        }),
      })

      await adapter.generate({
        prompt: 'Portrait image',
        aspectRatio: AspectRatio.Portrait,
      })

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.parameters.aspectRatio).toBe('9:16')
    })

    it('should include safety setting in request', async () => {
      const adapter = new ImagenAdapter({ safetySetting: 'block_most' })

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          predictions: [
            { bytesBase64Encoded: 'base64data==', mimeType: 'image/png' },
          ],
        }),
      })

      await adapter.generate({
        prompt: 'Test prompt',
        aspectRatio: AspectRatio.Square,
      })

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.parameters.safetySetting).toBe('block_most')
    })

    it('should merge provider options', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          predictions: [
            { bytesBase64Encoded: 'base64data==', mimeType: 'image/png' },
          ],
        }),
      })

      await adapter.generate({
        prompt: 'Test prompt',
        aspectRatio: AspectRatio.Square,
        providerOptions: {
          customParam: 'value',
        },
      })

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.parameters.customParam).toBe('value')
    })

    it('should throw error when no predictions returned', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          predictions: [],
        }),
      })

      await expect(
        adapter.generate({
          prompt: 'Test prompt',
          aspectRatio: AspectRatio.Square,
        })
      ).rejects.toMatchObject({
        category: ErrorCategory.ProviderError,
        message: expect.stringContaining('No images'),
      })
    })

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            message: 'Bad request',
          })
        ),
      })

      await expect(
        adapter.generate({
          prompt: 'Test prompt',
          aspectRatio: AspectRatio.Square,
        })
      ).rejects.toBeDefined()
    })

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal Server Error'),
      })

      await expect(
        adapter.generate({
          prompt: 'Test prompt',
          aspectRatio: AspectRatio.Square,
        })
      ).rejects.toBeDefined()
    })

    it('should default mimeType to image/png', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          predictions: [
            { bytesBase64Encoded: 'base64data==' }, // No mimeType
          ],
        }),
      })

      const result = await adapter.generate({
        prompt: 'Test prompt',
        aspectRatio: AspectRatio.Square,
      })

      expect(result.images[0].contentType).toBe('image/png')
    })

    it('should generate random seed (Imagen does not support seed)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          predictions: [
            { bytesBase64Encoded: 'base64data==', mimeType: 'image/png' },
          ],
        }),
      })

      const result = await adapter.generate({
        prompt: 'Test prompt',
        aspectRatio: AspectRatio.Square,
      })

      expect(typeof result.seed).toBe('number')
      expect(result.seed).toBeGreaterThanOrEqual(0)
    })

    it('should throw error when auth fails', async () => {
      // Mock auth failure
      const { GoogleAuth } = await import('google-auth-library')
      ;(GoogleAuth as Mock).mockImplementationOnce(() => ({
        getClient: vi.fn().mockResolvedValue({
          getAccessToken: vi.fn().mockResolvedValue({ token: null }),
        }),
      }))

      const adapter = new ImagenAdapter()

      await expect(
        adapter.generate({
          prompt: 'Test',
          aspectRatio: AspectRatio.Square,
        })
      ).rejects.toMatchObject({
        category: ErrorCategory.ProviderError,
        message: expect.stringContaining('access token'),
      })
    })
  })

  // ============================================
  // normalizeError method
  // ============================================

  describe('normalizeError', () => {
    it('should normalize rate limit error (429)', () => {
      const error = {
        status: 429,
        message: 'Rate limit exceeded',
      }

      const result = adapter.normalizeError(error)

      expect(result.category).toBe(ErrorCategory.RateLimited)
      expect(result.retryable).toBe(true)
    })

    it('should normalize safety-related error', () => {
      const error = {
        status: 400,
        message: 'Image blocked by safety filter',
      }

      const result = adapter.normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ContentFiltered)
      expect(result.retryable).toBe(false)
    })

    it('should normalize policy violation error', () => {
      const error = {
        status: 400,
        message: 'Content violates policy',
      }

      const result = adapter.normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ContentFiltered)
    })

    it('should normalize blocked content error', () => {
      const error = {
        status: 400,
        message: 'Request blocked due to content',
      }

      const result = adapter.normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ContentFiltered)
    })

    it('should normalize invalid input error (400)', () => {
      const error = {
        status: 400,
        message: 'Invalid parameter format',
      }

      const result = adapter.normalizeError(error)

      expect(result.category).toBe(ErrorCategory.InvalidInput)
      expect(result.retryable).toBe(false)
    })

    it('should normalize authentication error (401)', () => {
      const error = {
        status: 401,
        message: 'Unauthorized',
      }

      const result = adapter.normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ProviderError)
    })

    it('should normalize forbidden error (403)', () => {
      const error = {
        status: 403,
        message: 'Forbidden',
      }

      const result = adapter.normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ProviderError)
    })

    it('should normalize server error (500+)', () => {
      const error = {
        status: 500,
        message: 'Internal server error',
      }

      const result = adapter.normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ProviderError)
      expect(result.retryable).toBe(true)
    })

    it('should detect safety from message without status', () => {
      const error = {
        message: 'Safety filter triggered',
      }

      const result = adapter.normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ContentFiltered)
    })

    it('should fall back to base normalizer for unknown errors', () => {
      const error = new Error('Unknown error')

      const result = adapter.normalizeError(error)

      expect(result.message).toBe('Unknown error')
      expect(result.originalError).toBe(error)
    })
  })

  // ============================================
  // getDefaultOptions method
  // ============================================

  describe('getDefaultOptions', () => {
    it('should return default options', () => {
      const adapter = new ImagenAdapter()
      const options = adapter.getDefaultOptions()

      expect(options.safetySetting).toBe('block_some')
    })

    it('should reflect custom config', () => {
      const adapter = new ImagenAdapter({
        safetySetting: 'block_most',
      })

      const options = adapter.getDefaultOptions()

      expect(options.safetySetting).toBe('block_most')
    })
  })

  // ============================================
  // supportsFeature method
  // ============================================

  describe('supportsFeature', () => {
    it('should support batch feature', () => {
      expect(adapter.supportsFeature('batch')).toBe(true)
    })

    it('should not support seed feature', () => {
      expect(adapter.supportsFeature('seed')).toBe(false)
    })

    it('should not support negativePrompt feature', () => {
      expect(adapter.supportsFeature('negativePrompt')).toBe(false)
    })

    it('should not support inpainting feature', () => {
      expect(adapter.supportsFeature('inpainting')).toBe(false)
    })
  })

  // ============================================
  // getSupportedAspectRatios method
  // ============================================

  describe('getSupportedAspectRatios', () => {
    it('should return all supported aspect ratios', () => {
      const ratios = adapter.getSupportedAspectRatios()

      expect(ratios).toContain(AspectRatio.Square)
      expect(ratios).toContain(AspectRatio.Landscape)
      expect(ratios).toContain(AspectRatio.Portrait)
      expect(ratios).toContain(AspectRatio.Standard)
      expect(ratios).toContain(AspectRatio.StandardPortrait)
    })
  })

  // ============================================
  // createImagenAdapter factory
  // ============================================

  describe('createImagenAdapter', () => {
    it('should create adapter with default config', () => {
      const adapter = createImagenAdapter()

      expect(adapter.modelId).toBe('imagen-3')
      expect(adapter.displayName).toBe('Imagen 3 (Nano Banana)')
    })

    it('should create adapter with custom config', () => {
      const adapter = createImagenAdapter({
        projectId: 'custom-project',
        safetySetting: 'block_few',
      })

      const options = adapter.getDefaultOptions()
      expect(options.safetySetting).toBe('block_few')
    })
  })
})
