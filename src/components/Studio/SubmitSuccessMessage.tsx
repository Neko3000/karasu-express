'use client'

/**
 * SubmitSuccessMessage Component
 *
 * Displays success confirmation after task submission.
 * Shows:
 * - Success confirmation with task ID
 * - Link to Task Manager to track progress
 * - Option to create another task
 *
 * Part of Phase 5: Submit Button for Task Creation Page
 */

import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@payloadcms/ui'

export interface SubmitSuccessMessageProps {
  /** The submitted task's ID */
  taskId: string
  /** Callback to navigate to task detail/manager */
  onViewTask: () => void
  /** Callback to create a new task */
  onCreateNew: () => void
  /** Additional CSS classes */
  className?: string
}


/**
 * SubmitSuccessMessage - Success confirmation after task submission
 */
export function SubmitSuccessMessage({
  taskId,
  onViewTask,
  onCreateNew,
  className = '',
}: SubmitSuccessMessageProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'calc(var(--base) * 1)',
        padding: 'calc(var(--base) * 1.5)',
        backgroundColor: 'var(--theme-success-50)',
        border: '1px solid var(--theme-success-200)',
        borderRadius: 'var(--style-radius-m)',
        textAlign: 'center',
      }}
    >
      {/* Success Icon */}
      <CheckCircle2 size={32} style={{ color: 'var(--theme-success-500)' }} />

      {/* Title */}
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: 'var(--font-size-h4)',
            fontWeight: 600,
            color: 'var(--theme-success-700)',
          }}
        >
          Task Submitted Successfully!
        </h3>
        <p
          style={{
            margin: 'calc(var(--base) * 0.5) 0 0 0',
            fontSize: 'calc(var(--base-body-size) * 0.9)',
            color: 'var(--theme-success-600)',
          }}
        >
          Your generation task has been queued for processing.
        </p>
      </div>

      {/* Task ID Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'calc(var(--base) * 0.25)',
          padding: 'calc(var(--base) * 0.25) calc(var(--base) * 0.5)',
          backgroundColor: 'var(--theme-success-100)',
          borderRadius: 'var(--style-radius-s)',
          fontSize: 'calc(var(--base-body-size) * 0.85)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span style={{ color: 'var(--theme-success-500)' }}>Task ID:</span>
        <span style={{ fontWeight: 600, color: 'var(--theme-success-700)' }}>
          {taskId}
        </span>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: 'calc(var(--base) * 0.5)',
          marginTop: 'calc(var(--base) * 0.5)',
        }}
      >
        <Button
          type="button"
          onClick={onViewTask}
          buttonStyle="primary"
        >
          View Task Progress
        </Button>
        <Button
          type="button"
          onClick={onCreateNew}
          buttonStyle="secondary"
        >
          Create Another Task
        </Button>
      </div>

      {/* Info Text */}
      <p
        style={{
          margin: 0,
          fontSize: 'calc(var(--base-body-size) * 0.8)',
          color: 'var(--theme-elevation-500)',
        }}
      >
        You can track the progress in the Task Manager or view this task&apos;s details.
      </p>
    </div>
  )
}

export default SubmitSuccessMessage
