/**
 * Seed Script
 *
 * Seeds the database with default style templates and model configurations.
 * Run with: pnpm payload:seed
 */

import type { Payload } from 'payload'

import { AspectRatio, Provider } from '../lib/types'

// ============================================
// DEFAULT STYLE TEMPLATES
// ============================================

interface StyleTemplateData {
  styleId: string
  name: string
  description: string
  positivePrompt: string
  negativePrompt: string
  isSystem: boolean
  sortOrder: number
}

const DEFAULT_STYLES: StyleTemplateData[] = [
  {
    styleId: 'base',
    name: 'Base (No Style)',
    description: 'Original prompt without style modifications',
    positivePrompt: '{prompt}',
    negativePrompt: '',
    isSystem: true,
    sortOrder: -1,
  },
  {
    styleId: 'ghibli-anime',
    name: 'Studio Ghibli Style',
    description: "Hayao Miyazaki's signature animation aesthetic",
    positivePrompt:
      '{prompt}, studio ghibli style, cel shaded, vibrant colors, hayao miyazaki, hand-drawn animation, whimsical, detailed backgrounds, soft lighting',
    negativePrompt:
      '3d render, realistic, photorealistic, low quality, blurry, cgi, western animation',
    isSystem: true,
    sortOrder: 10,
  },
  {
    styleId: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon-lit futuristic dystopian aesthetic',
    positivePrompt:
      '{prompt}, cyberpunk style, neon lights, futuristic, dystopian, high tech, low life, rain, reflections, blade runner aesthetic, holographic displays',
    negativePrompt:
      'natural lighting, rural, vintage, old-fashioned, bright daylight, warm colors',
    isSystem: true,
    sortOrder: 20,
  },
  {
    styleId: 'film-noir',
    name: 'Film Noir',
    description: 'Classic 1940s noir cinematography style',
    positivePrompt:
      '{prompt}, film noir style, black and white, high contrast, dramatic shadows, venetian blind lighting, 1940s aesthetic, moody, atmospheric, cinematic',
    negativePrompt:
      'colorful, bright, cheerful, modern, low contrast, flat lighting',
    isSystem: true,
    sortOrder: 30,
  },
  {
    styleId: 'watercolor',
    name: 'Watercolor Painting',
    description: 'Soft watercolor painting style',
    positivePrompt:
      '{prompt}, watercolor painting, soft edges, flowing colors, artistic, traditional media, paper texture, wet on wet technique, delicate, impressionistic',
    negativePrompt:
      'digital art, sharp edges, 3d render, photorealistic, hard lines, vector art',
    isSystem: true,
    sortOrder: 40,
  },
  {
    styleId: 'oil-painting',
    name: 'Oil Painting',
    description: 'Classical oil painting technique',
    positivePrompt:
      '{prompt}, oil painting, classical art, rich colors, visible brushstrokes, canvas texture, old master style, dramatic lighting, chiaroscuro',
    negativePrompt:
      'digital art, flat colors, modern style, minimalist, photograph',
    isSystem: true,
    sortOrder: 50,
  },
  {
    styleId: 'pixel-art',
    name: 'Pixel Art',
    description: 'Retro 8-bit/16-bit pixel art style',
    positivePrompt:
      '{prompt}, pixel art, 16-bit style, retro gaming aesthetic, limited color palette, dithering, crisp pixels, nostalgic, sprite art',
    negativePrompt:
      'realistic, smooth gradients, high resolution, photorealistic, 3d render',
    isSystem: true,
    sortOrder: 60,
  },
  {
    styleId: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, simple minimalist design',
    positivePrompt:
      '{prompt}, minimalist style, simple, clean lines, negative space, limited color palette, modern design, geometric, elegant simplicity',
    negativePrompt:
      'cluttered, busy, ornate, detailed, complex, realistic, photographic',
    isSystem: true,
    sortOrder: 70,
  },
]

// ============================================
// DEFAULT MODEL CONFIGURATIONS
// ============================================

interface ModelConfigData {
  modelId: string
  displayName: string
  provider: Provider
  isEnabled: boolean
  rateLimit: number
  defaultParams: Record<string, unknown>
  supportedAspectRatios: AspectRatio[]
  supportedFeatures: string[]
  sortOrder: number
}

const DEFAULT_MODELS: ModelConfigData[] = [
  {
    modelId: 'flux-pro',
    displayName: 'Flux Pro',
    provider: Provider.Fal,
    isEnabled: true,
    rateLimit: 10,
    defaultParams: {
      num_inference_steps: 25,
      guidance_scale: 3.5,
      safety_tolerance: '2',
    },
    supportedAspectRatios: [
      AspectRatio.Square,
      AspectRatio.Landscape,
      AspectRatio.Portrait,
      AspectRatio.Standard,
      AspectRatio.StandardPortrait,
    ],
    supportedFeatures: ['seed', 'negativePrompt'],
    sortOrder: 10,
  },
  {
    modelId: 'flux-dev',
    displayName: 'Flux Dev',
    provider: Provider.Fal,
    isEnabled: true,
    rateLimit: 10,
    defaultParams: {
      num_inference_steps: 20,
      guidance_scale: 3.0,
      safety_tolerance: '2',
    },
    supportedAspectRatios: [
      AspectRatio.Square,
      AspectRatio.Landscape,
      AspectRatio.Portrait,
      AspectRatio.Standard,
      AspectRatio.StandardPortrait,
    ],
    supportedFeatures: ['seed', 'negativePrompt'],
    sortOrder: 20,
  },
  {
    modelId: 'flux-schnell',
    displayName: 'Flux Schnell (Fast)',
    provider: Provider.Fal,
    isEnabled: true,
    rateLimit: 15,
    defaultParams: {
      num_inference_steps: 4,
      safety_tolerance: '2',
    },
    supportedAspectRatios: [
      AspectRatio.Square,
      AspectRatio.Landscape,
      AspectRatio.Portrait,
      AspectRatio.Standard,
      AspectRatio.StandardPortrait,
    ],
    supportedFeatures: ['seed'],
    sortOrder: 30,
  },
  {
    modelId: 'dalle-3',
    displayName: 'DALL-E 3',
    provider: Provider.OpenAI,
    isEnabled: true,
    rateLimit: 5,
    defaultParams: {
      quality: 'hd',
      style: 'vivid',
    },
    supportedAspectRatios: [
      AspectRatio.Square,
      AspectRatio.Landscape,
      AspectRatio.Portrait,
    ],
    supportedFeatures: [],
    sortOrder: 40,
  },
  {
    modelId: 'imagen-3',
    displayName: 'Imagen 3 (Nano Banana)',
    provider: Provider.Google,
    isEnabled: true,
    rateLimit: 15,
    defaultParams: {
      safetySetting: 'block_some',
    },
    supportedAspectRatios: [
      AspectRatio.Square,
      AspectRatio.Landscape,
      AspectRatio.Portrait,
      AspectRatio.Standard,
      AspectRatio.StandardPortrait,
    ],
    supportedFeatures: ['batch'],
    sortOrder: 50,
  },
]

// ============================================
// SEED FUNCTIONS
// ============================================

// Use a flexible payload type to avoid strict collection type checking
// until types are regenerated
type FlexiblePayload = Payload & {
  find: (args: { collection: string; where: Record<string, unknown>; limit: number }) => Promise<{ docs: unknown[] }>
  create: (args: { collection: string; data: Record<string, unknown> }) => Promise<unknown>
}

/**
 * Seed style templates
 */
async function seedStyleTemplates(payload: FlexiblePayload): Promise<void> {
  console.log('Seeding style templates...')

  for (const style of DEFAULT_STYLES) {
    try {
      // Check if style already exists
      const existing = await payload.find({
        collection: 'style-templates',
        where: {
          styleId: { equals: style.styleId },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        console.log(`  Style "${style.styleId}" already exists, skipping`)
        continue
      }

      // Create the style
      await payload.create({
        collection: 'style-templates',
        data: style as unknown as Record<string, unknown>,
      })

      console.log(`  Created style: ${style.name}`)
    } catch (error) {
      console.error(`  Failed to create style "${style.styleId}":`, error)
    }
  }

  console.log('Style templates seeded successfully')
}

/**
 * Seed model configurations
 */
async function seedModelConfigs(payload: FlexiblePayload): Promise<void> {
  console.log('Seeding model configurations...')

  for (const model of DEFAULT_MODELS) {
    try {
      // Check if model already exists
      const existing = await payload.find({
        collection: 'model-configs',
        where: {
          modelId: { equals: model.modelId },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        console.log(`  Model "${model.modelId}" already exists, skipping`)
        continue
      }

      // Create the model config
      await payload.create({
        collection: 'model-configs',
        data: model as unknown as Record<string, unknown>,
      })

      console.log(`  Created model: ${model.displayName}`)
    } catch (error) {
      console.error(`  Failed to create model "${model.modelId}":`, error)
    }
  }

  console.log('Model configurations seeded successfully')
}

/**
 * Main seed function
 */
export async function seed(payload: Payload): Promise<void> {
  console.log('Starting database seed...')
  console.log('========================')

  await seedStyleTemplates(payload as FlexiblePayload)
  console.log('')
  await seedModelConfigs(payload as FlexiblePayload)

  console.log('')
  console.log('========================')
  console.log('Database seed complete!')
}

/**
 * Export default styles for reference
 */
export const defaultStyles = DEFAULT_STYLES

/**
 * Export default models for reference
 */
export const defaultModels = DEFAULT_MODELS
