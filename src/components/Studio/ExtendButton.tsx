'use client'

/**
 * ExtendButton Component
 *
 * A small, colorful button that triggers prompt optimization.
 * Shows "Optimize Prompt" label with a sparkle icon.
 * Follows PayloadCMS modern design language.
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
 * SparkleIcon - AI/Magic sparkle icon for prompt optimization
 */
function SparkleIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/**
 * ExtendButton - Small colorful button that triggers prompt optimization
 * Follows PayloadCMS modern design language with gradient and compact styling
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
        twp inline-flex items-center justify-center gap-1.5
        px-3 py-1.5
        text-xs font-semibold
        rounded-md
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
        ${
          isDisabled
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-gray-700'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:from-purple-700 active:to-pink-700 text-white shadow-sm hover:shadow-md'
        }
        ${className}
      `}
      aria-label={loading ? 'Optimizing prompt...' : 'Optimize prompt'}
    >
      {loading ? (
        <>
          {/* Loading spinner */}
          <svg
            className="twp animate-spin h-3.5 w-3.5"
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
          <span>Optimizing...</span>
        </>
      ) : (
        <>
          {/* Sparkle icon */}
          <SparkleIcon className="twp h-3.5 w-3.5" />
          <span>Optimize Prompt</span>
        </>
      )}
    </button>
  )
}

export default ExtendButton
