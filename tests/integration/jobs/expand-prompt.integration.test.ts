/**
 * Integration Tests: Expand Prompt Job
 *
 * Tests for src/jobs/expand-prompt.ts
 * Per Constitution Principle VI (Testing Discipline)
 *
 * Mock LLM, test task status transitions, expandedPrompts updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TaskStatus } from '../../../src/lib/types'

// Mock the prompt optimizer service (LLM)
vi.mock('../../../src/services/prompt-optimizer', () => ({
  createPromptOptimizer: vi.fn(() => ({
    expandPrompt: vi.fn().mockResolvedValue({
      variants: [
        {
          variantId: 'variant-1',
          variantName: 'Realistic',
          expandedPrompt: 'mocked expanded prompt',
          suggestedNegativePrompt: 'blurry',
          keywords: ['test'],
        },
        {
          variantId: 'variant-2',
          variantName: 'Artistic',
          expandedPrompt: 'mocked expanded prompt 2',
          suggestedNegativePrompt: 'blurry',
          keywords: ['test'],
        },
        {
          variantId: 'variant-3',
          variantName: 'Cinematic',
          expandedPrompt: 'mocked expanded prompt 3',
          suggestedNegativePrompt: 'blurry',
          keywords: ['test'],
        },
      ],
      subjectSlug: 'mocked-slug',
    }),
    getProviderId: vi.fn().mockReturnValue('mock'),
  })),
  generateSubjectSlug: vi.fn((subject: string) => {
    return subject
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) || 'untitled'
  }),
}))

// Import after mocks are set up
import { expandPromptHandler, type ExpandPromptJobInput } from '../../../src/jobs/expand-prompt'

describe('Expand Prompt Job Integration', () => {
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

  // Mock req object
  let mockReq: { payload: typeof mockPayload }

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

    mockReq = { payload: mockPayload }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================
  // Test Data Factories
  // ============================================

  const createJobInput = (overrides?: Partial<ExpandPromptJobInput>): ExpandPromptJobInput => ({
    taskId: 'task-123',
    subject: 'a cat in the rain',
    variantCount: 3,
    webSearchEnabled: false,
    ...overrides,
  })

  const createMockTask = (overrides = {}) => ({
    id: 'task-123',
    subject: 'a cat in the rain',
    status: TaskStatus.Queued,
    styles: ['ghibli', 'cyberpunk'],
    models: ['flux-pro', 'dalle-3'],
    countPerPrompt: 2,
    totalExpected: 24,
    progress: 0,
    ...overrides,
  })

  /**
   * Set up all mocks for a successful expand-prompt flow
   */
  const setupSuccessMocks = (taskOverrides = {}) => {
    mockPayload.update.mockResolvedValue({ id: 'task-123' })
    mockPayload.findByID.mockResolvedValue(createMockTask(taskOverrides))
    mockPayload.find.mockResolvedValue({
      docs: [
        { styleId: 'ghibli', name: 'Ghibli', positivePrompt: '{prompt}, ghibli style', negativePrompt: '' },
        { styleId: 'cyberpunk', name: 'Cyberpunk', positivePrompt: '{prompt}, cyberpunk style', negativePrompt: '' },
        { styleId: 'base', name: 'Base', positivePrompt: '{prompt}', negativePrompt: '' },
      ],
    })
    mockPayload.create.mockResolvedValue({ id: 'subtask-new' })
    mockPayload.jobs.queue.mockResolvedValue({})
  }

  // ============================================
  // Status Transitions
  // ============================================

  describe('status transitions', () => {
    it('should transition task from queued to expanding at start', async () => {
      const input = createJobInput()
      setupSuccessMocks()

      await expandPromptHandler({ input, req: mockReq })

      // First update should set status to expanding
      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'tasks',
          id: 'task-123',
          data: expect.objectContaining({
            status: 'expanding',
          }),
        })
      )
    })

    it('should transition task to processing on success', async () => {
      const input = createJobInput()
      setupSuccessMocks()

      await expandPromptHandler({ input, req: mockReq })

      // Last update should set status to processing
      const updateCalls = mockPayload.update.mock.calls
      const lastCall = updateCalls[updateCalls.length - 1]

      expect(lastCall[0]).toMatchObject({
        collection: 'tasks',
        id: 'task-123',
        data: expect.objectContaining({
          status: 'processing',
        }),
      })
    })

    it('should transition task to failed on error', async () => {
      const input = createJobInput()

      // First call succeeds (status to expanding), second call fails
      mockPayload.update
        .mockResolvedValueOnce({ id: 'task-123' })
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({ id: 'task-123' })

      const result = await expandPromptHandler({ input, req: mockReq })

      expect(result.output.success).toBe(false)

      // Should attempt to update status to failed
      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'failed',
          }),
        })
      )
    })
  })

  // ============================================
  // Expanded Prompts
  // ============================================

  describe('expanded prompts update', () => {
    it('should update task with expanded prompts on success', async () => {
      const input = createJobInput({ variantCount: 3 })
      setupSuccessMocks()

      await expandPromptHandler({ input, req: mockReq })

      // Find the call that updates expandedPrompts
      const updateWithPrompts = mockPayload.update.mock.calls.find(
        (call) => call[0].data?.expandedPrompts !== undefined
      )

      expect(updateWithPrompts).toBeDefined()
      expect(updateWithPrompts![0].data.expandedPrompts).toHaveLength(3)
    })

    it('should generate correct variant structure', async () => {
      const input = createJobInput({
        subject: 'a dragon',
        variantCount: 2,
      })
      setupSuccessMocks()

      await expandPromptHandler({ input, req: mockReq })

      const updateWithPrompts = mockPayload.update.mock.calls.find(
        (call) => call[0].data?.expandedPrompts !== undefined
      )

      const prompts = updateWithPrompts![0].data.expandedPrompts

      // Each prompt should have required fields
      prompts.forEach((prompt: { variantId: string; variantName: string; originalPrompt: string; expandedPrompt: string; subjectSlug: string }) => {
        expect(prompt).toHaveProperty('variantId')
        expect(prompt).toHaveProperty('variantName')
        expect(prompt).toHaveProperty('originalPrompt')
        expect(prompt).toHaveProperty('expandedPrompt')
        expect(prompt).toHaveProperty('subjectSlug')
      })
    })

    it('should preserve original prompt in expanded prompts', async () => {
      const input = createJobInput({
        subject: 'a beautiful sunset over mountains',
      })
      setupSuccessMocks()

      await expandPromptHandler({ input, req: mockReq })

      const updateWithPrompts = mockPayload.update.mock.calls.find(
        (call) => call[0].data?.expandedPrompts !== undefined
      )

      const prompts = updateWithPrompts![0].data.expandedPrompts

      prompts.forEach((prompt: { originalPrompt: string }) => {
        expect(prompt.originalPrompt).toBe('a beautiful sunset over mountains')
      })
    })

    it('should generate subject slug from subject', async () => {
      const input = createJobInput({
        subject: 'A Cat In The Rain!!!',
      })
      setupSuccessMocks()

      await expandPromptHandler({ input, req: mockReq })

      const updateWithPrompts = mockPayload.update.mock.calls.find(
        (call) => call[0].data?.expandedPrompts !== undefined
      )

      const prompts = updateWithPrompts![0].data.expandedPrompts

      // Subject slug should be lowercase, no special chars, hyphenated
      prompts.forEach((prompt: { subjectSlug: string }) => {
        expect(prompt.subjectSlug).toMatch(/^[a-z0-9-]+$/)
      })
    })

    it('should truncate long subject slugs', async () => {
      const input = createJobInput({
        subject: 'a '.repeat(100) + 'very long subject',
      })
      setupSuccessMocks()

      await expandPromptHandler({ input, req: mockReq })

      const updateWithPrompts = mockPayload.update.mock.calls.find(
        (call) => call[0].data?.expandedPrompts !== undefined
      )

      const prompts = updateWithPrompts![0].data.expandedPrompts

      prompts.forEach((prompt: { subjectSlug: string }) => {
        expect(prompt.subjectSlug.length).toBeLessThanOrEqual(50)
      })
    })
  })

  // ============================================
  // Output
  // ============================================

  describe('job output', () => {
    it('should return success with variants on success', async () => {
      const input = createJobInput({ variantCount: 3 })
      setupSuccessMocks()

      const result = await expandPromptHandler({ input, req: mockReq })

      expect(result.output.success).toBe(true)
      expect(result.output.variants).toBeDefined()
      expect(result.output.variants).toHaveLength(3)
    })

    it('should return error message on failure', async () => {
      const input = createJobInput()
      mockPayload.update.mockRejectedValue(new Error('Test error message'))

      const result = await expandPromptHandler({ input, req: mockReq })

      expect(result.output.success).toBe(false)
      expect(result.output.error).toBeDefined()
      expect(result.output.error).toContain('Test error message')
    })

    it('should handle unknown error types', async () => {
      const input = createJobInput()
      mockPayload.update.mockRejectedValue('string error')

      const result = await expandPromptHandler({ input, req: mockReq })

      expect(result.output.success).toBe(false)
      expect(result.output.error).toBe('Unknown error')
    })
  })

  // ============================================
  // Logging
  // ============================================

  describe('logging', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleLogSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    it('should log job start', async () => {
      const input = createJobInput({ taskId: 'test-task' })
      setupSuccessMocks()

      await expandPromptHandler({ input, req: mockReq })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[expand-prompt]')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-task')
      )
    })

    it('should log errors', async () => {
      const input = createJobInput()
      mockPayload.update.mockRejectedValue(new Error('Test error'))

      await expandPromptHandler({ input, req: mockReq })

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  // ============================================
  // Edge Cases
  // ============================================

  describe('edge cases', () => {
    it('should handle variant count of 1', async () => {
      const input = createJobInput({ variantCount: 1 })
      setupSuccessMocks()

      const result = await expandPromptHandler({ input, req: mockReq })

      expect(result.output.success).toBe(true)
      expect(result.output.variants).toHaveLength(1)
    })

    it('should handle empty subject', async () => {
      const input = createJobInput({ subject: '' })
      setupSuccessMocks()

      const result = await expandPromptHandler({ input, req: mockReq })

      // Should still succeed but with empty/placeholder slug
      expect(result.output.success).toBe(true)
    })

    it('should handle webSearchEnabled flag', async () => {
      const input = createJobInput({ webSearchEnabled: true })
      setupSuccessMocks()

      // Job should complete (web search is future enhancement)
      const result = await expandPromptHandler({ input, req: mockReq })

      expect(result.output.success).toBe(true)
    })
  })
})
