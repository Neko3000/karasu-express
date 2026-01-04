/**
 * Expand Prompt Job Handler
 *
 * PayloadCMS job handler for LLM prompt optimization.
 * Takes a user's brief theme and generates optimized prompt variants.
 *
 * Phase 4 (User Story 2): Uses Gemini Pro for intelligent prompt expansion
 */

import type { BasePayload } from 'payload'
import { TaskStatus, type ExpandedPrompt } from '../lib/types'
import { createSubTaskSpecs, type TaskConfig } from '../services/task-orchestrator'
import { mergeStyle, type StyleTemplate } from '../services/style-merger'
import {
  createPromptOptimizer,
  generateSubjectSlug,
  type PromptExpansionResult,
} from '../services/prompt-optimizer'

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
  usedLLM?: boolean
}

/**
 * Default variant names for fallback expansion
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
 * Create fallback variants when LLM is unavailable
 */
function createFallbackVariants(
  subject: string,
  variantCount: number,
  subjectSlug: string
): ExpandedPrompt[] {
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

  return variants
}

/**
 * Convert LLM expansion result to ExpandedPrompt format
 */
function convertToExpandedPrompts(
  result: PromptExpansionResult,
  originalPrompt: string
): ExpandedPrompt[] {
  return result.variants.map((variant) => ({
    variantId: variant.variantId,
    variantName: variant.variantName,
    originalPrompt,
    expandedPrompt: variant.expandedPrompt,
    subjectSlug: result.subjectSlug,
  }))
}

/**
 * Expand prompt using LLM (Gemini Pro)
 * Falls back to placeholder expansion if LLM is unavailable
 */
async function expandWithLLM(
  subject: string,
  variantCount: number,
  webSearchEnabled: boolean
): Promise<{ variants: ExpandedPrompt[]; usedLLM: boolean }> {
  // Check if API key is available
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.log('[expand-prompt] GOOGLE_AI_API_KEY not set, using fallback expansion')
    const subjectSlug = generateSubjectSlug(subject)
    return {
      variants: createFallbackVariants(subject, variantCount, subjectSlug),
      usedLLM: false,
    }
  }

  try {
    console.log('[expand-prompt] Using Gemini Pro for prompt expansion')

    const optimizer = createPromptOptimizer()
    const result = await optimizer.expandPrompt({
      subject,
      variantCount,
      webSearchEnabled,
    })

    console.log(
      `[expand-prompt] LLM generated ${result.variants.length} variants (slug: ${result.subjectSlug})`
    )

    if (result.searchContext) {
      console.log(`[expand-prompt] Search context: ${result.searchContext}`)
    }

    return {
      variants: convertToExpandedPrompts(result, subject),
      usedLLM: true,
    }
  } catch (error) {
    console.error('[expand-prompt] LLM expansion failed, using fallback:', error)

    const subjectSlug = generateSubjectSlug(subject)
    return {
      variants: createFallbackVariants(subject, variantCount, subjectSlug),
      usedLLM: false,
    }
  }
}

/**
 * Expand prompt job handler
 *
 * This handler will:
 * 1. Update task status to 'expanding'
 * 2. Generate prompt variants using Gemini Pro (or fallback)
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
  const { taskId, subject, variantCount, webSearchEnabled } = input
  const { payload } = req

  console.log(`[expand-prompt] Starting expansion for task ${taskId}`)
  console.log(`[expand-prompt] Subject: "${subject}"`)
  console.log(`[expand-prompt] Variant count: ${variantCount}`)
  console.log(`[expand-prompt] Web search enabled: ${webSearchEnabled}`)

  try {
    // Update task status to 'expanding'
    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        status: TaskStatus.Expanding,
      },
    })

    // Expand prompts using LLM or fallback
    const { variants, usedLLM } = await expandWithLLM(subject, variantCount, webSearchEnabled)

    // Update task with expanded prompts
    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        expandedPrompts: variants,
      },
    })

    console.log(
      `[expand-prompt] Generated ${variants.length} variants for task ${taskId} (LLM: ${usedLLM})`
    )

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
          typeof s === 'string' ? s : s.styleId || s.id || ''
        )
      : []

    const modelIds = Array.isArray(task.models) ? task.models : []

    const batchSize = (task as { countPerPrompt?: number }).countPerPrompt || 1
    const includeBaseStyle = (task as { includeBaseStyle?: boolean }).includeBaseStyle ?? true
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
      const styleTemplate =
        styleTemplates.find((s) => s.styleId === spec.styleId) ||
        { styleId: spec.styleId, name: spec.styleId, positivePrompt: '{prompt}', negativePrompt: '' }

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
          expandedPrompt: spec.expandedPrompt as unknown as Record<string, unknown>,
          finalPrompt: merged.finalPrompt,
          negativePrompt: merged.negativePrompt,
          batchIndex: spec.batchIndex,
          aspectRatio: aspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
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

    console.log(
      `[expand-prompt] Created ${subTasksCreated} sub-tasks and queued jobs for task ${taskId}`
    )

    return {
      output: {
        success: true,
        variants,
        subTasksCreated,
        usedLLM,
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
