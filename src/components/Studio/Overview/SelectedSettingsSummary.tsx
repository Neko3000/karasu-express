'use client'

/**
 * SelectedSettingsSummary Component
 *
 * Displays selected generation settings:
 * - Selected models with provider badges
 * - Selected aspect ratio
 * - Other generation settings
 *
 * Part of Phase 5: Optimize Task Creation Page
 * Task: T038v - Create SelectedSettingsSummary component
 */

import React from 'react'
import type { ModelInfo } from '../hooks/useTaskOverview'

// ============================================
// TYPES
// ============================================

export interface SelectedSettingsSummaryProps {
  /** Selected models */
  selectedModels: ModelInfo[]
  /** Selected aspect ratio */
  aspectRatio: string
  /** Number of images per prompt */
  countPerPrompt: number
  /** Additional CSS classes */
  className?: string
}

// ============================================
// PROVIDER COLORS
// ============================================

const PROVIDER_COLORS: Record<string, { bg: string; text: string }> = {
  fal: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/50',
    text: 'text-emerald-800 dark:text-emerald-200',
  },
  openai: {
    bg: 'bg-green-100 dark:bg-green-900/50',
    text: 'text-green-800 dark:text-green-200',
  },
  google: {
    bg: 'bg-blue-100 dark:bg-blue-900/50',
    text: 'text-blue-800 dark:text-blue-200',
  },
  default: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-800 dark:text-gray-200',
  },
}

function getProviderColors(provider: string): { bg: string; text: string } {
  return PROVIDER_COLORS[provider.toLowerCase()] || PROVIDER_COLORS.default
}

// ============================================
// COMPONENT
// ============================================

/**
 * SelectedSettingsSummary - Display generation settings summary
 */
export function SelectedSettingsSummary({
  selectedModels,
  aspectRatio,
  countPerPrompt,
  className = '',
}: SelectedSettingsSummaryProps) {
  return (
    <div className={`twp ${className}`}>
      <h4 className="twp text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Settings
      </h4>

      <div className="twp space-y-3">
        {/* Selected Models */}
        <div>
          <span className="twp text-xs text-gray-500 dark:text-gray-400 block mb-1.5">
            Models
          </span>
          {selectedModels.length > 0 ? (
            <div className="twp flex flex-wrap gap-2">
              {selectedModels.map((model) => {
                const colors = getProviderColors(model.provider)
                return (
                  <span
                    key={model.modelId}
                    className={`
                      twp inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
                      ${colors.bg} ${colors.text}
                    `}
                  >
                    <span className="twp capitalize">{model.provider}</span>
                    <span className="twp opacity-50">|</span>
                    <span>{model.displayName}</span>
                  </span>
                )
              })}
            </div>
          ) : (
            <span className="twp text-sm text-gray-400 dark:text-gray-500">
              No models selected
            </span>
          )}
        </div>

        {/* Aspect Ratio & Count Per Prompt Row */}
        <div className="twp flex gap-4">
          {/* Aspect Ratio */}
          <div className="twp flex-1">
            <span className="twp text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Aspect Ratio
            </span>
            <span className="twp text-sm font-medium text-gray-900 dark:text-gray-100">
              {aspectRatio || '—'}
            </span>
          </div>

          {/* Count Per Prompt */}
          <div className="twp flex-1">
            <span className="twp text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Images Per Prompt
            </span>
            <span className="twp text-sm font-medium text-gray-900 dark:text-gray-100">
              {countPerPrompt || '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SelectedSettingsSummary
