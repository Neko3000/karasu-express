'use client'

/**
 * VariantCountSelector Component
 *
 * A dropdown selector for choosing the number of prompt variants to generate.
 * Options: 3 (default), 5, or 7 variants.
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
    <div className={`twp inline-flex items-center gap-2 ${className}`}>
      {label && (
        <label
          htmlFor="variant-count-selector"
          className="twp text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <select
        id="variant-count-selector"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={`
          twp px-3 py-1.5
          text-sm font-medium
          border rounded-md
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          border-gray-300 dark:border-gray-600
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'}
        `}
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
