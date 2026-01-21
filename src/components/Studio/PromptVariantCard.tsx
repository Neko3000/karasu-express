'use client'

/**
 * PromptVariantCard Component
 *
 * A compact card displaying a single prompt variant with:
 * - Checkbox for selection (multi-select)
 * - Variant name/label (e.g., "Realistic", "Artistic")
 * - Inline editable text area for the expanded prompt (fixed height)
 * - Character count display
 * - Always-visible editable negative prompt section (fixed height)
 * - Color-coded left border by variant type
 * - Fixed height for tag area, prompt textarea, and negative prompt
 *
 * Uses PayloadCMS styling patterns for consistency.
 * Rendered inside PromptOptimizerField on the Task creation page.
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 * Updated in Phase 8: T053a, T053b, T053c - Fixed heights for consistent card layout
 */

import React, { useCallback, useRef, useEffect, useState, memo } from 'react'

// Debounce delay for textarea changes (ms)
const DEBOUNCE_DELAY = 300

// T053a: Fixed height for tag area (minimum height for consistent layout)
const TAG_AREA_MIN_HEIGHT = '40px'

// T053b: Fixed height for expanded prompt textarea
const PROMPT_TEXTAREA_HEIGHT = '120px'

// T053c: Fixed height for negative prompt textarea
const NEGATIVE_PROMPT_HEIGHT = '80px'

// T053: Color mapping for variant types (left border color)
const VARIANT_COLORS: Record<string, string> = {
  realistic: '#3b82f6', // blue
  artistic: '#8b5cf6', // purple
  cinematic: '#f59e0b', // amber
  abstract: '#14b8a6', // teal
  surreal: '#ec4899', // pink
  minimalist: '#6b7280', // gray
  dramatic: '#ef4444', // red
  ethereal: '#06b6d4', // cyan
  vintage: '#78716c', // stone
  futuristic: '#6366f1', // indigo
}

// Default border color for unknown variant types
const DEFAULT_BORDER_COLOR = '#94a3b8' // slate-400

/**
 * Get border color for a variant name (T053)
 */
function getVariantColor(variantName: string): string {
  const lowerName = variantName.toLowerCase()
  for (const [key, color] of Object.entries(VARIANT_COLORS)) {
    if (lowerName.includes(key)) {
      return color
    }
  }
  return DEFAULT_BORDER_COLOR
}

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
  /** Callback when the negative prompt text is edited (T053c) */
  onNegativePromptChange?: (variantId: string, newNegativePrompt: string) => void
  /** Whether editing is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * PromptVariantCard - Selectable and editable prompt variant card
 * Uses PayloadCMS styling patterns for compact, consistent appearance
 * Wrapped with React.memo to prevent unnecessary re-renders
 *
 * T053a, T053b, T053c: Fixed heights for consistent 2-column grid layout
 */
function PromptVariantCardComponent({
  variant,
  isSelected,
  onSelectionChange,
  onPromptChange,
  onNegativePromptChange,
  disabled = false,
  className = '',
}: PromptVariantCardProps) {
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const negativeDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Local state for immediate textarea feedback
  const [localPrompt, setLocalPrompt] = useState(variant.expandedPrompt)
  // T053c: Local state for negative prompt (now editable)
  const [localNegativePrompt, setLocalNegativePrompt] = useState(variant.suggestedNegativePrompt || '')

  // T053: Get color for variant type
  const borderColor = getVariantColor(variant.variantName)

  // Sync local state when variant prop changes (e.g., from external update)
  useEffect(() => {
    setLocalPrompt(variant.expandedPrompt)
  }, [variant.expandedPrompt])

  // T053c: Sync negative prompt when variant prop changes
  useEffect(() => {
    setLocalNegativePrompt(variant.suggestedNegativePrompt || '')
  }, [variant.suggestedNegativePrompt])

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (negativeDebounceTimeoutRef.current) {
        clearTimeout(negativeDebounceTimeoutRef.current)
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

  // T053c: Handle negative prompt changes
  const handleNegativePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      // Update local state immediately for responsive UI
      setLocalNegativePrompt(newValue)

      // Clear existing timeout
      if (negativeDebounceTimeoutRef.current) {
        clearTimeout(negativeDebounceTimeoutRef.current)
      }

      // Debounce the parent callback to reduce re-renders
      if (onNegativePromptChange) {
        negativeDebounceTimeoutRef.current = setTimeout(() => {
          onNegativePromptChange(variant.variantId, newValue)
        }, DEBOUNCE_DELAY)
      }
    },
    [variant.variantId, onNegativePromptChange]
  )

  return (
    <div
      className={className}
      style={{
        // T050: Reduced padding for denser layout
        padding: 'calc(var(--base) * 0.5)',
        borderRadius: 'var(--style-radius-s)',
        // Use non-shorthand border properties to avoid React warning about conflicting properties
        borderTop: `1px solid ${isSelected ? 'var(--theme-success-500)' : 'var(--theme-elevation-150)'}`,
        borderRight: `1px solid ${isSelected ? 'var(--theme-success-500)' : 'var(--theme-elevation-150)'}`,
        borderBottom: `1px solid ${isSelected ? 'var(--theme-success-500)' : 'var(--theme-elevation-150)'}`,
        // T053: Color-coded left border
        borderLeft: `4px solid ${borderColor}`,
        backgroundColor: isSelected ? 'var(--theme-success-50)' : 'var(--theme-elevation-50)',
        opacity: disabled ? 0.6 : 1,
        transition: 'border-color 150ms, background-color 150ms',
        // Ensure card layout fills grid cell properly
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* T053a: Header with checkbox, variant name, and tags - fixed minimum height */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'calc(var(--base) * 0.4)',
          marginBottom: 'calc(var(--base) * 0.4)',
          minHeight: TAG_AREA_MIN_HEIGHT,
        }}
      >
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
          {/* Keywords/Tags - T053a: consistent height area */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'calc(var(--base) * 0.2)',
              marginTop: 'calc(var(--base) * 0.2)',
              minHeight: '20px', // Ensure space even when no tags
            }}
          >
            {variant.keywords && variant.keywords.length > 0 && (
              variant.keywords.slice(0, 4).map((keyword, index) => (
                <span
                  key={index}
                  style={{
                    padding: '0 calc(var(--base) * 0.35)',
                    fontSize: 'calc(var(--base-body-size) * 0.7)',
                    borderRadius: 'var(--style-radius-s)',
                    backgroundColor: 'var(--theme-elevation-150)',
                    color: 'var(--theme-elevation-650)',
                  }}
                >
                  {keyword}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* T053b: Editable prompt textarea - fixed height */}
      <div style={{ marginBottom: 'calc(var(--base) * 0.4)' }}>
        {/* T052: Character count next to label */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'calc(var(--base) * 0.2)' }}>
          <label
            style={{
              fontSize: 'calc(var(--base-body-size) * 0.8)',
              fontWeight: 500,
              color: 'var(--theme-elevation-500)',
            }}
          >
            Expanded Prompt
          </label>
          <span
            style={{
              fontSize: 'calc(var(--base-body-size) * 0.7)',
              color: 'var(--theme-elevation-400)',
            }}
          >
            {localPrompt.length} chars
          </span>
        </div>
        <textarea
          value={localPrompt}
          onChange={handlePromptChange}
          disabled={disabled}
          style={{
            width: '100%',
            padding: 'calc(var(--base) * 0.35)',
            fontSize: 'calc(var(--base-body-size) * 0.85)',
            lineHeight: 1.4,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-s)',
            backgroundColor: 'var(--theme-input-bg)',
            color: 'var(--theme-text)',
            resize: 'none',
            // T053b: Fixed height for consistent layout
            height: PROMPT_TEXTAREA_HEIGHT,
            overflowY: 'auto',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          aria-label={`Edit ${variant.variantName} prompt`}
        />
      </div>

      {/* T053c: Always-visible editable negative prompt section - fixed height */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'calc(var(--base) * 0.2)' }}>
          <label
            style={{
              fontSize: 'calc(var(--base-body-size) * 0.8)',
              fontWeight: 500,
              color: 'var(--theme-elevation-500)',
            }}
          >
            Negative Prompt
          </label>
          <span
            style={{
              fontSize: 'calc(var(--base-body-size) * 0.7)',
              color: 'var(--theme-elevation-400)',
            }}
          >
            {localNegativePrompt.length} chars
          </span>
        </div>
        <textarea
          value={localNegativePrompt}
          onChange={handleNegativePromptChange}
          disabled={disabled}
          placeholder="Enter negative prompt (what to avoid in the image)..."
          style={{
            width: '100%',
            padding: 'calc(var(--base) * 0.35)',
            fontSize: 'calc(var(--base-body-size) * 0.85)',
            lineHeight: 1.4,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-s)',
            backgroundColor: 'var(--theme-input-bg)',
            color: 'var(--theme-text)',
            resize: 'none',
            // T053c: Fixed height for consistent layout
            height: NEGATIVE_PROMPT_HEIGHT,
            overflowY: 'auto',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          aria-label={`Edit ${variant.variantName} negative prompt`}
        />
      </div>
    </div>
  )
}

/**
 * Memoized PromptVariantCard to prevent unnecessary re-renders
 * Only re-renders when variant data, selection state, or disabled state changes
 * T053c: Also tracks negative prompt changes
 */
export const PromptVariantCard = memo(PromptVariantCardComponent, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.variant.variantId === nextProps.variant.variantId &&
    prevProps.variant.expandedPrompt === nextProps.variant.expandedPrompt &&
    prevProps.variant.suggestedNegativePrompt === nextProps.variant.suggestedNegativePrompt &&
    prevProps.variant.variantName === nextProps.variant.variantName &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.className === nextProps.className
  )
})

export default PromptVariantCard
