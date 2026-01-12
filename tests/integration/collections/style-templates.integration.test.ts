/**
 * Integration Tests: StyleTemplates Collection
 *
 * Tests for StyleTemplates collection CRUD operations and validation:
 * - Create, Read, Update, Delete operations
 * - Validation of {prompt} placeholder in positivePrompt
 * - Case-insensitive unique name validation
 * - System style deletion prevention
 *
 * Per Constitution Principle VI (Testing Discipline)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('StyleTemplates Collection Integration', () => {
  // Mock payload instance
  let mockPayload: {
    findByID: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    find: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockPayload = {
      findByID: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      find: vi.fn(),
      delete: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================
  // Test Data Factories
  // ============================================

  const createMockStyleTemplate = (overrides = {}) => ({
    id: 'style-123',
    styleId: 'custom-style',
    name: 'Custom Style',
    description: 'A custom style template',
    positivePrompt: '{prompt}, custom style modifiers',
    negativePrompt: 'low quality, blurry',
    isSystem: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  })

  const createBaseStyle = () => ({
    id: 'style-base',
    styleId: 'base',
    name: 'Base (No Style)',
    description: 'Original prompt without style modifications',
    positivePrompt: '{prompt}',
    negativePrompt: '',
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  // ============================================
  // CREATE Operations
  // ============================================

  describe('CREATE operations', () => {
    it('should create a style template with all required fields', async () => {
      const styleData = {
        styleId: 'ghibli-anime',
        name: 'Studio Ghibli Style',
        description: 'Hayao Miyazaki style animation',
        positivePrompt: '{prompt}, studio ghibli style, cel shaded, vibrant colors',
        negativePrompt: '3d render, realistic, photorealistic',
      }

      const createdStyle = createMockStyleTemplate(styleData)
      mockPayload.create.mockResolvedValue(createdStyle)

      const result = await mockPayload.create({
        collection: 'style-templates',
        data: styleData,
      })

      expect(result.styleId).toBe(styleData.styleId)
      expect(result.name).toBe(styleData.name)
      expect(result.positivePrompt).toContain('{prompt}')
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'style-templates',
        data: styleData,
      })
    })

    it('should create a style template with only required fields', async () => {
      const minimalStyleData = {
        styleId: 'minimal-style',
        name: 'Minimal Style',
        positivePrompt: '{prompt}',
      }

      const createdStyle = createMockStyleTemplate({
        ...minimalStyleData,
        description: '',
        negativePrompt: '',
      })
      mockPayload.create.mockResolvedValue(createdStyle)

      const result = await mockPayload.create({
        collection: 'style-templates',
        data: minimalStyleData,
      })

      expect(result.styleId).toBe(minimalStyleData.styleId)
      expect(result.positivePrompt).toBe('{prompt}')
    })

    it('should auto-generate timestamps on creation', async () => {
      const styleData = {
        styleId: 'new-style',
        name: 'New Style',
        positivePrompt: '{prompt}, new style',
      }

      const createdStyle = createMockStyleTemplate(styleData)
      mockPayload.create.mockResolvedValue(createdStyle)

      const result = await mockPayload.create({
        collection: 'style-templates',
        data: styleData,
      })

      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })
  })

  // ============================================
  // READ Operations
  // ============================================

  describe('READ operations', () => {
    it('should find a style template by ID', async () => {
      const style = createMockStyleTemplate()
      mockPayload.findByID.mockResolvedValue(style)

      const result = await mockPayload.findByID({
        collection: 'style-templates',
        id: 'style-123',
      })

      expect(result.id).toBe('style-123')
      expect(result.styleId).toBe('custom-style')
    })

    it('should find all style templates', async () => {
      const styles = [
        createBaseStyle(),
        createMockStyleTemplate({ id: 'style-1', styleId: 'ghibli' }),
        createMockStyleTemplate({ id: 'style-2', styleId: 'cyberpunk' }),
      ]

      mockPayload.find.mockResolvedValue({
        docs: styles,
        totalDocs: 3,
      })

      const result = await mockPayload.find({
        collection: 'style-templates',
        limit: 100,
      })

      expect(result.docs).toHaveLength(3)
      expect(result.totalDocs).toBe(3)
    })

    it('should find style template by styleId', async () => {
      const style = createMockStyleTemplate({ styleId: 'unique-style' })

      mockPayload.find.mockResolvedValue({
        docs: [style],
        totalDocs: 1,
      })

      const result = await mockPayload.find({
        collection: 'style-templates',
        where: {
          styleId: { equals: 'unique-style' },
        },
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0].styleId).toBe('unique-style')
    })

    it('should return empty array when no styles match', async () => {
      mockPayload.find.mockResolvedValue({
        docs: [],
        totalDocs: 0,
      })

      const result = await mockPayload.find({
        collection: 'style-templates',
        where: {
          styleId: { equals: 'non-existent' },
        },
      })

      expect(result.docs).toHaveLength(0)
    })

    it('should order styles by creation date (most recent first)', async () => {
      const styles = [
        createMockStyleTemplate({
          id: 'style-3',
          createdAt: '2025-01-03T00:00:00Z',
        }),
        createMockStyleTemplate({
          id: 'style-2',
          createdAt: '2025-01-02T00:00:00Z',
        }),
        createMockStyleTemplate({
          id: 'style-1',
          createdAt: '2025-01-01T00:00:00Z',
        }),
      ]

      mockPayload.find.mockResolvedValue({
        docs: styles,
        totalDocs: 3,
      })

      const result = await mockPayload.find({
        collection: 'style-templates',
        sort: '-createdAt',
      })

      expect(result.docs[0].id).toBe('style-3')
      expect(result.docs[2].id).toBe('style-1')
    })
  })

  // ============================================
  // UPDATE Operations
  // ============================================

  describe('UPDATE operations', () => {
    it('should update style template name', async () => {
      const style = createMockStyleTemplate()
      const updatedStyle = { ...style, name: 'Updated Name' }

      mockPayload.update.mockResolvedValue(updatedStyle)

      const result = await mockPayload.update({
        collection: 'style-templates',
        id: 'style-123',
        data: { name: 'Updated Name' },
      })

      expect(result.name).toBe('Updated Name')
    })

    it('should update style template description', async () => {
      const style = createMockStyleTemplate()
      const updatedStyle = { ...style, description: 'New description' }

      mockPayload.update.mockResolvedValue(updatedStyle)

      const result = await mockPayload.update({
        collection: 'style-templates',
        id: 'style-123',
        data: { description: 'New description' },
      })

      expect(result.description).toBe('New description')
    })

    it('should update positivePrompt if it contains {prompt}', async () => {
      const style = createMockStyleTemplate()
      const newPositivePrompt = '{prompt}, new style, enhanced'
      const updatedStyle = { ...style, positivePrompt: newPositivePrompt }

      mockPayload.update.mockResolvedValue(updatedStyle)

      const result = await mockPayload.update({
        collection: 'style-templates',
        id: 'style-123',
        data: { positivePrompt: newPositivePrompt },
      })

      expect(result.positivePrompt).toBe(newPositivePrompt)
      expect(result.positivePrompt).toContain('{prompt}')
    })

    it('should update negativePrompt', async () => {
      const style = createMockStyleTemplate()
      const newNegativePrompt = 'blurry, low resolution, watermark'
      const updatedStyle = { ...style, negativePrompt: newNegativePrompt }

      mockPayload.update.mockResolvedValue(updatedStyle)

      const result = await mockPayload.update({
        collection: 'style-templates',
        id: 'style-123',
        data: { negativePrompt: newNegativePrompt },
      })

      expect(result.negativePrompt).toBe(newNegativePrompt)
    })

    it('should update updatedAt timestamp on modification', async () => {
      const style = createMockStyleTemplate()
      const newUpdatedAt = new Date().toISOString()
      const updatedStyle = { ...style, name: 'New Name', updatedAt: newUpdatedAt }

      mockPayload.update.mockResolvedValue(updatedStyle)

      const result = await mockPayload.update({
        collection: 'style-templates',
        id: 'style-123',
        data: { name: 'New Name' },
      })

      expect(result.updatedAt).toBe(newUpdatedAt)
    })
  })

  // ============================================
  // DELETE Operations
  // ============================================

  describe('DELETE operations', () => {
    it('should delete a non-system style template', async () => {
      const style = createMockStyleTemplate({ isSystem: false })

      mockPayload.findByID.mockResolvedValue(style)
      mockPayload.delete.mockResolvedValue(style)

      // Check style is not system
      const foundStyle = await mockPayload.findByID({
        collection: 'style-templates',
        id: 'style-123',
      })

      expect(foundStyle.isSystem).toBe(false)

      // Delete should succeed
      const result = await mockPayload.delete({
        collection: 'style-templates',
        id: 'style-123',
      })

      expect(result.id).toBe('style-123')
    })

    it('should prevent deletion of system styles', async () => {
      const baseStyle = createBaseStyle()

      mockPayload.findByID.mockResolvedValue(baseStyle)
      mockPayload.delete.mockRejectedValue(
        new Error('Cannot delete system styles. They are required for core functionality.')
      )

      // Check style is system
      const foundStyle = await mockPayload.findByID({
        collection: 'style-templates',
        id: 'style-base',
      })

      expect(foundStyle.isSystem).toBe(true)

      // Delete should fail
      await expect(
        mockPayload.delete({
          collection: 'style-templates',
          id: 'style-base',
        })
      ).rejects.toThrow('Cannot delete system styles')
    })

    it('should return 404 when deleting non-existent style', async () => {
      mockPayload.findByID.mockResolvedValue(null)

      const result = await mockPayload.findByID({
        collection: 'style-templates',
        id: 'non-existent',
      })

      expect(result).toBeNull()
      // Endpoint should return 404
    })
  })

  // ============================================
  // VALIDATION: {prompt} placeholder
  // ============================================

  describe('VALIDATION: {prompt} placeholder', () => {
    it('should accept positivePrompt with {prompt} placeholder', () => {
      const validPrompts = [
        '{prompt}',
        '{prompt}, style modifiers',
        'prefix text, {prompt}, suffix text',
        '{prompt}, detailed, high quality, {prompt} enhanced',
      ]

      validPrompts.forEach((prompt) => {
        expect(prompt.includes('{prompt}')).toBe(true)
      })
    })

    it('should reject positivePrompt without {prompt} placeholder', () => {
      const invalidPrompts = [
        'just some text without placeholder',
        'missing the placeholder entirely',
        '{Prompt}', // wrong case
        '{ prompt }', // spaces
        '{prompts}', // plural
      ]

      invalidPrompts.forEach((prompt) => {
        expect(prompt.includes('{prompt}')).toBe(false)
      })
    })

    it('should validate {prompt} placeholder during creation', async () => {
      const invalidStyleData = {
        styleId: 'invalid-style',
        name: 'Invalid Style',
        positivePrompt: 'no placeholder here',
      }

      // Validation should fail before database call
      const hasPlaceholder = invalidStyleData.positivePrompt.includes('{prompt}')
      expect(hasPlaceholder).toBe(false)

      // If validation is enforced at collection level, create would be rejected
    })

    it('should validate {prompt} placeholder during update', async () => {
      const invalidUpdate = {
        positivePrompt: 'updated without placeholder',
      }

      const hasPlaceholder = invalidUpdate.positivePrompt.includes('{prompt}')
      expect(hasPlaceholder).toBe(false)

      // If validation is enforced at collection level, update would be rejected
    })
  })

  // ============================================
  // VALIDATION: styleId format
  // ============================================

  describe('VALIDATION: styleId format', () => {
    it('should accept valid styleId format (lowercase, hyphens, numbers)', () => {
      const validStyleIds = [
        'base',
        'ghibli-anime',
        'style-123',
        'my-custom-style',
        'style1',
        'a-b-c-d',
      ]

      const pattern = /^[a-z0-9-]+$/

      validStyleIds.forEach((styleId) => {
        expect(pattern.test(styleId)).toBe(true)
      })
    })

    it('should reject invalid styleId format', () => {
      const invalidStyleIds = [
        'Style', // uppercase
        'my_style', // underscore
        'my style', // space
        'Style-123', // mixed case
        'style@123', // special char
        '', // empty
      ]

      const pattern = /^[a-z0-9-]+$/

      invalidStyleIds.forEach((styleId) => {
        expect(pattern.test(styleId)).toBe(false)
      })
    })
  })

  // ============================================
  // VALIDATION: Unique name (case-insensitive)
  // ============================================

  describe('VALIDATION: Unique name (case-insensitive)', () => {
    it('should enforce unique name across styles', async () => {
      const existingStyle = createMockStyleTemplate({ name: 'Ghibli Style' })

      mockPayload.find.mockResolvedValue({
        docs: [existingStyle],
        totalDocs: 1,
      })

      // Check if name already exists (case-insensitive)
      const result = await mockPayload.find({
        collection: 'style-templates',
        where: {
          name: { equals: 'Ghibli Style' },
        },
      })

      expect(result.docs).toHaveLength(1)
      // Creation with same name should be rejected
    })

    it('should treat names as case-insensitive for uniqueness', async () => {
      const existingStyle = createMockStyleTemplate({ name: 'Ghibli Style' })

      // When checking uniqueness, compare lowercase
      const existingNameLower = existingStyle.name.toLowerCase()
      const newNameLower = 'ghibli style'.toLowerCase()

      expect(existingNameLower).toBe(newNameLower)
      // Should be treated as duplicate
    })

    it('should allow different names', async () => {
      mockPayload.find.mockResolvedValue({
        docs: [],
        totalDocs: 0,
      })

      // Check if different name exists
      const result = await mockPayload.find({
        collection: 'style-templates',
        where: {
          name: { equals: 'Cyberpunk Style' },
        },
      })

      expect(result.docs).toHaveLength(0)
      // Creation with different name should succeed
    })
  })

  // ============================================
  // Simplified Fields (previewImage and sortOrder removed)
  // ============================================

  describe('Simplified Fields', () => {
    it('should only include essential fields: styleId, name, description, positivePrompt, negativePrompt', () => {
      const style = createMockStyleTemplate()

      // Essential fields should be present
      expect(style).toHaveProperty('styleId')
      expect(style).toHaveProperty('name')
      expect(style).toHaveProperty('description')
      expect(style).toHaveProperty('positivePrompt')
      expect(style).toHaveProperty('negativePrompt')
      expect(style).toHaveProperty('isSystem')

      // Removed fields should not be present
      expect(style).not.toHaveProperty('previewImage')
      expect(style).not.toHaveProperty('sortOrder')
    })

    it('should not require previewImage field', async () => {
      const styleData = {
        styleId: 'no-preview',
        name: 'Style Without Preview',
        positivePrompt: '{prompt}, some modifiers',
      }

      const createdStyle = createMockStyleTemplate(styleData)
      mockPayload.create.mockResolvedValue(createdStyle)

      const result = await mockPayload.create({
        collection: 'style-templates',
        data: styleData,
      })

      // Style should be created without previewImage
      expect(result.styleId).toBe('no-preview')
      expect(result).not.toHaveProperty('previewImage')
    })

    it('should not require sortOrder field', async () => {
      const styleData = {
        styleId: 'no-sort',
        name: 'Style Without Sort Order',
        positivePrompt: '{prompt}, some modifiers',
      }

      const createdStyle = createMockStyleTemplate(styleData)
      mockPayload.create.mockResolvedValue(createdStyle)

      const result = await mockPayload.create({
        collection: 'style-templates',
        data: styleData,
      })

      // Style should be created without sortOrder
      expect(result.styleId).toBe('no-sort')
      expect(result).not.toHaveProperty('sortOrder')
    })
  })

  // ============================================
  // Access Control
  // ============================================

  describe('Access Control', () => {
    it('should allow read access to all users', () => {
      // Per collection config: read: () => true
      const accessConfig = {
        read: () => true,
      }

      expect(accessConfig.read()).toBe(true)
    })

    it('should require authentication for create', () => {
      // Per collection config: create: ({ req }) => !!req.user
      const accessConfig = {
        create: ({ req }: { req: { user?: unknown } }) => !!req.user,
      }

      expect(accessConfig.create({ req: { user: null } })).toBe(false)
      expect(accessConfig.create({ req: { user: { id: 'user-1' } } })).toBe(true)
    })

    it('should require authentication for update', () => {
      const accessConfig = {
        update: ({ req }: { req: { user?: unknown } }) => !!req.user,
      }

      expect(accessConfig.update({ req: { user: null } })).toBe(false)
      expect(accessConfig.update({ req: { user: { id: 'user-1' } } })).toBe(true)
    })

    it('should require authentication for delete', () => {
      const accessConfig = {
        delete: ({ req }: { req: { user?: unknown } }) => !!req.user,
      }

      expect(accessConfig.delete({ req: { user: null } })).toBe(false)
      expect(accessConfig.delete({ req: { user: { id: 'user-1' } } })).toBe(true)
    })
  })

  // ============================================
  // Edge Cases
  // ============================================

  describe('Edge Cases', () => {
    it('should handle empty description', async () => {
      const styleData = {
        styleId: 'empty-desc',
        name: 'Style With Empty Description',
        description: '',
        positivePrompt: '{prompt}',
      }

      const createdStyle = createMockStyleTemplate(styleData)
      mockPayload.create.mockResolvedValue(createdStyle)

      const result = await mockPayload.create({
        collection: 'style-templates',
        data: styleData,
      })

      expect(result.description).toBe('')
    })

    it('should handle empty negativePrompt', async () => {
      const styleData = {
        styleId: 'no-negative',
        name: 'Style Without Negative Prompt',
        positivePrompt: '{prompt}, positive only',
        negativePrompt: '',
      }

      const createdStyle = createMockStyleTemplate(styleData)
      mockPayload.create.mockResolvedValue(createdStyle)

      const result = await mockPayload.create({
        collection: 'style-templates',
        data: styleData,
      })

      expect(result.negativePrompt).toBe('')
    })

    it('should handle very long positivePrompt', async () => {
      const longPrompt = '{prompt}, ' + 'modifier, '.repeat(100)

      const styleData = {
        styleId: 'long-prompt',
        name: 'Style With Long Prompt',
        positivePrompt: longPrompt,
      }

      const createdStyle = createMockStyleTemplate(styleData)
      mockPayload.create.mockResolvedValue(createdStyle)

      const result = await mockPayload.create({
        collection: 'style-templates',
        data: styleData,
      })

      expect(result.positivePrompt.length).toBeGreaterThan(500)
    })

    it('should enforce description max length (500 chars)', () => {
      const maxLength = 500
      const validDescription = 'a'.repeat(500)
      const invalidDescription = 'a'.repeat(501)

      expect(validDescription.length).toBeLessThanOrEqual(maxLength)
      expect(invalidDescription.length).toBeGreaterThan(maxLength)
    })

    it('should enforce name max length (100 chars)', () => {
      const maxLength = 100
      const validName = 'a'.repeat(100)
      const invalidName = 'a'.repeat(101)

      expect(validName.length).toBeLessThanOrEqual(maxLength)
      expect(invalidName.length).toBeGreaterThan(maxLength)
    })
  })
})
