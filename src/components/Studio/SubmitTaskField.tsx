'use client'

/**
 * SubmitTaskField Component
 *
 * Custom PayloadCMS UI field component that integrates the submit button
 * and related UI into the Tasks collection creation/edit form.
 *
 * Features:
 * - Submit button with loading states
 * - Confirmation dialog before submission
 * - Success message with navigation options
 * - Error display with retry capability
 *
 * Part of Phase 5: Submit Button for Task Creation Page
 */

import React, { useState, useMemo, useCallback } from 'react'
import { useFormFields, useDocumentInfo } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import { SubmitTaskButton } from './SubmitTaskButton'
import { SubmitConfirmationDialog, type TaskSummary } from './SubmitConfirmationDialog'
import { SubmitSuccessMessage } from './SubmitSuccessMessage'
import { SubmitErrorMessage } from './SubmitErrorMessage'
import { useSubmitTask } from './hooks/useSubmitTask'
import { TaskStatus } from '../../lib/types'

// Model display names for summary
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'flux-pro': 'Flux Pro',
  'flux-dev': 'Flux Dev',
  'flux-schnell': 'Flux Schnell',
  'dalle-3': 'DALL-E 3',
  'nano-banana': 'Nano Banana',
}

/**
 * SubmitTaskField - Custom UI field for PayloadCMS Tasks collection
 * Provides submit button, confirmation dialog, and status messages
 */
export const SubmitTaskField: UIFieldClientComponent = () => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Get document info
  const documentInfo = useDocumentInfo()
  const docId = documentInfo?.id as string | undefined

  // Get submission hook
  const [submitState, submitActions] = useSubmitTask()

  // Get form field values for summary
  const fields = useFormFields(([fields]) => ({
    expandedPrompts: fields.expandedPrompts,
    importedStyleIds: fields.importedStyleIds,
    models: fields.models,
    countPerPrompt: fields.countPerPrompt,
    aspectRatio: fields.aspectRatio,
    variantCount: fields.variantCount,
    includeBaseStyle: fields.includeBaseStyle,
    status: fields.status,
    subject: fields.subject,
  }))

  // Calculate task summary for confirmation dialog
  const taskSummary: TaskSummary = useMemo(() => {
    const expandedPromptsArray = fields.expandedPrompts?.value as unknown[]
    const variantCountField = fields.variantCount?.value as number
    const variantCount = expandedPromptsArray?.length || variantCountField || 3

    const importedStyleIds = (fields.importedStyleIds?.value as string[]) || ['base']
    const includeBaseStyle = fields.includeBaseStyle?.value as boolean ?? true
    const hasBaseStyle = importedStyleIds.includes('base')
    let styleCount = importedStyleIds.length
    if (includeBaseStyle && !hasBaseStyle) {
      styleCount += 1
    }

    const selectedModels = (fields.models?.value as string[]) || []
    const modelCount = selectedModels.length
    const countPerPrompt = (fields.countPerPrompt?.value as number) || 1
    const aspectRatio = (fields.aspectRatio?.value as string) || '1:1'

    const totalImages = variantCount * styleCount * modelCount * countPerPrompt

    return {
      totalImages,
      variantCount,
      styleCount,
      modelNames: selectedModels.map(id => MODEL_DISPLAY_NAMES[id] || id),
      aspectRatio,
      countPerPrompt,
    }
  }, [fields])

  // Check if form is valid for submission
  const isFormValid = useMemo(() => {
    const subject = fields.subject?.value as string | undefined
    const models = fields.models?.value as string[] | undefined
    const importedStyleIds = fields.importedStyleIds?.value as string[] | undefined

    return (
      subject && subject.trim().length >= 2 &&
      models && models.length > 0 &&
      importedStyleIds && importedStyleIds.length > 0
    )
  }, [fields])

  // Check if task is already submitted (not in draft status)
  const isAlreadySubmitted = useMemo(() => {
    const status = fields.status?.value as string | undefined
    return status && status !== TaskStatus.Draft
  }, [fields])

  // Handle submit button click
  const handleSubmitClick = useCallback(() => {
    setShowConfirmDialog(true)
  }, [])

  // Handle confirm in dialog
  const handleConfirmSubmit = useCallback(async () => {
    setShowConfirmDialog(false)
    await submitActions.submit()
  }, [submitActions])

  // Handle cancel in dialog
  const handleCancelDialog = useCallback(() => {
    setShowConfirmDialog(false)
  }, [])

  // Determine if button should be disabled
  const isButtonDisabled = !isFormValid || isAlreadySubmitted || submitState.state === 'success'

  // If task is already submitted, show a different message
  if (isAlreadySubmitted && submitState.state !== 'success') {
    return (
      <div
        style={{
          padding: 'calc(var(--base) * 1)',
          backgroundColor: 'var(--theme-elevation-50)',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 'var(--style-radius-m)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 'var(--base-body-size)',
            color: 'var(--theme-elevation-600)',
          }}
        >
          This task has already been submitted for processing.
          {docId && (
            <a
              href={`/admin/collections/tasks/${docId}`}
              style={{
                marginLeft: '8px',
                color: 'var(--theme-text)',
                textDecoration: 'underline',
              }}
            >
              View task details
            </a>
          )}
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--base) * 1)',
      }}
    >
      {/* Section Header */}
      <div style={{ marginTop: '0.5rem' }}>
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 500,
            color: 'var(--theme-text)',
            margin: 0,
            marginBottom: '0.25rem',
          }}
        >
          Submit Task
        </h3>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--theme-elevation-500)',
            margin: 0,
            marginBottom: '0.75rem',
          }}
        >
          {isFormValid
            ? 'Ready to submit your generation task'
            : 'Complete the required fields above before submitting'}
        </p>
      </div>

      {/* Success Message */}
      {submitState.state === 'success' && submitState.taskId && (
        <SubmitSuccessMessage
          taskId={submitState.taskId}
          onViewTask={submitActions.navigateToTask}
          onCreateNew={submitActions.createNewTask}
        />
      )}

      {/* Error Message */}
      {submitState.state === 'error' && submitState.error && (
        <SubmitErrorMessage
          message={submitState.error}
          onRetry={submitActions.retry}
          retrying={false}
        />
      )}

      {/* Submit Button (hidden on success) */}
      {submitState.state !== 'success' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 'calc(var(--base) * 0.5)',
          }}
        >
          <SubmitTaskButton
            onClick={handleSubmitClick}
            state={submitState.state}
            disabled={isButtonDisabled}
          />

          {/* Validation hint */}
          {!isFormValid && (
            <p
              style={{
                margin: 0,
                fontSize: 'calc(var(--base-body-size) * 0.85)',
                color: 'var(--theme-warning-500)',
              }}
            >
              Please ensure you have: a subject (2+ characters), at least one model selected, and at least one style selected.
            </p>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <SubmitConfirmationDialog
        isOpen={showConfirmDialog}
        summary={taskSummary}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelDialog}
        isSubmitting={submitState.state === 'saving' || submitState.state === 'submitting'}
      />
    </div>
  )
}

export default SubmitTaskField
