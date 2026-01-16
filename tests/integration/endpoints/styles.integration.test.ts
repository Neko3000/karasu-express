/**
 * Integration Tests: Styles Endpoint
 *
 * Tests for GET /api/studio/styles endpoint
 *
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Note: These tests now mock PayloadCMS API calls instead of fs.readFileSync
 * since the style-loader reads from the StyleTemplates collection in MongoDB.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================
// Mock Payload Instance Factory
// ============================================

interface MockStyleDoc {
  id: string
  styleId: string
  name: string
  positivePrompt: string
  negativePrompt: string
  sortOrder: number
  isSystem: boolean
}

function createMockStyleDoc(overrides?: Partial<MockStyleDoc>): MockStyleDoc {
  return {
    id: `doc-${Math.random().toString(36).substring(7)}`,
    styleId: 'test-style',
    name: 'Test Style',
    positivePrompt: '{prompt}, test style modifiers',
    negativePrompt: 'bad quality, blurry',
    sortOrder: 0,
    isSystem: false,
    ...overrides,
  }
}

function createMockPayload(docs: MockStyleDoc[]) {
  return {
    find: vi.fn().mockResolvedValue({ docs, totalDocs: docs.length }),
    count: vi.fn().mockResolvedValue({ totalDocs: docs.length }),
  }
}

describe('Styles Endpoint Integration', () => {
  // ============================================
  // Setup / Teardown
  // ============================================

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================
  // GET /api/studio/styles
  // ============================================

  describe('GET /api/studio/styles', () => {
    it('should return all styles with correct structure', async () => {
      // Arrange
      const mockDocs = [
        createMockStyleDoc({ styleId: 'base', name: 'base', positivePrompt: '{prompt}', negativePrompt: '', sortOrder: -1 }),
        createMockStyleDoc({ styleId: 'cyberpunk', name: 'Cyberpunk', positivePrompt: '{prompt}, neon lights', negativePrompt: 'old, vintage', sortOrder: 10 }),
        createMockStyleDoc({ styleId: 'anime', name: 'Anime', positivePrompt: '{prompt}, anime style', negativePrompt: 'realistic', sortOrder: 20 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      // Import after setting up mocks
      const { clearStyleCache, refreshStyleCache, getAllStyles } = await import('../../../src/services/style-loader')
      clearStyleCache()
      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])

      const styles = getAllStyles()

      // Assert
      expect(styles).toHaveLength(3)
      expect(styles[0].styleId).toBe('base') // base should be first (sorted by sortOrder)
      expect(styles[0]).toHaveProperty('name')
      expect(styles[0]).toHaveProperty('positivePrompt')
      expect(styles[0]).toHaveProperty('negativePrompt')
      expect(styles[0]).toHaveProperty('source', 'imported')
    })

    it('should return "base" as the first style', async () => {
      // Arrange - docs sorted by sortOrder (base has -1)
      const mockDocs = [
        createMockStyleDoc({ styleId: 'base', name: 'base', positivePrompt: '{prompt}', sortOrder: -1 }),
        createMockStyleDoc({ styleId: 'zebra-style', name: 'Zebra Style', sortOrder: 20 }),
        createMockStyleDoc({ styleId: 'apple-style', name: 'Apple Style', sortOrder: 10 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      const { clearStyleCache, refreshStyleCache, getAllStyles } = await import('../../../src/services/style-loader')
      clearStyleCache()
      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])

      const styles = getAllStyles()

      // Assert - base should always be first (sortOrder: -1)
      expect(styles[0].styleId).toBe('base')
      expect(styles[0].name).toBe('base')
    })

    it('should return defaultStyleId as "base"', async () => {
      const { DEFAULT_STYLE_ID } = await import('../../../src/services/style-loader')
      expect(DEFAULT_STYLE_ID).toBe('base')
    })

    it('should return styles in sortOrder from database', async () => {
      // Arrange - DB returns already sorted by sortOrder
      const mockDocs = [
        createMockStyleDoc({ styleId: 'base', name: 'base', sortOrder: -1 }),
        createMockStyleDoc({ styleId: 'apple', name: 'Apple', sortOrder: 10 }),
        createMockStyleDoc({ styleId: 'middle', name: 'Middle', sortOrder: 20 }),
        createMockStyleDoc({ styleId: 'zebra', name: 'Zebra', sortOrder: 30 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      const { clearStyleCache, refreshStyleCache, getAllStyles } = await import('../../../src/services/style-loader')
      clearStyleCache()
      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])

      const styles = getAllStyles()

      // Assert - should be in sortOrder: base, Apple, Middle, Zebra
      expect(styles[0].name).toBe('base')
      expect(styles[1].name).toBe('Apple')
      expect(styles[2].name).toBe('Middle')
      expect(styles[3].name).toBe('Zebra')
    })

    it('should have correct format for each style', async () => {
      // Arrange
      const mockDocs = [
        createMockStyleDoc({
          styleId: 'cyberpunk',
          name: 'Cyberpunk',
          positivePrompt: '{prompt}, neon lights, futuristic',
          negativePrompt: 'vintage, old-fashioned',
          sortOrder: 10,
        }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      const { clearStyleCache, refreshStyleCache, getAllStyles } = await import('../../../src/services/style-loader')
      clearStyleCache()
      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])

      const styles = getAllStyles()
      const cyberpunk = styles[0]

      // Assert correct format transformation
      expect(cyberpunk.styleId).toBe('cyberpunk')
      expect(cyberpunk.name).toBe('Cyberpunk')
      expect(cyberpunk.positivePrompt).toBe('{prompt}, neon lights, futuristic')
      expect(cyberpunk.negativePrompt).toBe('vintage, old-fashioned')
      expect(cyberpunk.source).toBe('imported')
    })

    it('should support search filtering', async () => {
      // Arrange
      const mockDocs = [
        createMockStyleDoc({ styleId: 'cyberpunk', name: 'Cyberpunk', sortOrder: 10 }),
        createMockStyleDoc({ styleId: 'steampunk', name: 'Steampunk', sortOrder: 20 }),
        createMockStyleDoc({ styleId: 'anime', name: 'Anime', sortOrder: 30 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      const { clearStyleCache, refreshStyleCache, searchStyles } = await import('../../../src/services/style-loader')
      clearStyleCache()
      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])

      const results = searchStyles('punk')

      // Assert
      expect(results).toHaveLength(2)
      expect(results.map((s) => s.name)).toContain('Cyberpunk')
      expect(results.map((s) => s.name)).toContain('Steampunk')
      expect(results.map((s) => s.name)).not.toContain('Anime')
    })

    it('should return correct count', async () => {
      // Arrange
      const mockDocs = [
        createMockStyleDoc({ styleId: 'style-a', name: 'Style A', sortOrder: 10 }),
        createMockStyleDoc({ styleId: 'style-b', name: 'Style B', sortOrder: 20 }),
        createMockStyleDoc({ styleId: 'style-c', name: 'Style C', sortOrder: 30 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      const { clearStyleCache, refreshStyleCache, getStyleCount } = await import('../../../src/services/style-loader')
      clearStyleCache()
      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])

      const count = getStyleCount()

      // Assert
      expect(count).toBe(3)
    })
  })

  // ============================================
  // getDefaultStyle
  // ============================================

  describe('getDefaultStyle', () => {
    it('should return the base style', async () => {
      // Arrange
      const mockDocs = [
        createMockStyleDoc({ styleId: 'base', name: 'base', positivePrompt: '{prompt}', sortOrder: -1 }),
        createMockStyleDoc({ styleId: 'other', name: 'Other', positivePrompt: '{prompt}, other', sortOrder: 10 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      const { clearStyleCache, refreshStyleCache, getDefaultStyle } = await import('../../../src/services/style-loader')
      clearStyleCache()
      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])

      const defaultStyle = getDefaultStyle()

      // Assert
      expect(defaultStyle.styleId).toBe('base')
      expect(defaultStyle.name).toBe('base')
      expect(defaultStyle.positivePrompt).toBe('{prompt}')
    })

    it('should return fallback base style if not in database', async () => {
      // Arrange
      const mockDocs = [
        createMockStyleDoc({ styleId: 'only-style', name: 'Only Style', sortOrder: 10 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      const { clearStyleCache, refreshStyleCache, getDefaultStyle } = await import('../../../src/services/style-loader')
      clearStyleCache()
      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])

      const defaultStyle = getDefaultStyle()

      // Assert - should return fallback
      expect(defaultStyle.styleId).toBe('base')
      expect(defaultStyle.positivePrompt).toBe('{prompt}')
    })
  })

  // ============================================
  // getStyleById
  // ============================================

  describe('getStyleById', () => {
    it('should return style by ID', async () => {
      // Arrange
      const mockDocs = [
        createMockStyleDoc({ styleId: 'cyberpunk', name: 'Cyberpunk', positivePrompt: '{prompt}, neon', sortOrder: 10 }),
        createMockStyleDoc({ styleId: 'anime', name: 'Anime', positivePrompt: '{prompt}, anime', sortOrder: 20 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      const { clearStyleCache, refreshStyleCache, getStyleById } = await import('../../../src/services/style-loader')
      clearStyleCache()
      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])

      const style = getStyleById('cyberpunk')

      // Assert
      expect(style).toBeDefined()
      expect(style?.name).toBe('Cyberpunk')
    })

    it('should return undefined for non-existent ID', async () => {
      // Arrange
      const mockDocs = [
        createMockStyleDoc({ styleId: 'cyberpunk', name: 'Cyberpunk', sortOrder: 10 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      const { clearStyleCache, refreshStyleCache, getStyleById } = await import('../../../src/services/style-loader')
      clearStyleCache()
      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])

      const style = getStyleById('nonexistent')

      // Assert
      expect(style).toBeUndefined()
    })
  })

  // ============================================
  // getStylesByIds
  // ============================================

  describe('getStylesByIds', () => {
    it('should return multiple styles by IDs', async () => {
      // Arrange
      const mockDocs = [
        createMockStyleDoc({ styleId: 'style-a', name: 'Style A', sortOrder: 10 }),
        createMockStyleDoc({ styleId: 'style-b', name: 'Style B', sortOrder: 20 }),
        createMockStyleDoc({ styleId: 'style-c', name: 'Style C', sortOrder: 30 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      const { clearStyleCache, refreshStyleCache, getStylesByIds } = await import('../../../src/services/style-loader')
      clearStyleCache()
      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])

      const styles = getStylesByIds(['style-a', 'style-c'])

      // Assert
      expect(styles).toHaveLength(2)
      expect(styles.map((s) => s.styleId)).toContain('style-a')
      expect(styles.map((s) => s.styleId)).toContain('style-c')
    })

    it('should filter out non-existent IDs', async () => {
      // Arrange
      const mockDocs = [
        createMockStyleDoc({ styleId: 'style-a', name: 'Style A', sortOrder: 10 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      const { clearStyleCache, refreshStyleCache, getStylesByIds } = await import('../../../src/services/style-loader')
      clearStyleCache()
      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])

      const styles = getStylesByIds(['style-a', 'nonexistent'])

      // Assert
      expect(styles).toHaveLength(1)
      expect(styles[0].styleId).toBe('style-a')
    })
  })
})
