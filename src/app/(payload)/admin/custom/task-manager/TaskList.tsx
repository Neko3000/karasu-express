'use client'

/**
 * TaskList Component
 *
 * Task rows display with:
 * - Task ID, theme, creation time, progress bar, status badge
 * - Default sort: newest first
 * - Pagination controls
 * - Cancel button for in-progress tasks
 * - Click to expand task details
 *
 * Phase 7 (User Story 4): Task Monitoring and Management
 * Task: T043l - Create TaskList component
 */

import React from 'react'
import { TaskStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TaskListItem } from './hooks/useTaskProgress'

// ============================================
// TYPES
// ============================================

export interface TaskListProps {
  /** List of tasks */
  tasks: TaskListItem[]
  /** Currently selected task ID */
  selectedTaskId: string | null
  /** Total number of documents */
  totalDocs: number
  /** Current page */
  page: number
  /** Total pages */
  totalPages: number
  /** Has next page */
  hasNextPage: boolean
  /** Has previous page */
  hasPrevPage: boolean
  /** Loading state */
  isLoading: boolean
  /** Callback when task is selected */
  onSelectTask: (taskId: string | null) => void
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Callback when cancel is clicked */
  onCancelTask: (taskId: string) => void
}

// ============================================
// HELPERS
// ============================================

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.Draft:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    case TaskStatus.Queued:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case TaskStatus.Expanding:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case TaskStatus.Processing:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case TaskStatus.Completed:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case TaskStatus.PartialFailed:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    case TaskStatus.Failed:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case TaskStatus.Cancelled:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.Draft:
      return 'Draft'
    case TaskStatus.Queued:
      return 'Queued'
    case TaskStatus.Expanding:
      return 'Expanding'
    case TaskStatus.Processing:
      return 'Processing'
    case TaskStatus.Completed:
      return 'Completed'
    case TaskStatus.PartialFailed:
      return 'Partial Failed'
    case TaskStatus.Failed:
      return 'Failed'
    case TaskStatus.Cancelled:
      return 'Cancelled'
    default:
      return status
  }
}

function canCancelTask(status: TaskStatus): boolean {
  return [TaskStatus.Processing, TaskStatus.Expanding, TaskStatus.Queued].includes(status)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

// ============================================
// COMPONENT
// ============================================

export function TaskList({
  tasks,
  selectedTaskId,
  totalDocs,
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  isLoading,
  onSelectTask,
  onPageChange,
  onCancelTask,
}: TaskListProps) {
  return (
    <div className="twp">
      {/* Task Table */}
      <div className="twp overflow-x-auto">
        <table className="twp min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="twp bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="twp px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Theme
              </th>
              <th className="twp px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="twp px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Progress
              </th>
              <th className="twp px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="twp px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="twp bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading && tasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="twp px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Loading tasks...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="twp px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No tasks found
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask(selectedTaskId === task.id ? null : task.id)}
                  className={`
                    twp cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                    ${selectedTaskId === task.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                >
                  {/* Theme */}
                  <td className="twp px-4 py-4">
                    <div className="twp text-sm font-medium text-gray-900 dark:text-white">
                      {truncateText(task.subject, 50)}
                    </div>
                    <div className="twp text-xs text-gray-500 dark:text-gray-400">
                      ID: {task.id.substring(0, 8)}...
                    </div>
                  </td>

                  {/* Created */}
                  <td className="twp px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(task.createdAt)}
                  </td>

                  {/* Progress */}
                  <td className="twp px-4 py-4">
                    <div className="twp flex items-center gap-2">
                      <div className="twp w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`twp h-2 rounded-full transition-all ${
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
                      <span className="twp text-xs text-gray-500 dark:text-gray-400">
                        {task.progress}%
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="twp px-4 py-4">
                    <Badge
                      variant="outline"
                      className={getStatusColor(task.status)}
                    >
                      {getStatusLabel(task.status)}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="twp px-4 py-4">
                    <div className="twp flex gap-2">
                      {canCancelTask(task.status) && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            onCancelTask(task.id)
                          }}
                          className="twp:text-red-600 twp:dark:text-red-400 twp:hover:bg-red-50 twp:dark:hover:bg-red-900/20"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectTask(task.id)
                        }}
                        className="twp:text-blue-600 twp:dark:text-blue-400 twp:hover:bg-blue-50 twp:dark:hover:bg-blue-900/20"
                      >
                        View Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="twp flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="twp text-sm text-gray-500 dark:text-gray-400">
          Showing {tasks.length} of {totalDocs} tasks
        </div>
        <div className="twp flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage || isLoading}
          >
            Previous
          </Button>
          <span className="twp:px-3 twp:py-1 twp:text-sm twp:text-gray-500 twp:dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TaskList
