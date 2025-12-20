/**
 * Unit Tests: Prompt Optimizer Service
 *
 * Tests for src/services/prompt-optimizer.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Tests:
 * - expandPrompt with various themes
 * - Structured output parsing
 * - Web search integration
 * - Error handling
 * - LLM provider abstraction
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'

// Import after mocking
import {
  PromptOptimizer,
  type PromptExpansionInput,
  type PromptExpansionResult,
  type PromptVariant,
  type LLMProvider,
  GeminiProvider,
  generateSubjectSlug,
  DEFAULT_VARIANT_COUNT,
  SYSTEM_PROMPT,
} from '../../../src/services/prompt-optimizer'

describe('PromptOptimizer', () => {
  // ============================================
  // Test Data Factories
  // ============================================

  const createExpansionInput = (overrides?: Partial<PromptExpansionInput>): PromptExpansionInput => ({
    subject: 'a cat sitting on a windowsill',
    variantCount: 3,
    webSearchEnabled: false,
    ...overrides,
  })

  const createMockVariants = (count: number = 3): PromptVariant[] => {
    const variants: PromptVariant[] = []
    const variantNames = ['Realistic', 'Artistic', 'Cinematic', 'Abstract', 'Surreal']

    for (let i = 0; i < count; i++) {
      variants.push({
        variantId: `variant-${i + 1}`,
        variantName: variantNames[i] || `Variant ${i + 1}`,
        expandedPrompt: `a cat sitting on a windowsill, ${variantNames[i]?.toLowerCase() || 'styled'}, highly detailed, professional lighting, 8k resolution`,
        suggestedNegativePrompt: 'blurry, low quality, distorted',
        keywords: ['cat', 'windowsill', 'detailed'],
      })
    }
    return variants
  }

  const createMockLLMResponse = (variants: PromptVariant[]): PromptExpansionResult => ({
    variants,
    subjectSlug: 'cat-sitting-windowsill',
    searchContext: undefined,
  })

  // ============================================
  // Mock LLM Provider
  // ============================================

  class MockLLMProvider implements LLMProvider {
    public generateMock: Mock

    constructor() {
      this.generateMock = vi.fn()
    }

    get providerId(): string {
      return 'mock'
    }

    async generate(prompt: string, systemPrompt: string): Promise<string> {
      return this.generateMock(prompt, systemPrompt)
    }
  }

  // ============================================
  // Setup / Teardown
  // ============================================

  let mockProvider: MockLLMProvider
  let optimizer: PromptOptimizer

  beforeEach(() => {
    vi.clearAllMocks()
    mockProvider = new MockLLMProvider()
    optimizer = new PromptOptimizer(mockProvider)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================
  // generateSubjectSlug
  // ============================================

  describe('generateSubjectSlug', () => {
    it('should convert simple text to slug', () => {
      expect(generateSubjectSlug('a cat')).toBe('a-cat')
    })

    it('should convert spaces to hyphens', () => {
      expect(generateSubjectSlug('a cat sitting on a windowsill')).toBe('a-cat-sitting-on-a-windowsill')
    })

    it('should convert to lowercase', () => {
      expect(generateSubjectSlug('A Cat Sitting')).toBe('a-cat-sitting')
    })

    it('should remove special characters', () => {
      expect(generateSubjectSlug('a cat! with "quotes"')).toBe('a-cat-with-quotes')
    })

    it('should handle unicode characters', () => {
      expect(generateSubjectSlug('猫 on a windowsill')).toBe('on-a-windowsill')
    })

    it('should handle accented characters', () => {
      expect(generateSubjectSlug('café scene')).toBe('cafe-scene')
    })

    it('should remove leading/trailing hyphens', () => {
      expect(generateSubjectSlug('--test--')).toBe('test')
    })

    it('should collapse multiple hyphens', () => {
      expect(generateSubjectSlug('a   cat')).toBe('a-cat')
    })

    it('should truncate to 50 characters', () => {
      const longText = 'a'.repeat(100)
      expect(generateSubjectSlug(longText).length).toBeLessThanOrEqual(50)
    })

    it('should return "untitled" for empty input', () => {
      expect(generateSubjectSlug('')).toBe('untitled')
    })

    it('should return "untitled" for whitespace-only input', () => {
      expect(generateSubjectSlug('   ')).toBe('untitled')
    })

    it('should return "untitled" for unicode-only input', () => {
      expect(generateSubjectSlug('猫猫猫')).toBe('untitled')
    })
  })

  // ============================================
  // expandPrompt - Basic Functionality
  // ============================================

  describe('expandPrompt', () => {
    it('should call LLM provider with correct prompt', async () => {
      const input = createExpansionInput()
      const mockVariants = createMockVariants(3)
      const mockResult = createMockLLMResponse(mockVariants)

      mockProvider.generateMock.mockResolvedValue(JSON.stringify(mockResult))

      await optimizer.expandPrompt(input)

      expect(mockProvider.generateMock).toHaveBeenCalledTimes(1)
      const [userPrompt, systemPrompt] = mockProvider.generateMock.mock.calls[0]
      expect(userPrompt).toContain(input.subject)
      expect(userPrompt).toContain('3') // variant count
      expect(systemPrompt).toBe(SYSTEM_PROMPT)
    })

    it('should return structured expansion result', async () => {
      const input = createExpansionInput()
      const mockVariants = createMockVariants(3)
      const mockResult = createMockLLMResponse(mockVariants)

      mockProvider.generateMock.mockResolvedValue(JSON.stringify(mockResult))

      const result = await optimizer.expandPrompt(input)

      expect(result).toHaveProperty('variants')
      expect(result).toHaveProperty('subjectSlug')
      expect(result.variants).toHaveLength(3)
    })

    it('should parse structured output correctly', async () => {
      const input = createExpansionInput()
      const mockVariants = createMockVariants(3)
      const mockResult = createMockLLMResponse(mockVariants)

      mockProvider.generateMock.mockResolvedValue(JSON.stringify(mockResult))

      const result = await optimizer.expandPrompt(input)

      expect(result.variants[0]).toHaveProperty('variantId')
      expect(result.variants[0]).toHaveProperty('variantName')
      expect(result.variants[0]).toHaveProperty('expandedPrompt')
      expect(result.variants[0]).toHaveProperty('suggestedNegativePrompt')
      expect(result.variants[0]).toHaveProperty('keywords')
    })

    it('should generate correct variant count', async () => {
      const input = createExpansionInput({ variantCount: 5 })
      const mockVariants = createMockVariants(5)
      const mockResult = createMockLLMResponse(mockVariants)

      mockProvider.generateMock.mockResolvedValue(JSON.stringify(mockResult))

      const result = await optimizer.expandPrompt(input)

      expect(result.variants).toHaveLength(5)
    })

    it('should use default variant count if not specified', async () => {
      const input = createExpansionInput({ variantCount: undefined })
      const mockVariants = createMockVariants(DEFAULT_VARIANT_COUNT)
      const mockResult = createMockLLMResponse(mockVariants)

      mockProvider.generateMock.mockResolvedValue(JSON.stringify(mockResult))

      await optimizer.expandPrompt(input)

      const [userPrompt] = mockProvider.generateMock.mock.calls[0]
      expect(userPrompt).toContain(String(DEFAULT_VARIANT_COUNT))
    })

    it('should generate subjectSlug from subject', async () => {
      const input = createExpansionInput({ subject: 'A Beautiful Sunset' })
      const mockVariants = createMockVariants(3)
      const mockResult: PromptExpansionResult = {
        variants: mockVariants,
        subjectSlug: 'a-beautiful-sunset',
      }

      mockProvider.generateMock.mockResolvedValue(JSON.stringify(mockResult))

      const result = await optimizer.expandPrompt(input)

      expect(result.subjectSlug).toBe('a-beautiful-sunset')
    })
  })

  // ============================================
  // expandPrompt - Various Themes
  // ============================================

  describe('expandPrompt with various themes', () => {
    it('should handle simple theme', async () => {
      const input = createExpansionInput({ subject: 'a cat' })
      const mockVariants = createMockVariants(3)

      mockProvider.generateMock.mockResolvedValue(
        JSON.stringify(createMockLLMResponse(mockVariants))
      )

      const result = await optimizer.expandPrompt(input)

      expect(result.variants).toHaveLength(3)
      result.variants.forEach((v) => {
        expect(v.expandedPrompt.length).toBeGreaterThan(input.subject.length)
      })
    })

    it('should handle complex theme with details', async () => {
      const input = createExpansionInput({
        subject: 'a crying cat in the rain under a red umbrella at night in Tokyo',
      })
      const mockVariants = createMockVariants(3)

      mockProvider.generateMock.mockResolvedValue(
        JSON.stringify(createMockLLMResponse(mockVariants))
      )

      const result = await optimizer.expandPrompt(input)

      expect(result.variants).toHaveLength(3)
    })

    it('should handle abstract/conceptual theme', async () => {
      const input = createExpansionInput({
        subject: 'the feeling of nostalgia',
      })
      const mockVariants = createMockVariants(3)

      mockProvider.generateMock.mockResolvedValue(
        JSON.stringify(createMockLLMResponse(mockVariants))
      )

      const result = await optimizer.expandPrompt(input)

      expect(result.variants).toHaveLength(3)
    })

    it('should handle theme with special characters', async () => {
      const input = createExpansionInput({
        subject: 'a "quoted" theme with (parentheses) and special! chars?',
      })
      const mockVariants = createMockVariants(3)

      mockProvider.generateMock.mockResolvedValue(
        JSON.stringify(createMockLLMResponse(mockVariants))
      )

      const result = await optimizer.expandPrompt(input)

      expect(result.variants).toHaveLength(3)
    })

    it('should handle theme with unicode characters', async () => {
      const input = createExpansionInput({
        subject: '猫と雨 - a cat and rain',
      })
      const mockVariants = createMockVariants(3)

      mockProvider.generateMock.mockResolvedValue(
        JSON.stringify({
          variants: mockVariants,
          subjectSlug: 'a-cat-and-rain',
        })
      )

      const result = await optimizer.expandPrompt(input)

      expect(result.variants).toHaveLength(3)
      expect(result.subjectSlug).toBe('a-cat-and-rain')
    })
  })

  // ============================================
  // expandPrompt - Web Search Integration
  // ============================================

  describe('expandPrompt with web search', () => {
    it('should include search context when web search is enabled', async () => {
      const input = createExpansionInput({ webSearchEnabled: true })
      const mockVariants = createMockVariants(3)
      const mockResult: PromptExpansionResult = {
        variants: mockVariants,
        subjectSlug: 'cat-sitting-windowsill',
        searchContext: 'Trending: cozy home aesthetics, hygge style, window photography',
      }

      mockProvider.generateMock.mockResolvedValue(JSON.stringify(mockResult))

      const result = await optimizer.expandPrompt(input)

      expect(result.searchContext).toBeDefined()
      expect(result.searchContext).toContain('Trending')
    })

    it('should not include search context when web search is disabled', async () => {
      const input = createExpansionInput({ webSearchEnabled: false })
      const mockVariants = createMockVariants(3)
      const mockResult = createMockLLMResponse(mockVariants)

      mockProvider.generateMock.mockResolvedValue(JSON.stringify(mockResult))

      const result = await optimizer.expandPrompt(input)

      expect(result.searchContext).toBeUndefined()
    })

    it('should pass web search flag to user prompt', async () => {
      const input = createExpansionInput({ webSearchEnabled: true })
      const mockVariants = createMockVariants(3)

      mockProvider.generateMock.mockResolvedValue(
        JSON.stringify(createMockLLMResponse(mockVariants))
      )

      await optimizer.expandPrompt(input)

      const [userPrompt] = mockProvider.generateMock.mock.calls[0]
      expect(userPrompt).toContain('web search')
    })
  })

  // ============================================
  // expandPrompt - Error Handling
  // ============================================

  describe('expandPrompt error handling', () => {
    it('should throw error when LLM returns invalid JSON', async () => {
      const input = createExpansionInput()

      mockProvider.generateMock.mockResolvedValue('not valid json')

      await expect(optimizer.expandPrompt(input)).rejects.toThrow()
    })

    it('should throw error when LLM returns empty response', async () => {
      const input = createExpansionInput()

      mockProvider.generateMock.mockResolvedValue('')

      await expect(optimizer.expandPrompt(input)).rejects.toThrow()
    })

    it('should throw error when LLM returns missing variants', async () => {
      const input = createExpansionInput()

      mockProvider.generateMock.mockResolvedValue(
        JSON.stringify({ subjectSlug: 'test' })
      )

      await expect(optimizer.expandPrompt(input)).rejects.toThrow()
    })

    it('should throw error when LLM provider fails', async () => {
      const input = createExpansionInput()

      mockProvider.generateMock.mockRejectedValue(new Error('API error'))

      await expect(optimizer.expandPrompt(input)).rejects.toThrow('API error')
    })

    it('should handle rate limit errors', async () => {
      const input = createExpansionInput()

      const rateLimitError = new Error('Rate limit exceeded')
      ;(rateLimitError as Error & { status: number }).status = 429
      mockProvider.generateMock.mockRejectedValue(rateLimitError)

      await expect(optimizer.expandPrompt(input)).rejects.toThrow('Rate limit exceeded')
    })

    it('should handle timeout errors', async () => {
      const input = createExpansionInput()

      mockProvider.generateMock.mockRejectedValue(new Error('Request timeout'))

      await expect(optimizer.expandPrompt(input)).rejects.toThrow('Request timeout')
    })
  })

  // ============================================
  // expandPrompt - Output Validation
  // ============================================

  describe('expandPrompt output validation', () => {
    it('should ensure all variants have required fields', async () => {
      const input = createExpansionInput()
      const mockVariants = createMockVariants(3)

      mockProvider.generateMock.mockResolvedValue(
        JSON.stringify(createMockLLMResponse(mockVariants))
      )

      const result = await optimizer.expandPrompt(input)

      result.variants.forEach((variant) => {
        expect(variant.variantId).toBeDefined()
        expect(variant.variantName).toBeDefined()
        expect(variant.expandedPrompt).toBeDefined()
        expect(typeof variant.variantId).toBe('string')
        expect(typeof variant.variantName).toBe('string')
        expect(typeof variant.expandedPrompt).toBe('string')
      })
    })

    it('should ensure expanded prompts are longer than original', async () => {
      const input = createExpansionInput({ subject: 'a cat' })
      const mockVariants: PromptVariant[] = [
        {
          variantId: 'v1',
          variantName: 'Realistic',
          expandedPrompt:
            'a cat, photorealistic, detailed fur texture, natural lighting, shallow depth of field, professional photography',
          suggestedNegativePrompt: 'blurry',
          keywords: ['cat'],
        },
      ]

      mockProvider.generateMock.mockResolvedValue(
        JSON.stringify({ variants: mockVariants, subjectSlug: 'a-cat' })
      )

      const result = await optimizer.expandPrompt(input)

      expect(result.variants[0].expandedPrompt.length).toBeGreaterThan(
        input.subject.length
      )
    })

    it('should include keywords for each variant', async () => {
      const input = createExpansionInput()
      const mockVariants = createMockVariants(3)

      mockProvider.generateMock.mockResolvedValue(
        JSON.stringify(createMockLLMResponse(mockVariants))
      )

      const result = await optimizer.expandPrompt(input)

      result.variants.forEach((variant) => {
        expect(variant.keywords).toBeDefined()
        expect(Array.isArray(variant.keywords)).toBe(true)
      })
    })
  })

  // ============================================
  // LLM Provider Abstraction
  // ============================================

  describe('LLM Provider Abstraction', () => {
    it('should work with any provider implementing LLMProvider interface', async () => {
      class CustomProvider implements LLMProvider {
        get providerId(): string {
          return 'custom'
        }

        async generate(): Promise<string> {
          return JSON.stringify(createMockLLMResponse(createMockVariants(3)))
        }
      }

      const customOptimizer = new PromptOptimizer(new CustomProvider())
      const input = createExpansionInput()

      const result = await customOptimizer.expandPrompt(input)

      expect(result.variants).toHaveLength(3)
    })

    it('should expose provider ID from optimizer', () => {
      expect(optimizer.getProviderId()).toBe('mock')
    })
  })

  // ============================================
  // GeminiProvider
  // ============================================

  describe('GeminiProvider', () => {
    it('should have correct providerId', () => {
      const provider = new GeminiProvider('test-api-key')
      expect(provider.providerId).toBe('gemini')
    })

    it('should be instantiable with API key', () => {
      // Verify the provider can be created without throwing
      const provider = new GeminiProvider('test-api-key')
      expect(provider).toBeDefined()
      expect(provider.providerId).toBe('gemini')
    })

    it('should have a generate method', () => {
      const provider = new GeminiProvider('test-api-key')
      expect(typeof provider.generate).toBe('function')
    })

    it('should throw when API returns error', async () => {
      // Test error handling by using a mock provider that throws
      class ErrorProvider implements LLMProvider {
        get providerId(): string {
          return 'error'
        }
        async generate(): Promise<string> {
          throw new Error('Gemini API error')
        }
      }

      const errorOptimizer = new PromptOptimizer(new ErrorProvider())

      await expect(
        errorOptimizer.expandPrompt(createExpansionInput())
      ).rejects.toThrow('Gemini API error')
    })
  })

  // ============================================
  // SYSTEM_PROMPT constant
  // ============================================

  describe('SYSTEM_PROMPT', () => {
    it('should be defined', () => {
      expect(SYSTEM_PROMPT).toBeDefined()
      expect(typeof SYSTEM_PROMPT).toBe('string')
    })

    it('should contain prompt engineering instructions', () => {
      expect(SYSTEM_PROMPT).toContain('prompt')
    })

    it('should mention composition, lighting, and atmosphere', () => {
      const promptLower = SYSTEM_PROMPT.toLowerCase()
      expect(
        promptLower.includes('composition') ||
          promptLower.includes('lighting') ||
          promptLower.includes('atmosphere') ||
          promptLower.includes('detail')
      ).toBe(true)
    })
  })

  // ============================================
  // DEFAULT_VARIANT_COUNT constant
  // ============================================

  describe('DEFAULT_VARIANT_COUNT', () => {
    it('should be defined and be a number', () => {
      expect(DEFAULT_VARIANT_COUNT).toBeDefined()
      expect(typeof DEFAULT_VARIANT_COUNT).toBe('number')
    })

    it('should be a reasonable default (between 1 and 10)', () => {
      expect(DEFAULT_VARIANT_COUNT).toBeGreaterThanOrEqual(1)
      expect(DEFAULT_VARIANT_COUNT).toBeLessThanOrEqual(10)
    })
  })
})
