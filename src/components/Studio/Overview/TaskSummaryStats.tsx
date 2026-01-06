'use client'

/**
 * TaskSummaryStats Component
 *
 * Displays additional key information:
 * - Estimated API calls count
 * - Selected AI providers summary
 * - Warnings (e.g., high image count > 500)
 *
 * Part of Phase 5: Optimize Task Creation Page
 * Task: T038y - Create TaskSummaryStats component
 */

import React from 'react'

// ============================================
// TYPES
// ============================================

export interface TaskSummaryStatsProps {
  /** Estimated number of API calls */
  estimatedApiCalls: number
  /** Selected providers */
  providersSummary: string[]
  /** Warning message if applicable */
  warning: string | null
  /** Additional CSS classes */
  className?: string
}

// ============================================
// PROVIDER DISPLAY NAMES
// ============================================

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  fal: 'Fal.ai',
  openai: 'OpenAI',
  google: 'Google Cloud',
}

function getProviderDisplayName(provider: string): string {
  return PROVIDER_DISPLAY_NAMES[provider.toLowerCase()] || provider
}

// ============================================
// COMPONENT
// ============================================

/**
 * TaskSummaryStats - Display task summary and warnings
 */
export function TaskSummaryStats({
  estimatedApiCalls,
  providersSummary,
  warning,
  className = '',
}: TaskSummaryStatsProps) {
  const hasProviders = providersSummary.length > 0
  const hasApiCalls = estimatedApiCalls > 0

  return (
    <div className={`twp ${className}`}>
      <h4 className="twp text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Summary
      </h4>

      <div className="twp space-y-3">
        {/* Estimated API Calls */}
        <div className="twp flex items-center justify-between">
          <span className="twp text-sm text-gray-600 dark:text-gray-400">
            Estimated API Calls
          </span>
          <span
            className={`
              twp text-sm font-medium
              ${hasApiCalls ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}
            `}
          >
            {hasApiCalls ? estimatedApiCalls.toLocaleString() : '—'}
          </span>
        </div>

        {/* Providers */}
        <div className="twp flex items-center justify-between">
          <span className="twp text-sm text-gray-600 dark:text-gray-400">
            AI Providers
          </span>
          <span
            className={`
              twp text-sm font-medium
              ${hasProviders ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}
            `}
          >
            {hasProviders
              ? providersSummary.map(getProviderDisplayName).join(', ')
              : '—'}
          </span>
        </div>

        {/* Warning */}
        {warning && (
          <div className="twp mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
            <svg
              className="twp w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5"
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
            <div>
              <span className="twp text-sm font-medium text-amber-800 dark:text-amber-200 block">
                High Volume Warning
              </span>
              <span className="twp text-xs text-amber-700 dark:text-amber-300">
                {warning}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskSummaryStats
