'use client'

/**
 * ExtendButton Component
 *
 * A button that triggers prompt optimization/extension.
 * Shows "Extend" label and triggers the API call to expand prompts.
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React from 'react'

export interface ExtendButtonProps {
  /** Click handler for the button */
  onClick: () => void
  /** Whether the button is disabled */
  disabled?: boolean
  /** Whether the optimization is currently loading */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * ExtendButton - Triggers prompt optimization
 */
export function ExtendButton({
  onClick,
  disabled = false,
  loading = false,
  className = '',
}: ExtendButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`
        twp inline-flex items-center justify-center gap-2
        px-4 py-2
        text-sm font-medium
        rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
        ${
          isDisabled
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm hover:shadow'
        }
        ${className}
      `}
      aria-label={loading ? 'Extending prompts...' : 'Extend prompts'}
    >
      {loading ? (
        <>
          {/* Loading spinner */}
          <svg
            className="twp animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="twp opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="twp opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Extending...</span>
        </>
      ) : (
        <>
          {/* Extend icon */}
          <svg
            className="twp h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span>Extend</span>
        </>
      )}
    </button>
  )
}

export default ExtendButton
