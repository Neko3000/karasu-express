'use client'

/**
 * TaskDetail Component
 *
 * Task detail panel showing:
 * - Configuration snapshot (prompts, styles, models, parameters)
 * - Sub-task breakdown with status counts
 * - Error summary for failed tasks
 * - Retry All Failed button
 *
 * Phase 7 (User Story 4): Task Monitoring and Management
 * Task: T043m - Create TaskDetail component
 */

import React from 'react'
import { X } from 'lucide-react'
import { TaskStatus, SubTaskStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TaskDetail as TaskDetailType, SubTaskListItem } from './hooks/useTaskProgress'
import { SubTaskList } from './SubTaskList'

// ============================================
// TYPES
// ============================================

export interface TaskDetailProps {
  /** Task detail data */
  detail: TaskDetailType
  /** Loading state */
  isLoading: boolean
  /** Callback when retry all failed is clicked */
  onRetryAllFailed: () => void
  /** Callback when single sub-task retry is clicked */
  onRetrySubTask: (subTaskId: string) => void
  /** Callback to close detail panel */
  onClose: () => void
}

// ============================================
// HELPERS
// ============================================

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.Draft:
      return 'text-gray-600'
    case TaskStatus.Queued:
      return 'text-yellow-600'
    case TaskStatus.Expanding:
      return 'text-purple-600'
    case TaskStatus.Processing:
      return 'text-blue-600'
    case TaskStatus.Completed:
      return 'text-green-600'
    case TaskStatus.PartialFailed:
      return 'text-orange-600'
    case TaskStatus.Failed:
      return 'text-red-600'
    case TaskStatus.Cancelled:
      return 'text-gray-600'
    default:
      return 'text-gray-600'
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================
// COMPONENT
// ============================================

export function TaskDetail({
  detail,
  isLoading,
  onRetryAllFailed,
  onRetrySubTask,
  onClose,
}: TaskDetailProps) {
  const { task, subTasks, statusCounts } = detail

  const hasFailedSubTasks = statusCounts.failed > 0
  const canRetryFailed =
    hasFailedSubTasks &&
    task.status !== TaskStatus.Cancelled &&
    task.status !== TaskStatus.Processing

  // Group sub-tasks by status for easy viewing
  const failedSubTasks = subTasks.filter((st) => st.status === SubTaskStatus.Failed)

  return (
    <div className="twp bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="twp px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="twp text-lg font-semibold text-gray-900 dark:text-white">
            Task Details
          </h3>
          <p className="twp text-sm text-gray-500 dark:text-gray-400">
            ID: {task.id}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
        >
          <X className="twp:size-5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="twp p-8 text-center text-gray-500">Loading task details...</div>
      ) : (
        <div className="twp p-4 space-y-6">
          {/* Task Overview */}
          <div className="twp">
            <h4 className="twp text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </h4>
            <p className="twp text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
              {task.subject}
            </p>
          </div>

          {/* Status and Progress */}
          <div className="twp grid grid-cols-2 gap-4">
            <div>
              <h4 className="twp text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </h4>
              <span className={`twp text-lg font-semibold ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="twp text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Progress
              </h4>
              <div className="twp flex items-center gap-2">
                <div className="twp flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`twp h-3 rounded-full transition-all ${
                      task.status === TaskStatus.Failed
                        ? 'bg-red-500'
                        : task.status === TaskStatus.Cancelled
                        ? 'bg-gray-400'
                        : task.status === TaskStatus.Completed
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <span className="twp text-lg font-semibold text-gray-900 dark:text-white">
                  {task.progress}%
                </span>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="twp grid grid-cols-2 gap-4">
            <div>
              <h4 className="twp text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Created
              </h4>
              <p className="twp text-sm text-gray-900 dark:text-white">
                {formatDate(task.createdAt)}
              </p>
            </div>
            <div>
              <h4 className="twp text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Images
              </h4>
              <p className="twp text-sm text-gray-900 dark:text-white">
                {task.totalExpected || 'N/A'}
              </p>
            </div>
            {task.models && task.models.length > 0 && (
              <div>
                <h4 className="twp text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Models
                </h4>
                <div className="twp flex flex-wrap gap-1">
                  {task.models.map((model) => (
                    <Badge
                      key={model}
                      variant="secondary"
                      className="twp:bg-blue-100 twp:text-blue-800 twp:dark:bg-blue-900 twp:dark:text-blue-300"
                    >
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {task.aspectRatio && (
              <div>
                <h4 className="twp text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Aspect Ratio
                </h4>
                <p className="twp text-sm text-gray-900 dark:text-white">
                  {task.aspectRatio}
                </p>
              </div>
            )}
          </div>

          {/* Sub-task Status Counts */}
          <div className="twp">
            <h4 className="twp text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sub-Task Breakdown
            </h4>
            <div className="twp grid grid-cols-5 gap-2 text-center">
              <div className="twp p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <div className="twp text-lg font-semibold text-yellow-600">{statusCounts.pending}</div>
                <div className="twp text-xs text-gray-500">Pending</div>
              </div>
              <div className="twp p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="twp text-lg font-semibold text-blue-600">{statusCounts.processing}</div>
                <div className="twp text-xs text-gray-500">Processing</div>
              </div>
              <div className="twp p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <div className="twp text-lg font-semibold text-green-600">{statusCounts.success}</div>
                <div className="twp text-xs text-gray-500">Success</div>
              </div>
              <div className="twp p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <div className="twp text-lg font-semibold text-red-600">{statusCounts.failed}</div>
                <div className="twp text-xs text-gray-500">Failed</div>
              </div>
              <div className="twp p-2 bg-gray-50 dark:bg-gray-900/20 rounded">
                <div className="twp text-lg font-semibold text-gray-600">{statusCounts.cancelled}</div>
                <div className="twp text-xs text-gray-500">Cancelled</div>
              </div>
            </div>
          </div>

          {/* Retry All Failed Button */}
          {canRetryFailed && (
            <div className="twp">
              <Button
                onClick={onRetryAllFailed}
                className="twp:w-full twp:bg-orange-600 twp:hover:bg-orange-700 twp:text-white"
              >
                Retry All Failed ({statusCounts.failed})
              </Button>
            </div>
          )}

          {/* Error Summary */}
          {hasFailedSubTasks && (
            <div className="twp">
              <h4 className="twp text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                Error Summary ({statusCounts.failed} failed)
              </h4>
              <SubTaskList
                subTasks={failedSubTasks}
                onRetrySubTask={onRetrySubTask}
                showRetryButton={task.status !== TaskStatus.Cancelled}
              />
            </div>
          )}

          {/* All Sub-tasks (collapsible) */}
          <details className="twp">
            <summary className="twp cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              View All Sub-Tasks ({statusCounts.total})
            </summary>
            <div className="twp mt-2">
              <SubTaskList
                subTasks={subTasks}
                onRetrySubTask={onRetrySubTask}
                showRetryButton={task.status !== TaskStatus.Cancelled}
              />
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default TaskDetail
