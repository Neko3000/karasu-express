'use client'

/**
 * OptimizationProgressBar Component
 *
 * A compact progress indicator with three stages for prompt optimization:
 * 1. Analyzing - Understanding the subject
 * 2. Enhancing - Generating detailed prompts
 * 3. Formatting - Structuring the output
 *
 * Uses PayloadCMS styling patterns.
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
  /** Additional inline styles */
  style?: React.CSSProperties
}

/**
 * OptimizationProgressBar - Compact visual progress indicator for prompt optimization
 * Uses PayloadCMS styling patterns
 */
export function OptimizationProgressBar({ stage, className = '', style }: OptimizationProgressBarProps) {
  const progress = getStageProgress(stage)

  if (stage === 'idle') {
    return null
  }

  return (
    <div className={className} style={style}>
      {/* Progress bar container */}
      <div
        style={{
          position: 'relative',
          height: '4px',
          backgroundColor: 'var(--theme-elevation-150)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            borderRadius: '2px',
            transition: 'width 500ms ease-out',
            width: `${progress}%`,
            backgroundColor:
              stage === 'error'
                ? 'var(--theme-error-500)'
                : stage === 'complete'
                  ? 'var(--theme-success-500)'
                  : 'var(--theme-elevation-800)',
          }}
        />
      </div>

      {/* Stage labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 'calc(var(--base) * 0.4)',
        }}
      >
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
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                fontSize: 'calc(var(--base-body-size) * 0.75)',
                color: isCurrent
                  ? 'var(--theme-text)'
                  : isCompleted
                    ? 'var(--theme-success-500)'
                    : 'var(--theme-elevation-450)',
                fontWeight: isCurrent ? 500 : 400,
                transition: 'color 150ms',
              }}
            >
              {/* Stage indicator dot */}
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  marginBottom: '4px',
                  backgroundColor: isCurrent
                    ? 'var(--theme-elevation-800)'
                    : isCompleted
                      ? 'var(--theme-success-500)'
                      : 'var(--theme-elevation-200)',
                  transition: 'background-color 150ms',
                }}
              />
              <span>{config.label}</span>
            </div>
          )
        })}
      </div>

      {/* Completion message */}
      {stage === 'complete' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'calc(var(--base) * 0.3)',
            marginTop: 'calc(var(--base) * 0.4)',
            fontSize: 'calc(var(--base-body-size) * 0.85)',
            color: 'var(--theme-success-500)',
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Optimization complete</span>
        </div>
      )}
    </div>
  )
}

export default OptimizationProgressBar
