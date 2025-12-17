/**
 * ModelConfigs Collection
 *
 * Configuration for each AI model provider.
 * Stores model settings, rate limits, and supported features.
 */

import type { CollectionConfig } from 'payload'

import { PROVIDER_OPTIONS, ASPECT_RATIO_OPTIONS } from '../lib/types'

/**
 * Model feature options
 */
const MODEL_FEATURE_OPTIONS = [
  { label: 'Batch Generation', value: 'batch' },
  { label: 'Seed Control', value: 'seed' },
  { label: 'Negative Prompt', value: 'negativePrompt' },
]

export const ModelConfigs: CollectionConfig = {
  slug: 'model-configs',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'modelId', 'provider', 'isEnabled', 'rateLimit'],
    group: 'Configuration',
    description: 'AI model configurations and rate limits',
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'modelId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique identifier (e.g., flux-pro, dalle-3)',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'Model ID is required'
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Model ID must contain only lowercase letters, numbers, and hyphens'
        }
        return true
      },
    },
    {
      name: 'displayName',
      type: 'text',
      required: true,
      admin: {
        description: 'Human-readable name',
      },
    },
    {
      name: 'provider',
      type: 'select',
      required: true,
      index: true,
      options: PROVIDER_OPTIONS,
      admin: {
        description: 'AI provider for this model',
      },
    },
    {
      name: 'isEnabled',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this model is available for selection',
        position: 'sidebar',
      },
    },
    {
      name: 'rateLimit',
      type: 'number',
      required: true,
      defaultValue: 10,
      min: 1,
      max: 100,
      admin: {
        description: 'Maximum concurrent requests',
        position: 'sidebar',
      },
    },
    {
      name: 'defaultParams',
      type: 'json',
      required: true,
      defaultValue: {},
      admin: {
        description: 'Default generation parameters (JSON)',
      },
    },
    {
      name: 'supportedAspectRatios',
      type: 'select',
      hasMany: true,
      required: true,
      options: ASPECT_RATIO_OPTIONS,
      admin: {
        description: 'Supported aspect ratios for this model',
      },
    },
    {
      name: 'supportedFeatures',
      type: 'select',
      hasMany: true,
      options: MODEL_FEATURE_OPTIONS,
      admin: {
        description: 'Features supported by this model',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      index: true,
      admin: {
        description: 'Display order in UI',
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this model',
        position: 'sidebar',
      },
    },
  ],
}
