'use client'

/**
 * TaskOverviewField Component
 *
 * Custom PayloadCMS UI field component that displays the task overview
 * on the Tasks collection creation/edit form.
 *
 * Shows:
 * - Selected models and aspect ratio
 * - Calculated prompts count (variants × styles)
 * - Total images calculation
 * - Warnings for high image counts
 *
 * Always visible and updates in real-time as form values change.
 *
 * Part of Phase 5: Optimize Task Creation Page
 */

import React, { useMemo } from 'react'
import { useFormFields } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import { getAllStyles } from '../../services/style-loader'

// ============================================
// CONSTANTS
// ============================================

const HIGH_IMAGE_COUNT_THRESHOLD = 500

const MODEL_DISPLAY_NAMES: Record<string, { name: string; provider: string }> = {
  'flux-pro': { name: 'Flux Pro', provider: 'fal' },
  'flux-dev': { name: 'Flux Dev', provider: 'fal' },
  'flux-schnell': { name: 'Flux Schnell', provider: 'fal' },
  'dalle-3': { name: 'DALL-E 3', provider: 'openai' },
  'nano-banana': { name: 'Nano Banana', provider: 'google' },
}

// ============================================
// COMPONENT
// ============================================

/**
 * TaskOverviewField - Custom UI field for PayloadCMS Tasks collection
 * Displays overview of task configuration with calculated counts
 */
export const TaskOverviewField: UIFieldClientComponent = () => {
  // Get form field values using useFormFields for reactive updates
  const fields = useFormFields(([fields]) => ({
    expandedPrompts: fields.expandedPrompts,
    importedStyleIds: fields.importedStyleIds,
    models: fields.models,
    countPerPrompt: fields.countPerPrompt,
    aspectRatio: fields.aspectRatio,
    variantCount: fields.variantCount,
    includeBaseStyle: fields.includeBaseStyle,
  }))

  // Calculate overview data
  const overview = useMemo(() => {
    // Get expanded prompts count (from generated prompts or default variantCount)
    const expandedPromptsArray = fields.expandedPrompts?.value as unknown[]
    const variantCountField = fields.variantCount?.value as number
    const variantCount = expandedPromptsArray?.length || variantCountField || 3

    // Get selected styles
    const importedStyleIds = (fields.importedStyleIds?.value as string[]) || ['base']
    const includeBaseStyle = fields.includeBaseStyle?.value as boolean ?? true

    // Check if base is already in selected styles
    const hasBaseStyle = importedStyleIds.includes('base')

    // Calculate effective style count
    let styleCount = importedStyleIds.length
    if (includeBaseStyle && !hasBaseStyle) {
      styleCount += 1
    }

    // Get selected models
    const selectedModels = (fields.models?.value as string[]) || []
    const modelCount = selectedModels.length

    // Get batch settings
    const countPerPrompt = (fields.countPerPrompt?.value as number) || 1
    const aspectRatio = (fields.aspectRatio?.value as string) || '1:1'

    // Calculate counts
    const calculatedPromptsCount = variantCount * styleCount
    const imagesPerModel = calculatedPromptsCount * countPerPrompt
    const totalImages = imagesPerModel * modelCount

    // Build formulas
    const vLabel = variantCount === 1 ? 'variant' : 'variants'
    const sLabel = styleCount === 1 ? 'style' : 'styles'
    const pLabel = calculatedPromptsCount === 1 ? 'prompt' : 'prompts'
    const mLabel = modelCount === 1 ? 'model' : 'models'
    const iLabel = totalImages === 1 ? 'image' : 'images'

    const promptsFormula = variantCount > 0 && styleCount > 0
      ? `${variantCount} ${vLabel} × ${styleCount} ${sLabel} = ${calculatedPromptsCount} ${pLabel}`
      : 'Configure variants and styles'

    const imageFormula = modelCount > 0 && calculatedPromptsCount > 0
      ? `${calculatedPromptsCount} prompts × ${countPerPrompt}/prompt × ${modelCount} ${mLabel} = ${totalImages} ${iLabel}`
      : 'Select models to calculate'

    // Get style names for display
    let styleNames: string[] = []
    try {
      const allStyles = getAllStyles()
      styleNames = importedStyleIds.map(id => {
        const style = allStyles.find(s => s.styleId === id)
        return style?.name || id
      })
      if (includeBaseStyle && !hasBaseStyle) {
        styleNames.unshift('Base')
      }
    } catch {
      styleNames = importedStyleIds
    }

    // Get model info
    const modelInfos = selectedModels.map(id => MODEL_DISPLAY_NAMES[id] || { name: id, provider: 'unknown' })
    const providers = [...new Set(modelInfos.map(m => m.provider))]

    // Check warnings
    const hasWarning = totalImages > HIGH_IMAGE_COUNT_THRESHOLD
    const warning = hasWarning
      ? `High image count: ${totalImages} images. This may take significant time and resources.`
      : null

    // API calls estimate
    const estimatedApiCalls = calculatedPromptsCount * modelCount * countPerPrompt

    return {
      variantCount,
      styleCount,
      styleNames,
      modelCount,
      modelInfos,
      providers,
      countPerPrompt,
      aspectRatio,
      calculatedPromptsCount,
      promptsFormula,
      imagesPerModel,
      totalImages,
      imageFormula,
      estimatedApiCalls,
      hasWarning,
      warning,
    }
  }, [fields])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--base) * 0.75)',
      }}
    >
      {/* Section Header */}
      <div>
        <h3
          style={{
            fontSize: 'calc(var(--base-body-size) * 1.1)',
            fontWeight: 600,
            color: 'var(--theme-text)',
            margin: 0,
            marginBottom: 'calc(var(--base) * 0.25)',
          }}
        >
          📊 Generation Overview
        </h3>
        <p
          style={{
            fontSize: 'calc(var(--base-body-size) * 0.85)',
            color: 'var(--theme-elevation-500)',
            margin: 0,
          }}
        >
          Summary of your task configuration and calculated output
        </p>
      </div>

      {/* Overview Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'calc(var(--base) * 0.5)',
        }}
      >
        {/* Settings Card */}
        <OverviewCard title="Settings">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <InfoRow label="Aspect Ratio" value={overview.aspectRatio} />
            <InfoRow label="Images/Prompt" value={overview.countPerPrompt.toString()} />
            <InfoRow
              label="Models"
              value={overview.modelCount > 0
                ? overview.modelInfos.map(m => m.name).join(', ')
                : 'None selected'
              }
            />
          </div>
        </OverviewCard>

        {/* Prompts Card */}
        <OverviewCard title="Calculated Prompts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <InfoRow label="Variants" value={overview.variantCount.toString()} />
            <InfoRow label="Styles" value={`${overview.styleCount} (${overview.styleNames.slice(0, 3).join(', ')}${overview.styleNames.length > 3 ? '...' : ''})`} />
            <div
              style={{
                marginTop: '8px',
                padding: '8px',
                backgroundColor: 'var(--theme-elevation-50)',
                borderRadius: 'var(--style-radius-s)',
                fontSize: 'calc(var(--base-body-size) * 0.85)',
                textAlign: 'center',
              }}
            >
              <div style={{ color: 'var(--theme-elevation-500)' }}>Formula</div>
              <div style={{ fontWeight: 600, color: 'var(--theme-text)' }}>
                {overview.promptsFormula}
              </div>
            </div>
          </div>
        </OverviewCard>

        {/* Total Images Card */}
        <OverviewCard
          title="Total Images"
          highlight={overview.hasWarning ? 'warning' : overview.totalImages > 0 ? 'success' : undefined}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                fontSize: 'calc(var(--base-body-size) * 2)',
                fontWeight: 700,
                textAlign: 'center',
                color: overview.hasWarning
                  ? 'var(--theme-warning-500)'
                  : overview.totalImages > 0
                    ? 'var(--theme-success-500)'
                    : 'var(--theme-elevation-400)',
              }}
            >
              {overview.totalImages}
            </div>
            <div
              style={{
                fontSize: 'calc(var(--base-body-size) * 0.8)',
                color: 'var(--theme-elevation-500)',
                textAlign: 'center',
              }}
            >
              {overview.imageFormula}
            </div>
            {overview.hasWarning && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: 'var(--theme-warning-50)',
                  border: '1px solid var(--theme-warning-200)',
                  borderRadius: 'var(--style-radius-s)',
                  fontSize: 'calc(var(--base-body-size) * 0.8)',
                  color: 'var(--theme-warning-600)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>⚠️</span>
                <span>{overview.warning}</span>
              </div>
            )}
          </div>
        </OverviewCard>

        {/* API Stats Card */}
        <OverviewCard title="API Summary">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <InfoRow label="API Calls" value={overview.estimatedApiCalls.toString()} />
            <InfoRow
              label="Providers"
              value={overview.providers.length > 0
                ? overview.providers.join(', ')
                : 'None'
              }
            />
            <InfoRow
              label="Per Model"
              value={`${overview.imagesPerModel} images`}
            />
          </div>
        </OverviewCard>
      </div>
    </div>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface OverviewCardProps {
  title: string
  children: React.ReactNode
  highlight?: 'success' | 'warning'
}

function OverviewCard({ title, children, highlight }: OverviewCardProps) {
  const borderColor = highlight === 'warning'
    ? 'var(--theme-warning-200)'
    : highlight === 'success'
      ? 'var(--theme-success-200)'
      : 'var(--theme-elevation-150)'

  const bgColor = highlight === 'warning'
    ? 'var(--theme-warning-50)'
    : highlight === 'success'
      ? 'var(--theme-success-50)'
      : 'var(--theme-elevation-50)'

  return (
    <div
      style={{
        padding: 'calc(var(--base) * 0.75)',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--style-radius-s)',
      }}
    >
      <div
        style={{
          fontSize: 'calc(var(--base-body-size) * 0.85)',
          fontWeight: 600,
          color: 'var(--theme-elevation-600)',
          marginBottom: 'calc(var(--base) * 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 'calc(var(--base-body-size) * 0.9)',
      }}
    >
      <span style={{ color: 'var(--theme-elevation-500)' }}>{label}</span>
      <span style={{ fontWeight: 500, color: 'var(--theme-text)' }}>{value}</span>
    </div>
  )
}

export default TaskOverviewField
