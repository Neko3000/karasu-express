/**
 * Unit Tests: Flux Adapter
 *
 * Tests for src/adapters/flux.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Mock Fal.ai client and test:
 * - generate method
 * - normalizeError method
 * - getDefaultOptions method
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { FluxAdapter, createFluxAdapter } from '../../../src/adapters/flux'
import { AspectRatio, Provider, ErrorCategory } from '../../../src/lib/types'
import type { FluxResponseData } from '../../../src/adapters/types'

// Mock the Fal.ai client
vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    subscribe: vi.fn(),
  },
}))

// Mock the rate limiter to avoid timing issues in tests
vi.mock('../../../src/lib/rate-limiter', () => ({
  withRateLimit: vi.fn(
    async <T>(_providerId: string, operation: () => Promise<T>) => operation()
  ),
  rateLimiter: {
    acquire: vi.fn(),
    recordRequest: vi.fn(),
  },
}))

describe('FluxAdapter', () => {
  let adapter: FluxAdapter
  let mockFalSubscribe: Mock

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mocked module
    const falModule = await import('@fal-ai/client')
    mockFalSubscribe = falModule.fal.subscribe as Mock

    // Create adapter
    adapter = new FluxAdapter()
  })

  // ============================================
  // Constructor and Properties
  // ============================================

  describe('constructor', () => {
    it('should create adapter with default config', () => {
      const adapter = new FluxAdapter()

      expect(adapter.providerId).toBe(Provider.Fal)
      expect(adapter.modelId).toBe('flux-pro')
      expect(adapter.displayName).toBe('Flux Pro')
    })

    it('should create adapter with custom model ID', () => {
      const adapter = new FluxAdapter('flux-dev', 'Flux Dev')

      expect(adapter.modelId).toBe('flux-dev')
      expect(adapter.displayName).toBe('Flux Dev')
    })

    it('should accept custom config', () => {
      const adapter = new FluxAdapter('flux-pro', 'Flux Pro', {
        numInferenceSteps: 50,
        guidanceScale: 7.5,
      })

      const options = adapter.getDefaultOptions()
      expect(options.num_inference_steps).toBe(50)
      expect(options.guidance_scale).toBe(7.5)
    })
  })

  // ============================================
  // generate method
  // ============================================

  describe('generate', () => {
    it('should call Fal.ai with correct parameters', async () => {
      const mockResponse: FluxResponseData = {
        images: [
          {
            url: 'https://fal.ai/generated/image.png',
            width: 1024,
            height: 1024,
            content_type: 'image/png',
          },
        ],
        seed: 12345,
        timings: { inference: 1500 },
      }

      mockFalSubscribe.mockResolvedValue(mockResponse)

      const result = await adapter.generate({
        prompt: 'A beautiful sunset',
        aspectRatio: AspectRatio.Square,
      })

      // Verify Fal was called
      expect(mockFalSubscribe).toHaveBeenCalledWith(
        'fal-ai/flux-pro',
        expect.objectContaining({
          input: expect.objectContaining({
            prompt: 'A beautiful sunset',
            image_size: { width: 1024, height: 1024 },
            num_images: 1,
          }),
          logs: false,
        })
      )

      // Verify result
      expect(result.images).toHaveLength(1)
      expect(result.images[0].url).toBe('https://fal.ai/generated/image.png')
      expect(result.seed).toBe(12345)
      expect(result.timing?.inference).toBe(1500)
    })

    it('should handle different aspect ratios', async () => {
      mockFalSubscribe.mockResolvedValue({
        images: [
          {
            url: 'https://fal.ai/image.png',
            width: 1792,
            height: 1024,
            content_type: 'image/png',
          },
        ],
        seed: 12345,
      })

      await adapter.generate({
        prompt: 'Landscape image',
        aspectRatio: AspectRatio.Landscape,
      })

      expect(mockFalSubscribe).toHaveBeenCalledWith(
        'fal-ai/flux-pro',
        expect.objectContaining({
          input: expect.objectContaining({
            image_size: { width: 1792, height: 1024 },
          }),
        })
      )
    })

    it('should include seed when provided', async () => {
      mockFalSubscribe.mockResolvedValue({
        images: [
          {
            url: 'https://fal.ai/image.png',
            width: 1024,
            height: 1024,
            content_type: 'image/png',
          },
        ],
        seed: 42,
      })

      await adapter.generate({
        prompt: 'Test prompt',
        aspectRatio: AspectRatio.Square,
        seed: 42,
      })

      expect(mockFalSubscribe).toHaveBeenCalledWith(
        'fal-ai/flux-pro',
        expect.objectContaining({
          input: expect.objectContaining({
            seed: 42,
          }),
        })
      )
    })

    it('should merge provider options', async () => {
      mockFalSubscribe.mockResolvedValue({
        images: [
          {
            url: 'https://fal.ai/image.png',
            width: 1024,
            height: 1024,
            content_type: 'image/png',
          },
        ],
        seed: 12345,
      })

      await adapter.generate({
        prompt: 'Test prompt',
        aspectRatio: AspectRatio.Square,
        providerOptions: {
          custom_param: 'value',
        },
      })

      expect(mockFalSubscribe).toHaveBeenCalledWith(
        'fal-ai/flux-pro',
        expect.objectContaining({
          input: expect.objectContaining({
            custom_param: 'value',
          }),
        })
      )
    })

    it('should throw content filtered error on NSFW detection', async () => {
      mockFalSubscribe.mockResolvedValue({
        images: [
          {
            url: 'https://fal.ai/image.png',
            width: 1024,
            height: 1024,
            content_type: 'image/png',
          },
        ],
        seed: 12345,
        has_nsfw_concepts: [true],
      })

      await expect(
        adapter.generate({
          prompt: 'Test prompt',
          aspectRatio: AspectRatio.Square,
        })
      ).rejects.toMatchObject({
        category: ErrorCategory.ContentFiltered,
        message: expect.stringContaining('NSFW'),
      })
    })

    it('should handle missing timing in response', async () => {
      mockFalSubscribe.mockResolvedValue({
        images: [
          {
            url: 'https://fal.ai/image.png',
            width: 1024,
            height: 1024,
            content_type: 'image/png',
          },
        ],
        seed: 12345,
        // No timings field
      })

      const result = await adapter.generate({
        prompt: 'Test prompt',
        aspectRatio: AspectRatio.Square,
      })

      expect(result.timing).toBeUndefined()
    })

    it('should default content type to image/png', async () => {
      mockFalSubscribe.mockResolvedValue({
        images: [
          {
            url: 'https://fal.ai/image.png',
            width: 1024,
            height: 1024,
            // No content_type
          },
        ],
        seed: 12345,
      })

      const result = await adapter.generate({
        prompt: 'Test prompt',
        aspectRatio: AspectRatio.Square,
      })

      expect(result.images[0].contentType).toBe('image/png')
    })
  })

  // ============================================
  // normalizeError method
  // ============================================

  describe('normalizeError', () => {
    it('should normalize content policy violation', () => {
      const error = {
        detail: 'Content policy violation detected',
      }

      const result = adapter.normalizeError(error)

      expect(result.category).toBe(ErrorCategory.ContentFiltered)
      expect(result.providerCode).toBe('CONTENT_POLICY_VIOLATION')
    })

    it('should normalize rate limit error (429)', () => {
      const error = {
        status: 429,
        message: 'Too many requests',
      }

      const result = adapter.normalizeError(error)

      expect(result.category).toBe(ErrorCategory.RateLimited)
      expect(result.providerCode).toBe('RATE_LIMITED')
      expect(result.retryable).toBe(true)
    })

    it('should fall back to base normalizer for unknown errors', () => {
      const error = new Error('Unknown error')

      const result = adapter.normalizeError(error)

      expect(result.message).toBe('Unknown error')
      expect(result.originalError).toBe(error)
    })

    it('should handle null/undefined errors', () => {
      const result = adapter.normalizeError(null)

      expect(result.category).toBe(ErrorCategory.Unknown)
      expect(result.message).toBe('Unknown error')
    })
  })

  // ============================================
  // getDefaultOptions method
  // ============================================

  describe('getDefaultOptions', () => {
    it('should return default options', () => {
      const adapter = new FluxAdapter()
      const options = adapter.getDefaultOptions()

      expect(options).toHaveProperty('num_inference_steps')
      expect(options).toHaveProperty('guidance_scale')
      expect(options).toHaveProperty('safety_tolerance')
    })

    it('should reflect custom config', () => {
      const adapter = new FluxAdapter('flux-pro', 'Flux Pro', {
        numInferenceSteps: 100,
        guidanceScale: 5.0,
        safetyTolerance: '4',
      })

      const options = adapter.getDefaultOptions()

      expect(options.num_inference_steps).toBe(100)
      expect(options.guidance_scale).toBe(5.0)
      expect(options.safety_tolerance).toBe('4')
    })
  })

  // ============================================
  // supportsFeature method
  // ============================================

  describe('supportsFeature', () => {
    it('should support seed feature', () => {
      expect(adapter.supportsFeature('seed')).toBe(true)
    })

    it('should support negativePrompt feature', () => {
      expect(adapter.supportsFeature('negativePrompt')).toBe(true)
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
  // createFluxAdapter factory
  // ============================================

  describe('createFluxAdapter', () => {
    it('should create Flux Pro adapter by default', () => {
      const adapter = createFluxAdapter()

      expect(adapter.modelId).toBe('flux-pro')
      expect(adapter.displayName).toBe('Flux Pro')
    })

    it('should create Flux Dev adapter', () => {
      const adapter = createFluxAdapter('dev')

      expect(adapter.modelId).toBe('flux-dev')
      expect(adapter.displayName).toBe('Flux Dev')
    })

    it('should create Flux Schnell adapter', () => {
      const adapter = createFluxAdapter('schnell')

      expect(adapter.modelId).toBe('flux-schnell')
      expect(adapter.displayName).toBe('Flux Schnell')
    })

    it('should accept custom config', () => {
      const adapter = createFluxAdapter('pro', {
        numInferenceSteps: 30,
      })

      const options = adapter.getDefaultOptions()
      expect(options.num_inference_steps).toBe(30)
    })
  })
})
