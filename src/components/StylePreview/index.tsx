'use client'

/**
 * StylePreview Component
 *
 * Admin custom component for style templates that displays a preview
 * of how a sample prompt will be merged with the style template.
 *
 * Shows:
 * - Sample input prompt
 * - Merged positive prompt result
 * - Negative prompt (if defined)
 *
 * Per Phase 6 - Style Configuration and Management
 */

import React, { useMemo } from 'react'
import type { UIFieldClientComponent } from 'payload'
import { useFormFields } from '@payloadcms/ui'

// ============================================
// CONSTANTS
// ============================================

const SAMPLE_PROMPT = 'a majestic dragon flying over a mountain'

// ============================================
// STYLE MERGER (inline for component)
// ============================================

/**
 * Merge a prompt with a style template
 */
function mergePromptWithStyle(prompt: string, positiveTemplate: string): string {
  if (!positiveTemplate) {
    return prompt
  }
  return positiveTemplate.replace('{prompt}', prompt)
}

// ============================================
// STYLES
// ============================================

const containerStyle: React.CSSProperties = {
  marginTop: '1rem',
  padding: '1rem',
  backgroundColor: 'var(--theme-elevation-50)',
  borderRadius: '8px',
  border: '1px solid var(--theme-elevation-150)',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--theme-elevation-600)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.25rem',
}

const valueStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--theme-text)',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  backgroundColor: 'var(--theme-elevation-100)',
  padding: '0.5rem',
  borderRadius: '4px',
  marginBottom: '0.75rem',
}

const samplePromptStyle: React.CSSProperties = {
  ...valueStyle,
  backgroundColor: 'var(--theme-elevation-200)',
  fontStyle: 'italic',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--theme-text)',
  marginBottom: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const dividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'var(--theme-elevation-200)',
  margin: '1rem 0',
}

const noPromptStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--theme-elevation-400)',
  fontStyle: 'italic',
}

// ============================================
// COMPONENT
// ============================================

/**
 * StylePreview - Displays a preview of merged prompt output
 *
 * This component reads the current form values for positivePrompt
 * and negativePrompt, then shows how a sample prompt would be merged.
 */
export const StylePreview: UIFieldClientComponent = () => {
  // Get form field values
  const positivePromptField = useFormFields(([fields]) => fields.positivePrompt)
  const negativePromptField = useFormFields(([fields]) => fields.negativePrompt)

  const positivePrompt = (positivePromptField?.value as string) || ''
  const negativePrompt = (negativePromptField?.value as string) || ''

  // Calculate merged prompt
  const mergedPrompt = useMemo(() => {
    if (!positivePrompt || !positivePrompt.includes('{prompt}')) {
      return null
    }
    return mergePromptWithStyle(SAMPLE_PROMPT, positivePrompt)
  }, [positivePrompt])

  // Check if template is valid
  const hasValidTemplate = positivePrompt && positivePrompt.includes('{prompt}')

  return (
    <div style={containerStyle}>
      <div style={sectionTitleStyle}>
        <span role="img" aria-label="preview">👁️</span>
        Prompt Preview
      </div>

      {/* Sample Input */}
      <div style={labelStyle}>Sample Input Prompt</div>
      <div style={samplePromptStyle}>{SAMPLE_PROMPT}</div>

      <div style={dividerStyle} />

      {/* Merged Output */}
      <div style={labelStyle}>Merged Positive Prompt</div>
      {hasValidTemplate ? (
        <div style={valueStyle}>{mergedPrompt}</div>
      ) : (
        <div style={noPromptStyle}>
          Enter a positive prompt template with {'{prompt}'} placeholder to see preview
        </div>
      )}

      {/* Negative Prompt */}
      {negativePrompt && (
        <>
          <div style={labelStyle}>Negative Prompt</div>
          <div style={{ ...valueStyle, backgroundColor: 'var(--theme-error-50)' }}>
            {negativePrompt}
          </div>
        </>
      )}

      {/* Help text */}
      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--theme-elevation-500)',
          marginTop: '0.5rem',
        }}
      >
        The {'{prompt}'} placeholder will be replaced with the user&apos;s input during generation.
      </div>
    </div>
  )
}

export default StylePreview
