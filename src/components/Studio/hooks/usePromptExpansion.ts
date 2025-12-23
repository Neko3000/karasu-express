'use client'

/**
 * usePromptExpansion Hook
 *
 * State management hook for prompt expansion workflow. Manages:
 * - Subject input state
 * - Variant count selection (3/5/7)
 * - Collapsible section open/closed state
 * - Progress stage tracking (idle/analyzing/enhancing/formatting/complete/error)
 * - Generated variants array with selection state
 * - User modifications to generated prompts
 * - Error state and retry logic
 *
 * Part of Phase 4: User Story 2 - Intelligent Prompt Optimization
 */

import { useState, useCallback, useRef } from 'react'
import type { OptimizationStage } from '../OptimizationProgressBar'
import type { VariantWithSelection } from '../PromptVariantsList'
import type { PromptVariant } from '../PromptVariantCard'
import { DEFAULT_VARIANT_COUNT, type VariantCount } from '../VariantCountSelector'

/**
 * API response shape from /api/studio/expand-prompt
 */
interface ExpandPromptResponse {
  success: boolean
  data?: {
    variants: PromptVariant[]
    subjectSlug: string
    searchContext?: string
  }
  error?: string
  message?: string
}

/**
 * Hook state shape
 */
export interface PromptExpansionState {
  /** Current subject input value */
  subject: string
  /** Number of variants to generate */
  variantCount: VariantCount
  /** Whether the collapsible section is open */
  isOpen: boolean
  /** Current optimization stage */
  stage: OptimizationStage
  /** Generated variants with selection state */
  variants: VariantWithSelection[]
  /** Subject slug for file naming */
  subjectSlug: string
  /** Search context if web search was enabled */
  searchContext?: string
  /** Error message if optimization failed */
  error: string | null
}

/**
 * Hook actions
 */
export interface PromptExpansionActions {
  /** Update the subject input value */
  setSubject: (subject: string) => void
  /** Update the variant count */
  setVariantCount: (count: VariantCount) => void
  /** Start prompt expansion (calls API) */
  expand: () => Promise<void>
  /** Retry after error */
  retry: () => Promise<void>
  /** Toggle variant selection */
  toggleSelection: (variantId: string, selected: boolean) => void
  /** Update a variant's prompt text */
  updatePrompt: (variantId: string, newPrompt: string) => void
  /** Reset to initial state */
  reset: () => void
  /** Close the collapsible section */
  close: () => void
}

/**
 * Initial state
 */
const initialState: PromptExpansionState = {
  subject: '',
  variantCount: DEFAULT_VARIANT_COUNT,
  isOpen: false,
  stage: 'idle',
  variants: [],
  subjectSlug: '',
  searchContext: undefined,
  error: null,
}

/**
 * Simulate stage progression delays (ms)
 * Creates a visual indication of the optimization process
 */
const STAGE_DELAYS = {
  analyzing: 500,
  enhancing: 1000,
  formatting: 500,
}

/**
 * usePromptExpansion - Hook for managing prompt expansion workflow
 */
export function usePromptExpansion(): [PromptExpansionState, PromptExpansionActions] {
  const [state, setState] = useState<PromptExpansionState>(initialState)

  // Track user edits to prompts (persisted across re-renders)
  const editedPromptsRef = useRef<Map<string, string>>(new Map())

  /**
   * Set subject input
   */
  const setSubject = useCallback((subject: string) => {
    setState((prev) => ({ ...prev, subject }))
  }, [])

  /**
   * Set variant count
   */
  const setVariantCount = useCallback((variantCount: VariantCount) => {
    setState((prev) => ({ ...prev, variantCount }))
  }, [])

  /**
   * Close the collapsible section
   */
  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    editedPromptsRef.current.clear()
    setState(initialState)
  }, [])

  /**
   * Toggle variant selection
   */
  const toggleSelection = useCallback((variantId: string, selected: boolean) => {
    setState((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        v.variantId === variantId ? { ...v, isSelected: selected } : v
      ),
    }))
  }, [])

  /**
   * Update a variant's prompt text (with edit persistence)
   */
  const updatePrompt = useCallback((variantId: string, newPrompt: string) => {
    // Store the edit for persistence
    editedPromptsRef.current.set(variantId, newPrompt)

    setState((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        v.variantId === variantId ? { ...v, expandedPrompt: newPrompt } : v
      ),
    }))
  }, [])

  /**
   * Simulate stage progression with delays
   */
  const simulateStages = useCallback(async (): Promise<void> => {
    // Analyzing stage
    setState((prev) => ({ ...prev, stage: 'analyzing' }))
    await new Promise((resolve) => setTimeout(resolve, STAGE_DELAYS.analyzing))

    // Enhancing stage
    setState((prev) => ({ ...prev, stage: 'enhancing' }))
    await new Promise((resolve) => setTimeout(resolve, STAGE_DELAYS.enhancing))

    // Formatting stage
    setState((prev) => ({ ...prev, stage: 'formatting' }))
    await new Promise((resolve) => setTimeout(resolve, STAGE_DELAYS.formatting))
  }, [])

  /**
   * Call the expand-prompt API
   */
  const callExpandApi = useCallback(
    async (subject: string, variantCount: VariantCount): Promise<ExpandPromptResponse> => {
      const response = await fetch('/api/studio/expand-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          variantCount,
          webSearchEnabled: false,
        }),
      })

      return response.json()
    },
    []
  )

  /**
   * Start prompt expansion
   */
  const expand = useCallback(async () => {
    const { subject, variantCount } = state

    // Validate subject
    if (!subject.trim() || subject.trim().length < 2) {
      setState((prev) => ({
        ...prev,
        isOpen: true,
        stage: 'error',
        error: 'Please enter a subject with at least 2 characters',
      }))
      return
    }

    // Open section and start stages
    setState((prev) => ({
      ...prev,
      isOpen: true,
      stage: 'analyzing',
      error: null,
      variants: [],
    }))

    try {
      // Start stage simulation and API call in parallel
      const [, apiResponse] = await Promise.all([
        simulateStages(),
        callExpandApi(subject.trim(), variantCount),
      ])

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.message || apiResponse.error || 'Failed to expand prompt')
      }

      // Map variants to include selection state
      // Apply any preserved edits from previous runs
      const variantsWithSelection: VariantWithSelection[] = apiResponse.data.variants.map(
        (variant) => ({
          ...variant,
          // Restore any user edits
          expandedPrompt: editedPromptsRef.current.get(variant.variantId) ?? variant.expandedPrompt,
          isSelected: true, // Select all by default
        })
      )

      setState((prev) => ({
        ...prev,
        stage: 'complete',
        variants: variantsWithSelection,
        subjectSlug: apiResponse.data!.subjectSlug,
        searchContext: apiResponse.data!.searchContext,
        error: null,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setState((prev) => ({
        ...prev,
        stage: 'error',
        error: errorMessage,
      }))
    }
  }, [state, simulateStages, callExpandApi])

  /**
   * Retry after error
   */
  const retry = useCallback(async () => {
    await expand()
  }, [expand])

  return [
    state,
    {
      setSubject,
      setVariantCount,
      expand,
      retry,
      toggleSelection,
      updatePrompt,
      reset,
      close,
    },
  ]
}

export default usePromptExpansion
