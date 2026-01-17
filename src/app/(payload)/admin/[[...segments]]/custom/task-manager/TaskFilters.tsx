'use client'

/**
 * TaskFilters Component
 *
 * Filter controls for the Task Manager with:
 * - Status multi-select: In Progress, Completed, Failed, Cancelled
 * - Date range selector: Today, Last 7 days, Last 30 days, Custom range
 * - Theme keyword search input
 *
 * Phase 7 (User Story 4): Task Monitoring and Management
 * Task: T043k - Create TaskFilters component
 */

import React, { useState, useCallback } from 'react'
import { TaskStatus, type TaskFilters as TaskFiltersType, type DateRangeOption } from '@/lib/types'

// ============================================
// TYPES
// ============================================

export interface TaskFiltersProps {
  /** Current filters */
  filters: TaskFiltersType
  /** Callback when filters change */
  onFiltersChange: (filters: TaskFiltersType) => void
  /** Loading state */
  isLoading?: boolean
}

// ============================================
// CONSTANTS
// ============================================

const STATUS_OPTIONS = [
  { value: TaskStatus.Processing, label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: TaskStatus.Expanding, label: 'Expanding', color: 'bg-purple-100 text-purple-800' },
  { value: TaskStatus.Queued, label: 'Queued', color: 'bg-yellow-100 text-yellow-800' },
  { value: TaskStatus.Completed, label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: TaskStatus.PartialFailed, label: 'Partial Failed', color: 'bg-orange-100 text-orange-800' },
  { value: TaskStatus.Failed, label: 'Failed', color: 'bg-red-100 text-red-800' },
  { value: TaskStatus.Cancelled, label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
]

const DATE_RANGE_OPTIONS: { value: DateRangeOption; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
]

// ============================================
// COMPONENT
// ============================================

export function TaskFilters({
  filters,
  onFiltersChange,
  isLoading = false,
}: TaskFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.searchKeyword || '')
  const [showCustomDates, setShowCustomDates] = useState(filters.dateRange === 'custom')

  // Handle status toggle
  const handleStatusToggle = useCallback((status: TaskStatus) => {
    const currentStatuses = filters.status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    })
  }, [filters, onFiltersChange])

  // Handle date range change
  const handleDateRangeChange = useCallback((dateRange: DateRangeOption) => {
    setShowCustomDates(dateRange === 'custom')

    if (dateRange === 'custom') {
      onFiltersChange({
        ...filters,
        dateRange,
      })
    } else {
      onFiltersChange({
        ...filters,
        dateRange,
        startDate: undefined,
        endDate: undefined,
      })
    }
  }, [filters, onFiltersChange])

  // Handle custom date change
  const handleCustomDateChange = useCallback((type: 'start' | 'end', value: string) => {
    const date = value ? new Date(value) : undefined

    onFiltersChange({
      ...filters,
      [type === 'start' ? 'startDate' : 'endDate']: date,
    })
  }, [filters, onFiltersChange])

  // Handle search
  const handleSearch = useCallback(() => {
    onFiltersChange({
      ...filters,
      searchKeyword: searchInput.trim() || undefined,
    })
  }, [filters, searchInput, onFiltersChange])

  // Handle search on Enter
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchInput('')
    setShowCustomDates(false)
    onFiltersChange({})
  }, [onFiltersChange])

  const hasActiveFilters =
    (filters.status && filters.status.length > 0) ||
    filters.dateRange ||
    filters.searchKeyword

  return (
    <div className="twp space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Search */}
      <div className="twp">
        <label className="twp block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Search by Theme
        </label>
        <div className="twp flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Enter theme keyword..."
            className="twp flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="twp px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm font-medium"
          >
            Search
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="twp">
        <label className="twp block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter by Status
        </label>
        <div className="twp flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(({ value, label, color }) => {
            const isSelected = filters.status?.includes(value)
            return (
              <button
                key={value}
                onClick={() => handleStatusToggle(value)}
                disabled={isLoading}
                className={`
                  twp px-3 py-1 rounded-full text-xs font-medium transition-all
                  ${isSelected
                    ? `${color} ring-2 ring-offset-1 ring-blue-500`
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                  disabled:opacity-50
                `}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="twp">
        <label className="twp block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter by Date
        </label>
        <div className="twp flex flex-wrap gap-2">
          {DATE_RANGE_OPTIONS.map(({ value, label }) => {
            const isSelected = filters.dateRange === value
            return (
              <button
                key={value}
                onClick={() => handleDateRangeChange(value)}
                disabled={isLoading}
                className={`
                  twp px-3 py-1 rounded-md text-xs font-medium transition-all
                  ${isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                  disabled:opacity-50
                `}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Custom Date Range */}
        {showCustomDates && (
          <div className="twp mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="twp block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleCustomDateChange('start', e.target.value)}
                disabled={isLoading}
                className="twp w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="twp block text-xs text-gray-500 dark:text-gray-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleCustomDateChange('end', e.target.value)}
                disabled={isLoading}
                className="twp w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="twp pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClearFilters}
            disabled={isLoading}
            className="twp text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}

export default TaskFilters
