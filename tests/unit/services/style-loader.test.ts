/**
 * Unit Tests: Style Loader Service
 *
 * Tests for src/services/style-loader.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Tests loadStylesFromJson, parseStyleTemplates, getDefaultStyle returns "base"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { RawImportedStyle, ImportedStyle } from '../../../src/lib/style-types'
import {
  generateStyleId,
  normalizeImportedStyle,
  isRawImportedStyle,
} from '../../../src/lib/style-types'

// Mock the embedded styles data module
const mockStylesData: RawImportedStyle[] = []
vi.mock('../../../src/resources/style-list/sdxl-styles-exp', () => ({
  get sdxlStylesData() {
    return mockStylesData
  },
}))

// Import after mocking
import {
  loadStylesFromJson,
  parseStyleTemplates,
  getAllStyles,
  getDefaultStyle,
  getStyleById,
  getStylesByIds,
  searchStyles,
  getStyleCount,
  clearStyleCache,
  DEFAULT_STYLE_ID,
} from '../../../src/services/style-loader'

describe('StyleLoader', () => {
  // ============================================
  // Test Data Factories
  // ============================================

  const createRawStyle = (overrides?: Partial<RawImportedStyle>): RawImportedStyle => ({
    name: 'Test Style',
    prompt: '{prompt}, test style modifiers',
    negative_prompt: 'bad quality, blurry',
    ...overrides,
  })

  const setMockStyles = (styles: RawImportedStyle[]): void => {
    mockStylesData.length = 0
    mockStylesData.push(...styles)
  }

  // ============================================
  // Setup / Teardown
  // ============================================

  beforeEach(() => {
    clearStyleCache()
    setMockStyles([])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================
  // generateStyleId (from style-types.ts)
  // ============================================

  describe('generateStyleId', () => {
    it('should convert name to lowercase', () => {
      expect(generateStyleId('Test Style')).toBe('test-style')
    })

    it('should replace spaces with hyphens', () => {
      expect(generateStyleId('Abstract Expressionism')).toBe('abstract-expressionism')
    })

    it('should handle numbers', () => {
      expect(generateStyleId('3D Model')).toBe('3d-model')
      expect(generateStyleId('Abstract Expressionism 2')).toBe('abstract-expressionism-2')
    })

    it('should remove special characters', () => {
      expect(generateStyleId("Pokémon")).toBe('pok-mon')
      expect(generateStyleId('Art & Design')).toBe('art-design')
    })

    it('should handle leading/trailing hyphens', () => {
      expect(generateStyleId('-Test-')).toBe('test')
      expect(generateStyleId('  Test  ')).toBe('test')
    })

    it('should handle "base" style name', () => {
      expect(generateStyleId('base')).toBe('base')
    })
  })

  // ============================================
  // normalizeImportedStyle (from style-types.ts)
  // ============================================

  describe('normalizeImportedStyle', () => {
    it('should convert raw style to normalized format', () => {
      const raw = createRawStyle({
        name: 'Cyberpunk',
        prompt: '{prompt}, neon lights, futuristic',
        negative_prompt: 'vintage, old',
      })

      const result = normalizeImportedStyle(raw)

      expect(result).toEqual({
        styleId: 'cyberpunk',
        name: 'Cyberpunk',
        positivePrompt: '{prompt}, neon lights, futuristic',
        negativePrompt: 'vintage, old',
        source: 'imported',
      })
    })

    it('should handle empty negative prompt', () => {
      const raw = createRawStyle({
        name: 'base',
        prompt: '{prompt}',
        negative_prompt: '',
      })

      const result = normalizeImportedStyle(raw)

      expect(result.negativePrompt).toBe('')
    })
  })

  // ============================================
  // isRawImportedStyle (from style-types.ts)
  // ============================================

  describe('isRawImportedStyle', () => {
    it('should return true for valid raw style', () => {
      const valid = createRawStyle()
      expect(isRawImportedStyle(valid)).toBe(true)
    })

    it('should return false for null', () => {
      expect(isRawImportedStyle(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isRawImportedStyle(undefined)).toBe(false)
    })

    it('should return false for missing name', () => {
      expect(isRawImportedStyle({ prompt: '{prompt}', negative_prompt: '' })).toBe(false)
    })

    it('should return false for missing prompt', () => {
      expect(isRawImportedStyle({ name: 'Test', negative_prompt: '' })).toBe(false)
    })

    it('should return false for missing negative_prompt', () => {
      expect(isRawImportedStyle({ name: 'Test', prompt: '{prompt}' })).toBe(false)
    })
  })

  // ============================================
  // loadStylesFromJson
  // ============================================

  describe('loadStylesFromJson', () => {
    it('should load and parse valid styles from embedded data', () => {
      setMockStyles([
        createRawStyle({ name: 'base', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Cyberpunk', prompt: '{prompt}, neon', negative_prompt: 'old' }),
      ])

      const result = loadStylesFromJson()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('base')
      expect(result[1].name).toBe('Cyberpunk')
    })

    it('should skip invalid style entries', () => {
      // Set mock data with invalid entries mixed in
      mockStylesData.length = 0
      mockStylesData.push(
        createRawStyle({ name: 'Valid', prompt: '{prompt}', negative_prompt: '' }),
        { name: 'Invalid' } as RawImportedStyle, // Missing prompt and negative_prompt
        createRawStyle({ name: 'Also Valid', prompt: '{prompt}', negative_prompt: '' })
      )

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = loadStylesFromJson()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Valid')
      expect(result[1].name).toBe('Also Valid')
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should return empty array for empty data', () => {
      setMockStyles([])

      const result = loadStylesFromJson()

      expect(result).toHaveLength(0)
    })
  })

  // ============================================
  // parseStyleTemplates
  // ============================================

  describe('parseStyleTemplates', () => {
    it('should convert array of raw styles to ImportedStyle array', () => {
      const rawStyles: RawImportedStyle[] = [
        createRawStyle({ name: 'Style A', prompt: '{prompt}, a', negative_prompt: 'x' }),
        createRawStyle({ name: 'Style B', prompt: '{prompt}, b', negative_prompt: 'y' }),
      ]

      const result = parseStyleTemplates(rawStyles)

      expect(result).toHaveLength(2)
      expect(result[0].styleId).toBe('style-a')
      expect(result[0].source).toBe('imported')
      expect(result[1].styleId).toBe('style-b')
    })

    it('should handle empty array', () => {
      const result = parseStyleTemplates([])
      expect(result).toEqual([])
    })
  })

  // ============================================
  // getAllStyles
  // ============================================

  describe('getAllStyles', () => {
    it('should return styles sorted with "base" first', () => {
      setMockStyles([
        createRawStyle({ name: 'Zebra', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'base', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Apple', prompt: '{prompt}', negative_prompt: '' }),
      ])

      const result = getAllStyles(true)

      expect(result[0].styleId).toBe('base')
      expect(result[1].name).toBe('Apple')
      expect(result[2].name).toBe('Zebra')
    })

    it('should cache styles after first load', () => {
      setMockStyles([createRawStyle({ name: 'Test', prompt: '{prompt}', negative_prompt: '' })])

      const first = getAllStyles(true) // First call - loads from data
      const second = getAllStyles() // Second call - should use cache

      expect(first).toBe(second) // Same reference means cached
    })

    it('should reload when forceReload is true', () => {
      setMockStyles([createRawStyle({ name: 'Test', prompt: '{prompt}', negative_prompt: '' })])

      const first = getAllStyles(true) // First call

      // Modify the mock data
      setMockStyles([
        createRawStyle({ name: 'Test', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'NewStyle', prompt: '{prompt}', negative_prompt: '' }),
      ])

      const second = getAllStyles(true) // Second call with forceReload

      expect(first).not.toBe(second) // Different references
      expect(second).toHaveLength(2)
    })
  })

  // ============================================
  // getDefaultStyle
  // ============================================

  describe('getDefaultStyle', () => {
    it('should return "base" style when present', () => {
      setMockStyles([
        createRawStyle({ name: 'Other', prompt: '{prompt}, other', negative_prompt: '' }),
        createRawStyle({ name: 'base', prompt: '{prompt}', negative_prompt: '' }),
      ])

      const result = getDefaultStyle()

      expect(result.styleId).toBe('base')
      expect(result.name).toBe('base')
      expect(result.positivePrompt).toBe('{prompt}')
    })

    it('should return fallback base style when not found in file', () => {
      setMockStyles([
        createRawStyle({ name: 'Other', prompt: '{prompt}, other', negative_prompt: '' }),
      ])

      const result = getDefaultStyle()

      expect(result.styleId).toBe(DEFAULT_STYLE_ID)
      expect(result.positivePrompt).toBe('{prompt}')
      expect(result.source).toBe('imported')
    })
  })

  // ============================================
  // getStyleById
  // ============================================

  describe('getStyleById', () => {
    it('should return style when found', () => {
      setMockStyles([
        createRawStyle({ name: 'Cyberpunk', prompt: '{prompt}, neon', negative_prompt: '' }),
      ])

      const result = getStyleById('cyberpunk')

      expect(result).toBeDefined()
      expect(result?.name).toBe('Cyberpunk')
    })

    it('should return undefined when not found', () => {
      setMockStyles([
        createRawStyle({ name: 'Other', prompt: '{prompt}', negative_prompt: '' }),
      ])

      const result = getStyleById('nonexistent')

      expect(result).toBeUndefined()
    })
  })

  // ============================================
  // getStylesByIds
  // ============================================

  describe('getStylesByIds', () => {
    it('should return multiple styles by IDs', () => {
      setMockStyles([
        createRawStyle({ name: 'Style A', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Style B', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Style C', prompt: '{prompt}', negative_prompt: '' }),
      ])

      const result = getStylesByIds(['style-a', 'style-c'])

      expect(result).toHaveLength(2)
      expect(result[0].styleId).toBe('style-a')
      expect(result[1].styleId).toBe('style-c')
    })

    it('should filter out non-existent IDs', () => {
      setMockStyles([
        createRawStyle({ name: 'Style A', prompt: '{prompt}', negative_prompt: '' }),
      ])

      const result = getStylesByIds(['style-a', 'nonexistent'])

      expect(result).toHaveLength(1)
      expect(result[0].styleId).toBe('style-a')
    })
  })

  // ============================================
  // searchStyles
  // ============================================

  describe('searchStyles', () => {
    it('should find styles by name (case-insensitive)', () => {
      setMockStyles([
        createRawStyle({ name: 'Cyberpunk', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Steampunk', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Other', prompt: '{prompt}', negative_prompt: '' }),
      ])

      const result = searchStyles('punk')

      expect(result).toHaveLength(2)
      expect(result.map((s) => s.name)).toContain('Cyberpunk')
      expect(result.map((s) => s.name)).toContain('Steampunk')
    })

    it('should return empty array when no matches', () => {
      setMockStyles([
        createRawStyle({ name: 'Style A', prompt: '{prompt}', negative_prompt: '' }),
      ])

      const result = searchStyles('xyz')

      expect(result).toEqual([])
    })
  })

  // ============================================
  // getStyleCount
  // ============================================

  describe('getStyleCount', () => {
    it('should return total count of styles', () => {
      setMockStyles([
        createRawStyle({ name: 'Style A', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Style B', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Style C', prompt: '{prompt}', negative_prompt: '' }),
      ])

      const result = getStyleCount()

      expect(result).toBe(3)
    })
  })
})
