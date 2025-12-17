/**
 * StyleTemplates Collection
 *
 * Reusable style configurations with prompt modifiers.
 * Each style template contains positive and negative prompt templates
 * that can be merged with user prompts.
 */

import type { CollectionConfig } from 'payload'

export const StyleTemplates: CollectionConfig = {
  slug: 'style-templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'styleId', 'isSystem', 'sortOrder'],
    group: 'Configuration',
    description: 'Reusable style templates for AI image generation',
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        // Prevent deletion of system styles
        const style = await req.payload.findByID({
          collection: 'style-templates' as 'users', // Type assertion until types are regenerated
          id: id as string,
        })

        if (style && (style as unknown as { isSystem?: boolean }).isSystem) {
          throw new Error('Cannot delete system styles. They are required for core functionality.')
        }
      },
    ],
  },
  fields: [
    {
      name: 'styleId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique identifier (lowercase, hyphens only)',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'Style ID is required'
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Style ID must contain only lowercase letters, numbers, and hyphens'
        }
        return true
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name for the style',
      },
      minLength: 1,
      maxLength: 100,
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Brief description of the style effect',
      },
      maxLength: 500,
    },
    {
      name: 'positivePrompt',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Positive prompt template. Must contain {prompt} placeholder.',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'Positive prompt is required'
        if (!value.includes('{prompt}')) {
          return 'Positive prompt must contain {prompt} placeholder'
        }
        return true
      },
    },
    {
      name: 'negativePrompt',
      type: 'textarea',
      admin: {
        description: 'Negative prompt additions (appended to any user negative prompt)',
      },
      defaultValue: '',
    },
    {
      name: 'previewImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Preview thumbnail showing the style effect',
      },
    },
    {
      name: 'isSystem',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'System styles cannot be deleted',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      index: true,
      admin: {
        description: 'Display order in UI (lower = first)',
        position: 'sidebar',
      },
    },
  ],
}
