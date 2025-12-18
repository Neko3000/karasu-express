/**
 * Unit Tests: Asset Manager Service
 *
 * Tests for src/services/asset-manager.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Test generateFilename follows naming convention, various params
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateFilename,
  parseFilename,
  type FilenameParams,
  type ParsedFilename,
} from '../../../src/services/asset-manager'

describe('AssetManager', () => {
  // ============================================
  // Test Data Factories
  // ============================================

  const createFilenameParams = (overrides?: Partial<FilenameParams>): FilenameParams => ({
    subjectSlug: 'cyberpunk-cat',
    styleId: 'ghibli',
    modelId: 'flux-pro',
    batchIndex: 0,
    extension: 'png',
    ...overrides,
  })

  // ============================================
  // Mock Date
  // ============================================

  let mockDateNow: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp
    mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1702761234000)
  })

  afterEach(() => {
    mockDateNow.mockRestore()
  })

  // ============================================
  // generateFilename
  // ============================================

  describe('generateFilename', () => {
    it('should generate filename following convention: image_{timestamp}_{subject}_{style}_{model}_{index}.{ext}', () => {
      const params = createFilenameParams()

      const filename = generateFilename(params)

      // Expected: image_1702761234_cyberpunk-cat_ghibli_flux-pro_01.png
      expect(filename).toBe('image_1702761234_cyberpunk-cat_ghibli_flux-pro_01.png')
    })

    it('should pad batch index with leading zero for single digits', () => {
      const params = createFilenameParams({ batchIndex: 5 })

      const filename = generateFilename(params)

      expect(filename).toContain('_06.png') // 0-indexed, so 5 becomes 06
    })

    it('should not pad batch index for double digits', () => {
      const params = createFilenameParams({ batchIndex: 10 })

      const filename = generateFilename(params)

      expect(filename).toContain('_11.png') // 0-indexed, so 10 becomes 11
    })

    it('should handle different extensions', () => {
      const pngParams = createFilenameParams({ extension: 'png' })
      const jpgParams = createFilenameParams({ extension: 'jpg' })
      const webpParams = createFilenameParams({ extension: 'webp' })

      expect(generateFilename(pngParams)).toMatch(/\.png$/)
      expect(generateFilename(jpgParams)).toMatch(/\.jpg$/)
      expect(generateFilename(webpParams)).toMatch(/\.webp$/)
    })

    it('should sanitize subject slug', () => {
      const params = createFilenameParams({
        subjectSlug: 'My Subject With Spaces!!!',
      })

      const filename = generateFilename(params)

      // Should be lowercase and have special chars removed
      expect(filename).toContain('my-subject-with-spaces')
    })

    it('should sanitize style ID', () => {
      const params = createFilenameParams({
        styleId: 'Studio Ghibli!!!',
      })

      const filename = generateFilename(params)

      expect(filename).toContain('studio-ghibli')
    })

    it('should sanitize model ID', () => {
      const params = createFilenameParams({
        modelId: 'FLUX Pro v2!!!',
      })

      const filename = generateFilename(params)

      expect(filename).toContain('flux-pro-v2')
    })

    it('should handle empty subject slug', () => {
      const params = createFilenameParams({
        subjectSlug: '',
      })

      const filename = generateFilename(params)

      expect(filename).toContain('_unknown_')
    })

    it('should handle very long subject slugs by truncating', () => {
      const params = createFilenameParams({
        subjectSlug: 'a'.repeat(100),
      })

      const filename = generateFilename(params)

      // Subject should be truncated to max 50 chars
      expect(filename.length).toBeLessThan(150)
    })

    it('should use current timestamp', () => {
      const params = createFilenameParams()

      const filename = generateFilename(params)

      // Timestamp should be 1702761234 (mocked)
      expect(filename).toContain('_1702761234_')
    })

    it('should handle base style ID', () => {
      const params = createFilenameParams({
        styleId: 'base',
      })

      const filename = generateFilename(params)

      expect(filename).toContain('_base_')
    })

    it('should generate unique filenames for different batch indices', () => {
      const params1 = createFilenameParams({ batchIndex: 0 })
      const params2 = createFilenameParams({ batchIndex: 1 })
      const params3 = createFilenameParams({ batchIndex: 2 })

      const filename1 = generateFilename(params1)
      const filename2 = generateFilename(params2)
      const filename3 = generateFilename(params3)

      expect(filename1).not.toBe(filename2)
      expect(filename2).not.toBe(filename3)
      expect(filename1).not.toBe(filename3)
    })

    it('should handle special characters in all fields', () => {
      const params = createFilenameParams({
        subjectSlug: "cat's dream @ night",
        styleId: 'ghibli (anime)',
        modelId: 'flux/pro:v2',
      })

      const filename = generateFilename(params)

      // Should not contain special characters that would break filenames
      expect(filename).not.toContain("'")
      expect(filename).not.toContain('@')
      expect(filename).not.toContain('(')
      expect(filename).not.toContain(')')
      expect(filename).not.toContain('/')
      expect(filename).not.toContain(':')
    })

    it('should produce valid URL-safe filenames', () => {
      const params = createFilenameParams()

      const filename = generateFilename(params)

      // Filename should be URL-safe (only alphanumeric, hyphens, underscores, and dot)
      expect(filename).toMatch(/^[a-z0-9_-]+\.[a-z]+$/)
    })
  })

  // ============================================
  // parseFilename
  // ============================================

  describe('parseFilename', () => {
    it('should parse a valid filename', () => {
      const filename = 'image_1702761234_cyberpunk-cat_ghibli_flux-pro_01.png'

      const parsed = parseFilename(filename)

      expect(parsed).toBeDefined()
      expect(parsed?.timestamp).toBe(1702761234)
      expect(parsed?.subjectSlug).toBe('cyberpunk-cat')
      expect(parsed?.styleId).toBe('ghibli')
      expect(parsed?.modelId).toBe('flux-pro')
      expect(parsed?.batchIndex).toBe(0) // 01 -> 0 (convert back to 0-indexed)
      expect(parsed?.extension).toBe('png')
    })

    it('should return null for invalid filename format', () => {
      const invalidFilenames = [
        'not-a-valid-filename.png',
        'image.png',
        'image_1234.png',
        'image_timestamp_subject.png',
        '',
      ]

      invalidFilenames.forEach((filename) => {
        const parsed = parseFilename(filename)
        expect(parsed).toBeNull()
      })
    })

    it('should handle double-digit batch indices', () => {
      const filename = 'image_1702761234_subject_style_model_15.jpg'

      const parsed = parseFilename(filename)

      expect(parsed?.batchIndex).toBe(14) // 15 -> 14 (0-indexed)
    })

    it('should handle different extensions', () => {
      const pngFile = 'image_1702761234_subject_style_model_01.png'
      const jpgFile = 'image_1702761234_subject_style_model_01.jpg'
      const webpFile = 'image_1702761234_subject_style_model_01.webp'

      expect(parseFilename(pngFile)?.extension).toBe('png')
      expect(parseFilename(jpgFile)?.extension).toBe('jpg')
      expect(parseFilename(webpFile)?.extension).toBe('webp')
    })

    it('should round-trip correctly (generate then parse)', () => {
      const params = createFilenameParams({
        subjectSlug: 'test-subject',
        styleId: 'test-style',
        modelId: 'test-model',
        batchIndex: 5,
        extension: 'png',
      })

      const filename = generateFilename(params)
      const parsed = parseFilename(filename)

      expect(parsed).toBeDefined()
      expect(parsed?.subjectSlug).toBe('test-subject')
      expect(parsed?.styleId).toBe('test-style')
      expect(parsed?.modelId).toBe('test-model')
      expect(parsed?.batchIndex).toBe(5)
      expect(parsed?.extension).toBe('png')
    })

    it('should handle slugs with multiple hyphens', () => {
      const filename = 'image_1702761234_cyber-punk-cat-neon_ghibli-anime-style_flux-pro-v2_01.png'

      const parsed = parseFilename(filename)

      expect(parsed?.subjectSlug).toBe('cyber-punk-cat-neon')
      expect(parsed?.styleId).toBe('ghibli-anime-style')
      expect(parsed?.modelId).toBe('flux-pro-v2')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================

  describe('edge cases', () => {
    it('should handle batch index 0 correctly', () => {
      const params = createFilenameParams({ batchIndex: 0 })

      const filename = generateFilename(params)

      expect(filename).toContain('_01.') // 0 + 1 = 01
    })

    it('should handle maximum batch index (49 for batch size 50)', () => {
      const params = createFilenameParams({ batchIndex: 49 })

      const filename = generateFilename(params)

      expect(filename).toContain('_50.')
    })

    it('should handle unicode in subject after sanitization', () => {
      const params = createFilenameParams({
        subjectSlug: '猫-in-rain',
      })

      const filename = generateFilename(params)

      // Unicode should be removed or transliterated
      expect(filename).toMatch(/^[a-z0-9_-]+\.[a-z]+$/)
    })

    it('should handle consecutive special characters', () => {
      const params = createFilenameParams({
        subjectSlug: 'cat---in---rain',
      })

      const filename = generateFilename(params)

      // Should collapse multiple hyphens into one
      expect(filename).not.toContain('---')
    })
  })
})
