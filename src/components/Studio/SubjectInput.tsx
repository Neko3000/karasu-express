'use client'

/**
 * SubjectInput Component
 *
 * A multi-line text input for entering the generation subject/theme.
 * Features:
 * - Multi-line textarea with auto-resize
 * - Character counter showing current/max length
 * - Placeholder text guiding the user
 * - PayloadCMS styling patterns
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
 * Uses PayloadCMS styling patterns
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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
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
    <div className={className}>
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          rows={2}
          style={{
            width: '100%',
            minHeight: '56px',
            maxHeight: '120px',
            padding: 'calc(var(--base) * 0.5)',
            fontSize: 'var(--base-body-size)',
            lineHeight: 1.4,
            border: `1px solid ${isOverLimit || isUnderMin ? 'var(--theme-error-400)' : 'var(--theme-elevation-150)'}`,
            borderRadius: 'var(--style-radius-s)',
            backgroundColor: disabled ? 'var(--theme-elevation-100)' : 'var(--theme-input-bg)',
            color: 'var(--theme-text)',
            resize: 'none',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
            transition: 'border-color 150ms',
          }}
        />
      </div>

      {/* Character counter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'calc(var(--base) * 0.25)',
          fontSize: 'calc(var(--base-body-size) * 0.8)',
        }}
      >
        <span
          style={{
            color: isUnderMin ? 'var(--theme-warning-500)' : 'var(--theme-elevation-500)',
            transition: 'color 150ms',
          }}
        >
          {isUnderMin && `Minimum ${MIN_SUBJECT_LENGTH} characters required`}
        </span>
        <span
          style={{
            color: isOverLimit
              ? 'var(--theme-error-500)'
              : characterCount > MAX_SUBJECT_LENGTH * 0.9
                ? 'var(--theme-warning-500)'
                : 'var(--theme-elevation-500)',
            fontWeight: isOverLimit ? 500 : 400,
            transition: 'color 150ms',
          }}
        >
          {characterCount}/{MAX_SUBJECT_LENGTH}
        </span>
      </div>
    </div>
  )
}

export default SubjectInput
