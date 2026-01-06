'use client'

/**
 * useCalculatedPrompts Hook
 *
 * Calculates all prompt/style combinations for the task creation page.
 * Takes selected variants and styles as input, applies style-merger logic
 * to generate final prompts for each combination.
 *
 * Part of Phase 5: Optimize Task Creation Page
 * Task: T038p - Create useCalculatedPrompts hook
 */

import { useMemo } from 'react'
import type { VariantWithSelection } from '../PromptVariantsList'
import { mergeStyle, type MergedPrompt, type MergeableStyle } from '../../../services/style-merger'

// ============================================
// TYPES
// ============================================

/**
 * A calculated prompt representing one variant × style combination
 */
export interface CalculatedPrompt {
  /** Unique ID for this combination (variantId-styleId) */
  id: string
  /** The original variant ID */
  variantId: string
  /** The variant label/name */
  variantName: string
  /** The style ID applied */
  styleId: string
  /** The style name applied */
  styleName: string
  /** The final merged prompt text */
  finalPrompt: string
  /** The negative prompt if applicable */
  negativePrompt: string
  /** The original expanded prompt from the variant */
  originalPrompt: string
}

/**
 * Summary statistics for calculated prompts
 */
export interface CalculatedPromptsSummary {
  /** Number of selected variants */
  variantCount: number
  /** Number of selected styles */
  styleCount: number
  /** Total calculated prompts (variants × styles) */
  totalPrompts: number
  /** Formula display string (e.g., "3 variants × 2 styles = 6 prompts") */
  formulaDisplay: string
}

/**
 * Hook return type
 */
export interface UseCalculatedPromptsResult {
  /** Array of all calculated prompts */
  prompts: CalculatedPrompt[]
  /** Summary statistics */
  summary: CalculatedPromptsSummary
  /** Whether there are any calculated prompts */
  hasPrompts: boolean
}

// ============================================
// HOOK
// ============================================

/**
 * Calculate all prompt/style combinations
 *
 * @param selectedVariants - Array of selected variant prompts
 * @param selectedStyles - Array of selected styles to apply
 * @returns Calculated prompts with summary statistics
 *
 * @example
 * ```tsx
 * const { prompts, summary, hasPrompts } = useCalculatedPrompts(
 *   variants.filter(v => v.isSelected),
 *   selectedStyles
 * );
 *
 * // prompts = array of all combinations
 * // summary.totalPrompts = variants.length × styles.length
 * ```
 */
export function useCalculatedPrompts(
  selectedVariants: VariantWithSelection[],
  selectedStyles: MergeableStyle[]
): UseCalculatedPromptsResult {
  const prompts = useMemo<CalculatedPrompt[]>(() => {
    if (selectedVariants.length === 0 || selectedStyles.length === 0) {
      return []
    }

    const calculated: CalculatedPrompt[] = []

    for (const variant of selectedVariants) {
      for (const style of selectedStyles) {
        // Use style-merger to generate the final prompt
        const merged: MergedPrompt = mergeStyle(variant.expandedPrompt, style)

        calculated.push({
          id: `${variant.variantId}-${style.styleId}`,
          variantId: variant.variantId,
          variantName: variant.variantName,
          styleId: style.styleId,
          styleName: style.name,
          finalPrompt: merged.finalPrompt,
          negativePrompt: merged.negativePrompt,
          originalPrompt: variant.expandedPrompt,
        })
      }
    }

    return calculated
  }, [selectedVariants, selectedStyles])

  const summary = useMemo<CalculatedPromptsSummary>(() => {
    const variantCount = selectedVariants.length
    const styleCount = selectedStyles.length
    const totalPrompts = variantCount * styleCount

    // Build formula display
    let formulaDisplay: string
    if (variantCount === 0 && styleCount === 0) {
      formulaDisplay = 'No variants or styles selected'
    } else if (variantCount === 0) {
      formulaDisplay = 'No variants selected'
    } else if (styleCount === 0) {
      formulaDisplay = 'No styles selected'
    } else {
      const variantLabel = variantCount === 1 ? 'variant' : 'variants'
      const styleLabel = styleCount === 1 ? 'style' : 'styles'
      const promptLabel = totalPrompts === 1 ? 'prompt' : 'prompts'
      formulaDisplay = `${variantCount} ${variantLabel} × ${styleCount} ${styleLabel} = ${totalPrompts} ${promptLabel}`
    }

    return {
      variantCount,
      styleCount,
      totalPrompts,
      formulaDisplay,
    }
  }, [selectedVariants.length, selectedStyles.length])

  const hasPrompts = prompts.length > 0

  return {
    prompts,
    summary,
    hasPrompts,
  }
}

export default useCalculatedPrompts
