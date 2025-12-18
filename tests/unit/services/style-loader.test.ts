/**
 * Unit Tests: Style Loader Service
 *
 * Tests for src/services/style-loader.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Tests loadStylesFromJson, parseStyleTemplates, getDefaultStyle returns "base"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
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
import type { RawImportedStyle, ImportedStyle } from '../../../src/lib/style-types'
import {
  generateStyleId,
  normalizeImportedStyle,
  isRawImportedStyle,
} from '../../../src/lib/style-types'

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}))

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

  const createMockStylesJson = (styles: RawImportedStyle[]): string => {
    return JSON.stringify(styles)
  }

  // ============================================
  // Setup / Teardown
  // ============================================

  beforeEach(() => {
    clearStyleCache()
    vi.clearAllMocks()
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
    it('should load and parse valid JSON file', () => {
      const mockStyles = [
        createRawStyle({ name: 'base', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Cyberpunk', prompt: '{prompt}, neon', negative_prompt: 'old' }),
      ]

      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const result = loadStylesFromJson('/test/path.json')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('base')
      expect(result[1].name).toBe('Cyberpunk')
    })

    it('should skip invalid style entries', () => {
      const mockData = JSON.stringify([
        createRawStyle({ name: 'Valid', prompt: '{prompt}', negative_prompt: '' }),
        { name: 'Invalid' }, // Missing prompt and negative_prompt
        createRawStyle({ name: 'Also Valid', prompt: '{prompt}', negative_prompt: '' }),
      ])

      vi.mocked(fs.readFileSync).mockReturnValue(mockData)
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = loadStylesFromJson('/test/path.json')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Valid')
      expect(result[1].name).toBe('Also Valid')
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should throw error for non-array JSON', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('{"not": "array"}')

      expect(() => loadStylesFromJson('/test/path.json')).toThrow(
        'Styles file must contain an array'
      )
    })

    it('should throw error for invalid JSON syntax', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json {{{')

      expect(() => loadStylesFromJson('/test/path.json')).toThrow('Failed to parse styles JSON')
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
      const mockStyles = [
        createRawStyle({ name: 'Zebra', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'base', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Apple', prompt: '{prompt}', negative_prompt: '' }),
      ]

      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const result = getAllStyles(true)

      expect(result[0].styleId).toBe('base')
      expect(result[1].name).toBe('Apple')
      expect(result[2].name).toBe('Zebra')
    })

    it('should cache styles after first load', () => {
      const mockStyles = [createRawStyle({ name: 'Test', prompt: '{prompt}', negative_prompt: '' })]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      getAllStyles(true) // First call - loads from file
      getAllStyles() // Second call - should use cache

      expect(fs.readFileSync).toHaveBeenCalledTimes(1)
    })

    it('should reload when forceReload is true', () => {
      const mockStyles = [createRawStyle({ name: 'Test', prompt: '{prompt}', negative_prompt: '' })]
      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      getAllStyles(true) // First call
      getAllStyles(true) // Second call with forceReload

      expect(fs.readFileSync).toHaveBeenCalledTimes(2)
    })
  })

  // ============================================
  // getDefaultStyle
  // ============================================

  describe('getDefaultStyle', () => {
    it('should return "base" style when present', () => {
      const mockStyles = [
        createRawStyle({ name: 'Other', prompt: '{prompt}, other', negative_prompt: '' }),
        createRawStyle({ name: 'base', prompt: '{prompt}', negative_prompt: '' }),
      ]

      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const result = getDefaultStyle()

      expect(result.styleId).toBe('base')
      expect(result.name).toBe('base')
      expect(result.positivePrompt).toBe('{prompt}')
    })

    it('should return fallback base style when not found in file', () => {
      const mockStyles = [
        createRawStyle({ name: 'Other', prompt: '{prompt}, other', negative_prompt: '' }),
      ]

      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

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
      const mockStyles = [
        createRawStyle({ name: 'Cyberpunk', prompt: '{prompt}, neon', negative_prompt: '' }),
      ]

      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const result = getStyleById('cyberpunk')

      expect(result).toBeDefined()
      expect(result?.name).toBe('Cyberpunk')
    })

    it('should return undefined when not found', () => {
      const mockStyles = [
        createRawStyle({ name: 'Other', prompt: '{prompt}', negative_prompt: '' }),
      ]

      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const result = getStyleById('nonexistent')

      expect(result).toBeUndefined()
    })
  })

  // ============================================
  // getStylesByIds
  // ============================================

  describe('getStylesByIds', () => {
    it('should return multiple styles by IDs', () => {
      const mockStyles = [
        createRawStyle({ name: 'Style A', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Style B', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Style C', prompt: '{prompt}', negative_prompt: '' }),
      ]

      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const result = getStylesByIds(['style-a', 'style-c'])

      expect(result).toHaveLength(2)
      expect(result[0].styleId).toBe('style-a')
      expect(result[1].styleId).toBe('style-c')
    })

    it('should filter out non-existent IDs', () => {
      const mockStyles = [
        createRawStyle({ name: 'Style A', prompt: '{prompt}', negative_prompt: '' }),
      ]

      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

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
      const mockStyles = [
        createRawStyle({ name: 'Cyberpunk', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Steampunk', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Other', prompt: '{prompt}', negative_prompt: '' }),
      ]

      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const result = searchStyles('punk')

      expect(result).toHaveLength(2)
      expect(result.map((s) => s.name)).toContain('Cyberpunk')
      expect(result.map((s) => s.name)).toContain('Steampunk')
    })

    it('should return empty array when no matches', () => {
      const mockStyles = [
        createRawStyle({ name: 'Style A', prompt: '{prompt}', negative_prompt: '' }),
      ]

      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const result = searchStyles('xyz')

      expect(result).toEqual([])
    })
  })

  // ============================================
  // getStyleCount
  // ============================================

  describe('getStyleCount', () => {
    it('should return total count of styles', () => {
      const mockStyles = [
        createRawStyle({ name: 'Style A', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Style B', prompt: '{prompt}', negative_prompt: '' }),
        createRawStyle({ name: 'Style C', prompt: '{prompt}', negative_prompt: '' }),
      ]

      vi.mocked(fs.readFileSync).mockReturnValue(createMockStylesJson(mockStyles))

      const result = getStyleCount()

      expect(result).toBe(3)
    })
  })
})
