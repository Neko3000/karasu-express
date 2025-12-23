'use client'

/**
 * PromptVariantCard Component
 *
 * A card displaying a single prompt variant with:
 * - Checkbox for selection (multi-select)
 * - Variant name/label (e.g., "Realistic", "Artistic")
 * - Inline editable text area for the expanded prompt
 * - Suggested negative prompt display (non-editable, for reference)
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React, { useCallback, useRef, useEffect } from 'react'

export interface PromptVariant {
  /** Unique identifier for this variant */
  variantId: string
  /** Human-readable name (e.g., "Realistic", "Artistic") */
  variantName: string
  /** The expanded, detailed prompt */
  expandedPrompt: string
  /** Suggested negative prompt for this variant */
  suggestedNegativePrompt: string
  /** Keywords extracted from the prompt for categorization */
  keywords: string[]
}

export interface PromptVariantCardProps {
  /** The variant data to display */
  variant: PromptVariant
  /** Whether this variant is selected */
  isSelected: boolean
  /** Callback when selection changes */
  onSelectionChange: (variantId: string, selected: boolean) => void
  /** Callback when the prompt text is edited */
  onPromptChange: (variantId: string, newPrompt: string) => void
  /** Whether editing is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * PromptVariantCard - Selectable and editable prompt variant card
 */
export function PromptVariantCard({
  variant,
  isSelected,
  onSelectionChange,
  onPromptChange,
  disabled = false,
  className = '',
}: PromptVariantCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea to fit content
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`
    }
  }, [])

  // Adjust height when prompt changes
  useEffect(() => {
    adjustHeight()
  }, [variant.expandedPrompt, adjustHeight])

  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSelectionChange(variant.variantId, e.target.checked)
    },
    [variant.variantId, onSelectionChange]
  )

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onPromptChange(variant.variantId, e.target.value)
    },
    [variant.variantId, onPromptChange]
  )

  return (
    <div
      className={`
        twp p-4 rounded-lg border transition-all duration-200
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }
        ${disabled ? 'opacity-60' : ''}
        ${className}
      `}
    >
      {/* Header with checkbox and variant name */}
      <div className="twp flex items-start gap-3 mb-3">
        <input
          type="checkbox"
          id={`variant-${variant.variantId}`}
          checked={isSelected}
          onChange={handleCheckboxChange}
          disabled={disabled}
          className={`
            twp w-5 h-5 mt-0.5
            rounded border-gray-300 dark:border-gray-600
            text-blue-600 focus:ring-blue-500 focus:ring-2
            transition-colors duration-200
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        />
        <div className="twp flex-1">
          <label
            htmlFor={`variant-${variant.variantId}`}
            className={`
              twp block text-sm font-semibold
              text-gray-900 dark:text-gray-100
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {variant.variantName}
          </label>
          {/* Keywords */}
          {variant.keywords && variant.keywords.length > 0 && (
            <div className="twp flex flex-wrap gap-1 mt-1">
              {variant.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="twp px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editable prompt textarea */}
      <div className="twp mb-3">
        <label className="twp block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Expanded Prompt
        </label>
        <textarea
          ref={textareaRef}
          value={variant.expandedPrompt}
          onChange={handlePromptChange}
          disabled={disabled}
          rows={3}
          className={`
            twp w-full p-2
            text-sm leading-relaxed
            border rounded-md resize-none
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            border-gray-200 dark:border-gray-600
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${disabled ? 'cursor-not-allowed bg-gray-50 dark:bg-gray-800' : ''}
          `}
          aria-label={`Edit ${variant.variantName} prompt`}
        />
      </div>

      {/* Negative prompt (non-editable reference) */}
      {variant.suggestedNegativePrompt && (
        <div className="twp">
          <label className="twp block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Suggested Negative Prompt
          </label>
          <div
            className={`
              twp p-2
              text-sm leading-relaxed
              rounded-md
              bg-gray-100 dark:bg-gray-700/50
              text-gray-600 dark:text-gray-400
              border border-gray-200 dark:border-gray-600
            `}
          >
            {variant.suggestedNegativePrompt}
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptVariantCard
