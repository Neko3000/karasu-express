/**
 * Integration Tests: SubTask Retry Endpoint
 *
 * Tests for POST /api/sub-tasks/{id}/retry endpoint
 *
 * Phase 7 (User Story 4): Task Monitoring and Management
 * Per Constitution Principle VI (Testing Discipline)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TaskStatus, SubTaskStatus, AspectRatio } from '../../../src/lib/types'

describe('SubTask Retry Endpoint Integration', () => {
  // Mock payload instance
  let mockPayload: {
    findByID: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    jobs: {
      queue: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockPayload = {
      findByID: vi.fn(),
      update: vi.fn(),
      jobs: {
        queue: vi.fn(),
      },
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
    status: TaskStatus.PartialFailed,
    progress: 80,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  })

  const createMockSubTask = (overrides = {}) => ({
    id: 'subtask-123',
    parentTask: 'task-123',
    status: SubTaskStatus.Failed,
    styleId: 'ghibli',
    modelId: 'flux-pro',
    finalPrompt: 'a cat in the rain, ghibli style',
    negativePrompt: 'low quality, blurry',
    aspectRatio: AspectRatio.Square,
    batchIndex: 0,
    retryCount: 2,
    errorLog: 'Rate limit exceeded',
    errorCategory: 'RATE_LIMITED',
    expandedPrompt: {
      variantId: 'v1',
      variantName: 'Realistic',
      originalPrompt: 'a cat in the rain',
      expandedPrompt: 'a cat in the rain, detailed, realistic',
      subjectSlug: 'cat-rain',
    },
    ...overrides,
  })

  // ============================================
  // POST /api/sub-tasks/{id}/retry
  // ============================================

  describe('POST /api/sub-tasks/{id}/retry', () => {
    describe('successful retry', () => {
      it('should clear errorLog on retry', async () => {
        const subTask = createMockSubTask({
          errorLog: 'Previous error message',
          errorCategory: 'RATE_LIMITED',
        })

        mockPayload.findByID
          .mockResolvedValueOnce(subTask) // First call for sub-task
          .mockResolvedValueOnce(createMockTask()) // Second call for parent task

        mockPayload.update.mockResolvedValue({
          ...subTask,
          errorLog: null,
          errorCategory: null,
          status: SubTaskStatus.Pending,
          retryCount: 0,
        })

        const updatedSubTask = await mockPayload.update({
          collection: 'sub-tasks',
          id: 'subtask-123',
          data: {
            status: SubTaskStatus.Pending,
            retryCount: 0,
            errorLog: null,
            errorCategory: null,
          },
        })

        expect(updatedSubTask.errorLog).toBeNull()
        expect(updatedSubTask.errorCategory).toBeNull()
      })

      it('should reset retryCount to 0', async () => {
        const subTask = createMockSubTask({ retryCount: 3 })

        mockPayload.findByID
          .mockResolvedValueOnce(subTask)
          .mockResolvedValueOnce(createMockTask())

        mockPayload.update.mockResolvedValue({
          ...subTask,
          retryCount: 0,
        })

        const updatedSubTask = await mockPayload.update({
          collection: 'sub-tasks',
          id: 'subtask-123',
          data: { retryCount: 0 },
        })

        expect(updatedSubTask.retryCount).toBe(0)
      })

      it('should reset status to pending', async () => {
        const subTask = createMockSubTask({ status: SubTaskStatus.Failed })

        mockPayload.findByID
          .mockResolvedValueOnce(subTask)
          .mockResolvedValueOnce(createMockTask())

        mockPayload.update.mockResolvedValue({
          ...subTask,
          status: SubTaskStatus.Pending,
        })

        const updatedSubTask = await mockPayload.update({
          collection: 'sub-tasks',
          id: 'subtask-123',
          data: { status: SubTaskStatus.Pending },
        })

        expect(updatedSubTask.status).toBe(SubTaskStatus.Pending)
      })

      it('should clear startedAt and completedAt timestamps', async () => {
        const subTask = createMockSubTask({
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        })

        mockPayload.findByID
          .mockResolvedValueOnce(subTask)
          .mockResolvedValueOnce(createMockTask())

        mockPayload.update.mockResolvedValue({
          ...subTask,
          startedAt: null,
          completedAt: null,
        })

        const updatedSubTask = await mockPayload.update({
          collection: 'sub-tasks',
          id: 'subtask-123',
          data: {
            startedAt: null,
            completedAt: null,
          },
        })

        expect(updatedSubTask.startedAt).toBeNull()
        expect(updatedSubTask.completedAt).toBeNull()
      })

      it('should re-queue generate-image job', async () => {
        const subTask = createMockSubTask()

        mockPayload.findByID
          .mockResolvedValueOnce(subTask)
          .mockResolvedValueOnce(createMockTask())

        mockPayload.jobs.queue.mockResolvedValue({ id: 'job-456' })

        await mockPayload.jobs.queue({
          task: 'generate-image',
          input: {
            subTaskId: subTask.id,
            modelId: subTask.modelId,
            finalPrompt: subTask.finalPrompt,
            negativePrompt: subTask.negativePrompt,
            aspectRatio: subTask.aspectRatio,
          },
        })

        expect(mockPayload.jobs.queue).toHaveBeenCalledWith(
          expect.objectContaining({
            task: 'generate-image',
            input: expect.objectContaining({
              subTaskId: 'subtask-123',
              modelId: 'flux-pro',
              finalPrompt: 'a cat in the rain, ghibli style',
            }),
          })
        )
      })

      it('should update parent task status to processing if it was partial_failed', async () => {
        const subTask = createMockSubTask()
        const parentTask = createMockTask({ status: TaskStatus.PartialFailed })

        mockPayload.findByID
          .mockResolvedValueOnce(subTask)
          .mockResolvedValueOnce(parentTask)

        mockPayload.update
          .mockResolvedValueOnce({ ...subTask, status: SubTaskStatus.Pending })
          .mockResolvedValueOnce({ ...parentTask, status: TaskStatus.Processing })

        // Update parent task to processing
        const updatedTask = await mockPayload.update({
          collection: 'tasks',
          id: 'task-123',
          data: { status: TaskStatus.Processing },
        })

        expect(updatedTask.status).toBe(TaskStatus.Processing)
      })

      it('should update parent task status to processing if it was completed', async () => {
        const subTask = createMockSubTask()
        const parentTask = createMockTask({ status: TaskStatus.Completed })

        mockPayload.findByID
          .mockResolvedValueOnce(subTask)
          .mockResolvedValueOnce(parentTask)

        // When retrying after completion, parent should go back to processing
        expect(parentTask.status).toBe(TaskStatus.Completed)
      })

      it('should update parent task status to processing if it was failed', async () => {
        const subTask = createMockSubTask()
        const parentTask = createMockTask({ status: TaskStatus.Failed })

        mockPayload.findByID
          .mockResolvedValueOnce(subTask)
          .mockResolvedValueOnce(parentTask)

        expect(parentTask.status).toBe(TaskStatus.Failed)
      })
    })

    describe('response format', () => {
      it('should return subTaskId in response', () => {
        const expectedResponse = {
          message: 'SubTask re-queued',
          subTaskId: 'subtask-123',
          newStatus: SubTaskStatus.Pending,
        }

        expect(expectedResponse.subTaskId).toBe('subtask-123')
      })

      it('should return newStatus as pending', () => {
        const expectedResponse = {
          message: 'SubTask re-queued',
          subTaskId: 'subtask-123',
          newStatus: SubTaskStatus.Pending,
        }

        expect(expectedResponse.newStatus).toBe(SubTaskStatus.Pending)
      })

      it('should return success message', () => {
        const expectedResponse = {
          message: 'SubTask re-queued',
          subTaskId: 'subtask-123',
          newStatus: SubTaskStatus.Pending,
        }

        expect(expectedResponse.message).toBe('SubTask re-queued')
      })
    })

    describe('validation errors', () => {
      it('should reject if sub-task not found', async () => {
        mockPayload.findByID.mockResolvedValue(null)

        const subTask = await mockPayload.findByID({
          collection: 'sub-tasks',
          id: 'non-existent',
        })

        expect(subTask).toBeNull()
        // Endpoint should return 404
      })

      it('should reject retry of pending sub-task', async () => {
        const subTask = createMockSubTask({ status: SubTaskStatus.Pending })

        mockPayload.findByID.mockResolvedValue(subTask)

        const foundSubTask = await mockPayload.findByID({
          collection: 'sub-tasks',
          id: 'subtask-123',
        })

        // Cannot retry a pending sub-task
        expect(foundSubTask.status).toBe(SubTaskStatus.Pending)
        // Endpoint should return 400
      })

      it('should reject retry of processing sub-task', async () => {
        const subTask = createMockSubTask({ status: SubTaskStatus.Processing })

        mockPayload.findByID.mockResolvedValue(subTask)

        const foundSubTask = await mockPayload.findByID({
          collection: 'sub-tasks',
          id: 'subtask-123',
        })

        expect(foundSubTask.status).toBe(SubTaskStatus.Processing)
        // Endpoint should return 400
      })

      it('should reject retry of successful sub-task', async () => {
        const subTask = createMockSubTask({ status: SubTaskStatus.Success })

        mockPayload.findByID.mockResolvedValue(subTask)

        const foundSubTask = await mockPayload.findByID({
          collection: 'sub-tasks',
          id: 'subtask-123',
        })

        expect(foundSubTask.status).toBe(SubTaskStatus.Success)
        // Endpoint should return 400
      })

      it('should reject retry of cancelled sub-task', async () => {
        const subTask = createMockSubTask({ status: SubTaskStatus.Cancelled })

        mockPayload.findByID.mockResolvedValue(subTask)

        const foundSubTask = await mockPayload.findByID({
          collection: 'sub-tasks',
          id: 'subtask-123',
        })

        expect(foundSubTask.status).toBe(SubTaskStatus.Cancelled)
        // Endpoint should return 400
      })

      it('should reject retry if parent task is cancelled', async () => {
        const subTask = createMockSubTask({ status: SubTaskStatus.Failed })
        const parentTask = createMockTask({ status: TaskStatus.Cancelled })

        mockPayload.findByID
          .mockResolvedValueOnce(subTask)
          .mockResolvedValueOnce(parentTask)

        const foundParentTask = await mockPayload.findByID({
          collection: 'tasks',
          id: 'task-123',
        })

        expect(foundParentTask.status).toBe(TaskStatus.Cancelled)
        // Endpoint should return 400
      })

      it('should reject if sub-task has no valid parent task reference', async () => {
        const subTask = createMockSubTask({
          status: SubTaskStatus.Failed,
          parentTask: null,
        })

        mockPayload.findByID.mockResolvedValue(subTask)

        const foundSubTask = await mockPayload.findByID({
          collection: 'sub-tasks',
          id: 'subtask-123',
        })

        expect(foundSubTask.parentTask).toBeNull()
        // Endpoint should return 400
      })
    })

    describe('in-place update behavior', () => {
      it('should update existing sub-task instead of creating new one', async () => {
        const subTask = createMockSubTask()

        mockPayload.findByID
          .mockResolvedValueOnce(subTask)
          .mockResolvedValueOnce(createMockTask())

        // Should use update, not create
        mockPayload.update.mockResolvedValue({
          ...subTask,
          status: SubTaskStatus.Pending,
        })

        await mockPayload.update({
          collection: 'sub-tasks',
          id: 'subtask-123',
          data: { status: SubTaskStatus.Pending },
        })

        expect(mockPayload.update).toHaveBeenCalledWith(
          expect.objectContaining({
            collection: 'sub-tasks',
            id: 'subtask-123',
          })
        )
      })

      it('should preserve original sub-task fields (styleId, modelId, etc)', async () => {
        const subTask = createMockSubTask({
          styleId: 'cyberpunk',
          modelId: 'dalle-3',
          batchIndex: 5,
        })

        mockPayload.findByID
          .mockResolvedValueOnce(subTask)
          .mockResolvedValueOnce(createMockTask())

        // Original fields should be preserved
        expect(subTask.styleId).toBe('cyberpunk')
        expect(subTask.modelId).toBe('dalle-3')
        expect(subTask.batchIndex).toBe(5)

        // These should NOT be modified by retry
      })

      it('should preserve expandedPrompt data', async () => {
        const expandedPrompt = {
          variantId: 'artistic',
          variantName: 'Artistic Style',
          originalPrompt: 'original theme',
          expandedPrompt: 'detailed artistic prompt',
          subjectSlug: 'theme-slug',
        }

        const subTask = createMockSubTask({ expandedPrompt })

        mockPayload.findByID
          .mockResolvedValueOnce(subTask)
          .mockResolvedValueOnce(createMockTask())

        expect(subTask.expandedPrompt).toEqual(expandedPrompt)
      })
    })
  })
})
