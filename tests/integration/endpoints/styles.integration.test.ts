/**
 * Integration Tests: Styles Endpoint
 *
 * Tests for GET /api/studio/styles endpoint
 *
 * Per Constitution Principle VI (Testing Discipline)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import type { RawImportedStyle } from '../../../src/lib/style-types'

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}))

describe('Styles Endpoint Integration', () => {
  // ============================================
  // Test Data Factories
  // ============================================

  const createRawStyle = (overrides?: Partial<RawImportedStyle>): RawImportedStyle => ({
    name: 'Test Style',
    prompt: '{prompt}, test style modifiers',
    negative_prompt: 'bad quality, blurry',
    ...overrides,
  })

  const createMockStylesJson = (styles: RawImportedStyle[]): string => {
    return JSON.stringify(styles)
  }

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
      const mockStyles = [
        createRawStyle({ name: 'base', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Cyberpunk', prompt: '{prompt}, neon lights', negative_prompt: 'old, vintage' }),
        createRawStyle({ name: 'Anime', prompt: '{prompt}, anime style', negative_prompt: 'realistic' }),
      ]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      // Import after mocking
      const { clearStyleCache, getAllStyles } = await import('../../../src/services/style-loader')
      clearStyleCache()

      const styles = getAllStyles()

      // Assert
      expect(styles).toHaveLength(3)
      expect(styles[0].styleId).toBe('base') // base should be first
      expect(styles[0]).toHaveProperty('name')
      expect(styles[0]).toHaveProperty('positivePrompt')
      expect(styles[0]).toHaveProperty('negativePrompt')
      expect(styles[0]).toHaveProperty('source', 'imported')
    })

    it('should return "base" as the first style', async () => {
      // Arrange
      const mockStyles = [
        createRawStyle({ name: 'Zebra Style', prompt: '{prompt}, zebra', negative_prompt: '' }),
        createRawStyle({ name: 'base', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Apple Style', prompt: '{prompt}, apple', negative_prompt: '' }),
      ]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const { clearStyleCache, getAllStyles } = await import('../../../src/services/style-loader')
      clearStyleCache()

      const styles = getAllStyles()

      // Assert - base should always be first regardless of alphabetical order
      expect(styles[0].styleId).toBe('base')
      expect(styles[0].name).toBe('base')
    })

    it('should return defaultStyleId as "base"', async () => {
      const { DEFAULT_STYLE_ID } = await import('../../../src/services/style-loader')
      expect(DEFAULT_STYLE_ID).toBe('base')
    })

    it('should return styles sorted alphabetically after base', async () => {
      // Arrange
      const mockStyles = [
        createRawStyle({ name: 'Zebra', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'base', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Apple', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Middle', prompt: '{prompt}', negative_prompt: '' }),
      ]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const { clearStyleCache, getAllStyles } = await import('../../../src/services/style-loader')
      clearStyleCache()

      const styles = getAllStyles()

      // Assert - should be: base, Apple, Middle, Zebra
      expect(styles[0].name).toBe('base')
      expect(styles[1].name).toBe('Apple')
      expect(styles[2].name).toBe('Middle')
      expect(styles[3].name).toBe('Zebra')
    })

    it('should have correct format for each style', async () => {
      // Arrange
      const mockStyles = [
        createRawStyle({
          name: 'Cyberpunk',
          prompt: '{prompt}, neon lights, futuristic',
          negative_prompt: 'vintage, old-fashioned',
        }),
      ]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const { clearStyleCache, getAllStyles } = await import('../../../src/services/style-loader')
      clearStyleCache()

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
      const mockStyles = [
        createRawStyle({ name: 'Cyberpunk', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Steampunk', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Anime', prompt: '{prompt}', negative_prompt: '' }),
      ]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const { clearStyleCache, searchStyles } = await import('../../../src/services/style-loader')
      clearStyleCache()

      const results = searchStyles('punk')

      // Assert
      expect(results).toHaveLength(2)
      expect(results.map((s) => s.name)).toContain('Cyberpunk')
      expect(results.map((s) => s.name)).toContain('Steampunk')
      expect(results.map((s) => s.name)).not.toContain('Anime')
    })

    it('should return correct count', async () => {
      // Arrange
      const mockStyles = [
        createRawStyle({ name: 'Style A', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Style B', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Style C', prompt: '{prompt}', negative_prompt: '' }),
      ]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const { clearStyleCache, getStyleCount } = await import('../../../src/services/style-loader')
      clearStyleCache()

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
      const mockStyles = [
        createRawStyle({ name: 'Other', prompt: '{prompt}, other', negative_prompt: '' }),
        createRawStyle({ name: 'base', prompt: '{prompt}', negative_prompt: '' }),
      ]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const { clearStyleCache, getDefaultStyle } = await import('../../../src/services/style-loader')
      clearStyleCache()

      const defaultStyle = getDefaultStyle()

      // Assert
      expect(defaultStyle.styleId).toBe('base')
      expect(defaultStyle.name).toBe('base')
      expect(defaultStyle.positivePrompt).toBe('{prompt}')
    })

    it('should return fallback base style if not in file', async () => {
      // Arrange
      const mockStyles = [
        createRawStyle({ name: 'Only Style', prompt: '{prompt}', negative_prompt: '' }),
      ]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const { clearStyleCache, getDefaultStyle } = await import('../../../src/services/style-loader')
      clearStyleCache()

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
      const mockStyles = [
        createRawStyle({ name: 'Cyberpunk', prompt: '{prompt}, neon', negative_prompt: '' }),
        createRawStyle({ name: 'Anime', prompt: '{prompt}, anime', negative_prompt: '' }),
      ]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const { clearStyleCache, getStyleById } = await import('../../../src/services/style-loader')
      clearStyleCache()

      const style = getStyleById('cyberpunk')

      // Assert
      expect(style).toBeDefined()
      expect(style?.name).toBe('Cyberpunk')
    })

    it('should return undefined for non-existent ID', async () => {
      // Arrange
      const mockStyles = [
        createRawStyle({ name: 'Cyberpunk', prompt: '{prompt}', negative_prompt: '' }),
      ]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const { clearStyleCache, getStyleById } = await import('../../../src/services/style-loader')
      clearStyleCache()

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
      const mockStyles = [
        createRawStyle({ name: 'Style A', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Style B', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Style C', prompt: '{prompt}', negative_prompt: '' }),
      ]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const { clearStyleCache, getStylesByIds } = await import('../../../src/services/style-loader')
      clearStyleCache()

      const styles = getStylesByIds(['style-a', 'style-c'])

      // Assert
      expect(styles).toHaveLength(2)
      expect(styles.map((s) => s.styleId)).toContain('style-a')
      expect(styles.map((s) => s.styleId)).toContain('style-c')
    })

    it('should filter out non-existent IDs', async () => {
      // Arrange
      const mockStyles = [
        createRawStyle({ name: 'Style A', prompt: '{prompt}', negative_prompt: '' }),
      ]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const { clearStyleCache, getStylesByIds } = await import('../../../src/services/style-loader')
      clearStyleCache()

      const styles = getStylesByIds(['style-a', 'nonexistent'])

      // Assert
      expect(styles).toHaveLength(1)
      expect(styles[0].styleId).toBe('style-a')
    })
  })
})
