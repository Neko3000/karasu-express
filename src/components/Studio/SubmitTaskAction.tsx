'use client'

/**
 * SubmitTaskAction Component
 *
 * Custom PayloadCMS action component that adds a "Submit Task" button
 * next to the Save button in the document header.
 *
 * This component is registered via admin.components.views.edit.actions
 * in the Tasks collection configuration.
 *
 * Part of Phase 5: Submit Button for Task Creation Page
 */

import React, { useState, useMemo, useCallback } from 'react'
import { Rocket, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useFormFields, Button } from '@payloadcms/ui'
import { SubmitConfirmationDialog, type TaskSummary } from './SubmitConfirmationDialog'
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
 * SubmitTaskAction - Action button component for PayloadCMS document header
 * Adds "Submit Task" button next to the Save button
 */
export function SubmitTaskAction() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Get submission hook
  const [submitState, submitActions] = useSubmitTask()

  // Get form field values for validation and summary
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

  // Determine button state
  const isLoading = submitState.state === 'saving' || submitState.state === 'submitting'
  const isSuccess = submitState.state === 'success'
  const isDisabled = !isFormValid || isAlreadySubmitted || isLoading || isSuccess

  // Get button label
  const getButtonLabel = () => {
    if (submitState.state === 'saving') return 'Saving...'
    if (submitState.state === 'submitting') return 'Submitting...'
    if (submitState.state === 'success') return 'Submitted!'
    if (isAlreadySubmitted) return 'Already Submitted'
    return 'Submit Task'
  }

  // Get button icon
  const getButtonIcon = () => {
    if (isLoading) return <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
    if (isSuccess) return <CheckCircle2 size={14} />
    return <Rocket size={14} />
  }

  // Keep button visible but disabled when already submitted
  // Previously returned null for already-submitted tasks, but we now keep it visible for visual confirmation

  return (
    <>
      <Button
        type="button"
        onClick={handleSubmitClick}
        disabled={isDisabled}
        buttonStyle="primary"
        size="medium"
        icon={getButtonIcon()}
        iconPosition="left"
        iconStyle="without-border"
        aria-label={getButtonLabel()}
      >
        {getButtonLabel()}
      </Button>

      {/* Confirmation Dialog */}
      <SubmitConfirmationDialog
        isOpen={showConfirmDialog}
        summary={taskSummary}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelDialog}
        isSubmitting={isLoading}
      />

      {/* Toast-style notifications for success/error could be added here */}
      {submitState.state === 'error' && submitState.error && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 16px',
            backgroundColor: 'var(--theme-error-50)',
            border: '1px solid var(--theme-error-200)',
            borderRadius: 'var(--style-radius-m)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 10000,
            maxWidth: '400px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ color: 'var(--theme-error-500)', flexShrink: 0 }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--theme-error-700)', marginBottom: '4px' }}>
                Submission Failed
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--theme-error-600)' }}>
                {submitState.error}
              </div>
              <button
                type="button"
                onClick={submitActions.retry}
                style={{
                  marginTop: '8px',
                  padding: '4px 8px',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--theme-error-100)',
                  border: '1px solid var(--theme-error-300)',
                  borderRadius: 'var(--style-radius-s)',
                  cursor: 'pointer',
                  color: 'var(--theme-error-700)',
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {submitState.state === 'success' && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 16px',
            backgroundColor: 'var(--theme-success-50)',
            border: '1px solid var(--theme-success-200)',
            borderRadius: 'var(--style-radius-m)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 10000,
            maxWidth: '400px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ color: 'var(--theme-success-500)', flexShrink: 0 }}>
              <CheckCircle2 size={14} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--theme-success-700)', marginBottom: '4px' }}>
                Task Submitted!
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--theme-success-600)' }}>
                Your task has been queued for processing.
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={submitActions.navigateToTask}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--theme-success-500)',
                    border: 'none',
                    borderRadius: 'var(--style-radius-s)',
                    cursor: 'pointer',
                    color: 'white',
                  }}
                >
                  View Task
                </button>
                <button
                  type="button"
                  onClick={submitActions.createNewTask}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--theme-success-100)',
                    border: '1px solid var(--theme-success-300)',
                    borderRadius: 'var(--style-radius-s)',
                    cursor: 'pointer',
                    color: 'var(--theme-success-700)',
                  }}
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SubmitTaskAction
