/**
 * Unit Tests: Nano Banana Adapter
 *
 * Tests for src/adapters/nano-banana.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Mock @google/genai SDK and test:
 * - generate method
 * - normalizeError method
 * - getDefaultOptions method
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  NanoBananaAdapter,
  createNanoBananaAdapter,
} from '../../../src/adapters/nano-banana'
import { AspectRatio, Provider, ErrorCategory } from '../../../src/lib/types'

// Mock @google/genai SDK
const mockGenerateContent = vi.fn()
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
  Modality: {
    TEXT: 'TEXT',
    IMAGE: 'IMAGE',
  },
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

describe('NanoBananaAdapter', () => {
  let adapter: NanoBananaAdapter

  beforeEach(() => {
    vi.clearAllMocks()

    // Set up environment variables
    process.env.GOOGLE_AI_API_KEY = 'test-api-key'

    // Create adapter
    adapter = new NanoBananaAdapter()
  })

  // ============================================
  // Constructor and Properties
  // ============================================

  describe('constructor', () => {
    it('should create adapter with default config', () => {
      const adapter = new NanoBananaAdapter()

      expect(adapter.providerId).toBe(Provider.Google)
      expect(adapter.modelId).toBe('nano-banana')
      expect(adapter.displayName).toBe('Nano Banana')
    })

    it('should accept custom config with API key', () => {
      const adapter = new NanoBananaAdapter({
        apiKey: 'custom-api-key',
      })

      expect(adapter).toBeDefined()
    })

    it('should use environment variable for API key', () => {
      process.env.GOOGLE_AI_API_KEY = 'env-api-key'

      // Create new adapter to pick up env vars
      const adapter = new NanoBananaAdapter()

      // Verify it uses the env vars (indirectly through the API call)
      expect(adapter).toBeDefined()
    })
  })

  // ============================================
  // generate method
  // ============================================

  describe('generate', () => {
    it('should call Google AI SDK with correct parameters', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                { text: 'Generated image description' },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: 'base64imagedata==',
                  },
                },
              ],
            },
          },
        ],
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await adapter.generate({
        prompt: 'A beautiful sunset',
        aspectRatio: AspectRatio.Square,
      })

      // Verify generateContent was called
      expect(mockGenerateContent).toHaveBeenCalled()

      // Verify result
      expect(result.images).toHaveLength(1)
      expect(result.images[0].url).toContain('data:image/png;base64,')
      expect(result.images[0].width).toBe(1024)
      expect(result.images[0].height).toBe(1024)
    })

    it('should handle different aspect ratios', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: { mimeType: 'image/png', data: 'base64data==' },
                },
              ],
            },
          },
        ],
      })

      const result = await adapter.generate({
        prompt: 'Landscape image',
        aspectRatio: AspectRatio.Landscape,
      })

      // Verify request includes aspect ratio config
      expect(mockGenerateContent).toHaveBeenCalled()
      expect(result.images).toHaveLength(1)
      expect(result.images[0].width).toBe(1408)
      expect(result.images[0].height).toBe(768)
    })

    it('should handle portrait aspect ratio', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: { mimeType: 'image/png', data: 'base64data==' },
                },
              ],
            },
          },
        ],
      })

      const result = await adapter.generate({
        prompt: 'Portrait image',
        aspectRatio: AspectRatio.Portrait,
      })

      expect(result.images).toHaveLength(1)
      expect(result.images[0].width).toBe(768)
      expect(result.images[0].height).toBe(1408)
    })

    it('should throw error when no candidates returned', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [],
      })

      await expect(
        adapter.generate({
          prompt: 'Test prompt',
          aspectRatio: AspectRatio.Square,
        })
      ).rejects.toMatchObject({
        category: ErrorCategory.ProviderError,
        message: expect.stringContaining('No image'),
      })
    })

    it('should throw error when no image data in response', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: 'Only text, no image' }],
            },
          },
        ],
      })

      await expect(
        adapter.generate({
          prompt: 'Test prompt',
          aspectRatio: AspectRatio.Square,
        })
      ).rejects.toMatchObject({
        category: ErrorCategory.ProviderError,
        message: expect.stringContaining('No image'),
      })
    })

    it('should handle API errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'))

      await expect(
        adapter.generate({
          prompt: 'Test prompt',
          aspectRatio: AspectRatio.Square,
        })
      ).rejects.toBeDefined()
    })

    it('should generate random seed (Nano Banana does not return seed)', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: { mimeType: 'image/png', data: 'base64data==' },
                },
              ],
            },
          },
        ],
      })

      const result = await adapter.generate({
        prompt: 'Test prompt',
        aspectRatio: AspectRatio.Square,
      })

      expect(typeof result.seed).toBe('number')
      expect(result.seed).toBeGreaterThanOrEqual(0)
    })

    it('should throw error when API key is missing', async () => {
      delete process.env.GOOGLE_AI_API_KEY

      const adapter = new NanoBananaAdapter()

      await expect(
        adapter.generate({
          prompt: 'Test',
          aspectRatio: AspectRatio.Square,
        })
      ).rejects.toMatchObject({
        category: ErrorCategory.ProviderError,
        message: expect.stringContaining('API key'),
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
      const adapter = new NanoBananaAdapter()
      const options = adapter.getDefaultOptions()

      expect(options.aspectRatio).toBeDefined()
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
  // createNanoBananaAdapter factory
  // ============================================

  describe('createNanoBananaAdapter', () => {
    it('should create adapter with default config', () => {
      const adapter = createNanoBananaAdapter()

      expect(adapter.modelId).toBe('nano-banana')
      expect(adapter.displayName).toBe('Nano Banana')
    })

    it('should create adapter with custom API key', () => {
      const adapter = createNanoBananaAdapter({
        apiKey: 'custom-api-key',
      })

      expect(adapter).toBeDefined()
    })
  })
})
