'use client'

/**
 * PromptOptimizationSection Component
 *
 * A collapsible container that expands below the SubjectInput when
 * the ExtendButton is clicked. Shows optimization progress and results.
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import React from 'react'

export interface PromptOptimizationSectionProps {
  /** Whether the section is expanded/open */
  isOpen: boolean
  /** Children components to render inside */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * PromptOptimizationSection - Collapsible container for optimization results
 */
export function PromptOptimizationSection({
  isOpen,
  children,
  className = '',
}: PromptOptimizationSectionProps) {
  return (
    <div
      className={`
        twp overflow-hidden transition-all duration-300 ease-in-out
        ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
        ${className}
      `}
      aria-hidden={!isOpen}
    >
      <div
        className={`
          twp mt-4 p-4
          border rounded-lg
          bg-gray-50 dark:bg-gray-800/50
          border-gray-200 dark:border-gray-700
        `}
      >
        {children}
      </div>
    </div>
  )
}

export default PromptOptimizationSection
