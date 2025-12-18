/**
 * Expand Prompt Job Handler
 *
 * PayloadCMS job handler for LLM prompt optimization.
 * Takes a user's brief theme and generates optimized prompt variants.
 *
 * Phase 3 (User Story 1): Creates placeholder variants
 * Phase 4 (User Story 2): Will implement actual LLM prompt expansion
 */

import type { BasePayload } from 'payload'
import { TaskStatus, type ExpandedPrompt } from '../lib/types'
import { createSubTaskSpecs, type TaskConfig } from '../services/task-orchestrator'
import { mergeStyle, type StyleTemplate } from '../services/style-merger'

/**
 * Input data for the expand-prompt job
 */
export interface ExpandPromptJobInput {
  taskId: string
  subject: string
  variantCount: number
  webSearchEnabled: boolean
}

/**
 * Output data from the expand-prompt job
 */
export interface ExpandPromptJobOutput {
  success: boolean
  variants?: Array<{
    variantId: string
    variantName: string
    expandedPrompt: string
    subjectSlug: string
  }>
  subTasksCreated?: number
  error?: string
}

/**
 * Generate a subject slug from the original subject
 */
function generateSubjectSlug(subject: string): string {
  return subject
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) || 'untitled'
}

/**
 * Default variant names for prompt expansion
 */
const DEFAULT_VARIANT_NAMES = [
  'Realistic',
  'Abstract',
  'Artistic',
  'Cinematic',
  'Surreal',
  'Minimalist',
  'Dramatic',
  'Whimsical',
  'Dark',
  'Vibrant',
]

/**
 * Expand prompt job handler
 *
 * This handler will:
 * 1. Update task status to 'expanding'
 * 2. Generate prompt variants (placeholder for Phase 4 LLM integration)
 * 3. Update the Task document with expanded prompts
 * 4. Create SubTask documents for each prompt/style/model combination
 * 5. Queue generate-image jobs for each SubTask
 */
export async function expandPromptHandler({
  input,
  req,
}: {
  input: ExpandPromptJobInput
  req: { payload: BasePayload }
}): Promise<{ output: ExpandPromptJobOutput }> {
  const { taskId, subject, variantCount } = input
  const { payload } = req

  console.log(`[expand-prompt] Starting expansion for task ${taskId}`)
  console.log(`[expand-prompt] Subject: "${subject}"`)
  console.log(`[expand-prompt] Variant count: ${variantCount}`)

  try {
    // Update task status to 'expanding'
    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        status: TaskStatus.Expanding,
      },
    })

    // Generate subject slug
    const subjectSlug = generateSubjectSlug(subject)

    // TODO: Phase 4 - Implement actual LLM prompt expansion using Gemini Pro
    // For now, create placeholder variants with enhanced prompts
    const variants: ExpandedPrompt[] = []
    for (let i = 0; i < variantCount; i++) {
      const variantName = DEFAULT_VARIANT_NAMES[i] || `Variant ${i + 1}`
      variants.push({
        variantId: `variant-${i + 1}`,
        variantName,
        originalPrompt: subject,
        expandedPrompt: `${subject}, ${variantName.toLowerCase()} style, high quality, detailed, professional, masterpiece`,
        subjectSlug,
      })
    }

    // Update task with expanded prompts
    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        expandedPrompts: variants,
      },
    })

    console.log(`[expand-prompt] Generated ${variants.length} variants for task ${taskId}`)

    // Fetch the full task to get styles, models, and batch config
    const task = await payload.findByID({
      collection: 'tasks',
      id: taskId,
    })

    if (!task) {
      throw new Error(`Task ${taskId} not found after update`)
    }

    // Extract style IDs and model IDs
    const styleIds = Array.isArray(task.styles)
      ? task.styles.map((s: string | { id?: string; styleId?: string }) =>
          typeof s === 'string' ? s : (s.styleId || s.id || ''))
      : []

    const modelIds = Array.isArray(task.models) ? task.models : []

    const batchConfig = task.batchConfig as { countPerPrompt?: number; includeBaseStyle?: boolean } || {}
    const batchSize = batchConfig.countPerPrompt || 1
    const includeBaseStyle = batchConfig.includeBaseStyle ?? true
    const aspectRatio = (task as { aspectRatio?: string }).aspectRatio || '1:1'

    // Fetch style templates for merging
    const stylesResult = await payload.find({
      collection: 'style-templates',
      where: {
        or: [
          { styleId: { in: styleIds } },
          ...(includeBaseStyle ? [{ styleId: { equals: 'base' } }] : []),
        ],
      },
      limit: 100,
    })

    const styleTemplates: StyleTemplate[] = stylesResult.docs.map((doc) => ({
      styleId: (doc as { styleId?: string }).styleId || '',
      name: (doc as { name?: string }).name || '',
      positivePrompt: (doc as { positivePrompt?: string }).positivePrompt || '{prompt}',
      negativePrompt: (doc as { negativePrompt?: string }).negativePrompt || '',
    }))

    // Create task config for sub-task generation
    const taskConfig: TaskConfig = {
      taskId,
      expandedPrompts: variants,
      selectedStyles: styleIds,
      selectedModels: modelIds,
      batchSize,
      includeBaseStyle,
    }

    // Generate sub-task specifications
    const subTaskSpecs = createSubTaskSpecs(taskConfig)

    console.log(`[expand-prompt] Creating ${subTaskSpecs.length} sub-tasks for task ${taskId}`)

    // Create SubTask documents and queue jobs
    let subTasksCreated = 0
    for (const spec of subTaskSpecs) {
      // Find the style template for this spec
      const styleTemplate = styleTemplates.find((s) => s.styleId === spec.styleId)
        || { styleId: spec.styleId, name: spec.styleId, positivePrompt: '{prompt}', negativePrompt: '' }

      // Merge prompt with style
      const merged = mergeStyle(spec.expandedPrompt.expandedPrompt, styleTemplate)

      // Create the SubTask document
      const subTask = await payload.create({
        collection: 'sub-tasks',
        data: {
          parentTask: taskId,
          status: 'pending',
          styleId: spec.styleId,
          modelId: spec.modelId,
          expandedPrompt: spec.expandedPrompt,
          finalPrompt: merged.finalPrompt,
          negativePrompt: merged.negativePrompt,
          batchIndex: spec.batchIndex,
          aspectRatio,
          retryCount: 0,
        },
      })

      // Queue generate-image job for this SubTask
      await payload.jobs.queue({
        task: 'generate-image',
        input: {
          subTaskId: subTask.id,
          modelId: spec.modelId,
          finalPrompt: merged.finalPrompt,
          negativePrompt: merged.negativePrompt,
          aspectRatio,
        },
      })

      subTasksCreated++
    }

    // Update task status to 'processing'
    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        status: TaskStatus.Processing,
      },
    })

    console.log(`[expand-prompt] Created ${subTasksCreated} sub-tasks and queued jobs for task ${taskId}`)

    return {
      output: {
        success: true,
        variants,
        subTasksCreated,
      },
    }
  } catch (error) {
    console.error(`[expand-prompt] Error processing task ${taskId}:`, error)

    // Update task status to failed
    try {
      await payload.update({
        collection: 'tasks',
        id: taskId,
        data: {
          status: TaskStatus.Failed,
        },
      })
    } catch (updateError) {
      console.error(`[expand-prompt] Error updating task status to failed:`, updateError)
    }

    return {
      output: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}
