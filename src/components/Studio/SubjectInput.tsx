'use client'

/**
 * SubjectInput Component
 *
 * A multi-line text input for entering the generation subject/theme.
 * Features:
 * - Multi-line textarea with auto-resize
 * - Character counter showing current/max length
 * - Placeholder text guiding the user
 * - TailwindCSS styling with `.twp` scope
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React, { useCallback, useRef, useEffect } from 'react'

/**
 * Maximum character length for subject input
 */
export const MAX_SUBJECT_LENGTH = 1000

/**
 * Minimum character length for subject input
 */
export const MIN_SUBJECT_LENGTH = 2

export interface SubjectInputProps {
  /** Current value of the input */
  value: string
  /** Callback when value changes */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
  /** Aria label for accessibility */
  'aria-label'?: string
}

/**
 * SubjectInput - Multi-line text input with character counter
 */
export function SubjectInput({
  value,
  onChange,
  placeholder = 'Enter your creative theme or subject (e.g., "a cat sitting on a windowsill at sunset")',
  disabled = false,
  className = '',
  'aria-label': ariaLabel = 'Subject input',
}: SubjectInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea to fit content
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  // Adjust height when value changes
  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      // Enforce max length
      if (newValue.length <= MAX_SUBJECT_LENGTH) {
        onChange(newValue)
      }
    },
    [onChange]
  )

  const characterCount = value.length
  const isOverLimit = characterCount > MAX_SUBJECT_LENGTH
  const isUnderMin = characterCount > 0 && characterCount < MIN_SUBJECT_LENGTH

  return (
    <div className={`twp ${className}`}>
      <div className="twp relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          rows={3}
          className={`
            twp w-full min-h-[80px] max-h-[200px] p-3
            text-sm leading-relaxed
            border rounded-lg resize-none
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-1
            ${
              isOverLimit || isUnderMin
                ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}
          `}
        />
      </div>

      {/* Character counter */}
      <div className="twp flex justify-between items-center mt-1 text-xs">
        <span
          className={`
            twp transition-colors duration-200
            ${isUnderMin ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}
          `}
        >
          {isUnderMin && `Minimum ${MIN_SUBJECT_LENGTH} characters required`}
        </span>
        <span
          className={`
            twp transition-colors duration-200
            ${
              isOverLimit
                ? 'text-red-600 dark:text-red-400 font-medium'
                : characterCount > MAX_SUBJECT_LENGTH * 0.9
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 dark:text-gray-400'
            }
          `}
        >
          {characterCount}/{MAX_SUBJECT_LENGTH}
        </span>
      </div>
    </div>
  )
}

export default SubjectInput
