'use client'

/**
 * OptimizationErrorBanner Component
 *
 * An inline error banner with error message display and "Retry" button
 * shown inside the collapsible section when prompt optimization fails.
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React from 'react'

export interface OptimizationErrorBannerProps {
  /** Error message to display */
  message: string
  /** Callback when retry button is clicked */
  onRetry: () => void
  /** Whether retry is currently in progress */
  retrying?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * OptimizationErrorBanner - Error display with retry functionality
 */
export function OptimizationErrorBanner({
  message,
  onRetry,
  retrying = false,
  className = '',
}: OptimizationErrorBannerProps) {
  return (
    <div
      className={`
        twp flex items-start gap-3 p-4
        rounded-lg
        bg-red-50 dark:bg-red-900/20
        border border-red-200 dark:border-red-800
        ${className}
      `}
      role="alert"
    >
      {/* Error icon */}
      <div className="twp flex-shrink-0">
        <svg
          className="twp w-5 h-5 text-red-500 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Error message and retry button */}
      <div className="twp flex-1 min-w-0">
        <h4 className="twp text-sm font-medium text-red-800 dark:text-red-200">
          Optimization Failed
        </h4>
        <p className="twp mt-1 text-sm text-red-700 dark:text-red-300 break-words">
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className={`
            twp mt-3 inline-flex items-center gap-2
            px-3 py-1.5
            text-sm font-medium
            rounded-md
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500
            ${
              retrying
                ? 'bg-red-200 dark:bg-red-800/50 text-red-400 cursor-not-allowed'
                : 'bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/50'
            }
          `}
        >
          {retrying ? (
            <>
              {/* Retry spinner */}
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
              <span>Retrying...</span>
            </>
          ) : (
            <>
              {/* Retry icon */}
              <svg
                className="twp w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Retry</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default OptimizationErrorBanner
