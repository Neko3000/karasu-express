/**
 * Integration Tests: Studio Expand Prompt Endpoint
 *
 * Tests for POST /api/studio/expand-prompt endpoint
 *
 * Per Constitution Principle VI (Testing Discipline)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { PromptExpansionResult } from '../../../src/services/prompt-optimizer'

// Mock the prompt optimizer module
vi.mock('../../../src/services/prompt-optimizer', () => ({
  DEFAULT_VARIANT_COUNT: 3,
  createPromptOptimizer: vi.fn(),
}))

describe('Studio Expand Prompt Endpoint Integration', () => {
  // ============================================
  // Test Data Factories
  // ============================================

  const createMockResult = (overrides?: Partial<PromptExpansionResult>): PromptExpansionResult => ({
    variants: [
      {
        variantId: 'variant-1',
        variantName: 'Realistic',
        expandedPrompt: 'a cat sitting on a windowsill, photorealistic, natural lighting',
        suggestedNegativePrompt: 'blurry, low quality',
        keywords: ['cat', 'windowsill', 'realistic'],
      },
      {
        variantId: 'variant-2',
        variantName: 'Artistic',
        expandedPrompt: 'a cat sitting on a windowsill, oil painting style, impressionist',
        suggestedNegativePrompt: 'photorealistic, modern',
        keywords: ['cat', 'windowsill', 'artistic'],
      },
      {
        variantId: 'variant-3',
        variantName: 'Cinematic',
        expandedPrompt: 'a cat sitting on a windowsill, cinematic lighting, dramatic shadows',
        suggestedNegativePrompt: 'flat lighting, amateur',
        keywords: ['cat', 'windowsill', 'cinematic'],
      },
    ],
    subjectSlug: 'cat-sitting-windowsill',
    ...overrides,
  })

  const createMockOptimizer = (result: PromptExpansionResult) => ({
    expandPrompt: vi.fn().mockResolvedValue(result),
    getProviderId: vi.fn().mockReturnValue('mock'),
  })

  const createRequest = (body: object): NextRequest => {
    return new NextRequest('http://localhost:3000/api/studio/expand-prompt', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  // ============================================
  // Setup / Teardown
  // ============================================

  let originalEnv: string | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    originalEnv = process.env.GOOGLE_AI_API_KEY
    process.env.GOOGLE_AI_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalEnv !== undefined) {
      process.env.GOOGLE_AI_API_KEY = originalEnv
    } else {
      delete process.env.GOOGLE_AI_API_KEY
    }
  })

  // ============================================
  // POST /api/studio/expand-prompt - Success Cases
  // ============================================

  describe('POST /api/studio/expand-prompt - Success', () => {
    it('should expand prompt successfully with default options', async () => {
      const mockResult = createMockResult()
      const mockOptimizer = createMockOptimizer(mockResult)

      const { createPromptOptimizer } = await import('../../../src/services/prompt-optimizer')
      vi.mocked(createPromptOptimizer).mockReturnValue(mockOptimizer as unknown as ReturnType<typeof createPromptOptimizer>)

      // Import route handler after mocking
      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a cat sitting on a windowsill',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.variants).toHaveLength(3)
      expect(data.data.subjectSlug).toBe('cat-sitting-windowsill')
    })

    it('should expand prompt with custom variant count', async () => {
      const mockResult = createMockResult({
        variants: [
          {
            variantId: 'variant-1',
            variantName: 'Realistic',
            expandedPrompt: 'expanded prompt',
            suggestedNegativePrompt: 'negative',
            keywords: ['key'],
          },
        ],
      })
      const mockOptimizer = createMockOptimizer(mockResult)

      const { createPromptOptimizer } = await import('../../../src/services/prompt-optimizer')
      vi.mocked(createPromptOptimizer).mockReturnValue(mockOptimizer as unknown as ReturnType<typeof createPromptOptimizer>)

      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a mountain landscape',
        variantCount: 5,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockOptimizer.expandPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          variantCount: 5,
        })
      )
    })

    it('should expand prompt with web search enabled', async () => {
      const mockResult = createMockResult({
        searchContext: 'Trending: cozy aesthetics, hygge style',
      })
      const mockOptimizer = createMockOptimizer(mockResult)

      const { createPromptOptimizer } = await import('../../../src/services/prompt-optimizer')
      vi.mocked(createPromptOptimizer).mockReturnValue(mockOptimizer as unknown as ReturnType<typeof createPromptOptimizer>)

      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a cozy living room',
        webSearchEnabled: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.searchContext).toBeDefined()
      expect(mockOptimizer.expandPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          webSearchEnabled: true,
        })
      )
    })

    it('should return correct variant structure', async () => {
      const mockResult = createMockResult()
      const mockOptimizer = createMockOptimizer(mockResult)

      const { createPromptOptimizer } = await import('../../../src/services/prompt-optimizer')
      vi.mocked(createPromptOptimizer).mockReturnValue(mockOptimizer as unknown as ReturnType<typeof createPromptOptimizer>)

      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a cat',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      const variant = data.data.variants[0]
      expect(variant).toHaveProperty('variantId')
      expect(variant).toHaveProperty('variantName')
      expect(variant).toHaveProperty('expandedPrompt')
      expect(variant).toHaveProperty('suggestedNegativePrompt')
      expect(variant).toHaveProperty('keywords')
      expect(Array.isArray(variant.keywords)).toBe(true)
    })

    it('should trim whitespace from subject', async () => {
      const mockResult = createMockResult()
      const mockOptimizer = createMockOptimizer(mockResult)

      const { createPromptOptimizer } = await import('../../../src/services/prompt-optimizer')
      vi.mocked(createPromptOptimizer).mockReturnValue(mockOptimizer as unknown as ReturnType<typeof createPromptOptimizer>)

      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: '  a cat with spaces  ',
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockOptimizer.expandPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'a cat with spaces',
        })
      )
    })
  })

  // ============================================
  // POST /api/studio/expand-prompt - Validation Errors
  // ============================================

  describe('POST /api/studio/expand-prompt - Validation', () => {
    it('should return 400 for missing subject', async () => {
      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({})

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation error')
      expect(data.message).toContain('subject')
    })

    it('should return 400 for empty subject', async () => {
      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: '',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('subject')
    })

    it('should return 400 for subject too short', async () => {
      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('at least 2 characters')
    })

    it('should return 400 for subject too long', async () => {
      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a'.repeat(1001),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('cannot exceed')
    })

    it('should return 400 for invalid variantCount type', async () => {
      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a cat',
        variantCount: 'three',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('variantCount')
    })

    it('should return 400 for variantCount less than 1', async () => {
      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a cat',
        variantCount: 0,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('at least 1')
    })

    it('should return 400 for variantCount exceeding maximum', async () => {
      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a cat',
        variantCount: 11,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('cannot exceed')
    })

    it('should return 400 for invalid webSearchEnabled type', async () => {
      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a cat',
        webSearchEnabled: 'true',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('webSearchEnabled')
    })

    it('should return 400 for invalid JSON', async () => {
      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = new NextRequest('http://localhost:3000/api/studio/expand-prompt', {
        method: 'POST',
        body: 'not valid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Invalid JSON')
    })
  })

  // ============================================
  // POST /api/studio/expand-prompt - Error Handling
  // ============================================

  describe('POST /api/studio/expand-prompt - Error Handling', () => {
    it('should return 503 when API key is not configured', async () => {
      delete process.env.GOOGLE_AI_API_KEY

      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a cat',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Configuration error')
    })

    it('should return 429 for rate limit errors', async () => {
      const mockOptimizer = {
        expandPrompt: vi.fn().mockRejectedValue(new Error('rate limit exceeded')),
        getProviderId: vi.fn().mockReturnValue('mock'),
      }

      const { createPromptOptimizer } = await import('../../../src/services/prompt-optimizer')
      vi.mocked(createPromptOptimizer).mockReturnValue(mockOptimizer as unknown as ReturnType<typeof createPromptOptimizer>)

      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a cat',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Rate limit exceeded')
    })

    it('should return 503 for API errors', async () => {
      const mockOptimizer = {
        expandPrompt: vi.fn().mockRejectedValue(new Error('API authentication failed')),
        getProviderId: vi.fn().mockReturnValue('mock'),
      }

      const { createPromptOptimizer } = await import('../../../src/services/prompt-optimizer')
      vi.mocked(createPromptOptimizer).mockReturnValue(mockOptimizer as unknown as ReturnType<typeof createPromptOptimizer>)

      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a cat',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Service error')
    })

    it('should return 500 for generic errors', async () => {
      const mockOptimizer = {
        expandPrompt: vi.fn().mockRejectedValue(new Error('Unknown error occurred')),
        getProviderId: vi.fn().mockReturnValue('mock'),
      }

      const { createPromptOptimizer } = await import('../../../src/services/prompt-optimizer')
      vi.mocked(createPromptOptimizer).mockReturnValue(mockOptimizer as unknown as ReturnType<typeof createPromptOptimizer>)

      const { POST } = await import('../../../src/app/api/studio/expand-prompt/route')

      const request = createRequest({
        subject: 'a cat',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  // ============================================
  // GET /api/studio/expand-prompt - Documentation
  // ============================================

  describe('GET /api/studio/expand-prompt - Documentation', () => {
    it('should return endpoint documentation', async () => {
      const { GET } = await import('../../../src/app/api/studio/expand-prompt/route')

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.endpoint).toBe('/api/studio/expand-prompt')
      expect(data.method).toBe('POST')
      expect(data.description).toBeDefined()
      expect(data.request).toBeDefined()
      expect(data.response).toBeDefined()
      expect(data.example).toBeDefined()
    })
  })
})
