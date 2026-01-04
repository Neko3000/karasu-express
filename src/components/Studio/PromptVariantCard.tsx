'use client'

/**
 * PromptVariantCard Component
 *
 * A compact card displaying a single prompt variant with:
 * - Checkbox for selection (multi-select)
 * - Variant name/label (e.g., "Realistic", "Artistic")
 * - Inline editable text area for the expanded prompt
 * - Suggested negative prompt display (non-editable, for reference)
 *
 * Uses PayloadCMS styling patterns for consistency.
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React, { useCallback, useRef, useEffect, useState, memo } from 'react'

// Debounce delay for textarea changes (ms)
const DEBOUNCE_DELAY = 300

export interface PromptVariant {
  /** Unique identifier for this variant */
  variantId: string
  /** Human-readable name (e.g., "Realistic", "Artistic") */
  variantName: string
  /** The expanded, detailed prompt */
  expandedPrompt: string
  /** Suggested negative prompt for this variant */
  suggestedNegativePrompt: string
  /** Keywords extracted from the prompt for categorization */
  keywords: string[]
}

export interface PromptVariantCardProps {
  /** The variant data to display */
  variant: PromptVariant
  /** Whether this variant is selected */
  isSelected: boolean
  /** Callback when selection changes */
  onSelectionChange: (variantId: string, selected: boolean) => void
  /** Callback when the prompt text is edited */
  onPromptChange: (variantId: string, newPrompt: string) => void
  /** Whether editing is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * PromptVariantCard - Selectable and editable prompt variant card
 * Uses PayloadCMS styling patterns for compact, consistent appearance
 * Wrapped with React.memo to prevent unnecessary re-renders
 */
function PromptVariantCardComponent({
  variant,
  isSelected,
  onSelectionChange,
  onPromptChange,
  disabled = false,
  className = '',
}: PromptVariantCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Local state for immediate textarea feedback
  const [localPrompt, setLocalPrompt] = useState(variant.expandedPrompt)

  // Auto-resize textarea to fit content
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }, [])

  // Sync local state when variant prop changes (e.g., from external update)
  useEffect(() => {
    setLocalPrompt(variant.expandedPrompt)
  }, [variant.expandedPrompt])

  // Adjust height when local prompt changes
  useEffect(() => {
    adjustHeight()
  }, [localPrompt, adjustHeight])

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSelectionChange(variant.variantId, e.target.checked)
    },
    [variant.variantId, onSelectionChange]
  )

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      // Update local state immediately for responsive UI
      setLocalPrompt(newValue)

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      // Debounce the parent callback to reduce re-renders
      debounceTimeoutRef.current = setTimeout(() => {
        onPromptChange(variant.variantId, newValue)
      }, DEBOUNCE_DELAY)
    },
    [variant.variantId, onPromptChange]
  )

  return (
    <div
      className={className}
      style={{
        padding: 'calc(var(--base) * 0.75)',
        borderRadius: 'var(--style-radius-s)',
        border: `1px solid ${isSelected ? 'var(--theme-success-500)' : 'var(--theme-elevation-150)'}`,
        backgroundColor: isSelected ? 'var(--theme-success-50)' : 'var(--theme-elevation-50)',
        opacity: disabled ? 0.6 : 1,
        transition: 'border-color 150ms, background-color 150ms',
      }}
    >
      {/* Header with checkbox and variant name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'calc(var(--base) * 0.5)', marginBottom: 'calc(var(--base) * 0.5)' }}>
        <input
          type="checkbox"
          id={`variant-${variant.variantId}`}
          checked={isSelected}
          onChange={handleCheckboxChange}
          disabled={disabled}
          style={{
            width: '16px',
            height: '16px',
            marginTop: '2px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            accentColor: 'var(--theme-success-500)',
          }}
        />
        <div style={{ flex: 1 }}>
          <label
            htmlFor={`variant-${variant.variantId}`}
            style={{
              display: 'block',
              fontSize: 'var(--base-body-size)',
              fontWeight: 500,
              color: 'var(--theme-text)',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {variant.variantName}
          </label>
          {/* Keywords */}
          {variant.keywords && variant.keywords.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'calc(var(--base) * 0.25)', marginTop: 'calc(var(--base) * 0.25)' }}>
              {variant.keywords.slice(0, 4).map((keyword, index) => (
                <span
                  key={index}
                  style={{
                    padding: '0 calc(var(--base) * 0.4)',
                    fontSize: 'calc(var(--base-body-size) * 0.75)',
                    borderRadius: 'var(--style-radius-s)',
                    backgroundColor: 'var(--theme-elevation-150)',
                    color: 'var(--theme-elevation-650)',
                  }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editable prompt textarea */}
      <div style={{ marginBottom: 'calc(var(--base) * 0.5)' }}>
        <label
          style={{
            display: 'block',
            fontSize: 'calc(var(--base-body-size) * 0.8)',
            fontWeight: 500,
            color: 'var(--theme-elevation-500)',
            marginBottom: 'calc(var(--base) * 0.25)',
          }}
        >
          Expanded Prompt
        </label>
        <textarea
          ref={textareaRef}
          value={localPrompt}
          onChange={handlePromptChange}
          disabled={disabled}
          rows={2}
          style={{
            width: '100%',
            padding: 'calc(var(--base) * 0.4)',
            fontSize: 'calc(var(--base-body-size) * 0.9)',
            lineHeight: 1.4,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-s)',
            backgroundColor: 'var(--theme-input-bg)',
            color: 'var(--theme-text)',
            resize: 'none',
            minHeight: '48px',
            maxHeight: '150px',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          aria-label={`Edit ${variant.variantName} prompt`}
        />
      </div>

      {/* Negative prompt (non-editable reference) */}
      {variant.suggestedNegativePrompt && (
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'calc(var(--base-body-size) * 0.8)',
              fontWeight: 500,
              color: 'var(--theme-elevation-500)',
              marginBottom: 'calc(var(--base) * 0.25)',
            }}
          >
            Suggested Negative Prompt
          </label>
          <div
            style={{
              padding: 'calc(var(--base) * 0.4)',
              fontSize: 'calc(var(--base-body-size) * 0.85)',
              lineHeight: 1.4,
              borderRadius: 'var(--style-radius-s)',
              backgroundColor: 'var(--theme-elevation-100)',
              color: 'var(--theme-elevation-600)',
              border: '1px solid var(--theme-elevation-100)',
            }}
          >
            {variant.suggestedNegativePrompt}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Memoized PromptVariantCard to prevent unnecessary re-renders
 * Only re-renders when variant data, selection state, or disabled state changes
 */
export const PromptVariantCard = memo(PromptVariantCardComponent, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.variant.variantId === nextProps.variant.variantId &&
    prevProps.variant.expandedPrompt === nextProps.variant.expandedPrompt &&
    prevProps.variant.variantName === nextProps.variant.variantName &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.className === nextProps.className
  )
})

export default PromptVariantCard
