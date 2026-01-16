/**
 * Seed Script
 *
 * Seeds the database with default style templates and model configurations.
 * Run with: pnpm payload:seed
 *
 * Style data source: src/resources/original/sdxl_styles_exp.json
 */

import * as fs from 'fs'
import * as path from 'path'
import type { Payload } from 'payload'

import { AspectRatio, Provider } from '../lib/types'
import { generateStyleId, type RawImportedStyle } from '../lib/style-types'

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

/**
 * Load SDXL styles from the JSON file
 */
function loadStylesFromJson(): RawImportedStyle[] {
  const jsonPath = path.join(__dirname, '../resources/original/sdxl_styles_exp.json')
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
  return JSON.parse(jsonContent) as RawImportedStyle[]
}

/**
 * Convert all SDXL styles from the JSON file to StyleTemplateData format
 * This ensures ALL styles are seeded to the database
 */
function getAllStylesToSeed(): StyleTemplateData[] {
  const sdxlStylesData = loadStylesFromJson()

  return sdxlStylesData.map((rawStyle, index) => {
    const styleId = generateStyleId(rawStyle.name)
    const isBase = styleId === 'base'

    return {
      styleId,
      name: rawStyle.name,
      description: isBase ? 'Original prompt without style modifications' : `${rawStyle.name} style`,
      positivePrompt: rawStyle.prompt,
      negativePrompt: rawStyle.negative_prompt,
      isSystem: isBase, // Only base is marked as system style (cannot be deleted)
      sortOrder: isBase ? -1 : index * 10, // Base first, then ordered by index
    }
  })
}

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
    modelId: 'nano-banana',
    displayName: 'Nano Banana',
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
 * Seed style templates from SDXL styles data
 * Seeds ALL styles from sdxl-styles-exp.ts to the database
 */
async function seedStyleTemplates(payload: FlexiblePayload): Promise<void> {
  const stylesToSeed = getAllStylesToSeed()
  console.log(`Seeding ${stylesToSeed.length} style templates...`)

  let created = 0
  let skipped = 0

  for (const style of stylesToSeed) {
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
        skipped++
        continue
      }

      // Create the style
      await payload.create({
        collection: 'style-templates',
        data: style as unknown as Record<string, unknown>,
      })

      created++
    } catch (error) {
      console.error(`  Failed to create style "${style.styleId}":`, error)
    }
  }

  console.log(`Style templates seeded: ${created} created, ${skipped} already existed`)
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
 * Export default styles for reference (now includes all SDXL styles)
 */
export const defaultStyles = getAllStylesToSeed()

/**
 * Export default models for reference
 */
export const defaultModels = DEFAULT_MODELS
