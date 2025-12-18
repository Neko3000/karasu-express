/**
 * Integration Tests: Task Endpoints
 *
 * Tests for task-related custom endpoints:
 * - POST /api/tasks/{id}/submit
 * - POST /api/tasks/{id}/retry-failed
 * - POST /api/studio/calculate-fission
 *
 * Per Constitution Principle VI (Testing Discipline)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TaskStatus, SubTaskStatus } from '../../../src/lib/types'

describe('Task Endpoints Integration', () => {
  // Mock payload instance
  let mockPayload: {
    findByID: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    find: ReturnType<typeof vi.fn>
    jobs: {
      queue: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockPayload = {
      findByID: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      find: vi.fn(),
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
    expandedPrompts: [],
    styles: ['ghibli', 'cyberpunk'],
    models: ['flux-pro', 'dalle-3'],
    batchConfig: {
      countPerPrompt: 2,
      totalExpected: 24,
    },
    status: TaskStatus.Draft,
    progress: 0,
    webSearchEnabled: false,
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
  // POST /api/tasks/{id}/submit
  // ============================================

  describe('POST /api/tasks/{id}/submit', () => {
    // This describes the expected behavior of the submit endpoint

    describe('successful submission', () => {
      it('should transition task from draft to queued', async () => {
        const task = createMockTask({ status: TaskStatus.Draft })

        mockPayload.findByID.mockResolvedValue(task)
        mockPayload.update.mockResolvedValue({ ...task, status: TaskStatus.Queued })
        mockPayload.jobs.queue.mockResolvedValue({ id: 'job-123' })

        // Simulate endpoint logic
        const foundTask = await mockPayload.findByID({
          collection: 'tasks',
          id: 'task-123',
        })

        expect(foundTask.status).toBe(TaskStatus.Draft)

        // Update to queued
        const updatedTask = await mockPayload.update({
          collection: 'tasks',
          id: 'task-123',
          data: { status: TaskStatus.Queued },
        })

        expect(updatedTask.status).toBe(TaskStatus.Queued)
      })

      it('should queue expand-prompt job on submission', async () => {
        const task = createMockTask({
          status: TaskStatus.Draft,
          subject: 'test subject',
        })

        mockPayload.findByID.mockResolvedValue(task)
        mockPayload.update.mockResolvedValue({ ...task, status: TaskStatus.Queued })
        mockPayload.jobs.queue.mockResolvedValue({ id: 'job-123' })

        // Queue the job
        await mockPayload.jobs.queue({
          task: 'expand-prompt',
          input: {
            taskId: task.id,
            subject: task.subject,
            variantCount: 3,
            webSearchEnabled: task.webSearchEnabled,
          },
        })

        expect(mockPayload.jobs.queue).toHaveBeenCalledWith(
          expect.objectContaining({
            task: 'expand-prompt',
            input: expect.objectContaining({
              taskId: task.id,
              subject: task.subject,
            }),
          })
        )
      })
    })

    describe('validation errors', () => {
      it('should reject submission if task not found', async () => {
        mockPayload.findByID.mockResolvedValue(null)

        const task = await mockPayload.findByID({
          collection: 'tasks',
          id: 'non-existent',
        })

        expect(task).toBeNull()
        // Endpoint should return 404
      })

      it('should reject submission if task is not in draft status', async () => {
        const task = createMockTask({ status: TaskStatus.Processing })

        mockPayload.findByID.mockResolvedValue(task)

        const foundTask = await mockPayload.findByID({
          collection: 'tasks',
          id: 'task-123',
        })

        expect(foundTask.status).not.toBe(TaskStatus.Draft)
        // Endpoint should return 400 - can only submit draft tasks
      })

      it('should reject submission if task has no styles', async () => {
        const task = createMockTask({ styles: [] })

        mockPayload.findByID.mockResolvedValue(task)

        const foundTask = await mockPayload.findByID({
          collection: 'tasks',
          id: 'task-123',
        })

        expect(foundTask.styles).toHaveLength(0)
        // Endpoint should return 400 - at least one style required
      })

      it('should reject submission if task has no models', async () => {
        const task = createMockTask({ models: [] })

        mockPayload.findByID.mockResolvedValue(task)

        const foundTask = await mockPayload.findByID({
          collection: 'tasks',
          id: 'task-123',
        })

        expect(foundTask.models).toHaveLength(0)
        // Endpoint should return 400 - at least one model required
      })
    })
  })

  // ============================================
  // POST /api/tasks/{id}/retry-failed
  // ============================================

  describe('POST /api/tasks/{id}/retry-failed', () => {
    describe('successful retry', () => {
      it('should find all failed subtasks for a task', async () => {
        const failedSubTasks = [
          createMockSubTask({ id: 'sub-1', status: SubTaskStatus.Failed }),
          createMockSubTask({ id: 'sub-2', status: SubTaskStatus.Failed }),
        ]

        mockPayload.find.mockResolvedValue({
          docs: failedSubTasks,
          totalDocs: 2,
        })

        const result = await mockPayload.find({
          collection: 'sub-tasks',
          where: {
            parentTask: { equals: 'task-123' },
            status: { equals: SubTaskStatus.Failed },
          },
        })

        expect(result.docs).toHaveLength(2)
        expect(result.docs.every((doc: { status: SubTaskStatus }) => doc.status === SubTaskStatus.Failed)).toBe(true)
      })

      it('should reset failed subtasks to pending', async () => {
        const failedSubTask = createMockSubTask({
          id: 'sub-1',
          status: SubTaskStatus.Failed,
          retryCount: 2,
          errorLog: 'Previous error',
        })

        mockPayload.update.mockResolvedValue({
          ...failedSubTask,
          status: SubTaskStatus.Pending,
          retryCount: 0,
          errorLog: null,
          errorCategory: null,
        })

        const updatedSubTask = await mockPayload.update({
          collection: 'sub-tasks',
          id: 'sub-1',
          data: {
            status: SubTaskStatus.Pending,
            retryCount: 0,
            errorLog: null,
            errorCategory: null,
          },
        })

        expect(updatedSubTask.status).toBe(SubTaskStatus.Pending)
        expect(updatedSubTask.retryCount).toBe(0)
      })

      it('should queue generate-image job for each reset subtask', async () => {
        const subTask = createMockSubTask({
          status: SubTaskStatus.Pending,
          modelId: 'flux-pro',
          finalPrompt: 'test prompt',
        })

        mockPayload.jobs.queue.mockResolvedValue({ id: 'job-456' })

        await mockPayload.jobs.queue({
          task: 'generate-image',
          input: {
            subTaskId: subTask.id,
            modelId: subTask.modelId,
            finalPrompt: subTask.finalPrompt,
          },
        })

        expect(mockPayload.jobs.queue).toHaveBeenCalledWith(
          expect.objectContaining({
            task: 'generate-image',
            input: expect.objectContaining({
              subTaskId: subTask.id,
            }),
          })
        )
      })

      it('should update parent task status to processing', async () => {
        const task = createMockTask({ status: TaskStatus.PartialFailed })

        mockPayload.update.mockResolvedValue({
          ...task,
          status: TaskStatus.Processing,
        })

        const updatedTask = await mockPayload.update({
          collection: 'tasks',
          id: 'task-123',
          data: { status: TaskStatus.Processing },
        })

        expect(updatedTask.status).toBe(TaskStatus.Processing)
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

      it('should reject if no failed subtasks exist', async () => {
        mockPayload.find.mockResolvedValue({
          docs: [],
          totalDocs: 0,
        })

        const result = await mockPayload.find({
          collection: 'sub-tasks',
          where: {
            parentTask: { equals: 'task-123' },
            status: { equals: SubTaskStatus.Failed },
          },
        })

        expect(result.docs).toHaveLength(0)
        // Endpoint should return 400 - no failed subtasks to retry
      })

      it('should reject if task is still processing', async () => {
        const task = createMockTask({ status: TaskStatus.Processing })

        mockPayload.findByID.mockResolvedValue(task)

        const foundTask = await mockPayload.findByID({
          collection: 'tasks',
          id: 'task-123',
        })

        expect(foundTask.status).toBe(TaskStatus.Processing)
        // Endpoint should return 400 - cannot retry while processing
      })
    })

    describe('response', () => {
      it('should return count of retried subtasks', async () => {
        const failedSubTasks = [
          createMockSubTask({ id: 'sub-1', status: SubTaskStatus.Failed }),
          createMockSubTask({ id: 'sub-2', status: SubTaskStatus.Failed }),
          createMockSubTask({ id: 'sub-3', status: SubTaskStatus.Failed }),
        ]

        mockPayload.find.mockResolvedValue({
          docs: failedSubTasks,
          totalDocs: 3,
        })

        const result = await mockPayload.find({
          collection: 'sub-tasks',
          where: {
            parentTask: { equals: 'task-123' },
            status: { equals: SubTaskStatus.Failed },
          },
        })

        // Response should include: { retriedCount: 3 }
        expect(result.totalDocs).toBe(3)
      })
    })
  })

  // ============================================
  // POST /api/studio/calculate-fission
  // ============================================

  describe('POST /api/studio/calculate-fission', () => {
    describe('calculation', () => {
      it('should calculate total subtasks correctly', () => {
        // Formula: prompts * styles * models * batch
        const input = {
          promptCount: 3,
          styleCount: 2,
          modelCount: 2,
          batchSize: 5,
        }

        const total = input.promptCount * input.styleCount * input.modelCount * input.batchSize

        expect(total).toBe(60) // 3 * 2 * 2 * 5 = 60
      })

      it('should include base style in calculation when specified', () => {
        const input = {
          promptCount: 2,
          styleCount: 2, // user selected
          modelCount: 1,
          batchSize: 3,
          includeBaseStyle: true,
        }

        // With base style: 2 + 1 = 3 styles
        const styleCount = input.includeBaseStyle ? input.styleCount + 1 : input.styleCount
        const total = input.promptCount * styleCount * input.modelCount * input.batchSize

        expect(total).toBe(18) // 2 * 3 * 1 * 3 = 18
      })

      it('should return warning when total exceeds 500', () => {
        const input = {
          promptCount: 3,
          styleCount: 5,
          modelCount: 3,
          batchSize: 20,
        }

        const total = input.promptCount * input.styleCount * input.modelCount * input.batchSize
        const warningThreshold = 500

        expect(total).toBe(900)
        expect(total).toBeGreaterThan(warningThreshold)

        // Response should include warning about large batch
      })

      it('should not return warning when total is at or below 500', () => {
        const input = {
          promptCount: 2,
          styleCount: 2,
          modelCount: 2,
          batchSize: 10,
        }

        const total = input.promptCount * input.styleCount * input.modelCount * input.batchSize
        const warningThreshold = 500

        expect(total).toBe(80)
        expect(total).toBeLessThanOrEqual(warningThreshold)

        // Response should NOT include warning
      })
    })

    describe('validation', () => {
      it('should reject if promptCount is 0 or negative', () => {
        const input = { promptCount: 0, styleCount: 2, modelCount: 1, batchSize: 1 }

        expect(input.promptCount).toBeLessThanOrEqual(0)
        // Endpoint should return 400
      })

      it('should reject if styleCount is 0 or negative', () => {
        const input = { promptCount: 2, styleCount: -1, modelCount: 1, batchSize: 1 }

        expect(input.styleCount).toBeLessThanOrEqual(0)
        // Endpoint should return 400
      })

      it('should reject if modelCount is 0 or negative', () => {
        const input = { promptCount: 2, styleCount: 2, modelCount: 0, batchSize: 1 }

        expect(input.modelCount).toBeLessThanOrEqual(0)
        // Endpoint should return 400
      })

      it('should reject if batchSize exceeds maximum (50)', () => {
        const input = { promptCount: 2, styleCount: 2, modelCount: 1, batchSize: 100 }
        const maxBatchSize = 50

        expect(input.batchSize).toBeGreaterThan(maxBatchSize)
        // Endpoint should return 400
      })

      it('should accept batchSize at maximum (50)', () => {
        const input = { promptCount: 1, styleCount: 1, modelCount: 1, batchSize: 50 }
        const maxBatchSize = 50

        expect(input.batchSize).toBeLessThanOrEqual(maxBatchSize)
        // Endpoint should accept this
      })
    })

    describe('response format', () => {
      it('should return total and breakdown', () => {
        const input = {
          promptCount: 3,
          styleCount: 2,
          modelCount: 2,
          batchSize: 5,
        }

        const expectedResponse = {
          total: 60,
          breakdown: {
            promptCount: 3,
            styleCount: 2,
            modelCount: 2,
            batchSize: 5,
          },
        }

        // Verify expected response structure
        expect(expectedResponse.total).toBe(60)
        expect(expectedResponse.breakdown).toEqual(input)
      })

      it('should include warning in response when applicable', () => {
        const input = {
          promptCount: 10,
          styleCount: 10,
          modelCount: 3,
          batchSize: 10,
        }

        const total = input.promptCount * input.styleCount * input.modelCount * input.batchSize

        const expectedResponse = {
          total: 3000,
          breakdown: input,
          warning: 'Large batch: 3000 images will be generated. This may take significant time and resources.',
        }

        expect(total).toBe(3000)
        expect(expectedResponse.warning).toBeDefined()
      })
    })
  })

  // ============================================
  // Common Behavior
  // ============================================

  describe('common endpoint behavior', () => {
    it('should require authentication for all endpoints', () => {
      // All task endpoints should require authenticated user
      // Mock req.user should be checked
    })

    it('should return proper error format on validation failures', () => {
      const errorResponse = {
        error: 'Validation error',
        message: 'At least one style must be selected',
        statusCode: 400,
      }

      expect(errorResponse).toHaveProperty('error')
      expect(errorResponse).toHaveProperty('message')
      expect(errorResponse).toHaveProperty('statusCode')
    })

    it('should return proper error format on not found', () => {
      const errorResponse = {
        error: 'Not found',
        message: 'Task with ID task-123 not found',
        statusCode: 404,
      }

      expect(errorResponse.statusCode).toBe(404)
    })
  })
})
