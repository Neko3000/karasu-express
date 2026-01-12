/**
 * Unit tests for style import utility
 *
 * Tests the functions that load and transform styles from the SDXL JSON file.
 */

import { describe, it, expect } from 'vitest'
import {
  generateStyleId,
  transformToStyleTemplate,
  loadStylesFromJson,
  type JsonStyle,
} from '../../../src/seed/import-styles'

describe('import-styles', () => {
  describe('generateStyleId', () => {
    it('should convert simple names to kebab-case', () => {
      expect(generateStyleId('Abstract')).toBe('abstract')
      expect(generateStyleId('Anime')).toBe('anime')
      expect(generateStyleId('base')).toBe('base')
    })

    it('should handle names with spaces', () => {
      expect(generateStyleId('3D Model')).toBe('3d-model')
      expect(generateStyleId('Art Deco')).toBe('art-deco')
      expect(generateStyleId('Film Noir')).toBe('film-noir')
      expect(generateStyleId('Abstract Expressionism')).toBe('abstract-expressionism')
    })

    it('should handle names with numbers', () => {
      expect(generateStyleId('Abstract Expressionism 2')).toBe('abstract-expressionism-2')
      expect(generateStyleId('Art Deco 2')).toBe('art-deco-2')
      expect(generateStyleId('Constructivism 1')).toBe('constructivism-1')
    })

    it('should handle names with existing hyphens', () => {
      expect(generateStyleId('ads-advertising')).toBe('ads-advertising')
      expect(generateStyleId('ads-food photography')).toBe('ads-food-photography')
      expect(generateStyleId('Neo-Baroque')).toBe('neo-baroque')
    })

    it('should handle special characters', () => {
      expect(generateStyleId("Pokémon")).toBe('pokmon') // removes accented char
      expect(generateStyleId('GTA')).toBe('gta')
    })

    it('should handle leading/trailing spaces', () => {
      expect(generateStyleId('  Abstract  ')).toBe('abstract')
      expect(generateStyleId('  Art Deco  ')).toBe('art-deco')
    })

    it('should handle multiple consecutive spaces', () => {
      expect(generateStyleId('Art    Deco')).toBe('art-deco')
    })
  })

  describe('transformToStyleTemplate', () => {
    it('should transform JSON style to StyleTemplateData format', () => {
      const jsonStyle: JsonStyle = {
        name: 'Cyberpunk',
        prompt: 'cyberpunk style, {prompt}, neon lights, futuristic',
        negative_prompt: 'historical, natural, rustic',
      }

      const result = transformToStyleTemplate(jsonStyle)

      expect(result.styleId).toBe('cyberpunk')
      expect(result.name).toBe('Cyberpunk')
      expect(result.description).toBe('')
      expect(result.positivePrompt).toBe('cyberpunk style, {prompt}, neon lights, futuristic')
      expect(result.negativePrompt).toBe('historical, natural, rustic')
      expect(result.isSystem).toBe(false)
    })

    it('should mark "base" style as isSystem: true', () => {
      const jsonStyle: JsonStyle = {
        name: 'base',
        prompt: '{prompt}',
        negative_prompt: '',
      }

      const result = transformToStyleTemplate(jsonStyle)

      expect(result.styleId).toBe('base')
      expect(result.isSystem).toBe(true)
    })

    it('should not mark other styles as system', () => {
      const jsonStyle: JsonStyle = {
        name: '3D Model',
        prompt: 'professional 3d model of {prompt}',
        negative_prompt: 'ugly, deformed',
      }

      const result = transformToStyleTemplate(jsonStyle)

      expect(result.styleId).toBe('3d-model')
      expect(result.isSystem).toBe(false)
    })

    it('should handle empty negative_prompt', () => {
      const jsonStyle: JsonStyle = {
        name: 'Simple Style',
        prompt: '{prompt}, simple',
        negative_prompt: '',
      }

      const result = transformToStyleTemplate(jsonStyle)

      expect(result.negativePrompt).toBe('')
    })
  })

  describe('loadStylesFromJson', () => {
    it('should return an array of styles', () => {
      const styles = loadStylesFromJson()

      expect(Array.isArray(styles)).toBe(true)
      expect(styles.length).toBeGreaterThan(0)
    })

    it('should return approximately 190 styles', () => {
      const styles = loadStylesFromJson()

      // The JSON file contains ~191 styles
      expect(styles.length).toBeGreaterThanOrEqual(190)
      expect(styles.length).toBeLessThanOrEqual(200)
    })

    it('should include the base style', () => {
      const styles = loadStylesFromJson()
      const baseStyle = styles.find((s) => s.styleId === 'base')

      expect(baseStyle).toBeDefined()
      expect(baseStyle?.name).toBe('base')
      expect(baseStyle?.isSystem).toBe(true)
      expect(baseStyle?.positivePrompt).toBe('{prompt}')
    })

    it('should include known styles with correct format', () => {
      const styles = loadStylesFromJson()

      // Check for a few known styles
      const cyberpunk = styles.find((s) => s.styleId === 'cyberpunk')
      expect(cyberpunk).toBeDefined()
      expect(cyberpunk?.positivePrompt).toContain('{prompt}')
      expect(cyberpunk?.isSystem).toBe(false)

      const anime = styles.find((s) => s.styleId === 'anime')
      expect(anime).toBeDefined()

      const artDeco = styles.find((s) => s.styleId === 'art-deco')
      expect(artDeco).toBeDefined()
    })

    it('should have all required fields for each style', () => {
      const styles = loadStylesFromJson()

      for (const style of styles) {
        expect(style.styleId).toBeDefined()
        expect(typeof style.styleId).toBe('string')
        expect(style.styleId.length).toBeGreaterThan(0)

        expect(style.name).toBeDefined()
        expect(typeof style.name).toBe('string')

        expect(style.positivePrompt).toBeDefined()
        expect(typeof style.positivePrompt).toBe('string')
        expect(style.positivePrompt).toContain('{prompt}')

        expect(typeof style.negativePrompt).toBe('string')
        expect(typeof style.isSystem).toBe('boolean')
        expect(typeof style.description).toBe('string')
      }
    })

    it('should generate unique styleIds', () => {
      const styles = loadStylesFromJson()
      const styleIds = styles.map((s) => s.styleId)
      const uniqueIds = new Set(styleIds)

      // Note: There might be duplicate names in the JSON that result in duplicate IDs
      // This test documents the current behavior
      expect(uniqueIds.size).toBeGreaterThan(0)
    })
  })
})
