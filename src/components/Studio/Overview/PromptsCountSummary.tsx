'use client'

/**
 * PromptsCountSummary Component
 *
 * Displays prompt count information:
 * - Number of prompt variants selected
 * - Number of styles selected
 * - Calculated prompts count: variants × styles
 * - Visual breakdown formula
 *
 * Part of Phase 5: Optimize Task Creation Page
 * Task: T038w - Create PromptsCountSummary component
 */

import React from 'react'

// ============================================
// TYPES
// ============================================

export interface PromptsCountSummaryProps {
  /** Number of selected variants */
  variantCount: number
  /** Number of selected styles */
  styleCount: number
  /** Calculated prompts count */
  calculatedPromptsCount: number
  /** Formula display string */
  formulaDisplay: string
  /** Additional CSS classes */
  className?: string
}

// ============================================
// COMPONENT
// ============================================

/**
 * PromptsCountSummary - Display prompts count breakdown
 */
export function PromptsCountSummary({
  variantCount,
  styleCount,
  calculatedPromptsCount,
  formulaDisplay,
  className = '',
}: PromptsCountSummaryProps) {
  const hasData = variantCount > 0 || styleCount > 0

  return (
    <div className={`twp ${className}`}>
      <h4 className="twp text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Prompts
      </h4>

      {/* Counts Grid */}
      <div className="twp grid grid-cols-3 gap-4 mb-3">
        {/* Variants */}
        <div className="twp text-center">
          <span
            className={`
              twp block text-2xl font-bold
              ${variantCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600'}
            `}
          >
            {variantCount}
          </span>
          <span className="twp text-xs text-gray-500 dark:text-gray-400">
            {variantCount === 1 ? 'Variant' : 'Variants'}
          </span>
        </div>

        {/* Multiplication Sign */}
        <div className="twp flex items-center justify-center">
          <span className="twp text-xl text-gray-400 dark:text-gray-500">×</span>
        </div>

        {/* Styles */}
        <div className="twp text-center">
          <span
            className={`
              twp block text-2xl font-bold
              ${styleCount > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-300 dark:text-gray-600'}
            `}
          >
            {styleCount}
          </span>
          <span className="twp text-xs text-gray-500 dark:text-gray-400">
            {styleCount === 1 ? 'Style' : 'Styles'}
          </span>
        </div>
      </div>

      {/* Result */}
      <div className="twp pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="twp flex items-center justify-between">
          <span className="twp text-sm text-gray-600 dark:text-gray-400">
            Calculated Prompts
          </span>
          <span
            className={`
              twp text-lg font-bold
              ${calculatedPromptsCount > 0 ? 'text-gray-900 dark:text-gray-100' : 'text-gray-300 dark:text-gray-600'}
            `}
          >
            {calculatedPromptsCount}
          </span>
        </div>

        {/* Formula Display */}
        {hasData && (
          <p className="twp text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formulaDisplay}
          </p>
        )}
      </div>
    </div>
  )
}

export default PromptsCountSummary
