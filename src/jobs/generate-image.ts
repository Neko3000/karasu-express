/**
 * Generate Image Job Handler
 *
 * PayloadCMS job handler for AI image generation.
 * Executes a single image generation request via the appropriate adapter.
 *
 * Note: This is a placeholder that will be fully implemented in Phase 3 (User Story 1).
 * The handler structure is created here to enable Jobs Queue configuration.
 */

import type { BasePayload } from 'payload'

import { AspectRatio } from '../lib/types'
import { getAdapterOrThrow } from '../adapters'
import { formatErrorForLog } from '../lib/error-normalizer'

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
 * 3. Upload the result to storage
 * 4. Create a Media document linked to the SubTask
 * 5. Update the SubTask status
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
      collection: 'sub-tasks' as 'users',
      id: subTaskId,
      data: {
        status: 'processing',
        startedAt: new Date().toISOString(),
      } as Record<string, unknown>,
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
      collection: 'sub-tasks' as 'users',
      id: subTaskId,
      data: {
        requestPayload,
      } as Record<string, unknown>,
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
      collection: 'sub-tasks' as 'users',
      id: subTaskId,
      data: {
        responseData: result.metadata,
      } as Record<string, unknown>,
    })

    // Get the first generated image
    const generatedImage = result.images[0]

    if (!generatedImage) {
      throw new Error('No image returned from generation')
    }

    // TODO: Phase 3 - Upload to storage and create Media document
    // For now, we'll store the URL directly

    // Update sub-task as successful
    await payload.update({
      collection: 'sub-tasks' as 'users',
      id: subTaskId,
      data: {
        status: 'success',
        completedAt: new Date().toISOString(),
        responseData: {
          ...result.metadata,
          imageUrl: generatedImage.url,
          seed: result.seed,
        },
      } as Record<string, unknown>,
    })

    console.log(
      `[generate-image] Successfully generated image for sub-task ${subTaskId}`
    )

    return {
      output: {
        success: true,
        imageUrl: generatedImage.url,
        seed: result.seed,
      },
    }
  } catch (error) {
    console.error(
      `[generate-image] Error generating image for sub-task ${subTaskId}:`,
      error
    )

    // Get adapter to normalize error
    let errorCategory = 'UNKNOWN'
    let errorMessage = error instanceof Error ? error.message : 'Unknown error'

    try {
      const adapter = getAdapterOrThrow(modelId)
      const normalizedError = adapter.normalizeError(error)
      errorCategory = normalizedError.category
      errorMessage = formatErrorForLog(normalizedError)

      // If retryable, don't mark as completely failed
      if (normalizedError.retryable) {
        // Update retry count
        const subTask = await payload.findByID({
          collection: 'sub-tasks' as 'users',
          id: subTaskId,
        })

        const retryCount = ((subTask as { retryCount?: number })?.retryCount || 0) + 1

        if (retryCount < 3) {
          // Still within retry limit - keep as pending for retry
          await payload.update({
            collection: 'sub-tasks' as 'users',
            id: subTaskId,
            data: {
              status: 'pending',
              retryCount,
              errorLog: errorMessage,
              errorCategory,
            } as Record<string, unknown>,
          })

          // Re-throw to trigger job retry
          throw error
        }
      }
    } catch (adapterError) {
      // Ignore adapter errors during error handling
      if (adapterError === error) {
        throw error // Re-throw if it's the retry case
      }
    }

    // Update sub-task as failed
    await payload.update({
      collection: 'sub-tasks' as 'users',
      id: subTaskId,
      data: {
        status: 'failed',
        completedAt: new Date().toISOString(),
        errorLog: errorMessage,
        errorCategory,
      } as Record<string, unknown>,
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
