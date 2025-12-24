'use client'

/**
 * VariantCountSelector Component
 *
 * A dropdown selector for choosing the number of prompt variants to generate.
 * Options: 3 (default), 5, or 7 variants.
 * Uses PayloadCMS styling patterns.
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React, { useCallback } from 'react'

/**
 * Available variant count options
 */
export const VARIANT_COUNT_OPTIONS = [3, 5, 7] as const

/**
 * Default variant count
 */
export const DEFAULT_VARIANT_COUNT = 3

export type VariantCount = (typeof VARIANT_COUNT_OPTIONS)[number]

export interface VariantCountSelectorProps {
  /** Currently selected variant count */
  value: VariantCount
  /** Callback when variant count changes */
  onChange: (count: VariantCount) => void
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
  /** Label text to display */
  label?: string
}

/**
 * VariantCountSelector - Dropdown for selecting variant count
 * Uses PayloadCMS styling patterns
 */
export function VariantCountSelector({
  value,
  onChange,
  disabled = false,
  className = '',
  label = 'Variants',
}: VariantCountSelectorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = parseInt(e.target.value, 10) as VariantCount
      onChange(newValue)
    },
    [onChange]
  )

  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--base) * 0.4)' }}>
      {label && (
        <label
          htmlFor="variant-count-selector"
          style={{
            fontSize: 'var(--base-body-size)',
            fontWeight: 500,
            color: 'var(--theme-text)',
          }}
        >
          {label}
        </label>
      )}
      <select
        id="variant-count-selector"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        style={{
          padding: 'calc(var(--base) * 0.3) calc(var(--base) * 0.5)',
          fontSize: 'var(--base-body-size)',
          fontWeight: 500,
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 'var(--style-radius-s)',
          backgroundColor: disabled ? 'var(--theme-elevation-100)' : 'var(--theme-input-bg)',
          color: 'var(--theme-text)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color 150ms',
        }}
        aria-label="Number of prompt variants to generate"
      >
        {VARIANT_COUNT_OPTIONS.map((count) => (
          <option key={count} value={count}>
            {count} {count === DEFAULT_VARIANT_COUNT && '(Default)'}
          </option>
        ))}
      </select>
    </div>
  )
}

export default VariantCountSelector
