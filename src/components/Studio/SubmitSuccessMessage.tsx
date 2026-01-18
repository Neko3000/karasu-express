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
 * CheckCircleIcon - Success checkmark icon
 */
function CheckCircleIcon() {
  return (
    <svg
      width="32"
      height="32"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ color: 'var(--theme-success-500)' }}
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
      <CheckCircleIcon />

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
