'use client'

/**
 * useTaskOverview Hook
 *
 * Aggregates all form state (variants, styles, models, batch config)
 * and calculates summary statistics for the task creation page.
 *
 * Part of Phase 5: Optimize Task Creation Page
 * Task: T038z - Create useTaskOverview hook
 */

import { useMemo } from 'react'
import type { VariantWithSelection } from '../PromptVariantsList'
import type { MergeableStyle } from '../../../services/style-merger'

// ============================================
// TYPES
// ============================================

/**
 * Model configuration for display
 */
export interface ModelInfo {
  /** Unique model identifier */
  modelId: string
  /** Display name */
  displayName: string
  /** Provider name (e.g., 'fal', 'openai', 'google') */
  provider: string
}

/**
 * Batch configuration settings
 */
export interface BatchConfig {
  /** Number of images to generate per prompt */
  countPerPrompt: number
  /** Selected aspect ratio */
  aspectRatio: string
}

/**
 * Overview data structure for display components
 */
export interface TaskOverviewData {
  // ---- Settings Summary ----
  /** Selected models with details */
  selectedModels: ModelInfo[]
  /** Selected aspect ratio */
  aspectRatio: string
  /** Number of images per prompt */
  countPerPrompt: number

  // ---- Prompts Count ----
  /** Number of selected variants */
  variantCount: number
  /** Number of selected styles */
  styleCount: number
  /** Calculated prompts: variants × styles */
  calculatedPromptsCount: number
  /** Formula display (e.g., "3 variants × 2 styles = 6 prompts") */
  promptsFormula: string

  // ---- Image Count ----
  /** Images per model: variants × styles × countPerPrompt */
  imagesPerModel: number
  /** Total images: variants × styles × countPerPrompt × models */
  totalImages: number
  /** Formula display for image count */
  imageFormula: string
  /** Detailed breakdown per model */
  imageBreakdownPerModel: Array<{ modelId: string; modelName: string; count: number }>

  // ---- Task Summary Stats ----
  /** Estimated number of API calls */
  estimatedApiCalls: number
  /** Selected providers summary */
  providersSummary: string[]
  /** Warning message if applicable (e.g., high image count) */
  warning: string | null

  // ---- State flags ----
  /** Whether there's enough data to show overview */
  isReady: boolean
  /** Whether total images exceeds warning threshold */
  hasWarning: boolean
}

/**
 * Input parameters for the hook
 */
export interface UseTaskOverviewParams {
  /** Selected variants with selection state */
  variants: VariantWithSelection[]
  /** Selected styles */
  selectedStyles: MergeableStyle[]
  /** Selected models */
  selectedModels: ModelInfo[]
  /** Batch configuration */
  batchConfig: BatchConfig
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Warning threshold for high image count
 */
const HIGH_IMAGE_COUNT_THRESHOLD = 500

// ============================================
// HOOK
// ============================================

/**
 * Calculate task overview data from form state
 *
 * @param params - Form state including variants, styles, models, batch config
 * @returns Aggregated overview data for display components
 *
 * @example
 * ```tsx
 * const overview = useTaskOverview({
 *   variants: selectedVariants,
 *   selectedStyles,
 *   selectedModels,
 *   batchConfig: { countPerPrompt: 5, aspectRatio: '1:1' }
 * });
 *
 * // overview.totalImages = variants × styles × countPerPrompt × models
 * // overview.hasWarning = totalImages > 500
 * ```
 */
export function useTaskOverview({
  variants,
  selectedStyles,
  selectedModels,
  batchConfig,
}: UseTaskOverviewParams): TaskOverviewData {
  return useMemo<TaskOverviewData>(() => {
    // Count selected items
    const selectedVariants = variants.filter((v) => v.isSelected)
    const variantCount = selectedVariants.length
    const styleCount = selectedStyles.length
    const modelCount = selectedModels.length
    const { countPerPrompt, aspectRatio } = batchConfig

    // Calculate prompts count
    const calculatedPromptsCount = variantCount * styleCount

    // Build prompts formula
    let promptsFormula: string
    if (variantCount === 0 && styleCount === 0) {
      promptsFormula = 'No variants or styles selected'
    } else if (variantCount === 0) {
      promptsFormula = 'No variants selected'
    } else if (styleCount === 0) {
      promptsFormula = 'No styles selected'
    } else {
      const vLabel = variantCount === 1 ? 'variant' : 'variants'
      const sLabel = styleCount === 1 ? 'style' : 'styles'
      const pLabel = calculatedPromptsCount === 1 ? 'prompt' : 'prompts'
      promptsFormula = `${variantCount} ${vLabel} × ${styleCount} ${sLabel} = ${calculatedPromptsCount} ${pLabel}`
    }

    // Calculate image counts
    const imagesPerModel = calculatedPromptsCount * countPerPrompt
    const totalImages = imagesPerModel * modelCount

    // Build image formula
    let imageFormula: string
    if (modelCount === 0) {
      imageFormula = 'No models selected'
    } else if (calculatedPromptsCount === 0) {
      imageFormula = 'No prompts to generate'
    } else {
      const mLabel = modelCount === 1 ? 'model' : 'models'
      const iLabel = totalImages === 1 ? 'image' : 'images'
      imageFormula = `${calculatedPromptsCount} prompts × ${countPerPrompt} per prompt × ${modelCount} ${mLabel} = ${totalImages} ${iLabel}`
    }

    // Build per-model breakdown
    const imageBreakdownPerModel = selectedModels.map((model) => ({
      modelId: model.modelId,
      modelName: model.displayName,
      count: imagesPerModel,
    }))

    // Calculate API calls (one per subtask: prompt × model combination)
    const estimatedApiCalls = calculatedPromptsCount * modelCount * countPerPrompt

    // Get unique providers
    const providersSummary = [...new Set(selectedModels.map((m) => m.provider))]

    // Check for warnings
    const hasWarning = totalImages > HIGH_IMAGE_COUNT_THRESHOLD
    const warning = hasWarning
      ? `High image count: ${totalImages} images will be generated. This may take significant time and resources.`
      : null

    // Determine if overview is ready (has meaningful data)
    const isReady = variantCount > 0 && styleCount > 0 && modelCount > 0

    return {
      // Settings Summary
      selectedModels,
      aspectRatio,
      countPerPrompt,

      // Prompts Count
      variantCount,
      styleCount,
      calculatedPromptsCount,
      promptsFormula,

      // Image Count
      imagesPerModel,
      totalImages,
      imageFormula,
      imageBreakdownPerModel,

      // Task Summary Stats
      estimatedApiCalls,
      providersSummary,
      warning,

      // State flags
      isReady,
      hasWarning,
    }
  }, [variants, selectedStyles, selectedModels, batchConfig])
}

export default useTaskOverview
