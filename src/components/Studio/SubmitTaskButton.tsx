'use client'

/**
 * SubmitTaskButton Component
 *
 * A prominent button that triggers task submission.
 * Shows "Submit Task" label with a rocket icon.
 * Displays loading spinner during submission.
 * Integrates with PayloadCMS form context.
 *
 * Part of Phase 5: Submit Button for Task Creation Page
 */

import React from 'react'
import { Button } from '@payloadcms/ui'
import type { SubmissionState } from './hooks/useSubmitTask'

export interface SubmitTaskButtonProps {
  /** Click handler for the button */
  onClick: () => void
  /** Current submission state */
  state: SubmissionState
  /** Whether the button is disabled (form not valid) */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * RocketIcon - Launch icon for task submission
 */
function RocketIcon() {
  return (
    <svg
      width="16"
      height="16"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"
        clipRule="evenodd"
      />
      <path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z" />
    </svg>
  )
}

/**
 * LoadingSpinner - Spinner icon for loading state
 */
function LoadingSpinner() {
  return (
    <svg
      width="16"
      height="16"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle
        opacity="0.25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        opacity="0.75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * CheckIcon - Success checkmark icon
 */
function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/**
 * Get button label based on state
 */
function getButtonLabel(state: SubmissionState): string {
  switch (state) {
    case 'saving':
      return 'Saving...'
    case 'submitting':
      return 'Submitting...'
    case 'success':
      return 'Submitted!'
    case 'error':
      return 'Submit Task'
    case 'idle':
    default:
      return 'Submit Task'
  }
}

/**
 * Get button icon based on state
 */
function getButtonIcon(state: SubmissionState): React.ReactNode {
  switch (state) {
    case 'saving':
    case 'submitting':
      return <LoadingSpinner />
    case 'success':
      return <CheckIcon />
    case 'error':
    case 'idle':
    default:
      return <RocketIcon />
  }
}

/**
 * SubmitTaskButton - Prominent button for task submission
 * Uses PayloadCMS Button component for consistent styling
 */
export function SubmitTaskButton({
  onClick,
  state,
  disabled = false,
  className = '',
}: SubmitTaskButtonProps) {
  const isLoading = state === 'saving' || state === 'submitting'
  const isSuccess = state === 'success'
  const isDisabled = disabled || isLoading || isSuccess

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      buttonStyle="primary"
      size="large"
      icon={getButtonIcon(state)}
      iconPosition="left"
      iconStyle="without-border"
      className={className}
      aria-label={getButtonLabel(state)}
    >
      {getButtonLabel(state)}
    </Button>
  )
}

export default SubmitTaskButton
