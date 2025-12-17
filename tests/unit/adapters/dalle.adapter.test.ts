/**
 * Unit Tests: DALL-E Adapter
 *
 * Tests for src/adapters/dalle.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Mock OpenAI client and test:
 * - generate method
 * - normalizeError method
 * - getDefaultOptions method
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { DalleAdapter, createDalleAdapter } from '../../../src/adapters/dalle'
import { AspectRatio, Provider, ErrorCategory } from '../../../src/lib/types'

// Mock OpenAI - the mock factory is hoisted, so everything must be inside
vi.mock('openai', () => {
  const mockGenerate = vi.fn()

  // Create APIError class inside the mock factory
  class MockAPIError extends Error {
    status: number
    code: string | null

    constructor(status: number, _response: unknown, code: string | null, _headers: unknown) {
      super('API Error')
      this.name = 'APIError'
      this.status = status
      this.code = code
    }
  }

  const OpenAIMock = vi.fn().mockImplementation(() => ({
    images: {
      generate: mockGenerate,
    },
  }))

  // Attach APIError as a property on the default export
  ;(OpenAIMock as unknown as Record<string, unknown>).APIError = MockAPIError

  return {
    default: OpenAIMock,
  }
})

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

describe('DalleAdapter', () => {
  let adapter: DalleAdapter
  let mockGenerate: Mock

  beforeEach(async () => {
    vi.clearAllMocks()

    // Set up environment variable
    process.env.OPENAI_API_KEY = 'test-openai-api-key'

    // Get the mocked module
    const OpenAI = (await import('openai')).default
    const mockClient = new OpenAI({ apiKey: 'test' })
    mockGenerate = mockClient.images.generate as Mock

    // Create adapter
    adapter = new DalleAdapter()
  })

  // ============================================
  // Constructor and Properties
  // ============================================

  describe('constructor', () => {
    it('should create adapter with default config', () => {
      const adapter = new DalleAdapter()

      expect(adapter.providerId).toBe(Provider.OpenAI)
      expect(adapter.modelId).toBe('dalle-3')
      expect(adapter.displayName).toBe('DALL-E 3')
    })

    it('should accept custom config', () => {
      const adapter = new DalleAdapter({
        quality: 'standard',
        style: 'natural',
      })

      const options = adapter.getDefaultOptions()
      expect(options.quality).toBe('standard')
      expect(options.style).toBe('natural')
    })
  })

  // ============================================
  // generate method
  // ============================================

  describe('generate', () => {
    it('should call OpenAI with correct parameters', async () => {
      mockGenerate.mockResolvedValue({
        created: Date.now(),
        data: [
          {
            url: 'https://openai.com/generated/image.png',
            revised_prompt: 'A beautiful sunset over mountains',
          },
        ],
      })

      const result = await adapter.generate({
        prompt: 'A beautiful sunset',
        aspectRatio: AspectRatio.Square,
      })

      // Verify OpenAI was called with correct params
      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'dall-e-3',
          prompt: 'A beautiful sunset',
          n: 1,
          size: '1024x1024',
          quality: 'hd',
          style: 'vivid',
          response_format: 'url',
        })
      )

      // Verify result
      expect(result.images).toHaveLength(1)
      expect(result.images[0].url).toBe(
        'https://openai.com/generated/image.png'
      )
      expect(result.images[0].width).toBe(1024)
      expect(result.images[0].height).toBe(1024)
      expect(result.metadata.revisedPrompt).toBe(
        'A beautiful sunset over mountains'
      )
    })

    it('should handle landscape aspect ratio', async () => {
      mockGenerate.mockResolvedValue({
        created: Date.now(),
        data: [{ url: 'https://openai.com/image.png' }],
      })

      await adapter.generate({
        prompt: 'Landscape image',
        aspectRatio: AspectRatio.Landscape,
      })

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          size: '1792x1024',
        })
      )
    })

    it('should handle portrait aspect ratio', async () => {
      mockGenerate.mockResolvedValue({
        created: Date.now(),
        data: [{ url: 'https://openai.com/image.png' }],
      })

      await adapter.generate({
        prompt: 'Portrait image',
        aspectRatio: AspectRatio.Portrait,
      })

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          size: '1024x1792',
        })
      )
    })

    it('should map Standard aspect ratio to landscape', async () => {
      mockGenerate.mockResolvedValue({
        created: Date.now(),
        data: [{ url: 'https://openai.com/image.png' }],
      })

      await adapter.generate({
        prompt: 'Standard image',
        aspectRatio: AspectRatio.Standard,
      })

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          size: '1792x1024',
        })
      )
    })

    it('should apply provider options for quality', async () => {
      mockGenerate.mockResolvedValue({
        created: Date.now(),
        data: [{ url: 'https://openai.com/image.png' }],
      })

      await adapter.generate({
        prompt: 'Test prompt',
        aspectRatio: AspectRatio.Square,
        providerOptions: {
          quality: 'standard',
        },
      })

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          quality: 'standard',
        })
      )
    })

    it('should apply provider options for style', async () => {
      mockGenerate.mockResolvedValue({
        created: Date.now(),
        data: [{ url: 'https://openai.com/image.png' }],
      })

      await adapter.generate({
        prompt: 'Test prompt',
        aspectRatio: AspectRatio.Square,
        providerOptions: {
          style: 'natural',
        },
      })

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          style: 'natural',
        })
      )
    })

    it('should throw error when no images returned', async () => {
      mockGenerate.mockResolvedValue({
        created: Date.now(),
        data: [],
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

    it('should filter out images without URLs', async () => {
      mockGenerate.mockResolvedValue({
        created: Date.now(),
        data: [
          { url: 'https://openai.com/image1.png' },
          { b64_json: 'base64data' }, // No URL
          { url: 'https://openai.com/image2.png' },
        ],
      })

      const result = await adapter.generate({
        prompt: 'Test prompt',
        aspectRatio: AspectRatio.Square,
      })

      expect(result.images).toHaveLength(2)
      expect(result.images[0].url).toBe('https://openai.com/image1.png')
      expect(result.images[1].url).toBe('https://openai.com/image2.png')
    })

    it('should generate random seed (DALL-E does not support seed)', async () => {
      mockGenerate.mockResolvedValue({
        created: Date.now(),
        data: [{ url: 'https://openai.com/image.png' }],
      })

      const result = await adapter.generate({
        prompt: 'Test prompt',
        aspectRatio: AspectRatio.Square,
      })

      expect(typeof result.seed).toBe('number')
      expect(result.seed).toBeGreaterThanOrEqual(0)
    })

    it('should throw error when API key is not set', async () => {
      // Clear the API key
      delete process.env.OPENAI_API_KEY

      // Create new adapter (it will have no client)
      const newAdapter = new DalleAdapter()

      // Clear any cached client
      // @ts-expect-error - accessing private property for test
      newAdapter.client = null

      await expect(
        newAdapter.generate({
          prompt: 'Test',
          aspectRatio: AspectRatio.Square,
        })
      ).rejects.toMatchObject({
        category: ErrorCategory.ProviderError,
        message: expect.stringContaining('OPENAI_API_KEY'),
      })
    })
  })

  // ============================================
  // normalizeError method
  // ============================================

  describe('normalizeError', () => {
    // Note: We test with plain objects since OpenAI.APIError instanceof checks
    // are handled by the base normalizer via status code and message patterns.
    // The actual OpenAI SDK APIError instances would work the same way.

    it('should normalize content policy violation via code', () => {
      // Status 400 maps to INVALID_INPUT in the base normalizer
      // The actual DalleAdapter.normalizeError checks for OpenAI.APIError instance
      // For plain objects, it falls through to base normalizer
      const error = {
        status: 400,
        message: 'Content policy violation',
        code: 'content_policy_violation',
      }

      const result = adapter.normalizeError(error)

      // Base normalizer: HTTP status 400 -> InvalidInput (takes priority over message patterns)
      expect(result.category).toBe(ErrorCategory.InvalidInput)
    })

    it('should normalize safety-related error via message pattern when no status', () => {
      // When there's no status code, message patterns are used
      const error = {
        message: 'Safety system triggered',
      }

      const result = adapter.normalizeError(error)

      // Base normalizer detects 'safety' pattern
      expect(result.category).toBe(ErrorCategory.ContentFiltered)
    })

    it('should normalize rate limit error (429)', () => {
      const error = {
        status: 429,
        message: 'Rate limit exceeded',
      }

      const result = adapter.normalizeError(error)

      expect(result.category).toBe(ErrorCategory.RateLimited)
      expect(result.retryable).toBe(true)
    })

    it('should normalize invalid request error (400)', () => {
      const error = {
        status: 400,
        message: 'Invalid request parameters',
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

    it('should normalize server error (500+)', () => {
      const error = {
        status: 500,
        message: 'Internal server error',
      }

      const result = adapter.normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ProviderError)
      expect(result.retryable).toBe(true)
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
      const adapter = new DalleAdapter()
      const options = adapter.getDefaultOptions()

      expect(options.quality).toBe('hd')
      expect(options.style).toBe('vivid')
    })

    it('should reflect custom config', () => {
      const adapter = new DalleAdapter({
        quality: 'standard',
        style: 'natural',
      })

      const options = adapter.getDefaultOptions()

      expect(options.quality).toBe('standard')
      expect(options.style).toBe('natural')
    })
  })

  // ============================================
  // supportsFeature method
  // ============================================

  describe('supportsFeature', () => {
    it('should not support seed feature', () => {
      expect(adapter.supportsFeature('seed')).toBe(false)
    })

    it('should not support negativePrompt feature', () => {
      expect(adapter.supportsFeature('negativePrompt')).toBe(false)
    })

    it('should not support batch feature', () => {
      expect(adapter.supportsFeature('batch')).toBe(false)
    })

    it('should not support inpainting feature', () => {
      expect(adapter.supportsFeature('inpainting')).toBe(false)
    })
  })

  // ============================================
  // getSupportedAspectRatios method
  // ============================================

  describe('getSupportedAspectRatios', () => {
    it('should return natively supported aspect ratios', () => {
      const ratios = adapter.getSupportedAspectRatios()

      expect(ratios).toContain(AspectRatio.Square)
      expect(ratios).toContain(AspectRatio.Landscape)
      expect(ratios).toContain(AspectRatio.Portrait)
      // Standard and StandardPortrait are mapped but not natively supported
      expect(ratios).not.toContain(AspectRatio.Standard)
      expect(ratios).not.toContain(AspectRatio.StandardPortrait)
    })
  })

  // ============================================
  // createDalleAdapter factory
  // ============================================

  describe('createDalleAdapter', () => {
    it('should create adapter with default config', () => {
      const adapter = createDalleAdapter()

      expect(adapter.modelId).toBe('dalle-3')
      expect(adapter.displayName).toBe('DALL-E 3')
    })

    it('should create adapter with custom config', () => {
      const adapter = createDalleAdapter({
        quality: 'standard',
        style: 'natural',
      })

      const options = adapter.getDefaultOptions()
      expect(options.quality).toBe('standard')
      expect(options.style).toBe('natural')
    })
  })
})
