'use client'

/**
 * PromptVariantsList Component
 *
 * Displays generated prompt variants inside the collapsible section
 * after the optimization progress completes.
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React from 'react'
import { PromptVariantCard, type PromptVariant } from './PromptVariantCard'

export interface VariantWithSelection extends PromptVariant {
  /** Whether this variant is selected */
  isSelected: boolean
}

export interface PromptVariantsListProps {
  /** Array of variants with selection state */
  variants: VariantWithSelection[]
  /** Callback when a variant's selection changes */
  onSelectionChange: (variantId: string, selected: boolean) => void
  /** Callback when a variant's prompt is edited */
  onPromptChange: (variantId: string, newPrompt: string) => void
  /** Whether editing is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * PromptVariantsList - Container for displaying prompt variant cards
 */
export function PromptVariantsList({
  variants,
  onSelectionChange,
  onPromptChange,
  disabled = false,
  className = '',
}: PromptVariantsListProps) {
  const selectedCount = variants.filter((v) => v.isSelected).length

  if (variants.length === 0) {
    return null
  }

  return (
    <div className={`twp ${className}`}>
      {/* Header with selection info */}
      <div className="twp flex items-center justify-between mb-3">
        <h3 className="twp text-sm font-semibold text-gray-900 dark:text-gray-100">
          Generated Variants
        </h3>
        <span className="twp text-xs text-gray-500 dark:text-gray-400">
          {selectedCount} of {variants.length} selected
        </span>
      </div>

      {/* Select/Deselect all buttons */}
      <div className="twp flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => variants.forEach((v) => onSelectionChange(v.variantId, true))}
          disabled={disabled || selectedCount === variants.length}
          className={`
            twp px-2 py-1 text-xs rounded
            transition-colors duration-200
            ${
              disabled || selectedCount === variants.length
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
            }
          `}
        >
          Select All
        </button>
        <button
          type="button"
          onClick={() => variants.forEach((v) => onSelectionChange(v.variantId, false))}
          disabled={disabled || selectedCount === 0}
          className={`
            twp px-2 py-1 text-xs rounded
            transition-colors duration-200
            ${
              disabled || selectedCount === 0
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
            }
          `}
        >
          Deselect All
        </button>
      </div>

      {/* Variant cards */}
      <div className="twp space-y-3">
        {variants.map((variant) => (
          <PromptVariantCard
            key={variant.variantId}
            variant={variant}
            isSelected={variant.isSelected}
            onSelectionChange={onSelectionChange}
            onPromptChange={onPromptChange}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}

export default PromptVariantsList
