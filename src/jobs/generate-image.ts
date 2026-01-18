/**
 * Generate Image Job Handler
 *
 * PayloadCMS job handler for AI image generation.
 * Executes a single image generation request via the appropriate adapter.
 *
 * Phase 3 (User Story 1): Full implementation with asset management
 * Phase 7 (User Story 4): Added cancellation signal check
 * Phase 7 (Bug Fix): Download images locally before uploading to PayloadCMS Media collection
 * Phase 7 (T043x, T043y): Keep generated files and use filePath for PayloadCMS upload
 */

import type { BasePayload } from 'payload'

import { AspectRatio, SubTaskStatus, TaskStatus, ErrorCategory, MAX_RETRY_ATTEMPTS, type ExpandedPrompt } from '../lib/types'
import { getAdapterOrThrow } from '../adapters'
import { formatErrorForLog } from '../lib/error-normalizer'
import {
  generateFilename,
  generateAltText,
  getExtensionFromMimeType,
} from '../services/asset-manager'
import {
  downloadImage,
  saveToGeneratesFolder,
} from '../services/image-storage'

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
    // Phase 7: Check if parent task has been cancelled before processing
    // Get the sub-task to find parent task
    const subTaskCheck = await payload.findByID({
      collection: 'sub-tasks',
      id: subTaskId,
    })

    if (subTaskCheck) {
      const parentTaskId = typeof subTaskCheck.parentTask === 'string'
        ? subTaskCheck.parentTask
        : (subTaskCheck.parentTask as { id?: string })?.id

      if (parentTaskId) {
        const parentTask = await payload.findByID({
          collection: 'tasks',
          id: parentTaskId,
        })

        if (parentTask && parentTask.status === TaskStatus.Cancelled) {
          console.log(`[generate-image] Parent task ${parentTaskId} is cancelled. Skipping sub-task ${subTaskId}`)

          // Update sub-task to cancelled
          await payload.update({
            collection: 'sub-tasks',
            id: subTaskId,
            data: {
              status: SubTaskStatus.Cancelled,
              completedAt: new Date().toISOString(),
            },
          })

          return {
            output: {
              success: false,
              error: 'Parent task cancelled',
              errorCategory: 'UNKNOWN',
            },
          }
        }
      }
    }

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

    // Phase 7 Bug Fix: Download image from API URL and upload to PayloadCMS Media
    // This fixes the "MissingFile: No files were uploaded" error
    // Phase 7 (T043x, T043y): Keep generated files and use filePath for upload
    console.log(`[generate-image] Downloading image from: ${generatedImage.url}`)

    // Download the image from the API response URL
    const downloadedImage = await downloadImage(generatedImage.url)

    // Save to generates folder (files are retained for debugging/persistence)
    const savedFile = await saveToGeneratesFolder(downloadedImage.buffer, filename)
    console.log(`[generate-image] Saved image to: ${savedFile.filePath}`)

    // Create Media document with file path
    // PayloadCMS reads the file directly from disk using filePath option
    // This reduces memory usage by not holding large buffers
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
      },
      filePath: savedFile.filePath,
    })

    console.log(`[generate-image] Created Media document: ${mediaDoc.id}`)
    console.log(`[generate-image] Image retained at: ${savedFile.filePath}`)

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
