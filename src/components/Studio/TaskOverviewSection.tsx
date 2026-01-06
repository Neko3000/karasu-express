'use client'

/**
 * TaskOverviewSection Component
 *
 * A summary panel displayed before Status & Progress section showing:
 * - Section title: "Overview"
 * - Subsections for each category of information (settings, counts, etc.)
 *
 * Integrates:
 * - SelectedSettingsSummary (models, aspect ratio, settings)
 * - PromptsCountSummary (variants × styles calculation)
 * - ImageCountSummary (total images with breakdown)
 * - TaskSummaryStats (API calls, providers, warnings)
 *
 * Part of Phase 5: Optimize Task Creation Page
 * Task: T038u - Create TaskOverviewSection component
 */

import React from 'react'
import {
  SelectedSettingsSummary,
  PromptsCountSummary,
  ImageCountSummary,
  TaskSummaryStats,
} from './Overview'
import type { TaskOverviewData } from './hooks/useTaskOverview'

// ============================================
// TYPES
// ============================================

export interface TaskOverviewSectionProps {
  /** Overview data from useTaskOverview hook */
  overview: TaskOverviewData
  /** Whether to show the section (only when there's data) */
  isVisible?: boolean
  /** Additional CSS classes */
  className?: string
}

// ============================================
// COMPONENT
// ============================================

/**
 * TaskOverviewSection - Summary panel for task creation page
 */
export function TaskOverviewSection({
  overview,
  isVisible = true,
  className = '',
}: TaskOverviewSectionProps) {
  // Don't render if not visible
  if (!isVisible) {
    return null
  }

  return (
    <div className={`twp ${className}`}>
      {/* Section Header */}
      <div className="twp mb-4">
        <h2 className="twp text-lg font-semibold text-gray-900 dark:text-gray-100">
          Overview
        </h2>
        <p className="twp text-sm text-gray-500 dark:text-gray-400 mt-1">
          Summary of your generation task configuration
        </p>
      </div>

      {/* Overview Grid */}
      <div
        className="
          twp grid gap-4
          grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
        "
      >
        {/* Settings Card */}
        <div className="twp rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <SelectedSettingsSummary
            selectedModels={overview.selectedModels}
            aspectRatio={overview.aspectRatio}
            countPerPrompt={overview.countPerPrompt}
          />
        </div>

        {/* Prompts Count Card */}
        <div className="twp rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <PromptsCountSummary
            variantCount={overview.variantCount}
            styleCount={overview.styleCount}
            calculatedPromptsCount={overview.calculatedPromptsCount}
            formulaDisplay={overview.promptsFormula}
          />
        </div>

        {/* Image Count Card */}
        <div
          className={`
            twp rounded-lg border p-4
            ${overview.hasWarning
              ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }
          `}
        >
          <ImageCountSummary
            imagesPerModel={overview.imagesPerModel}
            totalImages={overview.totalImages}
            imageFormula={overview.imageFormula}
            imageBreakdownPerModel={overview.imageBreakdownPerModel}
            hasWarning={overview.hasWarning}
          />
        </div>

        {/* Summary Stats Card */}
        <div className="twp rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <TaskSummaryStats
            estimatedApiCalls={overview.estimatedApiCalls}
            providersSummary={overview.providersSummary}
            warning={overview.warning}
          />
        </div>
      </div>
    </div>
  )
}

export default TaskOverviewSection
