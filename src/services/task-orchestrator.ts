/**
 * Task Orchestrator Service
 *
 * Handles task decomposition (fission) into sub-tasks.
 * Calculates the total number of sub-tasks and creates sub-task specifications.
 *
 * Per research.md Task Fission Algorithm:
 * Total = N_prompts * N_styles * N_models * batch_size
 */

import type { ExpandedPrompt } from '../lib/types'
import { BATCH_WARNING_THRESHOLD } from '../lib/types'

// ============================================
// TYPES
// ============================================

/**
 * Configuration for task decomposition
 */
export interface TaskConfig {
  /** Parent task ID */
  taskId: string
  /** Expanded prompt variants from LLM */
  expandedPrompts: ExpandedPrompt[]
  /** Selected style IDs */
  selectedStyles: string[]
  /** Selected model IDs */
  selectedModels: string[]
  /** Number of images per prompt/style/model combination */
  batchSize: number
  /** Whether to include base style (no modifications) */
  includeBaseStyle: boolean
}

/**
 * Input for fission calculation
 */
export interface FissionCalculationInput {
  promptCount: number
  styleCount: number
  modelCount: number
  batchSize: number
}

/**
 * Result of fission calculation
 */
export interface FissionResult {
  /** Total number of sub-tasks */
  total: number
  /** Breakdown of calculation */
  breakdown: {
    promptCount: number
    styleCount: number
    modelCount: number
    batchSize: number
  }
  /** Warning message if total exceeds threshold */
  warning?: string
}

/**
 * Specification for a single sub-task
 */
export interface SubTaskSpec {
  /** Parent task ID */
  taskId: string
  /** Expanded prompt variant */
  expandedPrompt: ExpandedPrompt
  /** Style ID to apply */
  styleId: string
  /** Model ID for generation */
  modelId: string
  /** Batch index (0-based) */
  batchIndex: number
}

// ============================================
// CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate the total number of sub-tasks from input parameters
 *
 * @param input - Calculation input parameters
 * @returns Total number of sub-tasks
 */
export function calculateTotalSubTasks(input: FissionCalculationInput): number {
  const { promptCount, styleCount, modelCount, batchSize } = input
  return promptCount * styleCount * modelCount * batchSize
}

/**
 * Calculate fission result with breakdown and warning
 *
 * @param config - Task configuration
 * @returns Fission result with total, breakdown, and optional warning
 */
export function calculateFission(config: TaskConfig): FissionResult {
  const {
    expandedPrompts,
    selectedStyles,
    selectedModels,
    batchSize,
    includeBaseStyle,
  } = config

  // Calculate effective style count
  // Add base style if requested and not already included
  const hasBaseStyle = selectedStyles.includes('base')
  const effectiveStyleCount = includeBaseStyle && !hasBaseStyle
    ? selectedStyles.length + 1
    : selectedStyles.length

  const promptCount = expandedPrompts.length
  const modelCount = selectedModels.length

  const total = calculateTotalSubTasks({
    promptCount,
    styleCount: effectiveStyleCount,
    modelCount,
    batchSize,
  })

  const result: FissionResult = {
    total,
    breakdown: {
      promptCount,
      styleCount: effectiveStyleCount,
      modelCount,
      batchSize,
    },
  }

  // Add warning if total exceeds threshold
  if (total > BATCH_WARNING_THRESHOLD) {
    result.warning = `Large batch: ${total} images will be generated. This may take significant time and resources. Consider reducing the batch size or selections.`
  }

  return result
}

// ============================================
// SUB-TASK GENERATION
// ============================================

/**
 * Create sub-task specifications from task configuration
 *
 * Generates the Cartesian product of:
 * (prompts × styles × models × batch indices)
 *
 * @param config - Task configuration
 * @returns Array of sub-task specifications
 */
export function createSubTaskSpecs(config: TaskConfig): SubTaskSpec[] {
  const {
    taskId,
    expandedPrompts,
    selectedStyles,
    selectedModels,
    batchSize,
    includeBaseStyle,
  } = config

  // Build effective styles list
  const hasBaseStyle = selectedStyles.includes('base')
  const effectiveStyles = includeBaseStyle && !hasBaseStyle
    ? ['base', ...selectedStyles]
    : selectedStyles

  const subTasks: SubTaskSpec[] = []

  // Generate Cartesian product
  for (const expandedPrompt of expandedPrompts) {
    for (const styleId of effectiveStyles) {
      for (const modelId of selectedModels) {
        for (let batchIndex = 0; batchIndex < batchSize; batchIndex++) {
          subTasks.push({
            taskId,
            expandedPrompt,
            styleId,
            modelId,
            batchIndex,
          })
        }
      }
    }
  }

  return subTasks
}

/**
 * Preview fission calculation without full task config
 *
 * Useful for UI preview before task creation
 *
 * @param input - Simplified calculation input
 * @param includeBaseStyle - Whether base style will be added
 * @returns Fission result
 */
export function previewFission(
  input: FissionCalculationInput,
  includeBaseStyle: boolean = true
): FissionResult {
  // Adjust style count for base style
  const effectiveStyleCount = includeBaseStyle
    ? input.styleCount + 1
    : input.styleCount

  const total = calculateTotalSubTasks({
    ...input,
    styleCount: effectiveStyleCount,
  })

  const result: FissionResult = {
    total,
    breakdown: {
      promptCount: input.promptCount,
      styleCount: effectiveStyleCount,
      modelCount: input.modelCount,
      batchSize: input.batchSize,
    },
  }

  if (total > BATCH_WARNING_THRESHOLD) {
    result.warning = `Large batch: ${total} images will be generated. This may take significant time and resources.`
  }

  return result
}
