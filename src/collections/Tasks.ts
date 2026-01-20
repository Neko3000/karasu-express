/**
 * Tasks Collection
 *
 * Records a user's generation request with all configuration parameters.
 * Parent task / aggregate root for the AI Content Generation Studio.
 *
 * Per data-model.md specifications.
 */

import type { CollectionConfig } from 'payload'
import {
  TaskStatus,
  TASK_STATUS_OPTIONS,
  MAX_BATCH_SIZE,
  DEFAULT_BATCH_SIZE,
  DEFAULT_VARIANT_COUNT,
} from '../lib/types'

export const Tasks: CollectionConfig = {
  slug: 'tasks',
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'status', 'progress', 'createdAt'],
    group: 'Generation',
    description: 'AI image generation tasks',
    components: {
      edit: {
        // Add Submit Task button before document controls (next to Save button)
        beforeDocumentControls: ['@/components/Studio/SubmitTaskAction#SubmitTaskAction'],
      },
    },
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    // ============================================
    // SECTION 1: PROMPTS (Subject, Optimize, Style)
    // ============================================
    {
      name: 'promptsSection',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Admin/SectionHeader#SectionHeader',
        },
        custom: {
          heading: 'Prompts',
          description: 'Enter your creative theme and configure prompt optimization settings',
          level: 'h2',
        },
      },
    },
    {
      name: 'promptOptimizer',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Studio/PromptOptimizerField#PromptOptimizerField',
        },
      },
    },
    {
      name: 'subject',
      type: 'textarea',
      required: true,
      admin: {
        description: "User's original subject input",
        hidden: true, // Hidden because PromptOptimizerField manages this
      },
      minLength: 1,
      maxLength: 1000,
    },
    {
      name: 'expandedPrompts',
      type: 'array',
      admin: {
        description: 'LLM-optimized prompt variants',
        readOnly: true,
        condition: (data) => {
          // Show only if there are expanded prompts (for viewing existing tasks)
          return data?.expandedPrompts?.length > 0
        },
      },
      fields: [
        {
          name: 'variantId',
          type: 'text',
          required: true,
        },
        {
          name: 'variantName',
          type: 'text',
          required: true,
          admin: {
            description: 'e.g., "Realistic", "Abstract", "Artistic"',
          },
        },
        {
          name: 'originalPrompt',
          type: 'textarea',
          required: true,
        },
        {
          name: 'expandedPrompt',
          type: 'textarea',
          required: true,
        },
        {
          name: 'subjectSlug',
          type: 'text',
          required: true,
          admin: {
            description: 'English slug for file naming',
          },
        },
      ],
    },
    {
      name: 'webSearchEnabled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Enable web search (RAG) for prompt optimization',
      },
    },
    // Style Selector UI component - fetches styles from database via API
    {
      name: 'styleSelectorUI',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Studio/StyleSelectorField#StyleSelectorField',
        },
      },
    },
    // Hidden field to store the actual importedStyleIds value
    // The StyleSelectorField UI component manages this field
    {
      name: 'importedStyleIds',
      type: 'json',
      admin: {
        hidden: true, // Hidden because StyleSelectorField manages the UI
        description: 'Selected style template IDs (managed by StyleSelectorField)',
      },
      defaultValue: ['base'],
    },
    {
      name: 'styles',
      type: 'relationship',
      relationTo: 'style-templates',
      hasMany: true,
      admin: {
        description: 'Select custom style templates from database',
        condition: () => false, // Hidden - legacy field
      },
    },

    // ============================================
    // SECTION 2: IMAGE (Aspect Ratio, Model)
    // ============================================
    {
      name: 'imageSection',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Admin/SectionDivider#SectionDivider',
        },
      },
    },
    {
      name: 'imageSectionHeader',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Admin/SectionHeader#SectionHeader',
        },
        custom: {
          heading: 'Image Settings',
          description: 'Configure image output format and AI model selection',
          level: 'h2',
        },
      },
    },
    {
      name: 'aspectRatio',
      type: 'select',
      defaultValue: '9:16',
      options: [
        { label: 'Square (1:1)', value: '1:1' },
        { label: 'Landscape (16:9)', value: '16:9' },
        { label: 'Portrait (9:16)', value: '9:16' },
        { label: 'Standard (4:3)', value: '4:3' },
        { label: 'Standard Portrait (3:4)', value: '3:4' },
      ],
      admin: {
        description: 'Aspect ratio for generated images',
      },
    },
    {
      name: 'models',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['nano-banana'],
      admin: {
        description: 'Select one or more AI models for image generation',
      },
      options: [
        { label: 'Flux Pro', value: 'flux-pro' },
        { label: 'Flux Dev', value: 'flux-dev' },
        { label: 'Flux Schnell', value: 'flux-schnell' },
        { label: 'DALL-E 3', value: 'dalle-3' },
        { label: 'Nano Banana', value: 'nano-banana' },
      ],
      validate: (value: string[] | null | undefined) => {
        if (!value || value.length === 0) {
          return 'At least one model must be selected'
        }
        return true
      },
    },

    // ============================================
    // SECTION 3: BATCH (How Many Images)
    // ============================================
    {
      name: 'batchSection',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Admin/SectionDivider#SectionDivider',
        },
      },
    },
    {
      name: 'batchSectionHeader',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Admin/SectionHeader#SectionHeader',
        },
        custom: {
          heading: 'Batch Settings',
          description: 'Configure how many images to generate',
          level: 'h2',
        },
      },
    },
    {
      name: 'countPerPrompt',
      type: 'number',
      required: true,
      defaultValue: DEFAULT_BATCH_SIZE,
      min: 1,
      max: MAX_BATCH_SIZE,
      admin: {
        description: `Number of images to generate per prompt variant (1-${MAX_BATCH_SIZE})`,
      },
    },
    {
      name: 'variantCount',
      type: 'number',
      defaultValue: DEFAULT_VARIANT_COUNT,
      min: 1,
      max: 10,
      admin: {
        description: 'Number of prompt variants to generate (1-10)',
        hidden: true, // Managed by PromptOptimizerField
      },
    },
    {
      name: 'includeBaseStyle',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Include Base style (unmodified prompt) in generation',
      },
    },

    // ============================================
    // SECTION 4: OVERVIEW (Always Visible Summary)
    // ============================================
    {
      name: 'overviewSection',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Admin/SectionDivider#SectionDivider',
        },
      },
    },
    {
      name: 'taskOverview',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Studio/TaskOverviewField#TaskOverviewField',
        },
      },
    },

    // ============================================
    // SECTION 5: STATUS (Sidebar or Bottom)
    // ============================================
    {
      name: 'statusSection',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Admin/SectionDivider#SectionDivider',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: TaskStatus.Draft,
      options: TASK_STATUS_OPTIONS,
      admin: {
        description: 'Current task status',
        readOnly: true,
      },
      index: true,
    },
    {
      name: 'progress',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      max: 100,
      admin: {
        description: 'Completion percentage (0-100)',
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeValidate: [
      // Ensure at least one style is selected (from either source)
      async ({ data }) => {
        if (!data) return data

        const dbStylesCount = data.styles?.length || 0
        const importedStylesCount = data.importedStyleIds?.length || 0

        if (dbStylesCount === 0 && importedStylesCount === 0) {
          // Set default to base if no styles selected
          data.importedStyleIds = ['base']
        }

        return data
      },
    ],
  },
  timestamps: true,
}
