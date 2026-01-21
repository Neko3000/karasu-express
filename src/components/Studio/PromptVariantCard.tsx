'use client'

/**
 * PromptVariantCard Component
 *
 * A compact card displaying a single prompt variant with:
 * - Checkbox for selection (multi-select)
 * - Variant name/label (e.g., "Realistic", "Artistic")
 * - Inline editable text area for the expanded prompt
 * - Character count display
 * - Collapsible suggested negative prompt section (collapsed by default)
 * - Color-coded left border by variant type
 *
 * Uses PayloadCMS styling patterns for consistency.
 * Rendered inside PromptOptimizerField on the Task creation page.
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React, { useCallback, useRef, useEffect, useState, memo } from 'react'

// Debounce delay for textarea changes (ms)
const DEBOUNCE_DELAY = 300

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
  /** Whether editing is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * ChevronIcon - Expandable section indicator (T051)
 */
function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 150ms ease',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
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
  // T051: Negative prompt collapsed by default
  const [isNegativePromptExpanded, setIsNegativePromptExpanded] = useState(false)

  // T053: Get color for variant type
  const borderColor = getVariantColor(variant.variantName)

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

  // T051: Toggle negative prompt expand/collapse
  const toggleNegativePrompt = useCallback(() => {
    setIsNegativePromptExpanded((prev) => !prev)
  }, [])

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
      }}
    >
      {/* Header with checkbox and variant name - T050: reduced margins */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'calc(var(--base) * 0.4)', marginBottom: 'calc(var(--base) * 0.4)' }}>
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
          {/* Keywords - T050: reduced margins */}
          {variant.keywords && variant.keywords.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'calc(var(--base) * 0.2)', marginTop: 'calc(var(--base) * 0.2)' }}>
              {variant.keywords.slice(0, 4).map((keyword, index) => (
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editable prompt textarea - T050: reduced margins */}
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
          ref={textareaRef}
          value={localPrompt}
          onChange={handlePromptChange}
          disabled={disabled}
          rows={2}
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
            minHeight: '44px',
            maxHeight: '150px',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          aria-label={`Edit ${variant.variantName} prompt`}
        />
      </div>

      {/* T051: Collapsible negative prompt section (collapsed by default) */}
      {variant.suggestedNegativePrompt && (
        <div>
          <button
            type="button"
            onClick={toggleNegativePrompt}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'calc(var(--base) * 0.25)',
              padding: 0,
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: 'calc(var(--base-body-size) * 0.75)',
              fontWeight: 500,
              color: 'var(--theme-elevation-500)',
              marginBottom: isNegativePromptExpanded ? 'calc(var(--base) * 0.2)' : 0,
            }}
            aria-expanded={isNegativePromptExpanded}
            aria-controls={`negative-prompt-${variant.variantId}`}
          >
            <ChevronIcon isExpanded={isNegativePromptExpanded} />
            {isNegativePromptExpanded ? 'Negative Prompt' : 'Negative prompt available'}
          </button>

          {/* Animated collapse/expand */}
          <div
            id={`negative-prompt-${variant.variantId}`}
            style={{
              maxHeight: isNegativePromptExpanded ? '200px' : '0px',
              overflow: 'hidden',
              transition: 'max-height 200ms ease-out',
            }}
          >
            <div
              style={{
                padding: 'calc(var(--base) * 0.35)',
                fontSize: 'calc(var(--base-body-size) * 0.8)',
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
