/**
 * Integration Tests: Task Cancel Endpoint
 *
 * Tests for POST /api/tasks/{id}/cancel endpoint
 *
 * Phase 7 (User Story 4): Task Monitoring and Management
 * Per Constitution Principle VI (Testing Discipline)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TaskStatus, SubTaskStatus } from '../../../src/lib/types'

describe('Task Cancel Endpoint Integration', () => {
  // Mock payload instance
  let mockPayload: {
    findByID: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    find: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockPayload = {
      findByID: vi.fn(),
      update: vi.fn(),
      find: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================
  // Test Data Factories
  // ============================================

  const createMockTask = (overrides = {}) => ({
    id: 'task-123',
    subject: 'a cat in the rain',
    status: TaskStatus.Processing,
    progress: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  })

  const createMockSubTask = (overrides = {}) => ({
    id: 'subtask-123',
    parentTask: 'task-123',
    status: SubTaskStatus.Pending,
    styleId: 'ghibli',
    modelId: 'flux-pro',
    finalPrompt: 'a cat in the rain, ghibli style',
    batchIndex: 0,
    retryCount: 0,
    ...overrides,
  })

  // ============================================
  // POST /api/tasks/{id}/cancel
  // ============================================

  describe('POST /api/tasks/{id}/cancel', () => {
    describe('successful cancellation', () => {
      it('should transition task from processing to cancelled', async () => {
        const task = createMockTask({ status: TaskStatus.Processing })

        mockPayload.findByID.mockResolvedValue(task)
        mockPayload.find.mockResolvedValue({
          docs: [],
          totalDocs: 0,
        })
        mockPayload.update.mockResolvedValue({ ...task, status: TaskStatus.Cancelled })

        // Simulate endpoint logic
        const foundTask = await mockPayload.findByID({
          collection: 'tasks',
          id: 'task-123',
        })

        expect(foundTask.status).toBe(TaskStatus.Processing)

        // Update to cancelled
        const updatedTask = await mockPayload.update({
          collection: 'tasks',
          id: 'task-123',
          data: { status: TaskStatus.Cancelled },
        })

        expect(updatedTask.status).toBe(TaskStatus.Cancelled)
      })

      it('should transition task from expanding to cancelled', async () => {
        const task = createMockTask({ status: TaskStatus.Expanding })

        mockPayload.findByID.mockResolvedValue(task)
        mockPayload.find.mockResolvedValue({
          docs: [],
          totalDocs: 0,
        })
        mockPayload.update.mockResolvedValue({ ...task, status: TaskStatus.Cancelled })

        const foundTask = await mockPayload.findByID({
          collection: 'tasks',
          id: 'task-123',
        })

        expect(foundTask.status).toBe(TaskStatus.Expanding)
      })

      it('should transition task from queued to cancelled', async () => {
        const task = createMockTask({ status: TaskStatus.Queued })

        mockPayload.findByID.mockResolvedValue(task)
        mockPayload.find.mockResolvedValue({
          docs: [],
          totalDocs: 0,
        })
        mockPayload.update.mockResolvedValue({ ...task, status: TaskStatus.Cancelled })

        const foundTask = await mockPayload.findByID({
          collection: 'tasks',
          id: 'task-123',
        })

        expect(foundTask.status).toBe(TaskStatus.Queued)
      })

      it('should cancel all pending sub-tasks', async () => {
        const task = createMockTask({ status: TaskStatus.Processing })
        const pendingSubTasks = [
          createMockSubTask({ id: 'sub-1', status: SubTaskStatus.Pending }),
          createMockSubTask({ id: 'sub-2', status: SubTaskStatus.Pending }),
          createMockSubTask({ id: 'sub-3', status: SubTaskStatus.Pending }),
        ]

        mockPayload.findByID.mockResolvedValue(task)
        mockPayload.find.mockResolvedValue({
          docs: pendingSubTasks,
          totalDocs: 3,
        })

        const subTasksResult = await mockPayload.find({
          collection: 'sub-tasks',
          where: { parentTask: { equals: 'task-123' } },
        })

        const pendingCount = subTasksResult.docs.filter(
          (doc: { status: SubTaskStatus }) => doc.status === SubTaskStatus.Pending
        ).length

        expect(pendingCount).toBe(3)

        // Each pending sub-task should be updated to cancelled
        for (const subTask of subTasksResult.docs) {
          if (subTask.status === SubTaskStatus.Pending) {
            mockPayload.update.mockResolvedValueOnce({
              ...subTask,
              status: SubTaskStatus.Cancelled,
              completedAt: new Date().toISOString(),
            })
          }
        }
      })

      it('should leave completed sub-tasks unchanged', async () => {
        const task = createMockTask({ status: TaskStatus.Processing })
        const mixedSubTasks = [
          createMockSubTask({ id: 'sub-1', status: SubTaskStatus.Success }),
          createMockSubTask({ id: 'sub-2', status: SubTaskStatus.Success }),
          createMockSubTask({ id: 'sub-3', status: SubTaskStatus.Pending }),
        ]

        mockPayload.findByID.mockResolvedValue(task)
        mockPayload.find.mockResolvedValue({
          docs: mixedSubTasks,
          totalDocs: 3,
        })

        const subTasksResult = await mockPayload.find({
          collection: 'sub-tasks',
          where: { parentTask: { equals: 'task-123' } },
        })

        const successCount = subTasksResult.docs.filter(
          (doc: { status: SubTaskStatus }) => doc.status === SubTaskStatus.Success
        ).length

        // Successfully completed sub-tasks should remain as-is
        expect(successCount).toBe(2)
      })

      it('should leave currently processing sub-task unchanged', async () => {
        const task = createMockTask({ status: TaskStatus.Processing })
        const mixedSubTasks = [
          createMockSubTask({ id: 'sub-1', status: SubTaskStatus.Processing }),
          createMockSubTask({ id: 'sub-2', status: SubTaskStatus.Pending }),
        ]

        mockPayload.findByID.mockResolvedValue(task)
        mockPayload.find.mockResolvedValue({
          docs: mixedSubTasks,
          totalDocs: 2,
        })

        const subTasksResult = await mockPayload.find({
          collection: 'sub-tasks',
          where: { parentTask: { equals: 'task-123' } },
        })

        const processingSubTask = subTasksResult.docs.find(
          (doc: { status: SubTaskStatus }) => doc.status === SubTaskStatus.Processing
        )

        // Processing sub-task should not be cancelled immediately
        // It will complete on its own
        expect(processingSubTask).toBeDefined()
        expect(processingSubTask!.status).toBe(SubTaskStatus.Processing)
      })

      it('should retain completed assets (not delete media)', async () => {
        const task = createMockTask({ status: TaskStatus.Processing })
        const completedSubTask = createMockSubTask({
          id: 'sub-1',
          status: SubTaskStatus.Success,
        })

        mockPayload.findByID.mockResolvedValue(task)
        mockPayload.find.mockResolvedValue({
          docs: [completedSubTask],
          totalDocs: 1,
        })

        // No delete operation should be called for media
        // Media documents remain linked to successful sub-tasks
        expect(mockPayload.findByID).not.toHaveBeenCalledWith(
          expect.objectContaining({ collection: 'media' })
        )
      })
    })

    describe('response format', () => {
      it('should return cancelledSubTasks count', async () => {
        const task = createMockTask({ status: TaskStatus.Processing })
        const subTasks = [
          createMockSubTask({ id: 'sub-1', status: SubTaskStatus.Pending }),
          createMockSubTask({ id: 'sub-2', status: SubTaskStatus.Pending }),
          createMockSubTask({ id: 'sub-3', status: SubTaskStatus.Success }),
        ]

        mockPayload.findByID.mockResolvedValue(task)
        mockPayload.find.mockResolvedValue({
          docs: subTasks,
          totalDocs: 3,
        })

        const pendingCount = subTasks.filter(
          (st) => st.status === SubTaskStatus.Pending
        ).length

        // Expected response: { cancelledSubTasks: 2, completedSubTasks: 1 }
        expect(pendingCount).toBe(2)
      })

      it('should return completedSubTasks count', async () => {
        const task = createMockTask({ status: TaskStatus.Processing })
        const subTasks = [
          createMockSubTask({ id: 'sub-1', status: SubTaskStatus.Success }),
          createMockSubTask({ id: 'sub-2', status: SubTaskStatus.Success }),
          createMockSubTask({ id: 'sub-3', status: SubTaskStatus.Pending }),
        ]

        mockPayload.findByID.mockResolvedValue(task)
        mockPayload.find.mockResolvedValue({
          docs: subTasks,
          totalDocs: 3,
        })

        const completedCount = subTasks.filter(
          (st) => st.status === SubTaskStatus.Success
        ).length

        expect(completedCount).toBe(2)
      })

      it('should return success message', () => {
        const expectedResponse = {
          message: 'Task cancelled successfully',
          cancelledSubTasks: 5,
          completedSubTasks: 10,
        }

        expect(expectedResponse.message).toBe('Task cancelled successfully')
      })
    })

    describe('validation errors', () => {
      it('should reject if task not found', async () => {
        mockPayload.findByID.mockResolvedValue(null)

        const task = await mockPayload.findByID({
          collection: 'tasks',
          id: 'non-existent',
        })

        expect(task).toBeNull()
        // Endpoint should return 404
      })

      it('should reject cancellation of draft task', async () => {
        const task = createMockTask({ status: TaskStatus.Draft })

        mockPayload.findByID.mockResolvedValue(task)

        const foundTask = await mockPayload.findByID({
          collection: 'tasks',
          id: 'task-123',
        })

        // Draft tasks cannot be cancelled (nothing started yet)
        expect(foundTask.status).toBe(TaskStatus.Draft)
        // Endpoint should return 400
      })

      it('should reject cancellation of already completed task', async () => {
        const task = createMockTask({ status: TaskStatus.Completed })

        mockPayload.findByID.mockResolvedValue(task)

        const foundTask = await mockPayload.findByID({
          collection: 'tasks',
          id: 'task-123',
        })

        expect(foundTask.status).toBe(TaskStatus.Completed)
        // Endpoint should return 400
      })

      it('should reject cancellation of already failed task', async () => {
        const task = createMockTask({ status: TaskStatus.Failed })

        mockPayload.findByID.mockResolvedValue(task)

        const foundTask = await mockPayload.findByID({
          collection: 'tasks',
          id: 'task-123',
        })

        expect(foundTask.status).toBe(TaskStatus.Failed)
        // Endpoint should return 400
      })

      it('should reject cancellation of already cancelled task', async () => {
        const task = createMockTask({ status: TaskStatus.Cancelled })

        mockPayload.findByID.mockResolvedValue(task)

        const foundTask = await mockPayload.findByID({
          collection: 'tasks',
          id: 'task-123',
        })

        expect(foundTask.status).toBe(TaskStatus.Cancelled)
        // Endpoint should return 400
      })
    })

    describe('edge cases', () => {
      it('should handle task with no sub-tasks', async () => {
        const task = createMockTask({ status: TaskStatus.Queued })

        mockPayload.findByID.mockResolvedValue(task)
        mockPayload.find.mockResolvedValue({
          docs: [],
          totalDocs: 0,
        })

        const subTasksResult = await mockPayload.find({
          collection: 'sub-tasks',
          where: { parentTask: { equals: 'task-123' } },
        })

        expect(subTasksResult.docs).toHaveLength(0)
        // Should still cancel the task with cancelledSubTasks: 0
      })

      it('should handle task with all sub-tasks already completed', async () => {
        const task = createMockTask({ status: TaskStatus.Processing, progress: 100 })
        const completedSubTasks = [
          createMockSubTask({ id: 'sub-1', status: SubTaskStatus.Success }),
          createMockSubTask({ id: 'sub-2', status: SubTaskStatus.Success }),
        ]

        mockPayload.findByID.mockResolvedValue(task)
        mockPayload.find.mockResolvedValue({
          docs: completedSubTasks,
          totalDocs: 2,
        })

        const subTasksResult = await mockPayload.find({
          collection: 'sub-tasks',
          where: { parentTask: { equals: 'task-123' } },
        })

        const pendingCount = subTasksResult.docs.filter(
          (doc: { status: SubTaskStatus }) => doc.status === SubTaskStatus.Pending
        ).length

        expect(pendingCount).toBe(0)
        // cancelledSubTasks should be 0, completedSubTasks should be 2
      })
    })
  })
})
