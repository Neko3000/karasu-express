'use client'

/**
 * Studio Component (index.tsx)
 *
 * Main container component for the AI Content Generation Studio.
 * Integrates prompt optimization components:
 * - SubjectInput for entering creative themes
 * - VariantCountSelector for choosing number of variants (3/5/7)
 * - ExtendButton to trigger prompt optimization
 * - PromptOptimizationSection as collapsible container
 * - OptimizationProgressBar for staged progress display
 * - PromptVariantsList to display and edit generated variants
 * - OptimizationErrorBanner for error handling with retry
 *
 * Phase 5 additions (Optimize Task Creation Page):
 * - TaskOverviewSection for summary of generation settings
 * - CalculatedPromptsSection for variant × style combinations
 * - TotalImageCount for image count display
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 * Extended in Phase 5: Optimize Task Creation Page
 */

import React, { useState, useMemo } from 'react'
import { SubjectInput, MIN_SUBJECT_LENGTH } from './SubjectInput'
import { VariantCountSelector } from './VariantCountSelector'
import { ExtendButton } from './ExtendButton'
import { PromptOptimizationSection } from './PromptOptimizationSection'
import { OptimizationProgressBar } from './OptimizationProgressBar'
import { PromptVariantsList } from './PromptVariantsList'
import { OptimizationErrorBanner } from './OptimizationErrorBanner'
import { usePromptExpansion } from './hooks/usePromptExpansion'
import { useCalculatedPrompts } from './hooks/useCalculatedPrompts'
import { useTaskOverview, type ModelInfo, type BatchConfig } from './hooks/useTaskOverview'
import { TaskOverviewSection } from './TaskOverviewSection'
import { CalculatedPromptsSection } from './CalculatedPromptsSection'
import { TotalImageCount } from './TotalImageCount'
import { getDefaultStyle, getAllStyles } from '../../services/style-loader'
import type { MergeableStyle } from '../../services/style-merger'

export interface StudioProps {
  /** Additional CSS classes */
  className?: string
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

/**
 * Default batch configuration
 */
const DEFAULT_BATCH_CONFIG: BatchConfig = {
  countPerPrompt: 1,
  aspectRatio: '1:1',
}

/**
 * Default model configurations (for demonstration)
 * In a real implementation, these would come from the ModelConfigs collection
 */
const DEFAULT_MODELS: ModelInfo[] = [
  { modelId: 'flux-pro', displayName: 'Flux Pro', provider: 'fal' },
]

/**
 * Studio - Main AI Content Generation Studio Component
 */
export function Studio({ className = '' }: StudioProps) {
  const [state, actions] = usePromptExpansion()

  // Phase 5: State for styles, models, and batch config
  // These would typically come from form inputs in a full implementation
  // Note: setters are defined for future integration with form controls
  const [selectedStyleIds, _setSelectedStyleIds] = useState<string[]>(['base'])
  const [selectedModels, _setSelectedModels] = useState<ModelInfo[]>(DEFAULT_MODELS)
  const [batchConfig, _setBatchConfig] = useState<BatchConfig>(DEFAULT_BATCH_CONFIG)
  // Future: Expose setters when StyleSelector, ModelSelector, BatchConfig components are integrated
  void _setSelectedStyleIds
  void _setSelectedModels
  void _setBatchConfig

  // Get selected styles as MergeableStyle objects
  const selectedStyles = useMemo<MergeableStyle[]>(() => {
    try {
      const allStyles = getAllStyles()
      return allStyles.filter((s) => selectedStyleIds.includes(s.styleId))
    } catch {
      // If style loader fails (e.g., in SSR), return default style
      const defaultStyle = getDefaultStyle()
      return selectedStyleIds.includes(defaultStyle.styleId) ? [defaultStyle] : []
    }
  }, [selectedStyleIds])

  // Get selected variants (those with isSelected = true)
  const selectedVariants = useMemo(() => {
    return state.variants.filter((v) => v.isSelected)
  }, [state.variants])

  // Phase 5: Calculate prompts using the hook
  const { prompts: calculatedPrompts, summary: promptsSummary } = useCalculatedPrompts(
    selectedVariants,
    selectedStyles
  )

  // Phase 5: Calculate overview data using the hook
  const overviewData = useTaskOverview({
    variants: state.variants,
    selectedStyles,
    selectedModels,
    batchConfig,
  })

  const isLoading = state.stage === 'analyzing' || state.stage === 'enhancing' || state.stage === 'formatting'
  const canExtend = state.subject.trim().length >= MIN_SUBJECT_LENGTH && !isLoading
  const showProgress = state.stage !== 'idle' && state.stage !== 'complete' && state.stage !== 'error'
  const showVariants = state.stage === 'complete' && state.variants.length > 0
  const showError = state.stage === 'error' && state.error

  return (
    <div className={`twp max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="twp mb-6">
        <h1 className="twp text-2xl font-bold text-gray-900 dark:text-gray-100">
          AI Content Studio
        </h1>
        <p className="twp mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter a creative theme and let AI generate optimized prompts for image generation.
        </p>
      </div>

      {/* Subject Input Section */}
      <div className="twp mb-4">
        <label className="twp block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Creative Theme
        </label>
        <SubjectInput
          value={state.subject}
          onChange={actions.setSubject}
          disabled={isLoading}
        />
      </div>

      {/* Controls Row */}
      <div className="twp flex items-center justify-between gap-4 mb-4">
        <VariantCountSelector
          value={state.variantCount}
          onChange={actions.setVariantCount}
          disabled={isLoading}
        />

        <ExtendButton
          onClick={actions.expand}
          disabled={!canExtend}
          loading={isLoading}
        />
      </div>

      {/* Collapsible Optimization Section */}
      <PromptOptimizationSection isOpen={state.isOpen}>
        {/* Progress Bar */}
        {showProgress && (
          <OptimizationProgressBar
            stage={state.stage}
            className="twp mb-4"
          />
        )}

        {/* Error Banner */}
        {showError && (
          <OptimizationErrorBanner
            message={state.error!}
            onRetry={actions.retry}
            retrying={isLoading}
            className="twp mb-4"
          />
        )}

        {/* Variants List */}
        {showVariants && (
          <>
            {/* Completion Progress Bar */}
            <OptimizationProgressBar
              stage={state.stage}
              className="twp mb-4"
            />

            <PromptVariantsList
              variants={state.variants}
              onSelectionChange={actions.toggleSelection}
              onPromptChange={actions.updatePrompt}
              disabled={isLoading}
            />

            {/* Phase 5: Calculated Prompts Section */}
            {selectedStyles.length > 0 && selectedVariants.length > 0 && (
              <div className="twp mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <CalculatedPromptsSection
                  prompts={calculatedPrompts}
                  summary={promptsSummary}
                />
              </div>
            )}

            {/* Phase 5: Total Image Count */}
            <div className="twp mt-6">
              <TotalImageCount
                calculatedPromptsCount={promptsSummary.totalPrompts}
                countPerPrompt={batchConfig.countPerPrompt}
                modelCount={selectedModels.length}
                warning={overviewData.warning}
              />
            </div>

            {/* Action buttons for next steps */}
            <div className="twp flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="twp text-sm text-gray-500 dark:text-gray-400">
                {state.variants.filter((v) => v.isSelected).length} variant(s) selected
              </div>

              <div className="twp flex gap-3">
                <button
                  type="button"
                  onClick={actions.reset}
                  className="twp px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  Reset
                </button>

                <button
                  type="button"
                  disabled={state.variants.filter((v) => v.isSelected).length === 0}
                  className={`
                    twp px-4 py-2 text-sm font-medium rounded-lg
                    transition-colors duration-200
                    ${
                      state.variants.filter((v) => v.isSelected).length === 0
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }
                  `}
                >
                  Continue to Generation
                </button>
              </div>
            </div>
          </>
        )}
      </PromptOptimizationSection>

      {/* Phase 5: Task Overview Section - Always visible with current selections */}
      <div className="twp mt-8">
        <TaskOverviewSection
          overview={overviewData}
          isVisible={true}
        />
      </div>
    </div>
  )
}

// Export all components for individual use
export { SubjectInput } from './SubjectInput'
export { VariantCountSelector } from './VariantCountSelector'
export { ExtendButton } from './ExtendButton'
export { PromptOptimizationSection } from './PromptOptimizationSection'
export { OptimizationProgressBar } from './OptimizationProgressBar'
export { PromptVariantCard } from './PromptVariantCard'
export { PromptVariantsList } from './PromptVariantsList'
export { OptimizationErrorBanner } from './OptimizationErrorBanner'
export { PromptOptimizerField } from './PromptOptimizerField'
export { usePromptExpansion } from './hooks/usePromptExpansion'

// Phase 5 component exports
export { CalculatedPromptCard } from './CalculatedPromptCard'
export { CalculatedPromptsSection } from './CalculatedPromptsSection'
export { TotalImageCount } from './TotalImageCount'
export { TaskOverviewSection } from './TaskOverviewSection'
export { TaskOverviewField } from './TaskOverviewField'
export { useCalculatedPrompts } from './hooks/useCalculatedPrompts'
export { useTaskOverview } from './hooks/useTaskOverview'
export * from './Overview'

// Type exports
export type { SubjectInputProps } from './SubjectInput'
export type { VariantCountSelectorProps, VariantCount } from './VariantCountSelector'
export type { ExtendButtonProps } from './ExtendButton'
export type { PromptOptimizationSectionProps } from './PromptOptimizationSection'
export type { OptimizationProgressBarProps, OptimizationStage } from './OptimizationProgressBar'
export type { PromptVariantCardProps, PromptVariant } from './PromptVariantCard'
export type { PromptVariantsListProps, VariantWithSelection } from './PromptVariantsList'
export type { OptimizationErrorBannerProps } from './OptimizationErrorBanner'
export type { PromptExpansionState, PromptExpansionActions } from './hooks/usePromptExpansion'

// Phase 5 type exports
export type { CalculatedPromptCardProps } from './CalculatedPromptCard'
export type { CalculatedPromptsSectionProps } from './CalculatedPromptsSection'
export type { TotalImageCountProps } from './TotalImageCount'
export type { TaskOverviewSectionProps } from './TaskOverviewSection'
export type {
  CalculatedPrompt,
  CalculatedPromptsSummary,
  UseCalculatedPromptsResult,
} from './hooks/useCalculatedPrompts'
export type {
  ModelInfo,
  BatchConfig,
  TaskOverviewData,
  UseTaskOverviewParams,
} from './hooks/useTaskOverview'

export default Studio
