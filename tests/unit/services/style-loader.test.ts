/**
 * Unit Tests: Style Loader Service
 *
 * Tests for src/services/style-loader.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Tests getStylesFromDB, getAllStyles (cached), getDefaultStyle returns "base"
 *
 * Note: This service now reads from database via PayloadCMS API.
 * Tests mock the Payload find() method to simulate DB responses.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getAllStyles,
  getDefaultStyle,
  getStyleById,
  getStylesByIds,
  searchStyles,
  getStyleCount,
  clearStyleCache,
  refreshStyleCache,
  getStylesFromDB,
  getStyleByIdFromDB,
  getStylesByIdsFromDB,
  setPayloadInstance,
  DEFAULT_STYLE_ID,
} from '../../../src/services/style-loader'
import type { ImportedStyle } from '../../../src/lib/style-types'
import {
  generateStyleId,
  normalizeImportedStyle,
  isRawImportedStyle,
} from '../../../src/lib/style-types'
import type { RawImportedStyle } from '../../../src/lib/style-types'

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

// ============================================
// Test Suite
// ============================================

describe('StyleLoader', () => {
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
    const createRawStyle = (overrides?: Partial<RawImportedStyle>): RawImportedStyle => ({
      name: 'Test Style',
      prompt: '{prompt}, test style modifiers',
      negative_prompt: 'bad quality, blurry',
      ...overrides,
    })

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
    const createRawStyle = (overrides?: Partial<RawImportedStyle>): RawImportedStyle => ({
      name: 'Test Style',
      prompt: '{prompt}, test style modifiers',
      negative_prompt: 'bad quality, blurry',
      ...overrides,
    })

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
  // getStylesFromDB
  // ============================================

  describe('getStylesFromDB', () => {
    it('should fetch all styles from database', async () => {
      const mockDocs = [
        createMockStyleDoc({ styleId: 'base', name: 'base', sortOrder: -1 }),
        createMockStyleDoc({ styleId: 'cyberpunk', name: 'Cyberpunk', sortOrder: 10 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      const result = await getStylesFromDB(mockPayload as unknown as Parameters<typeof getStylesFromDB>[0])

      expect(result).toHaveLength(2)
      expect(result[0].styleId).toBe('base')
      expect(result[1].styleId).toBe('cyberpunk')
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'style-templates',
        limit: 0,
        sort: 'sortOrder',
      })
    })

    it('should return empty array when no styles in database', async () => {
      const mockPayload = createMockPayload([])

      const result = await getStylesFromDB(mockPayload as unknown as Parameters<typeof getStylesFromDB>[0])

      expect(result).toEqual([])
    })

    it('should convert DB documents to ImportedStyle format', async () => {
      const mockDocs = [
        createMockStyleDoc({
          styleId: 'test-style',
          name: 'Test Style',
          positivePrompt: '{prompt}, test',
          negativePrompt: 'bad',
        }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      const result = await getStylesFromDB(mockPayload as unknown as Parameters<typeof getStylesFromDB>[0])

      expect(result[0]).toEqual({
        styleId: 'test-style',
        name: 'Test Style',
        positivePrompt: '{prompt}, test',
        negativePrompt: 'bad',
        source: 'imported',
      })
    })
  })

  // ============================================
  // getStyleByIdFromDB
  // ============================================

  describe('getStyleByIdFromDB', () => {
    it('should fetch style by styleId from database', async () => {
      const mockDoc = createMockStyleDoc({ styleId: 'cyberpunk', name: 'Cyberpunk' })
      const mockPayload = {
        find: vi.fn().mockResolvedValue({ docs: [mockDoc] }),
      }

      const result = await getStyleByIdFromDB('cyberpunk', mockPayload as unknown as Parameters<typeof getStyleByIdFromDB>[1])

      expect(result).toBeDefined()
      expect(result?.styleId).toBe('cyberpunk')
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'style-templates',
        where: { styleId: { equals: 'cyberpunk' } },
        limit: 1,
      })
    })

    it('should return undefined when style not found', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValue({ docs: [] }),
      }

      const result = await getStyleByIdFromDB('nonexistent', mockPayload as unknown as Parameters<typeof getStyleByIdFromDB>[1])

      expect(result).toBeUndefined()
    })
  })

  // ============================================
  // getStylesByIdsFromDB
  // ============================================

  describe('getStylesByIdsFromDB', () => {
    it('should fetch multiple styles by IDs from database', async () => {
      const mockDocs = [
        createMockStyleDoc({ styleId: 'style-a', name: 'Style A' }),
        createMockStyleDoc({ styleId: 'style-c', name: 'Style C' }),
      ]
      const mockPayload = {
        find: vi.fn().mockResolvedValue({ docs: mockDocs }),
      }

      const result = await getStylesByIdsFromDB(['style-a', 'style-c'], mockPayload as unknown as Parameters<typeof getStylesByIdsFromDB>[1])

      expect(result).toHaveLength(2)
      expect(result[0].styleId).toBe('style-a')
      expect(result[1].styleId).toBe('style-c')
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'style-templates',
        where: { styleId: { in: ['style-a', 'style-c'] } },
        limit: 2,
      })
    })

    it('should return empty array when no IDs provided', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValue({ docs: [] }),
      }

      const result = await getStylesByIdsFromDB([], mockPayload as unknown as Parameters<typeof getStylesByIdsFromDB>[1])

      expect(result).toEqual([])
      expect(mockPayload.find).not.toHaveBeenCalled()
    })
  })

  // ============================================
  // refreshStyleCache and getAllStyles
  // ============================================

  describe('refreshStyleCache and getAllStyles', () => {
    it('should populate cache from database', async () => {
      const mockDocs = [
        createMockStyleDoc({ styleId: 'base', name: 'base', sortOrder: -1 }),
        createMockStyleDoc({ styleId: 'cyberpunk', name: 'Cyberpunk', sortOrder: 10 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])
      const result = getAllStyles()

      expect(result).toHaveLength(2)
      expect(result[0].styleId).toBe('base')
    })

    it('should return fallback style when cache not populated', () => {
      clearStyleCache()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = getAllStyles()

      expect(result).toHaveLength(1)
      expect(result[0].styleId).toBe(DEFAULT_STYLE_ID)
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should return cached styles on subsequent calls', async () => {
      const mockDocs = [createMockStyleDoc({ styleId: 'test', name: 'Test' })]
      const mockPayload = createMockPayload(mockDocs)

      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])
      getAllStyles()
      getAllStyles()

      // find should only be called once during refreshStyleCache
      expect(mockPayload.find).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================
  // getDefaultStyle
  // ============================================

  describe('getDefaultStyle', () => {
    it('should return "base" style when present in cache', async () => {
      const mockDocs = [
        createMockStyleDoc({ styleId: 'other', name: 'Other', sortOrder: 10 }),
        createMockStyleDoc({ styleId: 'base', name: 'base', positivePrompt: '{prompt}', sortOrder: -1 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])
      const result = getDefaultStyle()

      expect(result.styleId).toBe('base')
      expect(result.positivePrompt).toBe('{prompt}')
    })

    it('should return fallback base style when not found in cache', async () => {
      const mockDocs = [
        createMockStyleDoc({ styleId: 'other', name: 'Other', sortOrder: 10 }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])
      const result = getDefaultStyle()

      expect(result.styleId).toBe(DEFAULT_STYLE_ID)
      expect(result.positivePrompt).toBe('{prompt}')
      expect(result.source).toBe('imported')
    })
  })

  // ============================================
  // getStyleById (cached)
  // ============================================

  describe('getStyleById', () => {
    it('should return style when found in cache', async () => {
      const mockDocs = [
        createMockStyleDoc({ styleId: 'cyberpunk', name: 'Cyberpunk' }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])
      const result = getStyleById('cyberpunk')

      expect(result).toBeDefined()
      expect(result?.name).toBe('Cyberpunk')
    })

    it('should return undefined when not found in cache', async () => {
      const mockDocs = [
        createMockStyleDoc({ styleId: 'other', name: 'Other' }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])
      const result = getStyleById('nonexistent')

      expect(result).toBeUndefined()
    })
  })

  // ============================================
  // getStylesByIds (cached)
  // ============================================

  describe('getStylesByIds', () => {
    it('should return multiple styles by IDs from cache', async () => {
      const mockDocs = [
        createMockStyleDoc({ styleId: 'style-a', name: 'Style A' }),
        createMockStyleDoc({ styleId: 'style-b', name: 'Style B' }),
        createMockStyleDoc({ styleId: 'style-c', name: 'Style C' }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])
      const result = getStylesByIds(['style-a', 'style-c'])

      expect(result).toHaveLength(2)
      expect(result[0].styleId).toBe('style-a')
      expect(result[1].styleId).toBe('style-c')
    })

    it('should filter out non-existent IDs', async () => {
      const mockDocs = [
        createMockStyleDoc({ styleId: 'style-a', name: 'Style A' }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])
      const result = getStylesByIds(['style-a', 'nonexistent'])

      expect(result).toHaveLength(1)
      expect(result[0].styleId).toBe('style-a')
    })
  })

  // ============================================
  // searchStyles (cached)
  // ============================================

  describe('searchStyles', () => {
    it('should find styles by name (case-insensitive) from cache', async () => {
      const mockDocs = [
        createMockStyleDoc({ styleId: 'cyberpunk', name: 'Cyberpunk' }),
        createMockStyleDoc({ styleId: 'steampunk', name: 'Steampunk' }),
        createMockStyleDoc({ styleId: 'other', name: 'Other' }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])
      const result = searchStyles('punk')

      expect(result).toHaveLength(2)
      expect(result.map((s) => s.name)).toContain('Cyberpunk')
      expect(result.map((s) => s.name)).toContain('Steampunk')
    })

    it('should return empty array when no matches', async () => {
      const mockDocs = [
        createMockStyleDoc({ styleId: 'style-a', name: 'Style A' }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])
      const result = searchStyles('xyz')

      expect(result).toEqual([])
    })
  })

  // ============================================
  // getStyleCount (cached)
  // ============================================

  describe('getStyleCount', () => {
    it('should return total count of cached styles', async () => {
      const mockDocs = [
        createMockStyleDoc({ styleId: 'style-a', name: 'Style A' }),
        createMockStyleDoc({ styleId: 'style-b', name: 'Style B' }),
        createMockStyleDoc({ styleId: 'style-c', name: 'Style C' }),
      ]
      const mockPayload = createMockPayload(mockDocs)

      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])
      const result = getStyleCount()

      expect(result).toBe(3)
    })
  })

  // ============================================
  // clearStyleCache
  // ============================================

  describe('clearStyleCache', () => {
    it('should clear cached styles', async () => {
      const mockDocs = [createMockStyleDoc({ styleId: 'test', name: 'Test' })]
      const mockPayload = createMockPayload(mockDocs)

      await refreshStyleCache(mockPayload as unknown as Parameters<typeof refreshStyleCache>[0])
      expect(getAllStyles()).toHaveLength(1)

      clearStyleCache()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // After clearing, getAllStyles returns fallback
      const result = getAllStyles()
      expect(result).toHaveLength(1)
      expect(result[0].styleId).toBe(DEFAULT_STYLE_ID)
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})
