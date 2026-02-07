'use client'

/**
 * SubmitErrorMessage Component
 *
 * Displays error message when task submission fails.
 * Shows:
 * - Error message from API response
 * - Retry button to attempt submission again
 *
 * Styled consistently with OptimizationErrorBanner.
 *
 * Part of Phase 5: Submit Button for Task Creation Page
 */

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@payloadcms/ui'

export interface SubmitErrorMessageProps {
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
 * SubmitErrorMessage - Error display with retry functionality for task submission
 * Uses styling consistent with OptimizationErrorBanner
 */
export function SubmitErrorMessage({
  message,
  onRetry,
  retrying = false,
  className = '',
}: SubmitErrorMessageProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'calc(var(--base) * 0.75)',
        padding: 'calc(var(--base) * 1)',
        borderRadius: 'var(--style-radius-m)',
        backgroundColor: 'var(--theme-error-50)',
        border: '1px solid var(--theme-error-200)',
      }}
      role="alert"
    >
      {/* Error icon */}
      <div style={{ flexShrink: 0 }}>
        <AlertCircle size={24} style={{ color: 'var(--theme-error-500)' }} />
      </div>

      {/* Error message and retry button */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4
          style={{
            margin: 0,
            fontSize: 'var(--base-body-size)',
            fontWeight: 600,
            color: 'var(--theme-error-700)',
          }}
        >
          Submission Failed
        </h4>
        <p
          style={{
            margin: 'calc(var(--base) * 0.25) 0 0 0',
            fontSize: 'calc(var(--base-body-size) * 0.9)',
            color: 'var(--theme-error-600)',
            wordBreak: 'break-word',
          }}
        >
          {message}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'calc(var(--base) * 0.5)',
            marginTop: 'calc(var(--base) * 0.75)',
          }}
        >
          <Button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            buttonStyle="primary"
            size="small"
          >
            {retrying ? 'Retrying...' : 'Retry Submission'}
          </Button>
          <span
            style={{
              fontSize: 'calc(var(--base-body-size) * 0.8)',
              color: 'var(--theme-error-500)',
            }}
          >
            or check your form data and try again
          </span>
        </div>
      </div>
    </div>
  )
}

export default SubmitErrorMessage
