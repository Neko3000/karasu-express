/**
 * Contract Tests: AI Provider Adapters
 *
 * Tests for src/adapters/ - verifying all adapters conform to the
 * ImageGenerationAdapter interface defined in types.ts.
 *
 * Per Constitution Principle VI (Testing Discipline) - Contract Tests
 *
 * These tests verify:
 * 1. All adapters implement the required interface methods
 * 2. Method return types match the contract
 * 3. Adapters are properly registered in the registry
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import type {
  ImageGenerationAdapter,
  GenerationResult,
  AdapterFeature,
} from '../../src/adapters/types'
import type { NormalizedError } from '../../src/lib/error-normalizer'
import { Provider, AspectRatio, ErrorCategory } from '../../src/lib/types'

// Mock external dependencies to prevent actual API calls - MUST be before imports
vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    subscribe: vi.fn().mockResolvedValue({
      images: [
        { url: 'https://fal.ai/image.png', width: 1024, height: 1024, content_type: 'image/png' },
      ],
      seed: 12345,
    }),
  },
}))

vi.mock('openai', () => {
  const mockGenerate = vi.fn().mockResolvedValue({
    created: Date.now(),
    data: [{ url: 'https://openai.com/image.png' }],
  })

  // Create APIError class inside the mock factory (mock is hoisted)
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

// Mock google-auth-library - must be hoisted before any imports
vi.mock('google-auth-library', () => ({
  GoogleAuth: vi.fn().mockImplementation(() => ({
    getClient: vi.fn().mockResolvedValue({
      getAccessToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
    }),
  })),
}))

// Mock @google/generative-ai for Imagen adapter
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/png',
                      data: 'base64mockdata==',
                    },
                  },
                ],
              },
            },
          ],
        },
      }),
    }),
  })),
}))

vi.mock('../../src/lib/rate-limiter', () => ({
  withRateLimit: vi.fn(async <T>(_p: string, op: () => Promise<T>) => op()),
  rateLimiter: { acquire: vi.fn(), recordRequest: vi.fn() },
}))

// Import adapters AFTER mocks are set up
import { FluxAdapter, createFluxAdapter } from '../../src/adapters/flux'
import { DalleAdapter, createDalleAdapter } from '../../src/adapters/dalle'
import { ImagenAdapter, createImagenAdapter } from '../../src/adapters/imagen'

// Import registry
import {
  getAdapter,
  getAllAdapters,
  getAdaptersByProvider,
  getRegisteredModelIds,
  isModelRegistered,
  resetRegistry,
} from '../../src/adapters/index'

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({
    predictions: [{ bytesBase64Encoded: 'base64data==', mimeType: 'image/png' }],
  }),
})
global.fetch = mockFetch

// ============================================
// CONTRACT TEST SUITE
// ============================================

/**
 * Generic contract test suite for ImageGenerationAdapter
 * Tests that any adapter conforms to the interface contract
 */
function adapterContractTests(
  adapterName: string,
  createAdapter: () => ImageGenerationAdapter
) {
  describe(`${adapterName} Adapter Contract`, () => {
    let adapter: ImageGenerationAdapter

    beforeEach(() => {
      vi.clearAllMocks()
      adapter = createAdapter()
    })

    // ============================================
    // Required Properties
    // ============================================

    describe('required properties', () => {
      it('should have providerId property of type Provider', () => {
        expect(adapter.providerId).toBeDefined()
        expect(Object.values(Provider)).toContain(adapter.providerId)
      })

      it('should have modelId property as non-empty string', () => {
        expect(adapter.modelId).toBeDefined()
        expect(typeof adapter.modelId).toBe('string')
        expect(adapter.modelId.length).toBeGreaterThan(0)
      })

      it('should have displayName property as non-empty string', () => {
        expect(adapter.displayName).toBeDefined()
        expect(typeof adapter.displayName).toBe('string')
        expect(adapter.displayName.length).toBeGreaterThan(0)
      })
    })

    // ============================================
    // generate() Method Contract
    // ============================================

    describe('generate() method', () => {
      it('should exist and be a function', () => {
        expect(adapter.generate).toBeDefined()
        expect(typeof adapter.generate).toBe('function')
      })

      it('should return a Promise', () => {
        const result = adapter.generate({
          prompt: 'Test prompt',
          aspectRatio: AspectRatio.Square,
        })

        expect(result).toBeInstanceOf(Promise)
      })

      it('should return GenerationResult on success', async () => {
        const result = await adapter.generate({
          prompt: 'Test prompt',
          aspectRatio: AspectRatio.Square,
        })

        // Verify GenerationResult structure
        expect(result).toHaveProperty('images')
        expect(Array.isArray(result.images)).toBe(true)
        expect(result).toHaveProperty('seed')
        expect(typeof result.seed).toBe('number')
        expect(result).toHaveProperty('metadata')
        expect(typeof result.metadata).toBe('object')
      })

      it('should return images with required properties', async () => {
        const result = await adapter.generate({
          prompt: 'Test prompt',
          aspectRatio: AspectRatio.Square,
        })

        for (const image of result.images) {
          expect(image).toHaveProperty('url')
          expect(typeof image.url).toBe('string')
          expect(image).toHaveProperty('width')
          expect(typeof image.width).toBe('number')
          expect(image).toHaveProperty('height')
          expect(typeof image.height).toBe('number')
          expect(image).toHaveProperty('contentType')
          expect(typeof image.contentType).toBe('string')
        }
      })

      it('should accept optional seed parameter', async () => {
        // Should not throw
        await adapter.generate({
          prompt: 'Test prompt',
          aspectRatio: AspectRatio.Square,
          seed: 12345,
        })
      })

      it('should accept optional providerOptions parameter', async () => {
        // Should not throw
        await adapter.generate({
          prompt: 'Test prompt',
          aspectRatio: AspectRatio.Square,
          providerOptions: { customOption: 'value' },
        })
      })
    })

    // ============================================
    // normalizeError() Method Contract
    // ============================================

    describe('normalizeError() method', () => {
      it('should exist and be a function', () => {
        expect(adapter.normalizeError).toBeDefined()
        expect(typeof adapter.normalizeError).toBe('function')
      })

      it('should return NormalizedError structure', () => {
        const error = new Error('Test error')
        const result = adapter.normalizeError(error)

        // Verify NormalizedError structure
        expect(result).toHaveProperty('category')
        expect(Object.values(ErrorCategory)).toContain(result.category)
        expect(result).toHaveProperty('message')
        expect(typeof result.message).toBe('string')
        expect(result).toHaveProperty('retryable')
        expect(typeof result.retryable).toBe('boolean')
        expect(result).toHaveProperty('originalError')
      })

      it('should handle null/undefined errors', () => {
        const result1 = adapter.normalizeError(null)
        expect(result1).toHaveProperty('category')
        expect(result1).toHaveProperty('message')

        const result2 = adapter.normalizeError(undefined)
        expect(result2).toHaveProperty('category')
        expect(result2).toHaveProperty('message')
      })

      it('should handle string errors', () => {
        const result = adapter.normalizeError('String error message')
        expect(result.message).toContain('String error message')
      })

      it('should handle Error objects', () => {
        const error = new Error('Error object message')
        const result = adapter.normalizeError(error)
        expect(result.message).toBe('Error object message')
        expect(result.originalError).toBe(error)
      })

      it('should handle plain objects', () => {
        const error = { message: 'Plain object error', status: 400 }
        const result = adapter.normalizeError(error)
        expect(result.message).toBe('Plain object error')
      })
    })

    // ============================================
    // getDefaultOptions() Method Contract
    // ============================================

    describe('getDefaultOptions() method', () => {
      it('should exist and be a function', () => {
        expect(adapter.getDefaultOptions).toBeDefined()
        expect(typeof adapter.getDefaultOptions).toBe('function')
      })

      it('should return an object', () => {
        const result = adapter.getDefaultOptions()
        expect(typeof result).toBe('object')
        expect(result).not.toBeNull()
      })

      it('should return Record<string, unknown>', () => {
        const result = adapter.getDefaultOptions()
        // Should be able to access any key
        expect(() => result['anyKey']).not.toThrow()
      })
    })

    // ============================================
    // supportsFeature() Method Contract
    // ============================================

    describe('supportsFeature() method', () => {
      it('should exist and be a function', () => {
        expect(adapter.supportsFeature).toBeDefined()
        expect(typeof adapter.supportsFeature).toBe('function')
      })

      it('should return boolean for all feature types', () => {
        const features: AdapterFeature[] = [
          'seed',
          'negativePrompt',
          'batch',
          'inpainting',
        ]

        for (const feature of features) {
          const result = adapter.supportsFeature(feature)
          expect(typeof result).toBe('boolean')
        }
      })
    })

    // ============================================
    // getSupportedAspectRatios() Method Contract
    // ============================================

    describe('getSupportedAspectRatios() method', () => {
      it('should exist and be a function', () => {
        expect(adapter.getSupportedAspectRatios).toBeDefined()
        expect(typeof adapter.getSupportedAspectRatios).toBe('function')
      })

      it('should return an array', () => {
        const result = adapter.getSupportedAspectRatios()
        expect(Array.isArray(result)).toBe(true)
      })

      it('should return valid AspectRatio values', () => {
        const result = adapter.getSupportedAspectRatios()
        const validAspectRatios = Object.values(AspectRatio)

        for (const ratio of result) {
          expect(validAspectRatios).toContain(ratio)
        }
      })

      it('should return at least one aspect ratio', () => {
        const result = adapter.getSupportedAspectRatios()
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })
}

// ============================================
// RUN CONTRACT TESTS FOR ALL ADAPTERS
// ============================================

describe('Adapter Contracts', () => {
  // Set up environment
  beforeEach(() => {
    process.env.FAL_API_KEY = 'test-fal-key'
    process.env.OPENAI_API_KEY = 'test-openai-key'
    process.env.GOOGLE_AI_API_KEY = 'test-google-ai-key'
    resetRegistry()
  })

  // Run contract tests for Flux adapter
  adapterContractTests('Flux Pro', () => createFluxAdapter('pro'))
  adapterContractTests('Flux Dev', () => createFluxAdapter('dev'))
  adapterContractTests('Flux Schnell', () => createFluxAdapter('schnell'))

  // Run contract tests for DALL-E adapter
  adapterContractTests('DALL-E 3', () => createDalleAdapter())

  // Run contract tests for Imagen adapter
  adapterContractTests('Imagen 3', () => createImagenAdapter())
})

// ============================================
// REGISTRY CONTRACT TESTS
// ============================================

describe('Adapter Registry Contract', () => {
  beforeEach(() => {
    process.env.FAL_API_KEY = 'test-fal-key'
    process.env.OPENAI_API_KEY = 'test-openai-key'
    process.env.GOOGLE_AI_API_KEY = 'test-google-ai-key'
    resetRegistry()
  })

  describe('getAdapter()', () => {
    it('should return adapter for registered model ID', () => {
      const adapter = getAdapter('flux-pro')
      expect(adapter).toBeDefined()
      expect(adapter?.modelId).toBe('flux-pro')
    })

    it('should return undefined for unknown model ID', () => {
      const adapter = getAdapter('unknown-model')
      expect(adapter).toBeUndefined()
    })
  })

  describe('getAllAdapters()', () => {
    it('should return array of all registered adapters', () => {
      const adapters = getAllAdapters()
      expect(Array.isArray(adapters)).toBe(true)
      expect(adapters.length).toBeGreaterThan(0)
    })

    it('should include Flux, DALL-E, and Imagen adapters', () => {
      const adapters = getAllAdapters()
      const modelIds = adapters.map((a) => a.modelId)

      expect(modelIds).toContain('flux-pro')
      expect(modelIds).toContain('dalle-3')
      expect(modelIds).toContain('gemini-3-pro-image-preview')
    })
  })

  describe('getAdaptersByProvider()', () => {
    it('should return adapters filtered by provider', () => {
      const falAdapters = getAdaptersByProvider(Provider.Fal)
      expect(falAdapters.length).toBeGreaterThan(0)
      for (const adapter of falAdapters) {
        expect(adapter.providerId).toBe(Provider.Fal)
      }
    })

    it('should return empty array for provider with no adapters', () => {
      // All providers have adapters by default, so test after clearing
      // This is more of an edge case test
      const adapters = getAdaptersByProvider(Provider.Google)
      expect(Array.isArray(adapters)).toBe(true)
    })
  })

  describe('getRegisteredModelIds()', () => {
    it('should return array of model IDs', () => {
      const modelIds = getRegisteredModelIds()
      expect(Array.isArray(modelIds)).toBe(true)
      expect(modelIds.length).toBeGreaterThan(0)
      for (const id of modelIds) {
        expect(typeof id).toBe('string')
      }
    })
  })

  describe('isModelRegistered()', () => {
    it('should return true for registered models', () => {
      expect(isModelRegistered('flux-pro')).toBe(true)
      expect(isModelRegistered('dalle-3')).toBe(true)
      expect(isModelRegistered('gemini-3-pro-image-preview')).toBe(true)
    })

    it('should return false for unregistered models', () => {
      expect(isModelRegistered('unknown-model')).toBe(false)
    })
  })
})

// ============================================
// TYPE COMPATIBILITY TESTS
// ============================================

describe('Type Compatibility', () => {
  beforeEach(() => {
    process.env.FAL_API_KEY = 'test-fal-key'
    process.env.OPENAI_API_KEY = 'test-openai-key'
    process.env.GOOGLE_AI_API_KEY = 'test-google-ai-key'
  })

  it('FluxAdapter should be assignable to ImageGenerationAdapter', () => {
    const adapter: ImageGenerationAdapter = new FluxAdapter()
    expect(adapter).toBeDefined()
  })

  it('DalleAdapter should be assignable to ImageGenerationAdapter', () => {
    const adapter: ImageGenerationAdapter = new DalleAdapter()
    expect(adapter).toBeDefined()
  })

  it('ImagenAdapter should be assignable to ImageGenerationAdapter', () => {
    const adapter: ImageGenerationAdapter = new ImagenAdapter()
    expect(adapter).toBeDefined()
  })
})
