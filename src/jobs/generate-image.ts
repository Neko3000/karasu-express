/**
 * Generate Image Job Handler
 *
 * PayloadCMS job handler for AI image generation.
 * Executes a single image generation request via the appropriate adapter.
 *
 * Phase 3 (User Story 1): Full implementation with asset management
 */

import type { BasePayload } from 'payload'

import { AspectRatio, SubTaskStatus, ErrorCategory, MAX_RETRY_ATTEMPTS, type ExpandedPrompt } from '../lib/types'
import { getAdapterOrThrow } from '../adapters'
import { formatErrorForLog } from '../lib/error-normalizer'
import {
  generateFilename,
  generateAltText,
  getExtensionFromMimeType,
} from '../services/asset-manager'

/**
 * Input data for the generate-image job
 */
export interface GenerateImageJobInput {
  subTaskId: string
  modelId: string
  finalPrompt: string
  negativePrompt?: string
  aspectRatio: AspectRatio
  seed?: number
  providerOptions?: Record<string, unknown>
}

/**
 * Output data from the generate-image job
 */
export interface GenerateImageJobOutput {
  success: boolean
  imageUrl?: string
  mediaId?: string
  seed?: number
  error?: string
  errorCategory?: string
}

/**
 * Generate image job handler
 *
 * This handler will:
 * 1. Get the appropriate adapter for the model
 * 2. Execute the image generation request
 * 3. Create a Media document linked to the SubTask
 * 4. Update the SubTask status
 */
export async function generateImageHandler({
  input,
  req,
}: {
  input: GenerateImageJobInput
  req: { payload: BasePayload }
}): Promise<{ output: GenerateImageJobOutput }> {
  const {
    subTaskId,
    modelId,
    finalPrompt,
    negativePrompt,
    aspectRatio,
    seed,
    providerOptions,
  } = input
  const { payload } = req

  console.log(`[generate-image] Starting generation for sub-task ${subTaskId}`)
  console.log(`[generate-image] Model: ${modelId}`)
  console.log(`[generate-image] Prompt: "${finalPrompt.substring(0, 100)}..."`)

  try {
    // Update sub-task status to processing
    await payload.update({
      collection: 'sub-tasks',
      id: subTaskId,
      data: {
        status: SubTaskStatus.Processing,
        startedAt: new Date().toISOString(),
      },
    })

    // Get the adapter for this model
    const adapter = getAdapterOrThrow(modelId)

    // Store request payload for observability
    const requestPayload = {
      prompt: finalPrompt,
      negativePrompt,
      aspectRatio,
      seed,
      providerOptions,
    }

    await payload.update({
      collection: 'sub-tasks',
      id: subTaskId,
      data: {
        requestPayload,
      },
    })

    // Execute generation
    const result = await adapter.generate({
      prompt: finalPrompt,
      negativePrompt,
      aspectRatio,
      seed,
      providerOptions,
    })

    // Store response data
    await payload.update({
      collection: 'sub-tasks',
      id: subTaskId,
      data: {
        responseData: result.metadata,
      },
    })

    // Get the first generated image
    const generatedImage = result.images[0]

    if (!generatedImage) {
      throw new Error('No image returned from generation')
    }

    // Fetch the sub-task to get metadata for the Media document
    const subTask = await payload.findByID({
      collection: 'sub-tasks',
      id: subTaskId,
    })

    if (!subTask) {
      throw new Error(`SubTask ${subTaskId} not found`)
    }

    // Extract metadata from sub-task
    const expandedPrompt = subTask.expandedPrompt as ExpandedPrompt | null
    const parentTaskId = typeof subTask.parentTask === 'string'
      ? subTask.parentTask
      : (subTask.parentTask as { id?: string })?.id || ''
    const styleId = (subTask as { styleId?: string }).styleId || 'unknown'
    const batchIndex = (subTask as { batchIndex?: number }).batchIndex || 0
    const subjectSlug = expandedPrompt?.subjectSlug || 'generated'

    // Generate filename
    const extension = getExtensionFromMimeType(generatedImage.contentType)
    const filename = generateFilename({
      subjectSlug,
      styleId,
      modelId,
      batchIndex,
      extension,
    })

    // Generate alt text
    const altText = generateAltText(subjectSlug, styleId, adapter.displayName)

    // Create generation metadata
    const generationMeta = {
      taskId: parentTaskId,
      subjectSlug,
      styleId,
      modelId,
      batchIndex,
      finalPrompt,
      negativePrompt,
      seed: result.seed,
      aspectRatio,
      providerParams: providerOptions,
    }

    // Create Media document
    // Note: In a production environment, you would download the image
    // and upload it to your own storage. For now, we store the URL.
    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: altText,
        relatedSubtask: subTaskId,
        assetType: 'image',
        generationMeta,
        taskId: parentTaskId,
        styleId,
        modelId,
        subjectSlug,
        // The URL will be stored in a custom field or we'd handle upload differently
        // For MVP, we'll store metadata and reference the external URL
      },
    })

    // Update sub-task as successful
    await payload.update({
      collection: 'sub-tasks',
      id: subTaskId,
      data: {
        status: SubTaskStatus.Success,
        completedAt: new Date().toISOString(),
        responseData: {
          ...result.metadata,
          imageUrl: generatedImage.url,
          seed: result.seed,
          mediaId: mediaDoc.id,
        },
      },
    })

    console.log(
      `[generate-image] Successfully generated image for sub-task ${subTaskId}`
    )

    return {
      output: {
        success: true,
        imageUrl: generatedImage.url,
        mediaId: String(mediaDoc.id),
        seed: result.seed,
      },
    }
  } catch (error) {
    console.error(
      `[generate-image] Error generating image for sub-task ${subTaskId}:`,
      error
    )

    // Get adapter to normalize error
    let errorCategory = ErrorCategory.Unknown
    let errorMessage = error instanceof Error ? error.message : 'Unknown error'
    let isRetryable = false

    try {
      const adapter = getAdapterOrThrow(modelId)
      const normalizedError = adapter.normalizeError(error)
      errorCategory = normalizedError.category
      errorMessage = formatErrorForLog(normalizedError)
      isRetryable = normalizedError.retryable

      // If retryable, check retry count
      if (isRetryable) {
        const subTask = await payload.findByID({
          collection: 'sub-tasks',
          id: subTaskId,
        })

        const retryCount = ((subTask as { retryCount?: number })?.retryCount || 0) + 1

        if (retryCount < MAX_RETRY_ATTEMPTS) {
          // Still within retry limit - keep as pending for retry
          await payload.update({
            collection: 'sub-tasks',
            id: subTaskId,
            data: {
              status: SubTaskStatus.Pending,
              retryCount,
              errorLog: errorMessage,
              errorCategory,
            },
          })

          // Re-throw to trigger job retry
          throw error
        }
      }
    } catch (adapterError) {
      // If adapterError is the same as the original error, it's a retry case
      if (adapterError === error) {
        throw error
      }
      // Otherwise, ignore adapter errors during error handling
    }

    // Update sub-task as failed
    await payload.update({
      collection: 'sub-tasks',
      id: subTaskId,
      data: {
        status: SubTaskStatus.Failed,
        completedAt: new Date().toISOString(),
        errorLog: errorMessage,
        errorCategory,
      },
    })

    return {
      output: {
        success: false,
        error: errorMessage,
        errorCategory,
      },
    }
  }
}
