/**
 * Task Manager Service
 *
 * Provides filtering, sorting, and search functionality for the Task Manager UI.
 * Phase 7 (User Story 4): Task Monitoring and Management
 *
 * Per plan.md and data-model.md specifications.
 */

import type { BasePayload, Where } from 'payload'
import {
  TaskStatus,
  SubTaskStatus,
  type TaskFilters,
  type TaskSortOrder,
  type DateRangeOption,
} from '../lib/types'

/**
 * Pagination options for task queries
 */
export interface PaginationOptions {
  page?: number
  limit?: number
}

/**
 * Result of a task list query
 */
export interface TaskListResult {
  docs: Array<{
    id: string
    subject: string
    status: TaskStatus
    progress: number
    createdAt: string
    updatedAt: string
    totalExpected?: number
    models?: string[]
    importedStyleIds?: string[]
  }>
  totalDocs: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/**
 * Result of a task with sub-tasks query
 */
export interface TaskWithSubTasksResult {
  task: {
    id: string
    subject: string
    status: TaskStatus
    progress: number
    createdAt: string
    updatedAt: string
    totalExpected?: number
    models?: string[]
    importedStyleIds?: string[]
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
  subTasks: Array<{
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
  }>
  statusCounts: {
    pending: number
    processing: number
    success: number
    failed: number
    cancelled: number
    total: number
  }
}

/**
 * Calculate start date for a date range option
 */
export function getDateRangeStartDate(dateRange: DateRangeOption): Date {
  const now = new Date()

  switch (dateRange) {
    case 'today':
      // Start of today (midnight)
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case '7days':
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return sevenDaysAgo
    case '30days':
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return thirtyDaysAgo
    case 'custom':
      // Custom range - return epoch start as fallback
      return new Date(0)
    default:
      return new Date(0)
  }
}

/**
 * Build MongoDB query from TaskFilters
 */
export function buildTaskQuery(filters: TaskFilters): Where {
  const query: Where = {}
  const andConditions: Where[] = []

  // Filter by status (multiple statuses allowed)
  if (filters.status && filters.status.length > 0) {
    andConditions.push({
      status: {
        in: filters.status,
      },
    })
  }

  // Filter by date range
  if (filters.dateRange && filters.dateRange !== 'custom') {
    const startDate = getDateRangeStartDate(filters.dateRange)
    andConditions.push({
      createdAt: {
        greater_than_equal: startDate.toISOString(),
      },
    })
  } else if (filters.startDate || filters.endDate) {
    // Custom date range
    if (filters.startDate) {
      andConditions.push({
        createdAt: {
          greater_than_equal: filters.startDate.toISOString(),
        },
      })
    }
    if (filters.endDate) {
      andConditions.push({
        createdAt: {
          less_than_equal: filters.endDate.toISOString(),
        },
      })
    }
  }

  // Filter by search keyword (searches in subject)
  if (filters.searchKeyword && filters.searchKeyword.trim()) {
    andConditions.push({
      subject: {
        contains: filters.searchKeyword.trim(),
      },
    })
  }

  // Combine conditions with AND
  if (andConditions.length > 0) {
    if (andConditions.length === 1) {
      return andConditions[0]
    }
    return {
      and: andConditions,
    }
  }

  return query
}

/**
 * Get sort configuration for task queries
 */
export function getTaskSortConfig(sortOrder: TaskSortOrder = 'newest'): string {
  return sortOrder === 'newest' ? '-createdAt' : 'createdAt'
}

/**
 * Filter tasks with the specified filters, sort order, and pagination
 */
export async function filterTasks(
  payload: BasePayload,
  filters: TaskFilters = {},
  sortOrder: TaskSortOrder = 'newest',
  pagination: PaginationOptions = {}
): Promise<TaskListResult> {
  const { page = 1, limit = 10 } = pagination

  const query = buildTaskQuery(filters)
  const sort = getTaskSortConfig(sortOrder)

  const result = await payload.find({
    collection: 'tasks',
    where: query,
    sort,
    page,
    limit,
  })

  return {
    docs: result.docs.map((doc) => ({
      id: String(doc.id),
      subject: String(doc.subject || ''),
      status: doc.status as TaskStatus,
      progress: Number(doc.progress || 0),
      createdAt: String(doc.createdAt || ''),
      updatedAt: String(doc.updatedAt || ''),
      totalExpected: doc.totalExpected != null ? Number(doc.totalExpected) : undefined,
      models: Array.isArray(doc.models) ? doc.models as string[] : undefined,
      importedStyleIds: Array.isArray(doc.importedStyleIds)
        ? doc.importedStyleIds as string[]
        : undefined,
    })),
    totalDocs: result.totalDocs,
    page: result.page || 1,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  }
}

/**
 * Sort tasks by the specified order
 * (Helper for in-memory sorting if needed)
 */
export function sortTasks<T extends { createdAt: string }>(
  tasks: T[],
  sortOrder: TaskSortOrder = 'newest'
): T[] {
  return [...tasks].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })
}

/**
 * Get a task with all its sub-tasks and status counts
 */
export async function getTaskWithSubTasks(
  payload: BasePayload,
  taskId: string
): Promise<TaskWithSubTasksResult | null> {
  // Get the task
  const task = await payload.findByID({
    collection: 'tasks',
    id: taskId,
  })

  if (!task) {
    return null
  }

  // Get all sub-tasks for this task
  const subTasksResult = await payload.find({
    collection: 'sub-tasks',
    where: {
      parentTask: {
        equals: taskId,
      },
    },
    limit: 10000, // Get all sub-tasks
    sort: 'createdAt',
  })

  // Calculate status counts
  const statusCounts = {
    pending: 0,
    processing: 0,
    success: 0,
    failed: 0,
    cancelled: 0,
    total: subTasksResult.totalDocs,
  }

  const subTasks = subTasksResult.docs.map((doc) => {
    const status = doc.status as SubTaskStatus

    // Update counts
    switch (status) {
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

    return {
      id: String(doc.id),
      status,
      styleId: String(doc.styleId || ''),
      modelId: String(doc.modelId || ''),
      batchIndex: Number(doc.batchIndex || 0),
      errorLog: doc.errorLog ? String(doc.errorLog) : undefined,
      errorCategory: doc.errorCategory ? String(doc.errorCategory) : undefined,
      retryCount: Number(doc.retryCount || 0),
      startedAt: doc.startedAt ? String(doc.startedAt) : undefined,
      completedAt: doc.completedAt ? String(doc.completedAt) : undefined,
    }
  })

  return {
    task: {
      id: String(task.id),
      subject: String(task.subject || ''),
      status: task.status as TaskStatus,
      progress: Number(task.progress || 0),
      createdAt: String(task.createdAt || ''),
      updatedAt: String(task.updatedAt || ''),
      totalExpected: task.totalExpected != null ? Number(task.totalExpected) : undefined,
      models: Array.isArray(task.models) ? task.models as string[] : undefined,
      importedStyleIds: Array.isArray(task.importedStyleIds)
        ? task.importedStyleIds as string[]
        : undefined,
      expandedPrompts: Array.isArray(task.expandedPrompts)
        ? task.expandedPrompts as TaskWithSubTasksResult['task']['expandedPrompts']
        : undefined,
      countPerPrompt: task.countPerPrompt != null ? Number(task.countPerPrompt) : undefined,
      aspectRatio: task.aspectRatio ? String(task.aspectRatio) : undefined,
    },
    subTasks,
    statusCounts,
  }
}

/**
 * Check if a task can be cancelled
 * Only tasks in processing or expanding state can be cancelled
 */
export function canCancelTask(status: TaskStatus): boolean {
  return status === TaskStatus.Processing || status === TaskStatus.Expanding || status === TaskStatus.Queued
}

/**
 * Check if a sub-task can be retried
 * Only failed sub-tasks can be retried
 */
export function canRetrySubTask(status: SubTaskStatus): boolean {
  return status === SubTaskStatus.Failed
}
