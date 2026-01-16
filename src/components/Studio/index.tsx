/**
 * Studio Components Barrel File
 *
 * Re-exports individual Studio components for use in PayloadCMS admin.
 * The main Studio component has been removed - individual components
 * are now integrated directly into the Tasks collection UI.
 */

// Core components
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
export { useStyleOptions } from './hooks/useStyleOptions'
export { StyleSelectorField } from './StyleSelectorField'

// Phase 5 component exports
export { CalculatedPromptCard } from './CalculatedPromptCard'
export { CalculatedPromptsSection } from './CalculatedPromptsSection'
export { TotalImageCount } from './TotalImageCount'
export { TaskOverviewField } from './TaskOverviewField'
export { useCalculatedPrompts } from './hooks/useCalculatedPrompts'

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
export type {
  StyleOptionsState,
  StyleOptionsActions,
  UseStyleOptionsResult,
} from './hooks/useStyleOptions'

// Phase 5 type exports
export type { CalculatedPromptCardProps } from './CalculatedPromptCard'
export type { CalculatedPromptsSectionProps } from './CalculatedPromptsSection'
export type { TotalImageCountProps } from './TotalImageCount'
export type {
  CalculatedPrompt,
  CalculatedPromptsSummary,
  UseCalculatedPromptsResult,
} from './hooks/useCalculatedPrompts'
