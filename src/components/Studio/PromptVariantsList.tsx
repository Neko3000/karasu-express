'use client'

/**
 * PromptVariantsList Component
 *
 * Displays generated prompt variants inside the collapsible section
 * after the optimization progress completes.
 * Uses PayloadCMS styling patterns for consistency.
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React, { memo, useMemo, useCallback } from 'react'
import { Button } from '@payloadcms/ui'
import { PromptVariantCard, type PromptVariant } from './PromptVariantCard'

export interface VariantWithSelection extends PromptVariant {
  /** Whether this variant is selected */
  isSelected: boolean
}

export interface PromptVariantsListProps {
  /** Array of variants with selection state */
  variants: VariantWithSelection[]
  /** Callback when a variant's selection changes */
  onSelectionChange: (variantId: string, selected: boolean) => void
  /** Callback when a variant's prompt is edited */
  onPromptChange: (variantId: string, newPrompt: string) => void
  /** Whether editing is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * PromptVariantsList - Container for displaying prompt variant cards
 * Uses PayloadCMS styling patterns
 * Memoized to prevent unnecessary re-renders
 */
function PromptVariantsListComponent({
  variants,
  onSelectionChange,
  onPromptChange,
  disabled = false,
  className = '',
}: PromptVariantsListProps) {
  // Memoize selected count calculation
  const selectedCount = useMemo(() => variants.filter((v) => v.isSelected).length, [variants])

  // Memoize select all handler
  const handleSelectAll = useCallback(() => {
    variants.forEach((v) => onSelectionChange(v.variantId, true))
  }, [variants, onSelectionChange])

  // Memoize deselect all handler
  const handleDeselectAll = useCallback(() => {
    variants.forEach((v) => onSelectionChange(v.variantId, false))
  }, [variants, onSelectionChange])

  if (variants.length === 0) {
    return null
  }

  return (
    <div className={className} style={{ marginTop: 'calc(var(--base) * 0.5)' }}>
      {/* Header with selection info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'calc(var(--base) * 0.5)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--base-body-size)',
            fontWeight: 500,
            color: 'var(--theme-text)',
          }}
        >
          Generated Variants
        </span>
        <span
          style={{
            fontSize: 'calc(var(--base-body-size) * 0.85)',
            color: 'var(--theme-elevation-500)',
          }}
        >
          {selectedCount} of {variants.length} selected
        </span>
      </div>

      {/* Select/Deselect all buttons */}
      <div style={{ display: 'flex', gap: 'calc(var(--base) * 0.5)', marginBottom: 'calc(var(--base) * 0.5)' }}>
        <Button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled || selectedCount === variants.length}
          buttonStyle="secondary"
          size="small"
        >
          Select All
        </Button>
        <Button
          type="button"
          onClick={handleDeselectAll}
          disabled={disabled || selectedCount === 0}
          buttonStyle="secondary"
          size="small"
        >
          Deselect All
        </Button>
      </div>

      {/* Variant cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--base) * 0.5)' }}>
        {variants.map((variant) => (
          <PromptVariantCard
            key={variant.variantId}
            variant={variant}
            isSelected={variant.isSelected}
            onSelectionChange={onSelectionChange}
            onPromptChange={onPromptChange}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Memoized PromptVariantsList to prevent unnecessary re-renders
 */
export const PromptVariantsList = memo(PromptVariantsListComponent)

export default PromptVariantsList
