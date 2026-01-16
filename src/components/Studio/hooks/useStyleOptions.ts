'use client'

/**
 * useStyleOptions Hook
 *
 * Fetches available styles from the database via the /api/studio/styles endpoint.
 * Manages loading state, error handling, and style data.
 *
 * Part of Phase 5: Imported Style Ids Field - DB Integration
 *
 * @example
 * ```tsx
 * const { styles, isLoading, error, refetch, defaultStyleId } = useStyleOptions()
 *
 * if (isLoading) return <Loading />
 * if (error) return <Error message={error} onRetry={refetch} />
 *
 * return <StyleSelector styles={styles} defaultStyleId={defaultStyleId} />
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ImportedStyle, StylesResponse } from '../../../lib/style-types'

/**
 * API response shape from /api/studio/styles
 */
interface StylesApiResponse extends StylesResponse {
  success: boolean
  error?: string
  message?: string
}

/**
 * Hook state shape
 */
export interface StyleOptionsState {
  /** Array of available styles from database */
  styles: ImportedStyle[]
  /** Whether styles are currently being fetched */
  isLoading: boolean
  /** Error message if fetch failed */
  error: string | null
  /** The default style ID (typically 'base') */
  defaultStyleId: string
  /** Total count of styles */
  totalCount: number
}

/**
 * Hook actions
 */
export interface StyleOptionsActions {
  /** Refetch styles from the API */
  refetch: () => Promise<void>
  /** Search styles by query */
  search: (query: string) => Promise<void>
  /** Clear search and show all styles */
  clearSearch: () => Promise<void>
  /** Get style by ID from current styles list */
  getStyleById: (styleId: string) => ImportedStyle | undefined
  /** Get multiple styles by IDs from current styles list */
  getStylesByIds: (styleIds: string[]) => ImportedStyle[]
}

/**
 * Hook return type
 */
export interface UseStyleOptionsResult extends StyleOptionsState, StyleOptionsActions {}

/**
 * Initial state
 */
const initialState: StyleOptionsState = {
  styles: [],
  isLoading: true,
  error: null,
  defaultStyleId: 'base',
  totalCount: 0,
}

/**
 * useStyleOptions - Hook for fetching and managing style options from database
 *
 * @param autoFetch - Whether to fetch styles on mount (default: true)
 * @returns Style data and actions
 */
export function useStyleOptions(autoFetch = true): UseStyleOptionsResult {
  const [state, setState] = useState<StyleOptionsState>(initialState)

  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null)

  // Track if component is mounted
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Fetch styles from API
   */
  const fetchStyles = useCallback(async (searchQuery?: string): Promise<void> => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Set loading state
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Build URL with optional search query
      const url = new URL('/api/studio/styles', window.location.origin)
      if (searchQuery) {
        url.searchParams.set('search', searchQuery)
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: abortController.signal,
      })

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch styles`)
      }

      const data: StylesApiResponse = await response.json()

      // Check if request was aborted (again, after async operation)
      if (abortController.signal.aborted || !isMountedRef.current) {
        return
      }

      if (!data.success) {
        throw new Error(data.message || data.error || 'Failed to load styles')
      }

      setState({
        styles: data.styles,
        isLoading: false,
        error: null,
        defaultStyleId: data.defaultStyleId,
        totalCount: data.count,
      })
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      // Don't update state if component unmounted
      if (!isMountedRef.current) {
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
    }
  }, [])

  /**
   * Refetch styles (no search query)
   */
  const refetch = useCallback(async () => {
    await fetchStyles()
  }, [fetchStyles])

  /**
   * Search styles by query
   */
  const search = useCallback(async (query: string) => {
    await fetchStyles(query)
  }, [fetchStyles])

  /**
   * Clear search and show all styles
   */
  const clearSearch = useCallback(async () => {
    await fetchStyles()
  }, [fetchStyles])

  /**
   * Get style by ID from current styles list
   */
  const getStyleById = useCallback(
    (styleId: string): ImportedStyle | undefined => {
      return state.styles.find((s) => s.styleId === styleId)
    },
    [state.styles]
  )

  /**
   * Get multiple styles by IDs from current styles list
   */
  const getStylesByIds = useCallback(
    (styleIds: string[]): ImportedStyle[] => {
      const styleIdSet = new Set(styleIds)
      return state.styles.filter((s) => styleIdSet.has(s.styleId))
    },
    [state.styles]
  )

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchStyles()
    }
  }, [autoFetch, fetchStyles])

  return {
    // State
    styles: state.styles,
    isLoading: state.isLoading,
    error: state.error,
    defaultStyleId: state.defaultStyleId,
    totalCount: state.totalCount,
    // Actions
    refetch,
    search,
    clearSearch,
    getStyleById,
    getStylesByIds,
  }
}

export default useStyleOptions
