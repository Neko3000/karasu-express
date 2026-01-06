'use client'

/**
 * CalculatedPromptsSection Component
 *
 * Displays the final prompt combinations at the end of the "Prompts" section.
 * Shows all variant × style combinations with a collapsible list of prompt cards.
 *
 * Part of Phase 5: Optimize Task Creation Page
 * Task: T038n - Create CalculatedPromptsSection component
 */

import React, { useState } from 'react'
import { CalculatedPromptCard } from './CalculatedPromptCard'
import type { CalculatedPrompt, CalculatedPromptsSummary } from './hooks/useCalculatedPrompts'

// ============================================
// TYPES
// ============================================

export interface CalculatedPromptsSectionProps {
  /** Array of calculated prompts to display */
  prompts: CalculatedPrompt[]
  /** Summary statistics */
  summary: CalculatedPromptsSummary
  /** Additional CSS classes */
  className?: string
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Maximum prompts to show initially before collapse
 */
const INITIAL_DISPLAY_COUNT = 6

// ============================================
// COMPONENT
// ============================================

/**
 * CalculatedPromptsSection - Display all calculated prompt combinations
 */
export function CalculatedPromptsSection({
  prompts,
  summary,
  className = '',
}: CalculatedPromptsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // If no prompts, show empty state
  if (prompts.length === 0) {
    return (
      <div className={`twp ${className}`}>
        <div className="twp rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
          <p className="twp text-sm text-gray-500 dark:text-gray-400">
            {summary.formulaDisplay}
          </p>
        </div>
      </div>
    )
  }

  // Determine which prompts to show
  const hasMore = prompts.length > INITIAL_DISPLAY_COUNT
  const displayedPrompts = isExpanded
    ? prompts
    : prompts.slice(0, INITIAL_DISPLAY_COUNT)
  const hiddenCount = prompts.length - INITIAL_DISPLAY_COUNT

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev)
  }

  return (
    <div className={`twp ${className}`}>
      {/* Section Header */}
      <div className="twp flex items-center justify-between mb-4">
        <div>
          <h3 className="twp text-lg font-semibold text-gray-900 dark:text-gray-100">
            Calculated Prompts
          </h3>
          <p className="twp text-sm text-gray-500 dark:text-gray-400 mt-1">
            {summary.formulaDisplay}
          </p>
        </div>

        {/* Total count badge */}
        <span className="twp inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
          {summary.totalPrompts} {summary.totalPrompts === 1 ? 'prompt' : 'prompts'}
        </span>
      </div>

      {/* Prompts Grid */}
      <div className="twp grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {displayedPrompts.map((prompt) => (
          <CalculatedPromptCard
            key={prompt.id}
            prompt={prompt}
          />
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <div className="twp mt-4 text-center">
          <button
            type="button"
            onClick={toggleExpanded}
            className="twp inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
          >
            {isExpanded ? (
              <>
                <svg
                  className="twp w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                Show less
              </>
            ) : (
              <>
                <svg
                  className="twp w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                Show {hiddenCount} more
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default CalculatedPromptsSection
