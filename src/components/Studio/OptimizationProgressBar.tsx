'use client'

/**
 * OptimizationProgressBar Component
 *
 * A progress indicator with three stages for prompt optimization:
 * 1. Analyzing - Understanding the subject
 * 2. Enhancing - Generating detailed prompts
 * 3. Formatting - Structuring the output
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React from 'react'

/**
 * Optimization progress stages
 */
export type OptimizationStage = 'idle' | 'analyzing' | 'enhancing' | 'formatting' | 'complete' | 'error'

/**
 * Stage configuration with labels and order
 */
export const STAGE_CONFIG = {
  analyzing: { label: 'Analyzing', order: 1 },
  enhancing: { label: 'Enhancing', order: 2 },
  formatting: { label: 'Formatting', order: 3 },
} as const

/**
 * Get the numeric value for a stage (0-100%)
 */
function getStageProgress(stage: OptimizationStage): number {
  switch (stage) {
    case 'idle':
      return 0
    case 'analyzing':
      return 33
    case 'enhancing':
      return 66
    case 'formatting':
      return 90
    case 'complete':
      return 100
    case 'error':
      return 0
    default:
      return 0
  }
}

export interface OptimizationProgressBarProps {
  /** Current optimization stage */
  stage: OptimizationStage
  /** Additional CSS classes */
  className?: string
}

/**
 * OptimizationProgressBar - Visual progress indicator for prompt optimization
 */
export function OptimizationProgressBar({ stage, className = '' }: OptimizationProgressBarProps) {
  const progress = getStageProgress(stage)
  const isActive = stage !== 'idle' && stage !== 'complete' && stage !== 'error'

  if (stage === 'idle') {
    return null
  }

  return (
    <div className={`twp ${className}`}>
      {/* Progress bar container */}
      <div className="twp relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`
            twp absolute left-0 top-0 h-full rounded-full
            transition-all duration-500 ease-out
            ${stage === 'error' ? 'bg-red-500' : stage === 'complete' ? 'bg-green-500' : 'bg-blue-500'}
          `}
          style={{ width: `${progress}%` }}
        />
        {/* Animated pulse effect when active */}
        {isActive && (
          <div
            className="twp absolute left-0 top-0 h-full bg-blue-400 rounded-full animate-pulse"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>

      {/* Stage labels */}
      <div className="twp flex justify-between mt-2">
        {Object.entries(STAGE_CONFIG).map(([key, config]) => {
          const stageKey = key as keyof typeof STAGE_CONFIG
          const isCurrent = stage === stageKey
          const stageOrder = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG]?.order ?? 0
          const isCompleted =
            stage === 'complete' ||
            (stage !== 'error' && config.order < stageOrder)

          return (
            <div
              key={key}
              className={`
                twp flex flex-col items-center text-xs transition-colors duration-200
                ${
                  isCurrent
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-400 dark:text-gray-500'
                }
              `}
            >
              {/* Stage indicator dot */}
              <div
                className={`
                  twp w-2 h-2 rounded-full mb-1 transition-colors duration-200
                  ${
                    isCurrent
                      ? 'bg-blue-500 animate-pulse'
                      : isCompleted
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                  }
                `}
              />
              <span>{config.label}</span>
              {isCurrent && (
                <div className="twp flex items-center gap-1 mt-0.5">
                  <div className="twp w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="twp w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="twp w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Completion/Error message */}
      {stage === 'complete' && (
        <div className="twp flex items-center justify-center gap-2 mt-2 text-sm text-green-600 dark:text-green-400">
          <svg className="twp w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Optimization complete</span>
        </div>
      )}
    </div>
  )
}

export default OptimizationProgressBar
