'use client'

/**
 * ExtendButton Component
 *
 * A small button that triggers prompt optimization using PayloadCMS Button.
 * Shows "Optimize Prompt" label with a sparkle icon.
 * Follows PayloadCMS design language.
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@payloadcms/ui'

export interface ExtendButtonProps {
  /** Click handler for the button */
  onClick: () => void
  /** Whether the button is disabled */
  disabled?: boolean
  /** Whether the optimization is currently loading */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}


/**
 * ExtendButton - Small button that triggers prompt optimization
 * Uses PayloadCMS Button component for consistent styling
 */
export function ExtendButton({
  onClick,
  disabled = false,
  loading = false,
  className = '',
}: ExtendButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      buttonStyle="primary"
      size="small"
      icon={loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
      iconPosition="left"
      iconStyle="without-border"
      className={className}
      aria-label={loading ? 'Optimizing prompt...' : 'Optimize prompt'}
    >
      {loading ? 'Optimizing...' : 'Optimize Prompt'}
    </Button>
  )
}

export default ExtendButton
