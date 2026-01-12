'use client'

/**
 * CalculatedPromptCard Component
 *
 * Displays an individual calculated prompt showing the variant/style combination.
 * Shows:
 * - Variant label (e.g., "Variant 1 - Realistic")
 * - Style name applied (e.g., "Cyberpunk")
 * - Final merged prompt text (preview, non-editable)
 * - Negative prompt if applicable
 *
 * Part of Phase 5: Optimize Task Creation Page
 * Task: T038o - Create CalculatedPromptCard component
 */

import React, { useState } from 'react'
import type { CalculatedPrompt } from './hooks/useCalculatedPrompts'

// ============================================
// TYPES
// ============================================

export interface CalculatedPromptCardProps {
  /** The calculated prompt data */
  prompt: CalculatedPrompt
  /** Additional CSS classes */
  className?: string
}

// ============================================
// COMPONENT
// ============================================

/**
 * CalculatedPromptCard - Display a single calculated prompt combination
 */
export function CalculatedPromptCard({
  prompt,
  className = '',
}: CalculatedPromptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev)
  }

  // Truncate long prompts for preview
  const maxPreviewLength = 150
  const isLongPrompt = prompt.finalPrompt.length > maxPreviewLength
  const previewText = isLongPrompt && !isExpanded
    ? `${prompt.finalPrompt.slice(0, maxPreviewLength)}...`
    : prompt.finalPrompt

  return (
    <div
      className={`
        twp rounded-lg border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800
        overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="twp flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
        {/* Variant Badge */}
        <div className="twp flex items-center gap-2">
          <span className="twp inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
            {prompt.variantName}
          </span>
          <span className="twp text-gray-400 dark:text-gray-500">×</span>
          <span className="twp inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
            {prompt.styleName}
          </span>
        </div>

        {/* Expand/Collapse for long prompts */}
        {isLongPrompt && (
          <button
            type="button"
            onClick={toggleExpanded}
            className="twp text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Prompt Content */}
      <div className="twp p-4">
        {/* Final Prompt */}
        <div className="twp mb-3">
          <label className="twp block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Final Prompt
          </label>
          <p className="twp text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
            {previewText}
          </p>
        </div>

        {/* Negative Prompt (if applicable) */}
        {prompt.negativePrompt && (
          <div className="twp pt-3 border-t border-gray-100 dark:border-gray-700">
            <label className="twp block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Negative Prompt
            </label>
            <p className="twp text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">
              {prompt.negativePrompt}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CalculatedPromptCard
