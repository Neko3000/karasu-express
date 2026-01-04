'use client'

/**
 * SectionHeader Component
 *
 * Custom PayloadCMS UI field component that renders section headers
 * following Constitution Principle VII: Admin Panel UI Standards.
 *
 * Heading Hierarchy:
 * - H1: text-2xl font-bold - Page title, main view header
 * - H2: text-xl font-semibold - Major section headers
 * - H3: text-lg font-medium - Subsection headers
 * - H4: text-base font-medium - Minor groupings, field group labels
 */

import React from 'react'
import type { UIFieldClientComponent } from 'payload'

interface SectionHeaderProps {
  heading?: string
  description?: string
  level?: 'h1' | 'h2' | 'h3' | 'h4'
}

const headingStyles: Record<string, React.CSSProperties> = {
  h1: {
    fontSize: '1.5rem', // text-2xl
    fontWeight: 700, // font-bold
    marginBottom: '1.5rem', // mb-6
  },
  h2: {
    fontSize: '1.25rem', // text-xl
    fontWeight: 600, // font-semibold
    marginBottom: '1rem', // mb-4
  },
  h3: {
    fontSize: '1.125rem', // text-lg
    fontWeight: 500, // font-medium
    marginBottom: '0.75rem', // mb-3
  },
  h4: {
    fontSize: '1rem', // text-base
    fontWeight: 500, // font-medium
    marginBottom: '0.5rem', // mb-2
  },
}

/**
 * Renders the heading element based on level
 */
function renderHeading(
  level: 'h1' | 'h2' | 'h3' | 'h4',
  heading: string,
  style: React.CSSProperties,
  description?: string
): React.ReactElement {
  const headingStyle: React.CSSProperties = {
    ...style,
    color: 'var(--theme-text)',
    margin: 0,
    marginBottom: description ? '0.25rem' : style.marginBottom,
  }

  switch (level) {
    case 'h1':
      return <h1 style={headingStyle}>{heading}</h1>
    case 'h3':
      return <h3 style={headingStyle}>{heading}</h3>
    case 'h4':
      return <h4 style={headingStyle}>{heading}</h4>
    case 'h2':
    default:
      return <h2 style={headingStyle}>{heading}</h2>
  }
}

/**
 * SectionHeader - Renders a section header with heading and optional description
 */
export const SectionHeader: UIFieldClientComponent = ({ field }) => {
  const custom = field?.admin?.custom as SectionHeaderProps | undefined
  const heading = custom?.heading || 'Section'
  const description = custom?.description
  const level = custom?.level || 'h2'

  const style = headingStyles[level] || headingStyles.h2

  return (
    <div style={{ marginTop: level === 'h1' ? 0 : '0.5rem' }}>
      {renderHeading(level, heading, style, description)}
      {description && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--theme-elevation-500)',
            margin: 0,
            marginBottom: style.marginBottom,
          }}
        >
          {description}
        </p>
      )}
    </div>
  )
}

export default SectionHeader
