'use client'

/**
 * ImageCountSummary Component
 *
 * Displays image count information:
 * - Image count per model: variants × styles × countPerPrompt
 * - Image count for all models: variants × styles × countPerPrompt × models
 * - Visual breakdown with formula display
 * - Prominent display of total images to be generated
 *
 * Part of Phase 5: Optimize Task Creation Page
 * Task: T038x - Create ImageCountSummary component
 */

import React from 'react'

// ============================================
// TYPES
// ============================================

export interface ImageBreakdownItem {
  modelId: string
  modelName: string
  count: number
}

export interface ImageCountSummaryProps {
  /** Images per model */
  imagesPerModel: number
  /** Total images across all models */
  totalImages: number
  /** Formula display string */
  imageFormula: string
  /** Per-model breakdown */
  imageBreakdownPerModel: ImageBreakdownItem[]
  /** Whether there's a warning */
  hasWarning: boolean
  /** Additional CSS classes */
  className?: string
}

// ============================================
// COMPONENT
// ============================================

/**
 * ImageCountSummary - Display image count with breakdown
 */
export function ImageCountSummary({
  imagesPerModel: _imagesPerModel, // Available for future per-model display enhancements
  totalImages,
  imageFormula,
  imageBreakdownPerModel,
  hasWarning,
  className = '',
}: ImageCountSummaryProps) {
  void _imagesPerModel // Suppress unused warning; reserved for future use
  const hasData = totalImages > 0

  return (
    <div className={`twp ${className}`}>
      <h4 className="twp text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Images
      </h4>

      {/* Total Images - Prominent Display */}
      <div className="twp text-center mb-4">
        <span
          className={`
            twp block text-4xl font-bold
            ${hasWarning ? 'text-amber-600 dark:text-amber-400' : hasData ? 'text-gray-900 dark:text-gray-100' : 'text-gray-300 dark:text-gray-600'}
          `}
        >
          {totalImages > 0 ? totalImages.toLocaleString() : '—'}
        </span>
        <span className="twp text-sm text-gray-500 dark:text-gray-400">
          Total Images
        </span>
      </div>

      {/* Formula */}
      {hasData && (
        <p className="twp text-xs text-gray-400 dark:text-gray-500 text-center mb-4">
          {imageFormula}
        </p>
      )}

      {/* Per-Model Breakdown */}
      {imageBreakdownPerModel.length > 0 && (
        <div className="twp pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="twp text-xs text-gray-500 dark:text-gray-400 block mb-2">
            Per Model
          </span>
          <div className="twp space-y-1.5">
            {imageBreakdownPerModel.map((item) => (
              <div
                key={item.modelId}
                className="twp flex items-center justify-between text-sm"
              >
                <span className="twp text-gray-600 dark:text-gray-400 truncate">
                  {item.modelName}
                </span>
                <span className="twp font-medium text-gray-900 dark:text-gray-100">
                  {item.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasData && (
        <p className="twp text-xs text-gray-400 dark:text-gray-500 text-center">
          Configure settings to see image count
        </p>
      )}
    </div>
  )
}

export default ImageCountSummary
