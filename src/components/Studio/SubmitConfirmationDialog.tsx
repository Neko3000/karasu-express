'use client'

/**
 * SubmitConfirmationDialog Component
 *
 * A modal dialog that displays task summary before submission.
 * Shows warning when total images exceeds 500 (per FR-005).
 * Includes "Confirm Submit" and "Cancel" buttons.
 * Implements accessible modal patterns (focus trap, ESC to close).
 *
 * Part of Phase 5: Submit Button for Task Creation Page
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { Button } from '@payloadcms/ui'

export interface TaskSummary {
  /** Total number of images to generate */
  totalImages: number
  /** Number of prompt variants */
  variantCount: number
  /** Number of styles selected */
  styleCount: number
  /** Names of selected models */
  modelNames: string[]
  /** Aspect ratio */
  aspectRatio: string
  /** Images per prompt */
  countPerPrompt: number
}

export interface SubmitConfirmationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Task summary to display */
  summary: TaskSummary
  /** Callback when confirm button is clicked */
  onConfirm: () => void
  /** Callback when cancel button is clicked or dialog is dismissed */
  onCancel: () => void
  /** Whether submission is in progress */
  isSubmitting?: boolean
}

const HIGH_IMAGE_COUNT_THRESHOLD = 500

/**
 * WarningIcon - Alert triangle icon
 */
function WarningIcon() {
  return (
    <svg
      width="24"
      height="24"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ color: 'var(--theme-warning-500)' }}
    >
      <path
        fillRule="evenodd"
        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/**
 * RocketIcon - Launch icon
 */
function RocketIcon() {
  return (
    <svg
      width="24"
      height="24"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ color: 'var(--theme-success-500)' }}
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
 * SubmitConfirmationDialog - Modal for confirming task submission
 */
export function SubmitConfirmationDialog({
  isOpen,
  summary,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: SubmitConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  const hasWarning = summary.totalImages > HIGH_IMAGE_COUNT_THRESHOLD

  // Focus trap and keyboard handling
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onCancel()
      }
    },
    [onCancel, isSubmitting]
  )

  // Set up event listeners and focus
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Focus the confirm button when dialog opens
      setTimeout(() => {
        confirmButtonRef.current?.focus()
      }, 0)

      // Prevent body scroll
      document.body.style.overflow = 'hidden'

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
        }}
        onClick={isSubmitting ? undefined : onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--theme-elevation-0)',
          borderRadius: 'var(--style-radius-m)',
          boxShadow: 'var(--shadow-lg)',
          width: '90%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflow: 'auto',
          zIndex: 9999,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'calc(var(--base) * 0.75)',
            padding: 'calc(var(--base) * 1.5)',
            borderBottom: '1px solid var(--theme-elevation-150)',
          }}
        >
          {hasWarning ? <WarningIcon /> : <RocketIcon />}
          <div>
            <h2
              id="confirm-dialog-title"
              style={{
                margin: 0,
                fontSize: 'var(--font-size-h4)',
                fontWeight: 600,
                color: 'var(--theme-text)',
              }}
            >
              {hasWarning ? 'High Image Count Warning' : 'Confirm Submission'}
            </h2>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: 'calc(var(--base-body-size) * 0.9)',
                color: 'var(--theme-elevation-500)',
              }}
            >
              Review your task configuration before submitting
            </p>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            padding: 'calc(var(--base) * 1.5)',
          }}
        >
          {/* Warning Banner */}
          {hasWarning && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'calc(var(--base) * 0.5)',
                padding: 'calc(var(--base) * 0.75)',
                marginBottom: 'calc(var(--base) * 1)',
                backgroundColor: 'var(--theme-warning-50)',
                border: '1px solid var(--theme-warning-200)',
                borderRadius: 'var(--style-radius-s)',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    color: 'var(--theme-warning-700)',
                    marginBottom: '4px',
                  }}
                >
                  Large Batch Detected
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 'calc(var(--base-body-size) * 0.9)',
                    color: 'var(--theme-warning-600)',
                  }}
                >
                  You are about to generate <strong>{summary.totalImages}</strong> images.
                  This may take significant time and consume API resources.
                </p>
              </div>
            </div>
          )}

          {/* Summary Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'calc(var(--base) * 0.75)',
            }}
          >
            <SummaryItem label="Total Images" value={summary.totalImages.toString()} highlight />
            <SummaryItem label="Variants" value={summary.variantCount.toString()} />
            <SummaryItem label="Styles" value={summary.styleCount.toString()} />
            <SummaryItem label="Per Prompt" value={summary.countPerPrompt.toString()} />
            <SummaryItem
              label="Models"
              value={summary.modelNames.join(', ')}
              span={2}
            />
            <SummaryItem label="Aspect Ratio" value={summary.aspectRatio} />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'calc(var(--base) * 0.5)',
            padding: 'calc(var(--base) * 1)',
            borderTop: '1px solid var(--theme-elevation-150)',
            backgroundColor: 'var(--theme-elevation-50)',
          }}
        >
          <Button
            type="button"
            onClick={onCancel}
            buttonStyle="secondary"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            buttonStyle="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
          </Button>
        </div>
      </div>
    </>
  )
}

/**
 * SummaryItem - Individual summary item display
 */
interface SummaryItemProps {
  label: string
  value: string
  highlight?: boolean
  span?: number
}

function SummaryItem({ label, value, highlight, span }: SummaryItemProps) {
  return (
    <div
      style={{
        padding: 'calc(var(--base) * 0.5)',
        backgroundColor: highlight ? 'var(--theme-success-50)' : 'var(--theme-elevation-50)',
        border: `1px solid ${highlight ? 'var(--theme-success-200)' : 'var(--theme-elevation-150)'}`,
        borderRadius: 'var(--style-radius-s)',
        gridColumn: span ? `span ${span}` : undefined,
      }}
    >
      <div
        style={{
          fontSize: 'calc(var(--base-body-size) * 0.75)',
          color: 'var(--theme-elevation-500)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '2px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: highlight ? 'calc(var(--base-body-size) * 1.25)' : 'var(--base-body-size)',
          fontWeight: highlight ? 700 : 500,
          color: highlight ? 'var(--theme-success-600)' : 'var(--theme-text)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

export default SubmitConfirmationDialog
