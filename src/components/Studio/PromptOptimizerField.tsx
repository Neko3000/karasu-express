'use client'

/**
 * PromptOptimizerField Component
 *
 * Custom PayloadCMS field component that integrates prompt optimization UI
 * into the Tasks collection creation/edit form.
 *
 * Features:
 * - Subject input with character counter
 * - Variant count selector (3/5/7)
 * - "Optimize Prompt" button with sparkle icon
 * - Collapsible section with progress bar
 * - Selectable/editable prompt variants
 * - Error handling with retry
 *
 * Uses PayloadCMS styling patterns for consistent appearance.
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React, { useEffect, useCallback } from 'react'
import { useField, useForm, Button } from '@payloadcms/ui'
import { SubjectInput, MIN_SUBJECT_LENGTH } from './SubjectInput'
import { VariantCountSelector } from './VariantCountSelector'
import { ExtendButton } from './ExtendButton'
import { PromptOptimizationSection } from './PromptOptimizationSection'
import { OptimizationProgressBar } from './OptimizationProgressBar'
import { PromptVariantsList } from './PromptVariantsList'
import { OptimizationErrorBanner } from './OptimizationErrorBanner'
import { usePromptExpansion } from './hooks/usePromptExpansion'
import type { VariantWithSelection } from './PromptVariantsList'
import type { UIFieldClientComponent } from 'payload'

/**
 * PromptOptimizerField - Custom field for PayloadCMS Tasks collection
 * Replaces the default subject textarea with enhanced prompt optimization UI
 */
export const PromptOptimizerField: UIFieldClientComponent = () => {
  // Get the subject field from PayloadCMS
  const subjectField = useField<string>({
    path: 'subject',
  })

  // Get form context to update other fields
  const { dispatchFields } = useForm()

  // Use the prompt expansion hook
  const [state, actions] = usePromptExpansion()

  // Sync subject value from PayloadCMS form to hook state
  useEffect(() => {
    if (subjectField.value && subjectField.value !== state.subject) {
      actions.setSubject(subjectField.value)
    }
  }, [subjectField.value, state.subject, actions])

  // Update PayloadCMS form when subject changes in hook
  const handleSubjectChange = useCallback(
    (value: string) => {
      actions.setSubject(value)
      subjectField.setValue(value)
    },
    [actions, subjectField]
  )

  // Update expandedPrompts in PayloadCMS form when variants change
  useEffect(() => {
    if (state.stage === 'complete' && state.variants.length > 0) {
      // Convert variants to the expandedPrompts format expected by PayloadCMS
      const selectedVariants = state.variants.filter((v) => v.isSelected)
      const expandedPrompts = selectedVariants.map((variant: VariantWithSelection) => ({
        variantId: variant.variantId,
        variantName: variant.variantName,
        originalPrompt: state.subject,
        expandedPrompt: variant.expandedPrompt,
        subjectSlug: state.subjectSlug,
      }))

      // Dispatch field updates
      dispatchFields({
        type: 'UPDATE',
        path: 'expandedPrompts',
        value: expandedPrompts,
      })

      dispatchFields({
        type: 'UPDATE',
        path: 'batchConfig.variantCount',
        value: selectedVariants.length,
      })
    }
  }, [state.stage, state.variants, state.subject, state.subjectSlug, dispatchFields])

  const isLoading = state.stage === 'analyzing' || state.stage === 'enhancing' || state.stage === 'formatting'
  const canExtend = state.subject.trim().length >= MIN_SUBJECT_LENGTH && !isLoading
  const showProgress = state.stage !== 'idle' && state.stage !== 'complete' && state.stage !== 'error'
  const showVariants = state.stage === 'complete' && state.variants.length > 0
  const showError = state.stage === 'error' && state.error

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--base) * 0.75)' }}>
      {/* Field Label */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--base-body-size)',
            fontWeight: 500,
            color: 'var(--theme-text)',
            marginBottom: 'calc(var(--base) * 0.25)',
          }}
        >
          Creative Theme / Subject
          <span style={{ color: 'var(--theme-error-500)', marginLeft: '4px' }}>*</span>
        </label>
        <p
          style={{
            fontSize: 'calc(var(--base-body-size) * 0.85)',
            color: 'var(--theme-elevation-500)',
            margin: 0,
          }}
        >
          Enter your creative theme, then click &quot;Optimize Prompt&quot; to generate AI-enhanced variants
        </p>
      </div>

      {/* Subject Input */}
      <SubjectInput
        value={state.subject}
        onChange={handleSubjectChange}
        disabled={isLoading}
        placeholder="Enter your creative theme (e.g., 'a majestic lion in a mystical forest')"
      />

      {/* Controls Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'calc(var(--base) * 0.5)',
        }}
      >
        <VariantCountSelector
          value={state.variantCount}
          onChange={actions.setVariantCount}
          disabled={isLoading}
        />

        <ExtendButton
          onClick={actions.expand}
          disabled={!canExtend}
          loading={isLoading}
        />
      </div>

      {/* Collapsible Optimization Section */}
      <PromptOptimizationSection isOpen={state.isOpen}>
        {/* Progress Bar */}
        {showProgress && (
          <OptimizationProgressBar
            stage={state.stage}
            style={{ marginBottom: 'calc(var(--base) * 0.5)' }}
          />
        )}

        {/* Error Banner */}
        {showError && (
          <OptimizationErrorBanner
            message={state.error!}
            onRetry={actions.retry}
            retrying={isLoading}
            style={{ marginBottom: 'calc(var(--base) * 0.5)' }}
          />
        )}

        {/* Variants List */}
        {showVariants && (
          <>
            {/* Completion Progress Bar */}
            <OptimizationProgressBar
              stage={state.stage}
              style={{ marginBottom: 'calc(var(--base) * 0.5)' }}
            />

            <PromptVariantsList
              variants={state.variants}
              onSelectionChange={actions.toggleSelection}
              onPromptChange={actions.updatePrompt}
              disabled={isLoading}
            />

            {/* Selection Summary */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 'calc(var(--base) * 0.5)',
                paddingTop: 'calc(var(--base) * 0.5)',
                borderTop: '1px solid var(--theme-elevation-150)',
              }}
            >
              <div style={{ fontSize: 'calc(var(--base-body-size) * 0.9)', color: 'var(--theme-elevation-600)' }}>
                <span style={{ fontWeight: 500, color: 'var(--theme-success-500)' }}>
                  {state.variants.filter((v) => v.isSelected).length}
                </span>
                {' '}of {state.variants.length} variant(s) selected for generation
              </div>

              <Button
                type="button"
                onClick={actions.reset}
                buttonStyle="pill"
                size="small"
              >
                Clear & Start Over
              </Button>
            </div>
          </>
        )}
      </PromptOptimizationSection>

      {/* Hidden field info for PayloadCMS integration */}
      {state.stage === 'complete' && state.variants.filter((v) => v.isSelected).length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--theme-success-50)',
            border: '1px solid var(--theme-success-200)',
            borderRadius: 'var(--style-radius-s)',
            padding: 'calc(var(--base) * 0.5)',
            fontSize: 'calc(var(--base-body-size) * 0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--base) * 0.4)', color: 'var(--theme-success-600)' }}>
            <svg style={{ width: '14px', height: '14px' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>
              <strong>{state.variants.filter((v) => v.isSelected).length}</strong> optimized prompt variant(s) ready.
              Continue configuring styles and models below.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptOptimizerField
