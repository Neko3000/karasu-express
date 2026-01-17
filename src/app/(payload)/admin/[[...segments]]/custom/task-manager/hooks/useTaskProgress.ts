'use client'

/**
 * useTaskProgress Hook
 *
 * Custom hook for managing task list state with:
 * - 5-second polling interval (PROGRESS_POLL_INTERVAL = 5000ms)
 * - Visibility API integration (pause polling when tab hidden)
 * - Auto-refresh task list on status changes
 *
 * Phase 7 (User Story 4): Task Monitoring and Management
 * Task: T043o - Create useTaskProgress hook
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  TaskStatus,
  SubTaskStatus,
  PROGRESS_POLL_INTERVAL,
  type TaskFilters,
  type TaskSortOrder,
} from '@/lib/types'

// ============================================
// TYPES
// ============================================

export interface TaskListItem {
  id: string
  subject: string
  status: TaskStatus
  progress: number
  createdAt: string
  updatedAt: string
  totalExpected?: number
  models?: string[]
  importedStyleIds?: string[]
}

export interface SubTaskListItem {
  id: string
  status: SubTaskStatus
  styleId: string
  modelId: string
  batchIndex: number
  errorLog?: string
  errorCategory?: string
  retryCount: number
  startedAt?: string
  completedAt?: string
}

export interface TaskDetail {
  task: TaskListItem & {
    expandedPrompts?: Array<{
      variantId: string
      variantName: string
      originalPrompt: string
      expandedPrompt: string
      subjectSlug: string
    }>
    countPerPrompt?: number
    aspectRatio?: string
  }
  subTasks: SubTaskListItem[]
  statusCounts: {
    pending: number
    processing: number
    success: number
    failed: number
    cancelled: number
    total: number
  }
}

export interface UseTaskProgressState {
  tasks: TaskListItem[]
  totalDocs: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  isLoading: boolean
  error: string | null
  selectedTaskId: string | null
  selectedTaskDetail: TaskDetail | null
  isLoadingDetail: boolean
  filters: TaskFilters
  sortOrder: TaskSortOrder
}

export interface UseTaskProgressActions {
  fetchTasks: () => Promise<void>
  fetchTaskDetail: (taskId: string) => Promise<void>
  setFilters: (filters: TaskFilters) => void
  setSortOrder: (sortOrder: TaskSortOrder) => void
  setPage: (page: number) => void
  selectTask: (taskId: string | null) => void
  cancelTask: (taskId: string) => Promise<{ success: boolean; error?: string }>
  retrySubTask: (subTaskId: string) => Promise<{ success: boolean; error?: string }>
  clearError: () => void
}

export interface UseTaskProgressReturn extends UseTaskProgressState, UseTaskProgressActions {}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_LIMIT = 10

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useTaskProgress(): UseTaskProgressReturn {
  // State
  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPrevPage, setHasPrevPage] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [filters, setFilters] = useState<TaskFilters>({})
  const [sortOrder, setSortOrder] = useState<TaskSortOrder>('newest')

  // Refs for polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(true)

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Build query params
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', DEFAULT_LIMIT.toString())
      params.set('sort', sortOrder === 'newest' ? '-createdAt' : 'createdAt')

      if (filters.status && filters.status.length > 0) {
        params.set('status', filters.status.join(','))
      }
      if (filters.searchKeyword) {
        params.set('search', filters.searchKeyword)
      }
      if (filters.dateRange && filters.dateRange !== 'custom') {
        params.set('dateRange', filters.dateRange)
      }
      if (filters.startDate) {
        params.set('startDate', filters.startDate.toISOString())
      }
      if (filters.endDate) {
        params.set('endDate', filters.endDate.toISOString())
      }

      const response = await fetch(`/api/tasks?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`)
      }

      const data = await response.json()

      setTasks(data.docs || [])
      setTotalDocs(data.totalDocs || 0)
      setTotalPages(data.totalPages || 1)
      setHasNextPage(data.hasNextPage || false)
      setHasPrevPage(data.hasPrevPage || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setIsLoading(false)
    }
  }, [page, sortOrder, filters])

  // Fetch task detail
  const fetchTaskDetail = useCallback(async (taskId: string) => {
    setIsLoadingDetail(true)
    setError(null)

    try {
      // Fetch task
      const taskResponse = await fetch(`/api/tasks/${taskId}`)
      if (!taskResponse.ok) {
        throw new Error(`Failed to fetch task: ${taskResponse.statusText}`)
      }
      const task = await taskResponse.json()

      // Fetch sub-tasks
      const subTasksResponse = await fetch(`/api/sub-tasks?where[parentTask][equals]=${taskId}&limit=10000`)
      if (!subTasksResponse.ok) {
        throw new Error(`Failed to fetch sub-tasks: ${subTasksResponse.statusText}`)
      }
      const subTasksData = await subTasksResponse.json()

      // Calculate status counts
      const statusCounts = {
        pending: 0,
        processing: 0,
        success: 0,
        failed: 0,
        cancelled: 0,
        total: subTasksData.totalDocs || 0,
      }

      const subTasks = (subTasksData.docs || []).map((doc: SubTaskListItem) => {
        switch (doc.status) {
          case SubTaskStatus.Pending:
            statusCounts.pending++
            break
          case SubTaskStatus.Processing:
            statusCounts.processing++
            break
          case SubTaskStatus.Success:
            statusCounts.success++
            break
          case SubTaskStatus.Failed:
            statusCounts.failed++
            break
          case SubTaskStatus.Cancelled:
            statusCounts.cancelled++
            break
        }
        return doc
      })

      setSelectedTaskDetail({
        task,
        subTasks,
        statusCounts,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch task detail')
    } finally {
      setIsLoadingDetail(false)
    }
  }, [])

  // Cancel task
  const cancelTask = useCallback(async (taskId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        return { success: false, error: data.error || 'Failed to cancel task' }
      }

      // Refresh tasks and detail
      await fetchTasks()
      if (selectedTaskId === taskId) {
        await fetchTaskDetail(taskId)
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to cancel task' }
    }
  }, [fetchTasks, fetchTaskDetail, selectedTaskId])

  // Retry sub-task
  const retrySubTask = useCallback(async (subTaskId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/sub-tasks/${subTaskId}/retry`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        return { success: false, error: data.error || 'Failed to retry sub-task' }
      }

      // Refresh tasks and detail
      await fetchTasks()
      if (selectedTaskId) {
        await fetchTaskDetail(selectedTaskId)
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to retry sub-task' }
    }
  }, [fetchTasks, fetchTaskDetail, selectedTaskId])

  // Select task
  const selectTask = useCallback((taskId: string | null) => {
    setSelectedTaskId(taskId)
    if (taskId) {
      fetchTaskDetail(taskId)
    } else {
      setSelectedTaskDetail(null)
    }
  }, [fetchTaskDetail])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Visibility API handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden

      if (isVisibleRef.current) {
        // Tab became visible - fetch immediately and restart polling
        fetchTasks()
        if (selectedTaskId) {
          fetchTaskDetail(selectedTaskId)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchTasks, fetchTaskDetail, selectedTaskId])

  // Polling effect
  useEffect(() => {
    // Initial fetch
    fetchTasks()

    // Setup polling
    pollingIntervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        fetchTasks()
        if (selectedTaskId) {
          fetchTaskDetail(selectedTaskId)
        }
      }
    }, PROGRESS_POLL_INTERVAL)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [fetchTasks, fetchTaskDetail, selectedTaskId])

  // Refetch when filters or sort change
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    // State
    tasks,
    totalDocs,
    page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    isLoading,
    error,
    selectedTaskId,
    selectedTaskDetail,
    isLoadingDetail,
    filters,
    sortOrder,
    // Actions
    fetchTasks,
    fetchTaskDetail,
    setFilters,
    setSortOrder,
    setPage,
    selectTask,
    cancelTask,
    retrySubTask,
    clearError,
  }
}

export default useTaskProgress
