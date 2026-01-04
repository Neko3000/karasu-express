'use client'

/**
 * SectionDivider Component
 *
 * Custom PayloadCMS UI field component that renders section dividers
 * following Constitution Principle VII: Admin Panel UI Standards.
 *
 * Section Dividers Rules:
 * - Dividers MUST only appear between major sections (H2-level sections)
 * - Divider styling: border-t border-gray-200 dark:border-gray-700 with my-6 spacing
 * - Dividers MUST have equal spacing above and below
 */

import React from 'react'
import type { UIFieldClientComponent } from 'payload'

/**
 * SectionDivider - Renders a horizontal divider between major sections
 */
export const SectionDivider: UIFieldClientComponent = () => {
  return (
    <div
      style={{
        marginTop: '2.5rem',
        marginBottom: '2rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--theme-elevation-150)',
      }}
      aria-hidden="true"
    />
  )
}

export default SectionDivider
