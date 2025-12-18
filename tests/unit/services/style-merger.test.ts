/**
 * Unit Tests: Style Merger Utility
 *
 * Tests for src/services/style-merger.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Test mergeStyle with {prompt} placeholder, base style, negative prompts
 */

import { describe, it, expect } from 'vitest'
import {
  mergeStyle,
  type StyleTemplate,
  type MergedPrompt,
} from '../../../src/services/style-merger'

describe('StyleMerger', () => {
  // ============================================
  // Test Data Factories
  // ============================================

  const createStyleTemplate = (overrides?: Partial<StyleTemplate>): StyleTemplate => ({
    styleId: 'test-style',
    name: 'Test Style',
    positivePrompt: '{prompt}, test style modifiers',
    negativePrompt: 'bad quality, blurry',
    ...overrides,
  })

  // ============================================
  // mergeStyle
  // ============================================

  describe('mergeStyle', () => {
    it('should replace {prompt} placeholder with base prompt', () => {
      const style = createStyleTemplate({
        positivePrompt: '{prompt}, studio ghibli style',
      })

      const result = mergeStyle('a cat in the rain', style)

      expect(result.finalPrompt).toBe('a cat in the rain, studio ghibli style')
    })

    it('should include negative prompt from style', () => {
      const style = createStyleTemplate({
        negativePrompt: 'realistic, 3d render',
      })

      const result = mergeStyle('a fantasy castle', style)

      expect(result.negativePrompt).toBe('realistic, 3d render')
    })

    it('should handle base style with no modifications', () => {
      const style = createStyleTemplate({
        styleId: 'base',
        name: 'Base (No Style)',
        positivePrompt: '{prompt}',
        negativePrompt: '',
      })

      const result = mergeStyle('a simple prompt', style)

      expect(result.finalPrompt).toBe('a simple prompt')
      expect(result.negativePrompt).toBe('')
    })

    it('should handle empty negative prompt', () => {
      const style = createStyleTemplate({
        negativePrompt: '',
      })

      const result = mergeStyle('test prompt', style)

      expect(result.negativePrompt).toBe('')
    })

    it('should handle undefined negative prompt', () => {
      const style: StyleTemplate = {
        styleId: 'test',
        name: 'Test',
        positivePrompt: '{prompt}',
      }

      const result = mergeStyle('test prompt', style)

      expect(result.negativePrompt).toBe('')
    })

    it('should handle complex positive prompt templates', () => {
      const style = createStyleTemplate({
        positivePrompt:
          '{prompt}, highly detailed, cinematic lighting, volumetric fog, 8k resolution, artstation',
      })

      const result = mergeStyle('a dragon flying over mountains', style)

      expect(result.finalPrompt).toBe(
        'a dragon flying over mountains, highly detailed, cinematic lighting, volumetric fog, 8k resolution, artstation'
      )
    })

    it('should handle {prompt} at different positions', () => {
      // Start
      const styleStart = createStyleTemplate({
        positivePrompt: '{prompt} with extra details',
      })
      expect(mergeStyle('test', styleStart).finalPrompt).toBe('test with extra details')

      // Middle
      const styleMiddle = createStyleTemplate({
        positivePrompt: 'prefix, {prompt}, suffix',
      })
      expect(mergeStyle('test', styleMiddle).finalPrompt).toBe('prefix, test, suffix')

      // End
      const styleEnd = createStyleTemplate({
        positivePrompt: 'styled version of {prompt}',
      })
      expect(mergeStyle('test', styleEnd).finalPrompt).toBe('styled version of test')
    })

    it('should preserve original prompt exactly', () => {
      const style = createStyleTemplate({
        positivePrompt: '{prompt}, style',
      })

      const promptWithSpecialChars = 'a cat, with "quotes" and (parentheses)'
      const result = mergeStyle(promptWithSpecialChars, style)

      expect(result.finalPrompt).toBe('a cat, with "quotes" and (parentheses), style')
    })

    it('should handle prompts with newlines', () => {
      const style = createStyleTemplate({
        positivePrompt: '{prompt}, detailed',
      })

      const promptWithNewline = 'first line\nsecond line'
      const result = mergeStyle(promptWithNewline, style)

      expect(result.finalPrompt).toBe('first line\nsecond line, detailed')
    })

    it('should return style metadata in result', () => {
      const style = createStyleTemplate({
        styleId: 'ghibli',
        name: 'Ghibli Style',
      })

      const result = mergeStyle('test', style)

      expect(result.styleId).toBe('ghibli')
      expect(result.styleName).toBe('Ghibli Style')
    })

    it('should handle very long prompts', () => {
      const style = createStyleTemplate({
        positivePrompt: '{prompt}, style',
      })

      const longPrompt = 'word '.repeat(200).trim()
      const result = mergeStyle(longPrompt, style)

      expect(result.finalPrompt).toBe(longPrompt + ', style')
    })

    it('should handle style with only {prompt}', () => {
      const style = createStyleTemplate({
        positivePrompt: '{prompt}',
      })

      const result = mergeStyle('exact prompt', style)

      expect(result.finalPrompt).toBe('exact prompt')
    })

    it('should only replace first {prompt} occurrence', () => {
      const style = createStyleTemplate({
        positivePrompt: '{prompt} and more {prompt}',
      })

      const result = mergeStyle('test', style)

      // Standard behavior: replace only first occurrence
      expect(result.finalPrompt).toBe('test and more {prompt}')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================

  describe('edge cases', () => {
    it('should handle empty base prompt', () => {
      const style = createStyleTemplate({
        positivePrompt: '{prompt}, styled',
      })

      const result = mergeStyle('', style)

      expect(result.finalPrompt).toBe(', styled')
    })

    it('should handle whitespace-only prompt', () => {
      const style = createStyleTemplate({
        positivePrompt: '{prompt}, styled',
      })

      const result = mergeStyle('   ', style)

      expect(result.finalPrompt).toBe('   , styled')
    })

    it('should handle unicode characters in prompt', () => {
      const style = createStyleTemplate({
        positivePrompt: '{prompt}, スタイル',
      })

      const result = mergeStyle('猫', style)

      expect(result.finalPrompt).toBe('猫, スタイル')
    })

    it('should handle emoji in prompt', () => {
      const style = createStyleTemplate({
        positivePrompt: '{prompt} ✨',
      })

      const result = mergeStyle('cat 🐱', style)

      expect(result.finalPrompt).toBe('cat 🐱 ✨')
    })
  })

  // ============================================
  // Real-world Style Examples
  // ============================================

  describe('real-world style examples', () => {
    it('should correctly merge Ghibli style', () => {
      const ghibliStyle = createStyleTemplate({
        styleId: 'ghibli-anime',
        name: 'Studio Ghibli Style',
        positivePrompt:
          '{prompt}, studio ghibli style, cel shaded, vibrant colors, hayao miyazaki, hand-drawn animation',
        negativePrompt: '3d render, realistic, photorealistic, low quality, blurry, cgi',
      })

      const result = mergeStyle('a girl walking through a forest', ghibliStyle)

      expect(result.finalPrompt).toBe(
        'a girl walking through a forest, studio ghibli style, cel shaded, vibrant colors, hayao miyazaki, hand-drawn animation'
      )
      expect(result.negativePrompt).toBe(
        '3d render, realistic, photorealistic, low quality, blurry, cgi'
      )
    })

    it('should correctly merge Cyberpunk style', () => {
      const cyberpunkStyle = createStyleTemplate({
        styleId: 'cyberpunk',
        name: 'Cyberpunk',
        positivePrompt:
          '{prompt}, cyberpunk aesthetic, neon lights, rain, dark atmosphere, futuristic city',
        negativePrompt: 'natural lighting, rural, countryside, vintage',
      })

      const result = mergeStyle('a street vendor', cyberpunkStyle)

      expect(result.finalPrompt).toBe(
        'a street vendor, cyberpunk aesthetic, neon lights, rain, dark atmosphere, futuristic city'
      )
    })

    it('should correctly merge Film Noir style', () => {
      const noirStyle = createStyleTemplate({
        styleId: 'film-noir',
        name: 'Film Noir',
        positivePrompt:
          '{prompt}, film noir style, high contrast, black and white, dramatic shadows, 1940s detective aesthetic',
        negativePrompt: 'colorful, bright, cheerful, modern',
      })

      const result = mergeStyle('a detective in an office', noirStyle)

      expect(result.finalPrompt).toBe(
        'a detective in an office, film noir style, high contrast, black and white, dramatic shadows, 1940s detective aesthetic'
      )
    })
  })
})
