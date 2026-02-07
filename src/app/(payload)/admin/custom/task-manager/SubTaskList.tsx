'use client'

/**
 * SubTaskList Component
 *
 * Sub-task list with:
 * - Status indicators per sub-task
 * - Expandable error details (errorLog, errorCategory)
 * - Individual retry button for failed sub-tasks
 *
 * Phase 7 (User Story 4): Task Monitoring and Management
 * Task: T043n - Create SubTaskList component
 */

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SubTaskStatus } from '@/lib/types'
import type { SubTaskListItem } from './hooks/useTaskProgress'

// ============================================
// TYPES
// ============================================

export interface SubTaskListProps {
  /** List of sub-tasks */
  subTasks: SubTaskListItem[]
  /** Callback when retry is clicked */
  onRetrySubTask: (subTaskId: string) => void
  /** Whether to show retry button for failed tasks */
  showRetryButton?: boolean
  /** Maximum items to show before "show more" */
  maxVisible?: number
}

// ============================================
// HELPERS
// ============================================

function getStatusColor(status: SubTaskStatus): string {
  switch (status) {
    case SubTaskStatus.Pending:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case SubTaskStatus.Processing:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case SubTaskStatus.Success:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case SubTaskStatus.Failed:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case SubTaskStatus.Cancelled:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusIcon(status: SubTaskStatus): string {
  switch (status) {
    case SubTaskStatus.Pending:
      return '⏳'
    case SubTaskStatus.Processing:
      return '🔄'
    case SubTaskStatus.Success:
      return '✅'
    case SubTaskStatus.Failed:
      return '❌'
    case SubTaskStatus.Cancelled:
      return '🚫'
    default:
      return '❔'
  }
}

function formatErrorCategory(category: string | undefined): string {
  if (!category) return 'Unknown Error'

  const categories: Record<string, string> = {
    RATE_LIMITED: 'Rate Limited',
    CONTENT_FILTERED: 'Content Filtered',
    INVALID_INPUT: 'Invalid Input',
    PROVIDER_ERROR: 'Provider Error',
    NETWORK_ERROR: 'Network Error',
    TIMEOUT: 'Timeout',
    UNKNOWN: 'Unknown Error',
  }

  return categories[category] || category
}

// ============================================
// COMPONENT
// ============================================

export function SubTaskList({
  subTasks,
  onRetrySubTask,
  showRetryButton = true,
  maxVisible = 10,
}: SubTaskListProps) {
  const [showAll, setShowAll] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const visibleSubTasks = showAll ? subTasks : subTasks.slice(0, maxVisible)
  const hasMore = subTasks.length > maxVisible

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  if (subTasks.length === 0) {
    return (
      <div className="twp text-sm text-gray-500 dark:text-gray-400 py-2">
        No sub-tasks to display
      </div>
    )
  }

  return (
    <div className="twp space-y-2">
      {visibleSubTasks.map((subTask) => {
        const isExpanded = expandedIds.has(subTask.id)
        const canRetry = showRetryButton && subTask.status === SubTaskStatus.Failed

        return (
          <div
            key={subTask.id}
            className="twp bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Main Row */}
            <div
              className="twp flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => toggleExpanded(subTask.id)}
            >
              <div className="twp flex items-center gap-3">
                {/* Status Icon */}
                <span className="twp text-sm">{getStatusIcon(subTask.status)}</span>

                {/* Status Badge */}
                <span
                  className={`twp px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(
                    subTask.status
                  )}`}
                >
                  {subTask.status}
                </span>

                {/* Style & Model */}
                <span className="twp text-xs text-gray-500 dark:text-gray-400">
                  {subTask.styleId} / {subTask.modelId}
                </span>

                {/* Batch Index */}
                <span className="twp text-xs text-gray-400 dark:text-gray-500">
                  #{subTask.batchIndex}
                </span>
              </div>

              <div className="twp flex items-center gap-2">
                {/* Retry Button */}
                {canRetry && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRetrySubTask(subTask.id)
                    }}
                    className="twp px-2 py-1 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
                  >
                    Retry
                  </button>
                )}

                {/* Expand Icon */}
                <ChevronDown
                  className={`twp w-4 h-4 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="twp px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-sm space-y-2">
                {/* ID */}
                <div className="twp flex gap-2">
                  <span className="twp text-gray-500 dark:text-gray-400 w-24">ID:</span>
                  <span className="twp text-gray-900 dark:text-white font-mono text-xs">
                    {subTask.id}
                  </span>
                </div>

                {/* Retry Count */}
                <div className="twp flex gap-2">
                  <span className="twp text-gray-500 dark:text-gray-400 w-24">Retries:</span>
                  <span className="twp text-gray-900 dark:text-white">{subTask.retryCount}</span>
                </div>

                {/* Timestamps */}
                {subTask.startedAt && (
                  <div className="twp flex gap-2">
                    <span className="twp text-gray-500 dark:text-gray-400 w-24">Started:</span>
                    <span className="twp text-gray-900 dark:text-white">
                      {new Date(subTask.startedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {subTask.completedAt && (
                  <div className="twp flex gap-2">
                    <span className="twp text-gray-500 dark:text-gray-400 w-24">Completed:</span>
                    <span className="twp text-gray-900 dark:text-white">
                      {new Date(subTask.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Error Details */}
                {subTask.status === SubTaskStatus.Failed && (
                  <>
                    {subTask.errorCategory && (
                      <div className="twp flex gap-2">
                        <span className="twp text-gray-500 dark:text-gray-400 w-24">Error Type:</span>
                        <span className="twp text-red-600 dark:text-red-400 font-medium">
                          {formatErrorCategory(subTask.errorCategory)}
                        </span>
                      </div>
                    )}
                    {subTask.errorLog && (
                      <div className="twp">
                        <span className="twp text-gray-500 dark:text-gray-400">Error Log:</span>
                        <pre className="twp mt-1 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs rounded overflow-x-auto whitespace-pre-wrap">
                          {subTask.errorLog}
                        </pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Show More Button */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="twp w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Show {subTasks.length - maxVisible} more sub-tasks
        </button>
      )}

      {hasMore && showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="twp w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Show less
        </button>
      )}
    </div>
  )
}

export default SubTaskList
