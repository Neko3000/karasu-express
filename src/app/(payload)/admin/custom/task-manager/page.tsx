'use client'

/**
 * Task Manager Page
 *
 * Main Task Manager entry point for the custom admin view.
 * Provides enhanced task monitoring capabilities:
 * - Task list with filtering, search, and pagination
 * - Task detail panel with sub-task breakdown
 * - Cancel and retry functionality
 *
 * Phase 7 (User Story 4): Task Monitoring and Management
 * Task: T043j - Create TaskManager custom admin view page
 */

import React, { useCallback, useState } from 'react'
import { TaskFilters } from './TaskFilters'
import { TaskList } from './TaskList'
import { TaskDetail } from './TaskDetail'
import { useTaskProgress } from './hooks/useTaskProgress'

// ============================================
// COMPONENT
// ============================================

export default function TaskManagerPage() {
  const {
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
    setFilters,
    setSortOrder,
    setPage,
    selectTask,
    cancelTask,
    retrySubTask,
    clearError,
  } = useTaskProgress()

  const [actionError, setActionError] = useState<string | null>(null)

  // Handle cancel task
  const handleCancelTask = useCallback(async (taskId: string) => {
    if (!window.confirm('Are you sure you want to cancel this task? Currently running sub-tasks will complete, but pending sub-tasks will be cancelled.')) {
      return
    }

    setActionError(null)
    const result = await cancelTask(taskId)
    if (!result.success) {
      setActionError(result.error || 'Failed to cancel task')
    }
  }, [cancelTask])

  // Handle retry sub-task
  const handleRetrySubTask = useCallback(async (subTaskId: string) => {
    setActionError(null)
    const result = await retrySubTask(subTaskId)
    if (!result.success) {
      setActionError(result.error || 'Failed to retry sub-task')
    }
  }, [retrySubTask])

  // Handle retry all failed
  const handleRetryAllFailed = useCallback(async () => {
    if (!selectedTaskDetail) return

    const failedSubTasks = selectedTaskDetail.subTasks.filter(
      (st) => st.status === 'failed'
    )

    if (failedSubTasks.length === 0) {
      setActionError('No failed sub-tasks to retry')
      return
    }

    if (!window.confirm(`Are you sure you want to retry ${failedSubTasks.length} failed sub-tasks?`)) {
      return
    }

    setActionError(null)

    // Retry each failed sub-task
    for (const subTask of failedSubTasks) {
      const result = await retrySubTask(subTask.id)
      if (!result.success) {
        setActionError(`Failed to retry sub-task ${subTask.id}: ${result.error}`)
        break
      }
    }
  }, [selectedTaskDetail, retrySubTask])

  // Handle close detail
  const handleCloseDetail = useCallback(() => {
    selectTask(null)
  }, [selectTask])

  return (
    <div className="twp min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Header */}
      <div className="twp bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="twp flex items-center justify-between">
          <div>
            <h1 className="twp text-2xl font-bold text-gray-900 dark:text-white">
              Task Manager
            </h1>
            <p className="twp text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monitor and manage AI content generation tasks
            </p>
          </div>
          <div className="twp flex items-center gap-4">
            {/* Sort Order Toggle */}
            <div className="twp flex items-center gap-2">
              <span className="twp text-sm text-gray-500 dark:text-gray-400">Sort:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="twp text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 dark:bg-gray-800 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
            {/* Total Count */}
            <div className="twp text-sm text-gray-500 dark:text-gray-400">
              {totalDocs} total tasks
            </div>
          </div>
        </div>
      </div>

      {/* Error Alerts */}
      {(error || actionError) && (
        <div className="twp mx-6 mt-4">
          <div className="twp bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
            <div className="twp flex items-center gap-2">
              <svg className="twp w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="twp text-red-700 dark:text-red-300">{error || actionError}</span>
            </div>
            <button
              onClick={() => {
                clearError()
                setActionError(null)
              }}
              className="twp text-red-600 hover:text-red-800"
            >
              <svg className="twp w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="twp p-6">
        <div className="twp flex gap-6">
          {/* Left Panel: Filters + List */}
          <div className={`twp ${selectedTaskId ? 'w-1/2' : 'w-full'} space-y-4`}>
            {/* Filters */}
            <TaskFilters
              filters={filters}
              onFiltersChange={setFilters}
              isLoading={isLoading}
            />

            {/* Task List */}
            <div className="twp bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <TaskList
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                totalDocs={totalDocs}
                page={page}
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                isLoading={isLoading}
                onSelectTask={selectTask}
                onPageChange={setPage}
                onCancelTask={handleCancelTask}
              />
            </div>
          </div>

          {/* Right Panel: Task Detail */}
          {selectedTaskId && selectedTaskDetail && (
            <div className="twp w-1/2">
              <TaskDetail
                detail={selectedTaskDetail}
                isLoading={isLoadingDetail}
                onRetryAllFailed={handleRetryAllFailed}
                onRetrySubTask={handleRetrySubTask}
                onClose={handleCloseDetail}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
