/**
 * Task Manager Service Unit Tests
 *
 * Tests for filtering, sorting, and search functionality.
 * Phase 7 (User Story 4): Task Monitoring and Management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buildTaskQuery,
  getTaskSortConfig,
  sortTasks,
  getDateRangeStartDate,
  canCancelTask,
  canRetrySubTask,
} from '../../../src/services/task-manager'
import { TaskStatus, SubTaskStatus, type TaskFilters } from '../../../src/lib/types'

describe('Task Manager Service', () => {
  describe('buildTaskQuery', () => {
    it('should return empty query when no filters provided', () => {
      const query = buildTaskQuery({})
      expect(query).toEqual({})
    })

    it('should build query with single status filter', () => {
      const filters: TaskFilters = {
        status: [TaskStatus.Processing],
      }
      const query = buildTaskQuery(filters)
      expect(query).toEqual({
        status: { in: [TaskStatus.Processing] },
      })
    })

    it('should build query with multiple status filters', () => {
      const filters: TaskFilters = {
        status: [TaskStatus.Processing, TaskStatus.Completed, TaskStatus.Failed],
      }
      const query = buildTaskQuery(filters)
      expect(query).toEqual({
        status: { in: [TaskStatus.Processing, TaskStatus.Completed, TaskStatus.Failed] },
      })
    })

    it('should build query with date range filter (today)', () => {
      const filters: TaskFilters = {
        dateRange: 'today',
      }
      const query = buildTaskQuery(filters)

      // Should have createdAt greater_than_equal constraint
      expect(query).toHaveProperty('createdAt')
      expect((query as { createdAt?: { greater_than_equal?: string } }).createdAt).toHaveProperty(
        'greater_than_equal'
      )
    })

    it('should build query with date range filter (7days)', () => {
      const filters: TaskFilters = {
        dateRange: '7days',
      }
      const query = buildTaskQuery(filters)

      expect(query).toHaveProperty('createdAt')
      expect((query as { createdAt?: { greater_than_equal?: string } }).createdAt).toHaveProperty(
        'greater_than_equal'
      )
    })

    it('should build query with date range filter (30days)', () => {
      const filters: TaskFilters = {
        dateRange: '30days',
      }
      const query = buildTaskQuery(filters)

      expect(query).toHaveProperty('createdAt')
      expect((query as { createdAt?: { greater_than_equal?: string } }).createdAt).toHaveProperty(
        'greater_than_equal'
      )
    })

    it('should build query with custom date range filters', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      const filters: TaskFilters = {
        dateRange: 'custom',
        startDate,
        endDate,
      }
      const query = buildTaskQuery(filters)

      // Should have AND conditions for both start and end dates
      expect(query).toHaveProperty('and')
      const andConditions = (query as { and?: Array<unknown> }).and
      expect(andConditions).toHaveLength(2)
    })

    it('should build query with search keyword filter', () => {
      const filters: TaskFilters = {
        searchKeyword: 'cat',
      }
      const query = buildTaskQuery(filters)
      expect(query).toEqual({
        subject: { contains: 'cat' },
      })
    })

    it('should trim whitespace from search keyword', () => {
      const filters: TaskFilters = {
        searchKeyword: '  cat  ',
      }
      const query = buildTaskQuery(filters)
      expect(query).toEqual({
        subject: { contains: 'cat' },
      })
    })

    it('should ignore empty search keyword', () => {
      const filters: TaskFilters = {
        searchKeyword: '   ',
      }
      const query = buildTaskQuery(filters)
      expect(query).toEqual({})
    })

    it('should combine status and date range filters', () => {
      const filters: TaskFilters = {
        status: [TaskStatus.Processing],
        dateRange: 'today',
      }
      const query = buildTaskQuery(filters)

      expect(query).toHaveProperty('and')
      const andConditions = (query as { and?: Array<unknown> }).and
      expect(andConditions).toHaveLength(2)
    })

    it('should combine status, date range, and search keyword filters', () => {
      const filters: TaskFilters = {
        status: [TaskStatus.Processing, TaskStatus.Failed],
        dateRange: '7days',
        searchKeyword: 'cat',
      }
      const query = buildTaskQuery(filters)

      expect(query).toHaveProperty('and')
      const andConditions = (query as { and?: Array<unknown> }).and
      expect(andConditions).toHaveLength(3)
    })
  })

  describe('getTaskSortConfig', () => {
    it('should return -createdAt for newest first (default)', () => {
      expect(getTaskSortConfig()).toBe('-createdAt')
      expect(getTaskSortConfig('newest')).toBe('-createdAt')
    })

    it('should return createdAt for oldest first', () => {
      expect(getTaskSortConfig('oldest')).toBe('createdAt')
    })
  })

  describe('sortTasks', () => {
    const mockTasks = [
      { id: '1', createdAt: '2024-01-15T10:00:00Z' },
      { id: '2', createdAt: '2024-01-10T10:00:00Z' },
      { id: '3', createdAt: '2024-01-20T10:00:00Z' },
    ]

    it('should sort tasks by newest first (default)', () => {
      const sorted = sortTasks(mockTasks)
      expect(sorted.map((t) => t.id)).toEqual(['3', '1', '2'])
    })

    it('should sort tasks by newest first explicitly', () => {
      const sorted = sortTasks(mockTasks, 'newest')
      expect(sorted.map((t) => t.id)).toEqual(['3', '1', '2'])
    })

    it('should sort tasks by oldest first', () => {
      const sorted = sortTasks(mockTasks, 'oldest')
      expect(sorted.map((t) => t.id)).toEqual(['2', '1', '3'])
    })

    it('should not mutate the original array', () => {
      const original = [...mockTasks]
      sortTasks(mockTasks, 'newest')
      expect(mockTasks).toEqual(original)
    })
  })

  describe('getDateRangeStartDate', () => {
    it('should return start of today for "today"', () => {
      const result = getDateRangeStartDate('today')
      const now = new Date()

      expect(result.getFullYear()).toBe(now.getFullYear())
      expect(result.getMonth()).toBe(now.getMonth())
      expect(result.getDate()).toBe(now.getDate())
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
    })

    it('should return 7 days ago for "7days"', () => {
      const result = getDateRangeStartDate('7days')
      const now = new Date()
      const expectedDate = new Date(now)
      expectedDate.setDate(expectedDate.getDate() - 7)

      // Should be within the same day (7 days ago)
      expect(result.getFullYear()).toBe(expectedDate.getFullYear())
      expect(result.getMonth()).toBe(expectedDate.getMonth())
      expect(result.getDate()).toBe(expectedDate.getDate())
    })

    it('should return 30 days ago for "30days"', () => {
      const result = getDateRangeStartDate('30days')
      const now = new Date()
      const expectedDate = new Date(now)
      expectedDate.setDate(expectedDate.getDate() - 30)

      // Should be within the same day (30 days ago)
      expect(result.getFullYear()).toBe(expectedDate.getFullYear())
      expect(result.getMonth()).toBe(expectedDate.getMonth())
      expect(result.getDate()).toBe(expectedDate.getDate())
    })

    it('should return epoch start for "custom"', () => {
      const result = getDateRangeStartDate('custom')
      expect(result.getTime()).toBe(0)
    })
  })

  describe('canCancelTask', () => {
    it('should return true for Processing status', () => {
      expect(canCancelTask(TaskStatus.Processing)).toBe(true)
    })

    it('should return true for Expanding status', () => {
      expect(canCancelTask(TaskStatus.Expanding)).toBe(true)
    })

    it('should return true for Queued status', () => {
      expect(canCancelTask(TaskStatus.Queued)).toBe(true)
    })

    it('should return false for Draft status', () => {
      expect(canCancelTask(TaskStatus.Draft)).toBe(false)
    })

    it('should return false for Completed status', () => {
      expect(canCancelTask(TaskStatus.Completed)).toBe(false)
    })

    it('should return false for Failed status', () => {
      expect(canCancelTask(TaskStatus.Failed)).toBe(false)
    })

    it('should return false for PartialFailed status', () => {
      expect(canCancelTask(TaskStatus.PartialFailed)).toBe(false)
    })

    it('should return false for Cancelled status', () => {
      expect(canCancelTask(TaskStatus.Cancelled)).toBe(false)
    })
  })

  describe('canRetrySubTask', () => {
    it('should return true for Failed status', () => {
      expect(canRetrySubTask(SubTaskStatus.Failed)).toBe(true)
    })

    it('should return false for Pending status', () => {
      expect(canRetrySubTask(SubTaskStatus.Pending)).toBe(false)
    })

    it('should return false for Processing status', () => {
      expect(canRetrySubTask(SubTaskStatus.Processing)).toBe(false)
    })

    it('should return false for Success status', () => {
      expect(canRetrySubTask(SubTaskStatus.Success)).toBe(false)
    })

    it('should return false for Cancelled status', () => {
      expect(canRetrySubTask(SubTaskStatus.Cancelled)).toBe(false)
    })
  })
})
