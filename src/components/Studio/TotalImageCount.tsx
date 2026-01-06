'use client'

/**
 * TotalImageCount Component
 *
 * Displays the total image count with breakdown formula.
 * Shows:
 * - Number of calculated prompts (variants x styles)
 * - Count per prompt (from BatchConfig)
 * - Final total: (variants x styles x countPerPrompt)
 * - Visual emphasis for the final number
 *
 * Part of Phase 5: Optimize Task Creation Page
 * Task: T038q - Create TotalImageCount component
 */

import React from 'react'

// ============================================
// TYPES
// ============================================

export interface TotalImageCountProps {
  /** Number of calculated prompts (variants × styles) */
  calculatedPromptsCount: number
  /** Number of images per prompt */
  countPerPrompt: number
  /** Number of selected models */
  modelCount: number
  /** Optional warning message */
  warning?: string | null
  /** Additional CSS classes */
  className?: string
}

// ============================================
// COMPONENT
// ============================================

/**
 * TotalImageCount - Display total images to be generated
 */
export function TotalImageCount({
  calculatedPromptsCount,
  countPerPrompt,
  modelCount,
  warning = null,
  className = '',
}: TotalImageCountProps) {
  // Calculate totals
  const imagesPerModel = calculatedPromptsCount * countPerPrompt
  const totalImages = imagesPerModel * modelCount

  // Build display strings
  const hasData = calculatedPromptsCount > 0 && countPerPrompt > 0 && modelCount > 0

  // Formula components
  const promptsLabel = calculatedPromptsCount === 1 ? 'prompt' : 'prompts'
  const modelsLabel = modelCount === 1 ? 'model' : 'models'

  return (
    <div
      className={`
        twp rounded-lg border
        ${warning ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}
        ${className}
      `}
    >
      <div className="twp p-4">
        {/* Main Total */}
        <div className="twp flex items-center justify-between mb-3">
          <span className="twp text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Images
          </span>
          <span
            className={`
              twp text-2xl font-bold
              ${warning ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}
            `}
          >
            {hasData ? totalImages.toLocaleString() : '—'}
          </span>
        </div>

        {/* Formula Breakdown */}
        {hasData && (
          <div className="twp pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="twp flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="twp font-medium text-gray-700 dark:text-gray-300">
                {calculatedPromptsCount}
              </span>
              <span>{promptsLabel}</span>
              <span className="twp text-gray-400 dark:text-gray-500">×</span>
              <span className="twp font-medium text-gray-700 dark:text-gray-300">
                {countPerPrompt}
              </span>
              <span>per prompt</span>
              <span className="twp text-gray-400 dark:text-gray-500">×</span>
              <span className="twp font-medium text-gray-700 dark:text-gray-300">
                {modelCount}
              </span>
              <span>{modelsLabel}</span>
            </div>
          </div>
        )}

        {/* Per-model breakdown */}
        {hasData && modelCount > 0 && (
          <div className="twp mt-2 text-center">
            <span className="twp text-xs text-gray-400 dark:text-gray-500">
              ({imagesPerModel.toLocaleString()} images per model)
            </span>
          </div>
        )}

        {/* Warning */}
        {warning && (
          <div className="twp mt-3 flex items-start gap-2 p-2 rounded-md bg-amber-100 dark:bg-amber-900/40">
            <svg
              className="twp w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="twp text-sm text-amber-700 dark:text-amber-300">
              {warning}
            </span>
          </div>
        )}

        {/* Empty State */}
        {!hasData && (
          <p className="twp text-sm text-gray-400 dark:text-gray-500 text-center">
            Select variants, styles, and models to see image count
          </p>
        )}
      </div>
    </div>
  )
}

export default TotalImageCount
