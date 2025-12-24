'use client'

/**
 * OptimizationErrorBanner Component
 *
 * A compact inline error banner with error message display and "Retry" button
 * shown inside the collapsible section when prompt optimization fails.
 *
 * Uses PayloadCMS styling patterns.
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React from 'react'
import { Button } from '@payloadcms/ui'

export interface OptimizationErrorBannerProps {
  /** Error message to display */
  message: string
  /** Callback when retry button is clicked */
  onRetry: () => void
  /** Whether retry is currently in progress */
  retrying?: boolean
  /** Additional CSS classes */
  className?: string
  /** Additional inline styles */
  style?: React.CSSProperties
}

/**
 * OptimizationErrorBanner - Compact error display with retry functionality
 * Uses PayloadCMS styling patterns
 */
export function OptimizationErrorBanner({
  message,
  onRetry,
  retrying = false,
  className = '',
  style,
}: OptimizationErrorBannerProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'calc(var(--base) * 0.5)',
        padding: 'calc(var(--base) * 0.5)',
        borderRadius: 'var(--style-radius-s)',
        backgroundColor: 'var(--theme-error-50)',
        border: '1px solid var(--theme-error-200)',
        ...style,
      }}
      role="alert"
    >
      {/* Error icon */}
      <div style={{ flexShrink: 0 }}>
        <svg
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="var(--theme-error-500)"
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'calc(var(--base-body-size) * 0.9)',
            fontWeight: 500,
            color: 'var(--theme-error-600)',
          }}
        >
          Optimization Failed
        </div>
        <p
          style={{
            margin: 'calc(var(--base) * 0.25) 0 0 0',
            fontSize: 'calc(var(--base-body-size) * 0.85)',
            color: 'var(--theme-error-500)',
            wordBreak: 'break-word',
          }}
        >
          {message}
        </p>
        <div style={{ marginTop: 'calc(var(--base) * 0.5)' }}>
          <Button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            buttonStyle="secondary"
            size="small"
          >
            {retrying ? 'Retrying...' : 'Retry'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default OptimizationErrorBanner
