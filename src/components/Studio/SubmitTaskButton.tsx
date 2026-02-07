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
import { Rocket, Loader2, CheckCircle2 } from 'lucide-react'
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
      return <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
    case 'success':
      return <CheckCircle2 size={16} />
    case 'error':
    case 'idle':
    default:
      return <Rocket size={16} />
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
